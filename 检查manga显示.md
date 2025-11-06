# Manga 独立文章主页显示检查清单

## 1. 文件是否存在

检查文件：`src/content/manga/进击的巨人.md`

应该包含完整的 frontmatter：
```yaml
---
title: 进击的巨人
published: 2025-11-05T00:00:00.000Z
description: ...
draft: false  # 必须是 false
pinned: false
---
```

## 2. 配置是否正确

文件：`src/config.ts`

```typescript
homepageContent: {
    showMangaPosts: true,  // ← 必须是 true
}
```

## 3. draft 字段

确保文章的 `draft: false`，如果是 `true` 则不会显示在主页

## 4. 生产环境

在开发环境（`npm run dev`）中：
- `draft: false` 的文章会显示
- `draft: true` 的文章也会显示

在生产环境（`npm run build`）中：
- 只有 `draft: false` 的文章会显示

## 5. 清除缓存

如果修改后没有生效，清除缓存：
```bash
Remove-Item -Recurse -Force .astro -ErrorAction SilentlyContinue
npm run dev
```

## 6. 检查终端输出

启动后查看终端是否有错误：
- `[ERROR]` - 表示有错误
- 特别注意 `InvalidContentEntryDataError` 错误

## 7. 浏览器检查

1. 打开主页 `http://localhost:4321/`
2. 按 F12 打开开发者工具
3. 查看 Console 是否有 JavaScript 错误
4. 查看 Network 标签，刷新页面，看请求是否正常

## 常见问题

### 问题1: 主页不显示 manga 文章
**原因**：`showMangaPosts: false`
**解决**：在 `src/config.ts` 中设为 `true`

### 问题2: 文章格式错误
**原因**：frontmatter 格式不正确
**解决**：
- 确保 `---` 前后没有空格
- 确保 `published` 是正确的日期格式
- 确保所有必需字段都存在

### 问题3: 样式不一致
**原因**：可能使用了不同的组件
**解决**：主页使用 `PostCard` 组件，所有文章类型应该一致

## 当前文件状态

```
src/content/
├── posts/              → 主页显示 (showBlogPosts: true)
├── manga/              → 主页显示 (showMangaPosts: true)
│   └── 进击的巨人.md
├── portfolio/          → 主页显示 (showPortfolioPosts: true)
└── manga-categories/   → 不在主页显示（只在 /manga/ 文件夹页显示）
    ├── 热血系列/
    ├── 推理系列/
    └── 日常系列/
```

## 验证步骤

1. 访问主页，应该看到《进击的巨人》
2. 点击文章，应该跳转到 `/manga/进击的巨人/`
3. 访问 `/manga/`，应该看到文件夹和《进击的巨人》
4. 样式应该与 posts 文章完全一致







