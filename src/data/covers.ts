// 文章配图：键是阅读页路径（p/<文章 slug>、i/<Obsidian 随笔 id>），值是图片地址
// 文章 frontmatter 里写了 image 的以 frontmatter 为准；这里只给没写的补上
// 想换哪篇的封面，改这里就行（站内图片放 public/ 下，写 / 开头的路径；外链图片直接写网址）
export const COVERS: Record<string, string> = {
	// 文章
	"p/guide-post": "/assets/desktop-banner/2.webp",
	"p/xuexitong-checkin": "/assets/desktop-banner/d8.webp",
	"p/cet4-6": "/assets/desktop-banner/d3.webp",
	"p/rentui-guide": "/assets/desktop-banner/d7.webp",
	"p/light-novel-resources": "/assets/desktop-banner/d5.webp",
	"p/korean-light-novels": "/assets/desktop-banner/d4.webp",
	"p/manga-software-guide": "/assets/desktop-banner/1.webp",
	"p/ai-coding-agents-guide": "/assets/desktop-banner/d1.webp",
	"p/wiki-link-test-a": "/assets/desktop-banner/3.webp",
	"p/wiki-link-test-b": "/assets/desktop-banner/d6.webp",
	// 轻音少女用文章里自己的封面图
	"p/keion-girls": "https://image29135.oss-cn-wuhan-lr.aliyuncs.com/imag/Pasted%20image%2020250829221155.png",
	// Obsidian 里的随笔
	"i/粮仓": "/assets/anime/cmmn.webp",
	"i/梦": "/assets/anime/tz1.webp",
	"i/日语学习": "/assets/anime/laxxx.webp",
	"i/动画制作": "/assets/anime/lkls.webp",
};
