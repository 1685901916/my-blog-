import type {
	AnnouncementConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	FullscreenWallpaperConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	ProfileConfig,
	SakuraConfig,
	SidebarLayoutConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// 移除i18n导入以避免循环依赖

// 定义站点语言
const SITE_LANG = "zh_CN"; // 语言代码，例如：'en', 'zh_CN', 'ja' 等。

export const siteConfig: SiteConfig = {
	title: "文乃的小站",
	subtitle: "记录生活，分享美好",
	siteURL: "http://localhost:4322/",
	timeZone: 8,

	lang: SITE_LANG,

	// SEO关键词配置
	keywords: [
		"二次元",
		"动漫",
		"漫画",
		"轻小说",
		"韩轻",
		"游戏",
		"资源分享",
		"ACG",
		"番剧推荐",
		"小说推荐",
	],

	themeColor: {
		hue: 360, // 主题色的默认色相，范围从 0 到 360。例如：红色：0，青色：200，蓝绿色：250，粉色：345
		fixed: false, // 对访问者隐藏主题色选择器
	},

	// 特色页面开关配置(关闭不在使用的页面有助于提升SEO,关闭后直接在顶部导航删除对应的页面就行)
	featurePages: {
		anime: true, // 番剧页面开关
		diary: true, // 日记页面开关
		friends: true, // 友链页面开关
		projects: false, // 项目页面开关 - 已关闭
		skills: false, // 技能页面开关 - 已关闭
		timeline: false, // 时间线页面开关 - 已关闭
		albums: true, // 相册页面开关
		devices: true, // 设备页面开关
	},

	// ==========================================
	// 🎚️ 主页内容显示开关配置
	// ==========================================
	// 控制主页 (http://localhost:4321/) 显示哪些内容
	// 各专题页面（/manga/, /portfolio/ 等）不受影响
	// ==========================================
	homepageContent: {
		showBlogPosts: true, // ✅ 博客文章 - 设为 false 则主页不显示博客
		showMangaPosts: false, // ❌ 漫画内容 - 关闭主页显示
		showPortfolioPosts: true, // ✅ 作品集   - 在主页显示
		showEntertainmentPosts: true, // ✅ 娱乐资源 - 在主页显示
	},
	// ==========================================

	// 顶栏标题配置
	navbarTitle: {
		// 顶栏标题文本
		text: "文乃的小站",
		// 顶栏标题图标路径，使用圆形头像（需要放在 public 目录）
		icon: "/avatar-icon.png",
	},

	bangumi: {
		userId: "your-bangumi-id", // 在此处设置你的Bangumi用户ID，可以设置为 "sai" 测试
	},

	anime: {
		mode: "local", // 番剧页面模式："bangumi" 使用Bangumi API，"local" 使用本地配置
	},

	// 文章列表布局配置
	postListLayout: {
		// 默认布局模式："list" 列表模式（单列布局），"grid" 网格模式（双列布局）
		defaultMode: "list",
		// 是否允许用户切换布局
		allowSwitch: true,
	},

	// 标签样式配置
	tagStyle: {
		// 是否使用新样式（悬停高亮样式）还是旧样式（外框常亮样式）
		useNewStyle: false,
	},

	// 壁纸模式配置
	wallpaperMode: {
		// 默认壁纸模式：banner=顶部横幅，fullscreen=全屏壁纸，none=无壁纸
		defaultMode: "banner",
		// 布局切换按钮显示策略：off|mobile|desktop|both
		showModeSwitchOnMobile: "desktop",
	},

	banner: {
		enable: true, // 是否启动Banner壁纸模式

		// 支持单张图片或图片数组，当数组长度 > 1 时自动启用轮播
		src: {
			desktop: "/assets/desktop-banner/custom-bg.jpg", // 桌面横幅图片
			mobile: "/assets/mobile-banner/custom-bg.jpg", // 移动横幅图片
		}, // 使用本地横幅图片

		position: "center", // 等同于 object-position，仅支持 'top', 'center', 'bottom'。默认为 'center'

		carousel: {
			enable: false, // 为 true 时：为多张图片启用轮播。为 false 时：从数组中随机显示一张图片

			interval: 1.5, // 轮播间隔时间（秒）
		},

		waves: {
			enable: true, // 是否启用水波纹效果(这个功能比较吃性能)
			performanceMode: true, // 性能模式：减少动画复杂度(性能提升40%)
			mobileDisable: false, // 移动端禁用
		},

		// PicFlow API支持(智能图片API)
		imageApi: {
			enable: false, // 启用图片API
			url: "http://domain.com/api_v2.php?format=text&count=4", // API地址，返回每行一个图片链接的文本
		},
		// 这里需要使用PicFlow API的Text返回类型,所以我们需要format=text参数
		// 项目地址:https://github.com/matsuzaka-yuki/PicFlow-API
		// 请自行搭建API

		homeText: {
			enable: true, // 在主页显示自定义文本
			title: "文乃的小站", // 主页横幅主标题

			subtitle: [
				"欢迎来到我的个人空间",
				"记录生活的美好瞬间",
				"分享学习与成长",
				"探索无限可能",
			],
			typewriter: {
				enable: true, // 启用副标题打字机效果

				speed: 100, // 打字速度（毫秒）
				deleteSpeed: 50, // 删除速度（毫秒）
				pauseTime: 2000, // 完全显示后的暂停时间（毫秒）
			},
		},

		credit: {
			enable: false, // 显示横幅图片来源文本

			text: "Describe", // 要显示的来源文本
			url: "", // （可选）原始艺术品或艺术家页面的 URL 链接
		},

		navbar: {
			transparentMode: "semifull", // 导航栏透明模式："semi" 半透明加圆角，"full" 完全透明，"semifull" 动态透明
		},
	},
	toc: {
		enable: true, // 启用目录功能
		depth: 3, // 目录深度
	},
	generateOgImages: false, // 启用生成OpenGraph图片功能
	favicon: [
		// 使用自定义头像作为站点图标
		{ src: "/favicon/avatar-32.png", sizes: "32x32" },
		{ src: "/favicon/avatar-128.png", sizes: "128x128" },
		{ src: "/favicon/avatar-180.png", sizes: "180x180" },
		{ src: "/favicon/avatar-192.png", sizes: "192x192" },
	],
	// 字体配置
	font: {
		zenMaruGothic: {
			enable: true, // 启用全局圆体适合日语和英语
		},
		hanalei: {
			enable: false, // 启用 Hanalei 字体作为全局字体
		},
	},
	showLastModified: true, // 控制“上次编辑”卡片显示的开关
};
export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	enable: false, // 启用全屏壁纸功能,非Banner模式下生效
	src: {
		desktop: "/assets/desktop-banner/custom-bg.jpg", // 桌面横幅图片
		mobile: "/assets/mobile-banner/custom-bg.jpg", // 移动横幅图片
	}, // 使用本地横幅图片
	position: "center", // 壁纸位置，等同于 object-position
	carousel: {
		enable: false, // 禁用轮播（只有一张图片）
		interval: 1, // 轮播间隔时间（秒）
	},
	zIndex: -1, // 层级，确保壁纸在背景层
	opacity: 0.8, // 壁纸透明度
	blur: 1, // 背景模糊程度
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "资源",
			url: "/resources/",
			icon: "material-symbols:folder-open",
			children: [
				{
					name: "娱乐资源",
					url: "/resources/entertainment/",
					icon: "material-symbols:sports-esports",
				},
				{
					name: "实用工具",
					url: "/resources/utility/",
					icon: "material-symbols:construction",
				},
				{
					name: "实用信息",
					url: "/resources/info/",
					icon: "material-symbols:menu-book",
				},
			],
		},
		{
			name: "娱乐",
			url: "/entertainment/",
			icon: "material-symbols:sports-esports",
			children: [
				{
					name: "动漫",
					url: "/anime/",
					icon: "material-symbols:movie",
				},
				{
					name: "漫画",
					url: "/manga/",
					icon: "material-symbols:book",
				},
				{
					name: "小说",
					url: "/novel/",
					icon: "material-symbols:menu-book",
				},
				{
					name: "游戏",
					url: "/games/",
					icon: "material-symbols:sports-esports",
				},
			],
		},
		// 支持自定义导航栏链接,并且支持多级菜单,3.1版本新加
		{
			name: "作品集",
			url: "/portfolio/",
			icon: "material-symbols:work-outline",
			children: [
				{
					name: "正常系",
					url: "/portfolio/normal/",
					icon: "material-symbols:palette-outline",
				},
				{
					name: "程序系",
					url: "/portfolio/programming/",
					icon: "material-symbols:code",
				},
			],
		},
		{
			name: "赞助",
			url: "/sponsor/",
			icon: "material-symbols:favorite",
		},
		{
			name: "My",
			url: "/content/",
			icon: "material-symbols:person",
			children: [
				LinkPreset.Friends,
				LinkPreset.About,
				LinkPreset.Anime,
				LinkPreset.Diary,
				{
					name: "Gallery",
					url: "/albums/",
					icon: "material-symbols:photo-library",
				},
			],
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.jpg", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "Ayano",
	bio: "计算机专业大学生，B站Git源宝学员。老二次元，有千部以上阅番量。相信站长的品味，目前在学习AI相关。本站有很多实用工具～",
	typewriter: {
		enable: false, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/1685901916",
		},
		// {
		// 	name: "Bilibli",
		// 	icon: "fa6-brands:bilibili",
		// 	url: "https://space.bilibili.com/701864046",
		// },
		// {
		// 	name: "Gitee",
		// 	icon: "mdi:git",
		// 	url: "https://gitee.com/matsuzakayuki",
		// },
		// {
		// 	name: "Codeberg",
		// 	icon: "simple-icons:codeberg",
		// 	url: "https://codeberg.org",
		// },
		// {
		// 	name: "Discord",
		// 	icon: "fa6-brands:discord",
		// 	url: "https://discord.gg/MqW6TcQtVM",
		// },
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// 注意：某些样式（如背景颜色）已被覆盖，请参阅 astro.config.mjs 文件。
	// 请选择深色主题，因为此博客主题目前仅支持深色背景
	theme: "github-dark",
};

export const commentConfig: CommentConfig = {
	enable: false, // 启用评论功能。当设置为 false 时，评论组件将不会显示在文章区域。
	twikoo: {
		envId: "https://twikoo.vercel.app",
		lang: "zh-CN", // 设置 Twikoo 评论系统语言为中文
	},
};

export const announcementConfig: AnnouncementConfig = {
	title: "公告", // 公告标题
	content:
		"本站正在建设中，大部分文件多是ai生成主要是为了测试，不代表最终成果。", // 公告内容
	closable: true, // 允许用户关闭公告
	link: {
		enable: true, // 启用链接
		text: "了解更多", // 链接文本
		url: "/about/", // 链接 URL
		external: false, // 内部链接
	},
};

export const musicPlayerConfig: MusicPlayerConfig = {
	enable: false, // 关闭音乐播放器（默认不展示）
	defaultHidden: true, // 即便开启也默认隐藏为小圆球模式
};

export const footerConfig: FooterConfig = {
	enable: false, // 是否启用Footer HTML注入功能
};

// 直接编辑 FooterConfig.html 文件来添加备案号等自定义内容

/**
 * 侧边栏布局配置
 * 用于控制侧边栏组件的显示、排序、动画和响应式行为
 */
export const sidebarLayoutConfig: SidebarLayoutConfig = {
	// 是否启用侧边栏功能
	enable: true,

	// 侧边栏位置：左侧或右侧
	position: "left",

	// 侧边栏组件配置列表
	components: [
		{
			// 组件类型：用户资料组件
			type: "profile",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序（数字越小越靠前）
			order: 1,
			// 组件位置："top" 表示固定在顶部
			position: "top",
			// CSS 类名，用于应用样式和动画
			class: "onload-animation",
			// 动画延迟时间（毫秒），用于错开动画效果
			animationDelay: 0,
		},
		{
			// 组件类型：公告组件
			type: "announcement",
			// 是否启用该组件（现在通过统一配置控制）
			enable: true,
			// 组件显示顺序
			order: 2,
			// 组件位置："top" 表示固定在顶部
			position: "top",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 50,
		},
		{
			// 组件类型：分类组件
			type: "categories",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序
			order: 3,
			// 组件位置："sticky" 表示粘性定位，可滚动
			position: "sticky",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 150,
			// 响应式配置
			responsive: {
				// 折叠阈值：当分类数量超过5个时自动折叠
				collapseThreshold: 5,
			},
		},
		{
			// 组件类型：标签组件
			type: "tags",
			// 是否启用该组件
			enable: true,
			// 组件显示顺序
			order: 5,
			// 组件位置："sticky" 表示粘性定位
			position: "sticky",
			// CSS 类名
			class: "onload-animation",
			// 动画延迟时间
			animationDelay: 250,
			// 响应式配置
			responsive: {
				// 折叠阈值：当标签数量超过20个时自动折叠
				collapseThreshold: 20,
			},
		},
	],

	// 默认动画配置
	defaultAnimation: {
		// 是否启用默认动画
		enable: true,
		// 基础延迟时间（毫秒）
		baseDelay: 0,
		// 递增延迟时间（毫秒），每个组件依次增加的延迟
		increment: 50,
	},

	// 响应式布局配置
	responsive: {
		// 断点配置（像素值）
		breakpoints: {
			// 移动端断点：屏幕宽度小于768px
			mobile: 768,
			// 平板端断点：屏幕宽度小于1024px
			tablet: 1024,
			// 桌面端断点：屏幕宽度小于1280px
			desktop: 1280,
		},
		// 不同设备的布局模式
		//hidden:不显示侧边栏(桌面端)   drawer:抽屉模式(移动端不显示)   sidebar:显示侧边栏
		layout: {
			// 移动端：隐藏侧边栏（修复移动端排版问题）
			mobile: "hidden",
			// 平板端：显示侧边栏
			tablet: "sidebar",
			// 桌面端：显示侧边栏
			desktop: "sidebar",
		},
	},
};

export const sakuraConfig: SakuraConfig = {
	enable: false, // 默认关闭樱花特效
	sakuraNum: 21, // 樱花数量
	limitTimes: -1, // 樱花越界限制次数，-1为无限循环
	size: {
		min: 0.5, // 樱花最小尺寸倍数
		max: 1.1, // 樱花最大尺寸倍数
	},
	opacity: {
		min: 0.3, // 樱花最小不透明度
		max: 0.9, // 樱花最大不透明度
	},
	speed: {
		horizontal: {
			min: -1.7, // 水平移动速度最小值
			max: -1.2, // 水平移动速度最大值
		},
		vertical: {
			min: 1.5, // 垂直移动速度最小值
			max: 2.2, // 垂直移动速度最大值
		},
		rotation: 0.03, // 旋转速度
		fadeSpeed: 0.03, // 消失速度，不应大于最小不透明度
	},
	zIndex: 100, // 层级，确保樱花在合适的层级显示
};

// Pio 看板娘配置
export const pioConfig: import("./types/config").PioConfig = {
	enable: false, // 默认关闭看板娘
	models: ["/pio/models/pio/model.json"], // 默认模型路径
	position: "left", // 默认位置在左侧
	width: 280, // 默认宽度
	height: 250, // 默认高度
	mode: "draggable", // 默认为可拖拽模式
	hiddenOnMobile: true, // 默认在移动设备上隐藏
	dialog: {
		welcome: "Welcome to Mizuki Website!", // 欢迎词
		touch: [
			"What are you doing?",
			"Stop touching me!",
			"HENTAI!",
			"Don't bully me like that!",
		], // 触摸提示
		home: "Click here to go back to homepage!", // 首页提示
		skin: ["Want to see my new outfit?", "The new outfit looks great~"], // 换装提示
		close: "QWQ See you next time~", // 关闭提示
		link: "https://github.com/matsuzaka-yuki/Mizuki", // 关于链接
	},
};

// 导出所有配置的统一接口
export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	pio: pioConfig, // 添加 pio 配置
} as const;

export const umamiConfig = {
	enabled: false, // 是否显示Umami统计
	apiKey: import.meta.env.UMAMI_API_KEY || "api_xxxxxxxx", // API密钥优先从环境变量读取，否则使用配置文件中的值
	baseUrl: "https://api.umami.is", // Umami Cloud API地址
	scripts: `
<script defer src="XXXX.XXX" data-website-id="ABCD1234"></script>
  `.trim(), // 上面填你要插入的Script,不用再去Layout中插入
} as const;
