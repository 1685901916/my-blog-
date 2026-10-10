# 内容设计系统（`design/content-system` 分支）

这个分支用来试做博客的新结构，**不影响 main**：main 推送才会触发部署，这个分支只在本地。

核心思路：**整个站点就是一个 Obsidian 库**。每个页面都是同一个骨架：左边是「库」导航（像 Obsidian 左侧的文件 / 数据库列表），右边是一个数据库视图（卡片 + 搜索 / 筛选 / 排序 / 分组）。外观长在现有主题里，不另起一套风格。

## 站点结构

| 页面 | 是什么 | 内容放哪 |
|---|---|---|
| `/` 最近更新 | 文章、作品、月记混在一起按时间排，左栏按类型筛选 | 自动汇总 |
| `/posts/` 文章 | 所有长文，左栏按分类 / 标签筛选；按年份分组就是归档 | `src/content/posts/*.md` |
| `/library/` 收藏库 | 番、资源站等，一条笔记一张卡片 | `src/content/library/<书架>/*.md` |
| `/works/` 作品 | 作品墙，左栏按分组 / 技术栈筛选 | `src/content/portfolio/<normal|programming>/*.md` |
| `/journal/` 月记 | 每月一页，自动汇总 + 可选的手写部分 | `src/content/journal/YYYY-MM.md`（可选） |

文章、作品的详情页左栏是「库」导航 + 本文目录（窄屏时目录收进导航栏的目录按钮）。

**内容文件夹就这四个**，写东西时只要想「它是哪种形态」：

```
src/content/
  posts/      文章：教程、资源整理、记录……用 category 区分（实用工具 / 小说资源 / 赚钱……）
  portfolio/  作品：normal（正常系）/ programming（程序系）
  library/    收藏库：一个子文件夹一个书架（anime / sites / …）
  journal/    月记：YYYY-MM.md
```

（`spec/` 是关于、友链页的内容；`manga/`、`manga-categories/` 是主题自带的漫画演示，没有接进导航。）

以前的「资源」「娱乐」「实用工具」「实用信息」都变成了文章的分类，旧地址会自动跳转：

| 旧地址 | 跳到 |
|---|---|
| `/resources/entertainment/<分类>/<文章>/` | `/posts/<文章>/` |
| `/resources/utility/`、`/resources/info/` | `/posts/?cat=实用工具`、`/posts/?cat=实用信息` |
| `/portfolio/programming/`、`/portfolio/normal/` | `/works/?tag=程序系`、`/works/?tag=正常系` |
| `/2/`、`/3/`（旧主页分页） | `/posts/` |

---

## 本地预览

```bash
pnpm install
pnpm dev
```

然后打开 http://localhost:4321/ ，左栏的「库」可以走遍所有页面。

---

## 和现有系统怎么配合

### 侧边栏

全站侧边栏（头像、公告、分类、标签）在 swup 的换页容器外面，没法按页面换内容。所以页面用 `KitShell` 包一层：页面里出现 `data-kit-shell` 时，`kit.css` 用 `:has()` 隐藏全站侧边栏，换成页面自己的左栏。左栏外观直接用主题的 `WidgetLayout`，和原来的「分类」「标签」小组件一模一样。

| 页面 | 左栏 |
|---|---|
| 最近更新 | 个人卡片 + 库导航 + 类型（文章 / 作品 / 月记） |
| 文章 | 库导航 + 分类 + 标签 |
| 文章 / 作品详情 | 库导航 + 本文目录（滚动时高亮当前小节） |
| 收藏库 / 条目详情 | 库导航（书架在里面）+ 标签 |
| 作品 | 库导航 + 分组 + 技术栈 |
| 月记 | 库导航 + 月份列表 |

还没改造的页面（关于、友链、相册等）继续用主题原来的侧边栏。窄屏时左栏移到上方，变成可横滑的一行。

### 样式

尽量用主题已有的类，而不是自己定义一套：

- 卡片外壳：`card-base`
- 标题：粗体 + 左侧主题色竖条（和侧边栏小组件标题同款）
- 元信息：`meta-icon` 方块图标 + `text-50` 文字
- 标签：`btn-regular h-6 text-xs px-2 rounded-lg` + `# 标签`
- 正文：主题的 `Markdown` 组件，也会被站内搜索收录

主页横幅也降到和其他页面一样高（35% 屏高），首屏就能看到内容。

### 数据

- 文章里的分类、标签链接（`getCategoryUrl` / `getTagUrl`）都指向文章库的筛选：`/posts/?cat=…`、`/posts/?tag=…`。
- **手写的月记会出现在最近更新、归档和 RSS 里**。`journal` 集合的字段和文章兼容，链接指向 `/journal/YYYY-MM/`；归档和 RSS 用的 `/posts/YYYY-MM/` 会自动跳转过去。
- 收藏库条目不进「最近更新」，不然十几部番会把文章挤下去。

---

## 日常写内容

### 0. 文章

所有长文都放 `src/content/posts/`，**用 `category` 分类，不再建子文件夹**。文件名就是网址：`light-novel-resources.md` → `/posts/light-novel-resources/`。

```yaml
---
title: 轻小说资源推荐
published: 2026-04-01
description: 一句话简介，显示在卡片上
category: 小说资源        # 左栏「分类」里的一项；新写一个分类名就会自动多出一行
tags: [轻小说, 机翻, 工具] # 左栏「标签」
image: https://...        # 卡片封面；不写就用正文第一张图，再没有就是字体封面
---
```

想让某篇在卡片上好看，最有用的就是加一张 `image`。

### 1. 收藏库条目

一条笔记 = 一张卡片。属性名可以直接用 Obsidian 里的中文写法，**笔记原样拷过来就能用**：

```yaml
---
title: ♡☆轻音少女          # 不写 title 时用文件名当标题
cover: https://...jpg      # 也认「封面」「image」；不写就用正文第一张图，再没有就用字体封面
评分: 9.4                   # 也认 rating
文件标签: [动漫, 百合, 京阿尼] # 也认 tags；和书架同名的「动漫」会自动隐藏
date: 2024-06-15 11:43      # Obsidian 的日期格式都认；月记按它归月
year: 2009                  # 可选
link: https://bgm.tv/subject/1424  # 可选：卡片左上角出现直达按钮，详情页出现跳转按钮
---

正文写短评，会显示在详情页。
```

- 标题前的 `☆` / `♡` 会变成星星 / 爱心图标。
- 文件名决定网址：`k-on.md` → `/library/anime/k-on/`。
- 卡片上的 `# 标签` 可以直接点，点了就只看这个标签。

### 2. 加一个书架（比如漫画、游戏）

1. 新建文件夹 `src/content/library/manga/`，放笔记进去。
2. 在 `src/data/shelves.ts` 里加一项：书架名、图标、封面比例（海报 `3 / 4`，截图 `16 / 10`）、默认排序、卡片显示哪些属性。
3. 想在导航下拉里出现，就在 `src/config.ts` 的「收藏库」下面加一行。

### 3. 月记

**每个有内容的月份都会自动生成一页**，统计数字、本月作品、本月写了、本月收录都按日期自动汇总。想写几句话，就建 `src/content/journal/2026-10.md`：

```yaml
---
month: 2026-10
title: 给这个月起个名字      # 可选，不写就是「2026 年 10 月」
summary: 一句话定调          # 可选，显示在标题下、首页卡片和归档页
cover: https://...           # 可选，不写就用本月作品或收录的封面
---

碎碎念，三五行就够。任务列表 - [ ] 也能用。
```

写了就会出现在首页列表里。本地开发时页面上会显示「自动 / 手写」小标签和「还没写月记」的提示，线上不会显示。

### 4. 作品

继续写在 `src/content/portfolio/` 里。建议加 `image:` 封面（没有就用正文第一张图，再没有就是字体封面），有仓库就写 `sourceLink:`。最新的作品会在作品墙上占满一整行。

### 5. 长文排版（所有正文自动生效）

文章、作品、资源、月记、收藏库条目的正文都走主题的 Markdown 组件，所以排版是一起改的，**写法不用变**：

| 你在 Obsidian 里这样写 | 网站上变成 |
|---|---|
| 单独一行的链接 `[ESJ Zone](https://www.esjzone.cc/)` | 链接卡片：图标 + 标题 + 域名，整张可点 |
| 一张图（哪怕紧跟在文字下一行） | 从文字里拆出来，居中显示，最高 34rem，点开看大图 |
| 连着几行图片 | 排成网格 |
| 正文里的 `# 一级标题` | 当作节标题，比文章标题小，左侧有主题色竖条 |

另外：
- 宽屏下正文收成居中的一栏，最宽 46rem，17px 字号下一行约 40 个汉字。卡片宽度不变，和首页对齐。
- 段距收紧了，Obsidian 里一行一段的写法不再显得零碎。
- 引用块加了浅色底；GitHub 风格的 `> [!NOTE]` 提示块沿用主题样式。

想让某个链接保持普通文字链接，就别让它单独占一行（比如前面加几个字）。

---

## 代码结构

| 文件 | 作用 |
|---|---|
| `src/content/config.ts` | `library`、`journal` 两个集合；中文属性名在这里映射成英文字段 |
| `src/data/shelves.ts` | 书架配置 |
| `src/utils/kit/content.ts` | 数据层：把文章、作品、资源、收藏库统一成「条目」，月记汇总也在这里 |
| `src/utils/content-utils.ts`、`url-utils.ts` | 把手写月记接进首页列表 / 归档，链接指向 `/journal/` |
| `src/components/kit/KitShell.astro` | 页面骨架：左栏 + 主区，替换全站侧边栏 |
| `src/components/kit/VaultNav.astro` | 每页左栏第一块的「库」导航 |
| `src/components/kit/SideCats.astro`、`SideToc.astro`、`ProfileMini.astro` | 分类筛选、本文目录、主页的个人卡片 |
| `src/components/kit/ArticleCard.astro` | 文章 / 作品 / 月记共用的卡片 |
| `src/pages/index.astro`、`src/pages/posts/index.astro` | 最近更新、文章库 |
| `src/components/kit/SideNav.astro`、`SideTags.astro`、`JournalNav.astro` | 左栏小组件（基于主题的 `WidgetLayout`） |
| `src/components/kit/KitHeader.astro`、`Toolbar.astro` | 头部卡片和 Bases 式工具栏 |
| `src/components/kit/LibraryView.astro` | 收藏库视图（全部 / 单个书架共用） |
| `src/components/kit/LibraryCard.astro`、`WorkCard.astro`、`Cover.astro`、`StatStrip.astro` | 卡片和小部件 |
| `src/pages/library/`、`journal/`、`works.astro` | 页面 |
| `src/styles/kit.css` | 主题里没有的样式和动效参数 |
| `src/styles/article.css` | 长文排版：阅读栏宽度、段距、标题、图片、链接卡片 |
| `src/plugins/rehype-md-blocks.mjs` | Markdown 插件：单独一行的外链 → 链接卡片；图片拆出成居中图 / 网格 |
| `src/scripts/kit.ts` | 全站唯一的运行时脚本：入场动画、卡片筛选排序等 |
| `src/layouts/Layout.astro` | 只加了三行：引入 `kit.css`、`article.css` 和 `kit.ts` |

为什么脚本是全站一个：站点用 swup 做无刷新换页，换页时不会重新执行页面自己的模块脚本。所以 `kit.ts` 在首次加载和每次 `swup:page:view` 时扫描页面，按 `data-*` 属性挂载功能。

### 卡片视图怎么复用

给 `KitShell` 传 `collection`，整块区域（包括左栏）就是一个 Bases 式视图的作用域。里面放 `Toolbar`、带 `data-filter` 的筛选按钮和 `data-items` 网格，卡片外层带上这些属性就能被搜索、筛选、排序、分组：

```html
<div data-item data-title="标题" data-tags="标签1|标签2" data-date="2026-04-07" data-rating="9.5">…</div>
```

筛选状态会写进网址（`?tag=百合&sort=date`），可以直接分享；卡片 / 列表视图会记在浏览器里。

---

## 动效

参考了 [folia-major](https://github.com/chthollyphile/folia-major) 的动效手感，**只借鉴思路和参数，没有拷代码**（它是 AGPL-3.0 协议）。为了和主题统一，只保留不打扰阅读的那部分：

| 属性 | 效果 |
|---|---|
| `data-split` | 标题逐字弹入：模糊 + 上移 + 缩放，弹簧曲线带约 15% 回弹 |
| `data-reveal` | 滚动到视口时「模糊对焦」入场；同一批出现的元素依次错峰 |
| `data-tabs` | 卡片 / 列表切换的滑动指示条 |
| `data-tilt` | 作品卡片悬停时 3D 微倾斜（只在有鼠标的设备上） |
| `data-count` | 数字从 0 滚动到目标值 |

筛选、排序、切换视图时用浏览器原生 View Transitions 做位置过渡；系统开了「减少动态效果」时只保留淡入。同一个元素不要同时加 `data-reveal` 和 `data-tilt`（两者都写 `transform`），要倾斜就套一层。

---

## 已知问题和下一步

- 控制台的 `Cannot use import statement outside a module` 来自主题原有的侧栏组件，不是这个分支引入的。
- Obsidian 里单个换行就会换行，网站上单个换行会被合并成一个空格（标准 Markdown 行为）。想完全一致可以加 `remark-breaks`，但会影响所有旧文章的排版，需要逐篇检查后再决定。
- 旧追番页 `/anime/` 和 `/archive/` 归档页还在，导航已经不再链接它们，确认不需要后可以删掉。
- 分类里的「测试」是两篇双链测试文章，不需要可以删掉或设成 `draft: true`。
- 封面目前外链 Bangumi 和你的 OSS 图床；想更稳可以下载到本地。
- 以后可以在构建时直接解析 Obsidian 的 `.base` 文件，让网站视图和 Obsidian 里配的完全一致。
- Mizuki 作者已宣布停更、推荐迁移到 Shirone。这套 kit 只依赖主题变量和 Astro，以后迁移可以整体带走。
