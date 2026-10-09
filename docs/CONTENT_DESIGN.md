# 内容设计系统（`design/content-system` 分支）

这个分支用来试做博客的新结构，**不影响 main**：main 推送才会触发部署，这个分支只在本地。

核心思路：**按内容的「形态」排版，不按文件夹排版。** 一种形态对应一个模板，数据都从 Markdown 的属性（frontmatter）里来。

| 形态 | 页面 | 内容放哪 |
|---|---|---|
| 收藏库（番、资源站…） | `/library/`、`/library/<书架>/`、`/library/<书架>/<条目>/` | `src/content/library/<书架>/*.md` |
| 月记 | `/journal/`、`/journal/YYYY-MM/` | `src/content/journal/YYYY-MM.md`（可选） |
| 作品 | `/works/` | 沿用 `src/content/portfolio/` |
| 长文 | 沿用 `/posts/...` | 沿用 `src/content/posts/` |

---

## 本地预览

```bash
pnpm install
pnpm dev
```

然后打开：

- http://localhost:4321/library/ 收藏库首页
- http://localhost:4321/library/anime/ 动漫书架（网页版 Bases 视图）
- http://localhost:4321/journal/ 月记归档
- http://localhost:4321/journal/2026-04/ 一期示例月记
- http://localhost:4321/works/ 作品墙

---

## 日常写内容（只看这一节就够）

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
link: https://bgm.tv/subject/1424  # 可选，详情页会出现跳转按钮
---

正文写短评，会显示在详情页。
```

- 标题前的 `☆` / `♡` 会变成星星 / 爱心图标。
- 文件名决定网址：`k-on.md` → `/library/anime/k-on/`。想要好看的网址就用英文文件名。
- 现在的示例数据：`anime/` 是你 Obsidian「动漫.base」里评分最高的 10 部（封面来自 Bangumi），`sites/` 是从「轻小说资源推荐」那篇长文拆出来的 9 个站点和工具。

### 2. 加一个书架（比如漫画、游戏）

1. 新建文件夹 `src/content/library/manga/`，放笔记进去。
2. 在 `src/data/shelves.ts` 里加一项：书架名、图标、封面比例（海报 `3 / 4`，截图 `16 / 10`）、默认排序、卡片显示哪些属性。

收藏库首页、书架标签、导航都会自动多出这个书架（导航下拉要在 `src/config.ts` 里手动加一行）。

### 3. 月记

**每个有内容的月份都会自动生成一页**，不写也有。页面上这些部分是自动的：

- 统计条：这个月写了几篇、做了几个作品、收录了几条、收录的平均分
- 本月作品、本月写了、本月收录：按日期从文章、作品、收藏库里筛出来

想写几句话，就建 `src/content/journal/2026-10.md`：

```yaml
---
month: 2026-10
title: 给这个月起个名字      # 可选
summary: 一句话定调          # 可选，显示在标题下和归档页
cover: https://...           # 可选，不写就用本月作品或收录的封面
---

碎碎念，三五行就够。任务列表 - [ ] 也能用。
```

本地开发时，各版块旁边会显示「自动 / 手写」小标签，提示哪部分需要你写；线上不会显示。

### 4. 作品

继续写在 `src/content/portfolio/` 里，作品墙自动收录。两个建议：

- 加 `image:` 封面。没有的话会用正文第一张图，再没有就是字体封面（最新的「自动化头歌任务 Skill」现在就是这样）。
- 有仓库就写 `sourceLink:`，作品墙的大卡片会出现「源码」按钮。

---

## 代码结构（想改设计时看）

| 文件 | 作用 |
|---|---|
| `src/content/config.ts` | 新增 `library`、`journal` 两个集合；中文属性名在这里映射成英文字段 |
| `src/data/shelves.ts` | 书架配置 |
| `src/utils/kit/content.ts` | 数据层：把文章、作品、资源、收藏库统一成「条目」，月记汇总也在这里 |
| `src/components/kit/*` | 组件：`CollectionView`（Bases 式视图外壳）、`LibraryCard`、`WorkCard`、`Cover`、`PageHero`、`Kinetic`、`StatStrip`、`ShelfTabs` |
| `src/pages/library/`、`journal/`、`works.astro` | 页面 |
| `src/styles/kit.css` | 所有样式和动效参数 |
| `src/scripts/kit.ts` | 全站唯一的运行时脚本：入场动画、卡片筛选排序等 |
| `src/layouts/Layout.astro` | 只加了两行：引入 `kit.css` 和 `kit.ts` |

为什么脚本是全站一个：站点用 swup 做无刷新换页，换页时不会重新执行页面自己的模块脚本。所以 `kit.ts` 在首次加载和每次 `swup:page:view` 时扫描页面，按 `data-*` 属性挂载功能。

### 卡片视图怎么复用

`CollectionView` 只负责工具栏和网格，卡片通过 slot 传进去。任何卡片只要外层带上这些属性，就能被搜索、筛选、排序、分组：

```html
<div data-item data-title="标题" data-tags="标签1|标签2" data-date="2026-04-07" data-rating="9.5">…</div>
```

作品墙就是这样复用的。筛选状态会写进网址（`?tag=百合&sort=date`），可以直接分享；卡片 / 列表视图会记在浏览器里。

---

## 动效规则

参考了 [folia-major](https://github.com/chthollyphile/folia-major) 的动效手感，**只借鉴思路和参数，没有拷代码**（它是 AGPL-3.0 协议）。

| 属性 | 效果 |
|---|---|
| `data-split` | 标题逐字弹入：模糊 + 上移 + 缩放，弹簧曲线带约 15% 回弹 |
| `data-reveal` | 滚动到视口时「模糊对焦」入场；同一批出现的元素依次错峰 |
| `data-tabs` | 分段标签的滑动指示条（相当于 framer-motion 的 layoutId） |
| `data-tilt` | 指针悬停时 3D 微倾斜（只在有鼠标的设备上） |
| `data-count` | 数字从 0 滚动到目标值 |
| `.kit-kinetic` | 头部背景缓慢漂移的大字（folia 首页歌词背景那种） |

动效曲线在 `kit.css` 顶部：`--kit-spring`（柔和，回弹约 5%）、`--kit-pop`（弹入，约 15%），都是按弹簧物理参数算好的 CSS `linear()` 曲线。

原则：

1. 只动 `transform`、`opacity`、`filter`，不动布局属性。
2. 模糊入场结束后去掉 `filter`，不长期占用合成层。
3. 系统开了「减少动态效果」时，只保留淡入。
4. 筛选、排序、切换视图用浏览器原生 View Transitions 做位置过渡；不支持的浏览器直接切换。
5. 同一个元素不要同时加 `data-reveal` 和 `data-tilt`（两者都写 `transform`），要倾斜就套一层。

---

## 设计规则

- 颜色只用主题变量（`--primary` 等），换主题色、切暗色自动跟随。粉色只做强调，大面积用白和浅灰。
- 封面比例固定：海报 3:4，网站截图 16:10。
- 正文用 `.kit-prose`：中文字体栈，17px，行高 1.85，最宽 42em（一行约 40 个汉字）。
- 一个视图里最多一个实心按钮，其余用浅色按钮。
- 日期一律按 UTC 日历日处理，本地和线上构建结果一致。

---

## 顺手改的两处

- **导航**：「资源」「娱乐」两个下拉合并成「收藏库」，新增「月记」，「作品」指向作品墙。旧的「实用工具」「实用信息」暂时留在收藏库下拉里方便对比。
- **导航折行**：原来 1280px 宽时菜单文字会竖着折行。现在 1280 以下用汉堡菜单，1280–1439 收紧间距，文字不换行。

## 已知问题和下一步

- 控制台的 `Cannot use import statement outside a module` 来自主题原有的侧栏组件，不是这个分支引入的。
- 长文页（`/posts/...`）还没换成 `.kit-prose` 排版，这是下一步。
- 首页还是原来的列表，可以改成按形态区分的时间流。
- 旧追番页 `/anime/` 还是主题演示数据，可以删掉或指向 `/library/anime/`。
- 封面目前外链 Bangumi 和你的 OSS 图床；想更稳可以下载到本地。
- 以后可以在构建时直接解析 Obsidian 的 `.base` 文件，让网站视图和 Obsidian 里配的完全一致。
- Mizuki 作者已宣布停更、推荐迁移到 Shirone。这套 kit 只依赖主题变量和 Astro，以后迁移可以整体带走。
