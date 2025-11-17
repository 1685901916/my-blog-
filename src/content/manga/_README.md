# 漫画内容结构说明

## 文件夹结构

```
src/content/manga/
├── 分类名称/              # 漫画分类文件夹（如：热血系列、推理系列、日常系列）
│   └── 漫画名称.md        # 漫画文章
└── 独立漫画.md            # 不属于任何分类的独立漫画

src/content/manga-categories/
└── 分类名称/              # 漫画分类文件夹
    ├── info.json         # 分类信息文件
    └── 漫画名称.md        # 该分类下的漫画文章
```

## 漫画文章格式 (manga/*.md)

```markdown
---
title: 漫画标题
published: 2025-01-20
description: 漫画简介
image: /path/to/cover.jpg  # 封面图片（可选）
tags: ["标签1", "标签2"]
category: 分类名称          # 如果属于某个分类
draft: false
---

漫画内容...
```

## 分类信息格式 (manga-categories/*/info.json)

```json
{
  "name": "分类名称",
  "description": "分类描述",
  "cover": "cover.jpg"
}
```

## 示例

### 独立漫画示例
文件：`src/content/manga/进击的巨人.md`

```markdown
---
title: 进击的巨人
published: 2025-01-20
description: 一部关于人类与巨人战斗的漫画
image: /manga/attack-on-titan/cover.jpg
tags: ["热血", "战斗"]
draft: false
---

漫画内容...
```

### 分类漫画示例
文件：`src/content/manga-categories/热血系列/海贼王.md`

```markdown
---
title: 海贼王
published: 2025-01-20
description: 路飞的冒险故事
image: /manga/one-piece/cover.jpg
tags: ["热血", "冒险"]
category: 热血系列
draft: false
---

漫画内容...
```

文件：`src/content/manga-categories/热血系列/info.json`

```json
{
  "name": "热血系列",
  "description": "充满激情和战斗的漫画",
  "cover": "cover.jpg"
}
```

## 访问路径

- 漫画列表页：`/manga/`
- 分类页面：`/manga/分类名称/`
- 漫画详情页：`/manga/分类名称/漫画名称/` 或 `/manga/漫画名称/`（独立漫画）

## 注意事项

1. 分类文件夹名称必须与 `category` 字段一致
2. 每个分类文件夹下必须有 `info.json` 文件
3. 图片路径相对于 `/public` 目录
4. 独立漫画不需要 `category` 字段

