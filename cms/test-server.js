import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 测试 API
app.get('/api/posts', (req, res) => {
  res.json([
    {
      slug: 'test-post',
      title: '测试文章',
      published: new Date(),
      draft: false,
      description: '这是一个测试文章',
      tags: ['测试'],
      category: '测试'
    }
  ]);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mizuki CMS 测试服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 管理界面: http://localhost:${PORT}`);
});


























