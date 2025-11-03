// 全局变量
let editor = null;
let currentPost = null;
let posts = [];

// API 基础 URL
const API_BASE = 'http://localhost:3001/api';

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await initMonacoEditor();
    await loadPosts();
    setupEventListeners();
    updateStatus('就绪');
});

// 初始化 Monaco 编辑器
async function initMonacoEditor() {
    return new Promise((resolve) => {
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: '# 开始写作...\n\n',
                language: 'markdown',
                theme: 'vs',
                automaticLayout: true,
                wordWrap: 'on',
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false
            });

            // 监听编辑器内容变化
            editor.onDidChangeModelContent(() => {
                updateStatus('已修改 - 记得保存');
            });

            resolve();
        });
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 图片上传
    const imageUpload = document.getElementById('imageUpload');
    const imageInput = document.getElementById('imageInput');

    imageUpload.addEventListener('click', () => imageInput.click());
    imageUpload.addEventListener('dragover', handleDragOver);
    imageUpload.addEventListener('drop', handleDrop);
    imageInput.addEventListener('change', handleFileSelect);

    // 快捷键
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            savePost();
        }
    });
}

// 加载文章列表
async function loadPosts() {
    try {
        updateStatus('加载文章列表...');
        const response = await fetch(`${API_BASE}/posts`);
        posts = await response.json();
        
        renderPostList();
        updateStatus(`已加载 ${posts.length} 篇文章`);
    } catch (error) {
        console.error('加载文章失败:', error);
        updateStatus('加载文章失败');
    }
}

// 渲染文章列表
function renderPostList() {
    const postList = document.getElementById('postList');
    
    if (posts.length === 0) {
        postList.innerHTML = '<li class="post-item">暂无文章</li>';
        return;
    }

    postList.innerHTML = posts.map(post => `
        <li class="post-item" onclick="loadPost('${post.slug}')" data-slug="${post.slug}">
            <div class="post-title">${post.title}</div>
            <div class="post-meta">
                ${new Date(post.published).toLocaleDateString()} 
                ${post.draft ? '• 草稿' : '• 已发布'}
                ${post.category ? `• ${post.category}` : ''}
            </div>
        </li>
    `).join('');
}

// 加载单篇文章
async function loadPost(slug) {
    try {
        updateStatus(`加载文章: ${slug}`);
        
        const response = await fetch(`${API_BASE}/posts/${slug}`);
        if (!response.ok) {
            throw new Error('文章不存在');
        }
        
        const post = await response.json();
        currentPost = post;
        
        // 更新 UI
        document.getElementById('currentPost').textContent = post.frontMatter.title || slug;
        
        // 更新文章列表选中状态
        document.querySelectorAll('.post-item').forEach(item => {
            item.classList.toggle('active', item.dataset.slug === slug);
        });
        
        // 填充表单
        fillFrontMatterForm(post.frontMatter);
        
        // 设置编辑器内容
        if (editor) {
            editor.setValue(post.content);
        }
        
        updateStatus(`已加载: ${post.frontMatter.title || slug}`);
        
    } catch (error) {
        console.error('加载文章失败:', error);
        updateStatus('加载文章失败');
        alert('加载文章失败: ' + error.message);
    }
}

// 填充前端物质表单
function fillFrontMatterForm(frontMatter) {
    document.getElementById('title').value = frontMatter.title || '';
    document.getElementById('description').value = frontMatter.description || '';
    document.getElementById('category').value = frontMatter.category || '';
    document.getElementById('image').value = frontMatter.image || '';
    document.getElementById('draft').value = frontMatter.draft ? 'true' : 'false';
    
    // 处理日期
    if (frontMatter.published) {
        const date = new Date(frontMatter.published);
        document.getElementById('published').value = date.toISOString().split('T')[0];
    }
    
    // 处理标签
    if (frontMatter.tags && Array.isArray(frontMatter.tags)) {
        document.getElementById('tags').value = frontMatter.tags.join(', ');
    }
}

// 获取前端物质数据
function getFrontMatterData() {
    const tags = document.getElementById('tags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    
    return {
        title: document.getElementById('title').value,
        published: new Date(document.getElementById('published').value || Date.now()),
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        draft: document.getElementById('draft').value === 'true',
        tags: tags,
        lang: '',
        pinned: false
    };
}

// 保存文章
async function savePost() {
    if (!currentPost && !document.getElementById('title').value) {
        alert('请先填写文章标题');
        return;
    }
    
    try {
        updateStatus('保存中...');
        
        const frontMatter = getFrontMatterData();
        const content = editor ? editor.getValue() : '';
        
        // 生成 slug
        const slug = currentPost ? currentPost.slug : generateSlug(frontMatter.title);
        
        const response = await fetch(`${API_BASE}/posts/${slug}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                frontMatter,
                content
            })
        });
        
        if (!response.ok) {
            throw new Error('保存失败');
        }
        
        const result = await response.json();
        
        // 更新当前文章信息
        if (!currentPost) {
            currentPost = { slug, frontMatter, content };
        } else {
            currentPost.frontMatter = frontMatter;
            currentPost.content = content;
        }
        
        document.getElementById('currentPost').textContent = frontMatter.title;
        
        // 重新加载文章列表
        await loadPosts();
        
        updateStatus('保存成功');
        
    } catch (error) {
        console.error('保存失败:', error);
        updateStatus('保存失败');
        alert('保存失败: ' + error.message);
    }
}

// 删除文章
async function deletePost() {
    if (!currentPost) {
        alert('请先选择要删除的文章');
        return;
    }
    
    if (!confirm(`确定要删除文章 "${currentPost.frontMatter.title}" 吗？此操作不可恢复！`)) {
        return;
    }
    
    try {
        updateStatus('删除中...');
        
        const response = await fetch(`${API_BASE}/posts/${currentPost.slug}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('删除失败');
        }
        
        // 清空编辑器
        currentPost = null;
        document.getElementById('currentPost').textContent = '未选择';
        
        if (editor) {
            editor.setValue('');
        }
        
        // 清空表单
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('category').value = '';
        document.getElementById('tags').value = '';
        document.getElementById('image').value = '';
        
        // 重新加载文章列表
        await loadPosts();
        
        updateStatus('删除成功');
        
    } catch (error) {
        console.error('删除失败:', error);
        updateStatus('删除失败');
        alert('删除失败: ' + error.message);
    }
}

// 创建新文章
function createNewPost() {
    currentPost = null;
    document.getElementById('currentPost').textContent = '新文章';
    
    // 清空表单
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('tags').value = '';
    document.getElementById('image').value = '';
    document.getElementById('draft').value = 'true';
    document.getElementById('published').value = new Date().toISOString().split('T')[0];
    
    // 清空编辑器
    if (editor) {
        editor.setValue('# 新文章\n\n开始写作...\n');
    }
    
    // 取消文章列表选中状态
    document.querySelectorAll('.post-item').forEach(item => {
        item.classList.remove('active');
    });
    
    updateStatus('创建新文章');
}

// 切换标签页
function switchTab(tabName) {
    // 更新标签页状态
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // 显示对应内容
    document.getElementById('frontmatterTab').classList.toggle('hidden', tabName !== 'frontmatter');
    document.getElementById('monaco-editor').classList.toggle('hidden', tabName !== 'content');
    document.getElementById('previewTab').classList.toggle('hidden', tabName !== 'preview');
    
    // 如果是预览标签页，生成预览
    if (tabName === 'preview') {
        generatePreview();
    }
}

// 生成预览
async function generatePreview() {
    const frontMatter = getFrontMatterData();
    const content = editor ? editor.getValue() : '';
    
    // 简单的 Markdown 预览（实际项目中可以使用 marked 库）
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
            <h1>${frontMatter.title}</h1>
            <div style="color: #666; margin-bottom: 2rem;">
                发布日期: ${new Date(frontMatter.published).toLocaleDateString()} | 
                分类: ${frontMatter.category} | 
                状态: ${frontMatter.draft ? '草稿' : '已发布'}
            </div>
            <div style="white-space: pre-wrap; line-height: 1.6;">
                ${content.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;
}

// 图片上传处理
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    uploadImages(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    uploadImages(files);
}

// 上传图片
async function uploadImages(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('请选择图片文件');
        return;
    }
    
    const slug = currentPost ? currentPost.slug : 'temp';
    
    for (const file of imageFiles) {
        try {
            updateStatus(`上传图片: ${file.name}`);
            
            const formData = new FormData();
            formData.append('image', file);
            formData.append('postSlug', slug);
            
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('上传失败');
            }
            
            const result = await response.json();
            
            // 插入图片到编辑器
            if (editor) {
                const imageMarkdown = `![${file.name}](${result.imagePath})\n`;
                editor.trigger('keyboard', 'type', { text: imageMarkdown });
            }
            
            updateStatus(`图片上传成功: ${file.name}`);
            
        } catch (error) {
            console.error('上传失败:', error);
            alert(`上传 ${file.name} 失败: ${error.message}`);
        }
    }
}

// 生成 slug
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') || `post-${Date.now()}`;
}

// 更新状态栏
function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}


























