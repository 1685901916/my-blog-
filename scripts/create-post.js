#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createPost() {
  console.log('🌸 Mizuki 文章创建助手\n');
  
  const title = await askQuestion('文章标题: ');
  const description = await askQuestion('文章描述: ');
  const category = await askQuestion('分类 (可选): ') || '默认';
  const tags = await askQuestion('标签 (用逗号分隔): ');
  
  const today = new Date().toISOString().split('T')[0];
  const filename = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  
  const frontMatter = `---
title: ${title}
published: ${today}
description: ${description}
image: ''
tags: [${tagArray.map(tag => `"${tag}"`).join(', ')}]
category: ${category}
draft: false
pinned: false
lang: ''
---

# ${title}

在这里开始写你的文章内容...

## 小节标题

你的内容...

### 子标题

更多内容...

---

*文章创建于 ${today}*
`;

  const filePath = path.join('src', 'content', 'posts', `${filename}.md`);
  
  try {
    fs.writeFileSync(filePath, frontMatter, 'utf8');
    console.log(`\n✅ 文章创建成功！`);
    console.log(`📁 文件位置: ${filePath}`);
    console.log(`🌐 启动开发服务器后访问: http://localhost:4321/`);
    console.log(`\n💡 提示: 现在可以用你喜欢的编辑器打开这个文件继续编写！`);
  } catch (error) {
    console.error('❌ 创建文章失败:', error.message);
  }
  
  rl.close();
}

createPost();
