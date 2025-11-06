# Manga 独立文章使用说明

## 文件位置

独立的 manga 文章存放在：`src/content/manga/`

当前示例文章：
- `进击的巨人.md`

## 文章特性

### 1. 双重显示位置
- **主页**：如果 `siteConfig.homepageContent.showMangaPosts = true`
- **Manga 列表页**：`/manga/` 页面（与文件夹一起显示）

### 2. 独立路由
- 访问路径：`/manga/进击的巨人/`
- 不同于文件夹内文章：`/manga/热血系列/海贼王/`

### 3. 控制主页显示

**文件：`src/config.ts`**

```typescript
export const siteConfig = {
    // ... 其他配置
    homepageContent: {
        showBlogPosts: true,      // 控制博客文章
        showMangaPosts: true,     // 控制 manga 独立文章
        showPortfolioPosts: true, // 控制作品集
    }
}
```

- 设为 `true`：文章显示在主页
- 设为 `false`：文章不显示在主页，但仍可通过 `/manga/` 访问

### 4. 置顶功能

在文章的 frontmatter 中设置：

```yaml
---
title: 进击的巨人
published: 2025-11-05T00:00:00.000Z
pinned: true  # 设为 true 即可置顶
draft: false
# ... 其他字段
---
```

置顶文章会在主页和 `/manga/` 列表页置顶显示。

## 创建新的独立文章

1. 在 `src/content/manga/` 创建新的 `.md` 文件
2. 添加完整的 frontmatter：

```yaml
---
title: 文章标题
published: 2025-11-05T00:00:00.000Z
description: 文章简介
image: ''  # 可选：封面图片路径
tags: ["标签1", "标签2"]
category: 漫画
draft: false  # true 为草稿，不会显示
pinned: false  # true 为置顶
lang: ''
---
```

3. 编写 Markdown 内容
4. 保存后即可在主页和 `/manga/` 看到

## 与文件夹文章的区别

### 独立文章（`src/content/manga/`）
- ✅ 显示在主页（可控制）
- ✅ 显示在 `/manga/` 列表页
- ✅ 路由：`/manga/文章名/`
- ✅ 可以置顶

### 文件夹文章（`src/content/manga-categories/文件夹/`）
- ❌ 不显示在主页
- ✅ 显示在 `/manga/` 的文件夹卡片中
- ✅ 显示在 `/manga/文件夹/` 页面
- ✅ 路由：`/manga/文件夹/文章名/`
- ✅ 文件夹可以有封面和描述

## 样式

独立文章的样式与主页文章完全一致：
- 相同的卡片布局
- 相同的标签样式
- 相同的元数据显示（日期、分类、字数）
- 相同的封面图片处理
- 相同的悬停效果

## 示例对比

### 主页显示
```
┌─────────────────────────────────┐
│ 📝 博客文章                      │
│ 📚 漫画独立文章 (进击的巨人)     │  ← 独立文章
│ 💼 作品集文章                    │
└─────────────────────────────────┘
```

### /manga/ 页面显示
```
┌─────────────────────────────────┐
│ 📁 热血系列 (文件夹)             │
│ 📁 推理系列 (文件夹)             │
│ 📁 日常系列 (文件夹)             │
│ 📚 进击的巨人 (独立文章)         │  ← 独立文章
└─────────────────────────────────┘
```

## 测试

访问以下页面验证：
1. **主页**：`http://localhost:4321/` - 查看是否显示独立文章
2. **Manga 列表**：`http://localhost:4321/manga/` - 查看文件夹和独立文章
3. **独立文章**：`http://localhost:4321/manga/进击的巨人/` - 查看文章详情







