import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 根路径重定向到管理界面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'posts', req.body.postSlug || 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// 路径配置
const POSTS_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// API 路由

// 获取所有文章列表
app.get('/api/posts', async (req, res) => {
  try {
    const files = await fs.readdir(POSTS_DIR);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(POSTS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const { data } = matter(content);
        
        posts.push({
          slug: file.replace('.md', ''),
          filename: file,
          title: data.title || '无标题',
          published: data.published || new Date(),
          draft: data.draft || false,
          description: data.description || '',
          tags: data.tags || [],
          category: data.category || ''
        });
      }
    }

    // 按发布日期排序
    posts.sort((a, b) => new Date(b.published) - new Date(a.published));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: '获取文章列表失败', details: error.message });
  }
});

// 获取单篇文章
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: '文章不存在' });
    }

    const content = await fs.readFile(filePath, 'utf8');
    const { data, content: body } = matter(content);

    res.json({
      slug,
      frontMatter: data,
      content: body,
      rawContent: content
    });
  } catch (error) {
    res.status(500).json({ error: '获取文章失败', details: error.message });
  }
});

// 创建或更新文章
app.post('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { frontMatter, content } = req.body;

    // 构建完整的 Markdown 内容
    const fullContent = matter.stringify(content, frontMatter);
    
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    await fs.writeFile(filePath, fullContent, 'utf8');

    res.json({ 
      success: true, 
      message: '文章保存成功',
      slug,
      path: filePath
    });
  } catch (error) {
    res.status(500).json({ error: '保存文章失败', details: error.message });
  }
});

// 删除文章
app.delete('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: '文章不存在' });
    }

    await fs.remove(filePath);
    
    // 同时删除相关的图片目录（如果存在）
    const imageDir = path.join(PUBLIC_DIR, 'posts', slug);
    if (await fs.pathExists(imageDir)) {
      await fs.remove(imageDir);
    }

    res.json({ success: true, message: '文章删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除文章失败', details: error.message });
  }
});

// 上传图片
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const postSlug = req.body.postSlug || 'uploads';
    const imagePath = `/posts/${postSlug}/${req.file.filename}`;
    
    res.json({
      success: true,
      message: '图片上传成功',
      imagePath,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: '图片上传失败', details: error.message });
  }
});

// 获取图片列表
app.get('/api/images/:postSlug', async (req, res) => {
  try {
    const { postSlug } = req.params;
    const imageDir = path.join(PUBLIC_DIR, 'posts', postSlug);
    
    if (!await fs.pathExists(imageDir)) {
      return res.json({ images: [] });
    }

    const files = await fs.readdir(imageDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        path: `/posts/${postSlug}/${file}`,
        url: `http://localhost:4321/posts/${postSlug}/${file}`
      }));

    res.json({ images });
  } catch (error) {
    res.status(500).json({ error: '获取图片列表失败', details: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mizuki CMS 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 管理界面: http://localhost:${PORT}/admin`);
  console.log(`📁 文章目录: ${POSTS_DIR}`);
});
