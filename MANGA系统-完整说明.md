# Manga 系统 - 完整使用说明

## 系统结构

```
src/content/
├── manga/                    # 独立文章（显示在主页 + /manga/）
│   └── 进击的巨人.md          # 示例独立文章
│
└── manga-categories/         # 文件夹文章（只在文件夹页显示）
    ├── 热血系列/
    │   ├── info.json         # 文件夹信息（标题、描述、封面）
    │   ├── 海贼王.md
    │   └── 火影忍者.md
    ├── 推理系列/
    │   ├── info.json
    │   ├── 名侦探柯南.md
    │   └── 金田一少年事件簿.md
    └── 日常系列/
        ├── info.json
        ├── 悠哉日常大王.md
        └── 阿松.md
```

## 路由系统

### 独立文章
- **文件位置**：`src/content/manga/进击的巨人.md`
- **访问 URL**：`/manga/进击的巨人/`
- **显示位置**：
  - 主页（如果 `showMangaPosts: true`）
  - `/manga/` 列表页

### 文件夹文章
- **文件位置**：`src/content/manga-categories/热血系列/海贼王.md`
- **访问 URL**：`/manga/热血系列/海贼王/`
- **显示位置**：
  - `/manga/热血系列/` 文件夹页面
  - **不显示在主页**

### 文件夹本身
- **文件位置**：`src/content/manga-categories/热血系列/info.json`
- **访问 URL**：`/manga/热血系列/`
- **显示位置**：`/manga/` 列表页

## 主页显示控制

**文件**：`src/config.ts`

```typescript
export const siteConfig = {
    homepageContent: {
        showBlogPosts: true,      // 控制博客文章
        showMangaPosts: true,     // 控制 manga 独立文章 ⬅️ 这个
        showPortfolioPosts: true, // 控制作品集
    }
}
```

- `showMangaPosts: true` → 主页显示 `src/content/manga/` 下的文章
- `showMangaPosts: false` → 主页不显示，但仍可通过 `/manga/` 访问

## 创建独立文章

### 1. 创建文件

在 `src/content/manga/` 创建新的 `.md` 文件：

```markdown
---
title: 东京食尸鬼
published: 2025-11-05T00:00:00.000Z
description: 石田翠创作的黑暗奇幻漫画
image: ''
tags: ["漫画", "黑暗", "奇幻"]
category: 漫画
draft: false  # false = 显示，true = 隐藏
pinned: false # true = 置顶
lang: ''
---

# 东京食尸鬼

## 简介

内容...
```

### 2. 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 文章标题（必需）|
| `published` | date | 发布日期（必需）|
| `description` | string | 简介（可选）|
| `image` | string | 封面图片路径（可选）|
| `tags` | array | 标签列表（可选）|
| `category` | string | 分类（可选，默认"漫画"）|
| `draft` | boolean | 是否草稿（可选，默认 false）|
| `pinned` | boolean | 是否置顶（可选，默认 false）|

### 3. 保存后立即生效

保存文件后，开发服务器会自动重新加载，文章会出现在：
- 主页（如果 `showMangaPosts: true`）
- `/manga/` 列表页

## 创建文件夹和文章

### 1. 创建文件夹结构

```bash
src/content/manga-categories/
└── 运动系列/           # 新文件夹
    ├── info.json       # 文件夹信息
    ├── 灌篮高手.md
    └── 足球小将.md
```

### 2. 创建 info.json

```json
{
  "title": "运动系列",
  "description": "充满汗水与激情的运动漫画",
  "cover": ""
}
```

### 3. 创建文章文件

每个文章使用相同的 frontmatter 格式：

```markdown
---
title: 灌篮高手
published: 2025-11-05T00:00:00.000Z
description: ...
# ... 其他字段
---
```

## 样式说明

### 主页样式
所有文章（posts、manga、portfolio）在主页使用完全相同的样式：
- 相同的卡片布局
- 相同的标签样式（根据 `siteConfig.tagStyle.useNewStyle` 配置）
- 相同的元数据显示
- 相同的封面图片处理

### /manga/ 列表页样式
- **文件夹卡片**：左侧显示文件夹图标或封面，右侧显示标题和描述
- **独立文章卡片**：与主页样式完全相同

## 常见问题

### Q1: 为什么主页看不到 manga 文章？

**检查项**：
1. `src/config.ts` 中 `showMangaPosts` 是否为 `true`
2. 文章的 `draft` 是否为 `false`
3. 终端是否有错误信息
4. 清除缓存：`Remove-Item -Recurse -Force .astro; npm run dev`

### Q2: 文件夹内的文章能显示在主页吗？

**不能**。文件夹内的文章（`manga-categories/文件夹/文章.md`）只会显示在文件夹页面，不会显示在主页。

如果想让某篇文章显示在主页，请将它放在 `src/content/manga/` 目录。

### Q3: 如何让某篇文章置顶？

在文章的 frontmatter 中设置：

```yaml
---
pinned: true  # 设为 true 即可置顶
---
```

置顶文章会在主页和列表页最前面显示。

### Q4: 独立文章和文件夹文章有什么区别？

| 特性 | 独立文章 | 文件夹文章 |
|------|---------|-----------|
| 位置 | `src/content/manga/` | `src/content/manga-categories/文件夹/` |
| 主页显示 | ✅ 可控制 | ❌ 不显示 |
| /manga/ 显示 | ✅ 显示 | ✅ 显示在文件夹内 |
| URL | `/manga/文章名/` | `/manga/文件夹/文章名/` |
| 置顶 | ✅ 支持 | ✅ 支持（仅在文件夹内）|

## 完整示例

### 示例1: 创建独立文章

**文件**：`src/content/manga/钢之炼金术师.md`

```markdown
---
title: 钢之炼金术师
published: 2025-11-05T00:00:00.000Z
description: 荒川弘创作的奇幻冒险漫画
image: ''
tags: ["漫画", "奇幻", "冒险", "兄弟情"]
category: 漫画
draft: false
pinned: false
lang: ''
---

# 钢之炼金术师

## 简介

《钢之炼金术师》讲述了爱德华和阿尔冯斯兄弟寻找贤者之石的故事...
```

**效果**：
- 访问 `/manga/钢之炼金术师/` 可以看到文章
- 主页会显示这篇文章
- `/manga/` 列表页会显示这篇文章

### 示例2: 创建文件夹

**步骤**：
1. 创建目录：`src/content/manga-categories/科幻系列/`
2. 创建 `info.json`：
```json
{
  "title": "科幻系列",
  "description": "探索未来与科技的科幻漫画",
  "cover": ""
}
```
3. 创建文章：`src/content/manga-categories/科幻系列/铳梦.md`

**效果**：
- `/manga/` 会显示"科幻系列"文件夹
- 点击文件夹进入 `/manga/科幻系列/`
- 文件夹页面显示内部的所有文章
- 文章 URL：`/manga/科幻系列/铳梦/`

## 测试清单

启动开发服务器后，测试以下功能：

- [ ] 主页显示 manga 独立文章
- [ ] 点击文章跳转到 `/manga/文章名/`
- [ ] `/manga/` 显示文件夹和独立文章
- [ ] 点击文件夹跳转到 `/manga/文件夹/`
- [ ] 文件夹页面显示内部文章
- [ ] 点击文件夹内文章跳转到 `/manga/文件夹/文章名/`
- [ ] 样式与主页文章一致
- [ ] 标签可点击并跳转
- [ ] 分类可点击并跳转

## 部署到生产环境

构建命令：
```bash
npm run build
```

构建后，`dist` 目录包含所有静态文件，可以部署到任何静态托管服务。

**注意**：生产环境只会显示 `draft: false` 的文章。







