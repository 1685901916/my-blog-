import { defineCollection, z } from "astro:content";

const baseFields = {
	title: z.string(),
	published: z.date(),
	updated: z.date().optional(),
	draft: z.boolean().optional().default(false),
	description: z.string().optional().default(""),
	excerpt: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),
	lang: z.string().optional().default(""),
	pinned: z.boolean().optional().default(false),
	author: z.string().optional().default(""),
	sourceLink: z.string().optional().default(""),
	licenseName: z.string().optional().default(""),
	licenseUrl: z.string().optional().default(""),
	aliases: z.array(z.string()).optional().default([]),
	links: z.array(z.string()).optional().default([]),
	props: z.record(z.string(), z.string()).optional().default(),
	showOnHome: z.boolean().optional().default(true),
	showOnHomepage: z.boolean().optional().default(true),

	/* SEO优化：自定义URL slug */
	customSlug: z.string().optional().default(""),

	/* Page encryption fields */
	encrypted: z.boolean().optional().default(false),
	password: z.string().optional().default(""),

	/* For internal use */
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
};

const postsCollection = defineCollection({
	schema: z.object(baseFields),
});

const specCollection = defineCollection({
	schema: z.object({}),
});

// 漫画集合 - 使用与博客文章相同的 schema
const mangaCollection = defineCollection({
	schema: z.object({
		...baseFields,
		category: z.string().optional().nullable().default("漫画"),
	}),
});

// 作品集集合 - 使用与博客文章相同的 schema
const portfolioCollection = defineCollection({
	schema: z.object({
		...baseFields,
		category: z.string().optional().nullable().default("作品"),
	}),
});

// 漫画分类文件夹集合
const mangaCategoriesCollection = defineCollection({
	schema: z.object({
		...baseFields,
		category: z.string().optional().nullable().default("漫画"),
	}),
});

// 娱乐资源集合
const entertainmentResourcesCollection = defineCollection({
	schema: z.object({
		...baseFields,
		category: z.string().optional(),
		collection: z.string().optional().default("entertainment-resources"),
	}),
});

// Obsidian 里的日期可能是 "2024-08-28 12:17"、"2024-08-28T12:17" 或 YAML 日期
// 一律按 UTC 解析（和 YAML 日期一致），避免构建机器时区不同导致跨月
const looseDate = z
	.union([z.date(), z.string(), z.number()])
	.optional()
	.transform((v) => {
		if (v === undefined || v === "") return undefined;
		if (typeof v === "string") {
			const m = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
			if (m) {
				const [, y, mo, d, h = "0", mi = "0"] = m;
				return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
			}
		}
		const d = v instanceof Date ? v : new Date(v);
		return Number.isNaN(d.getTime()) ? undefined : d;
	});

// 收藏库：一个子文件夹 = 一个书架（anime / sites ...），书架配置见 src/data/shelves.ts
// 属性名同时接受 Obsidian 里的中文写法，笔记可以原样拷过来
const libraryCollection = defineCollection({
	schema: z
		.object({
			title: z.string().optional(),
			cover: z.string().optional(),
			封面: z.string().optional(),
			image: z.string().optional(),
			rating: z.number().optional(),
			评分: z.number().optional(),
			tags: z.array(z.string()).optional(),
			文件标签: z.array(z.string()).optional(),
			date: looseDate,
			status: z.string().optional(),
			状态: z.string().optional(),
			year: z.coerce.string().optional(),
			link: z.string().optional(),
			summary: z.string().optional(),
			draft: z.boolean().optional().default(false),
		})
		.transform((d) => ({
			title: d.title,
			cover: d.cover || d.封面 || d.image || "",
			rating: d.rating ?? d.评分,
			tags: (d.tags ?? d.文件标签 ?? []).map((t) =>
				String(t).replace(/^\[\[|\]\]$/g, ""),
			),
			date: d.date,
			status: d.status ?? d.状态,
			year: d.year,
			link: d.link,
			summary: d.summary ?? "",
			draft: d.draft,
		})),
});

// 月记：month 属性为 YYYY-MM；正文只写手写部分，其余自动汇总
// 字段和文章兼容（baseFields），所以手写的月记也会出现在首页列表、归档、分类和 RSS 里
const journalCollection = defineCollection({
	schema: z
		.object({
			...baseFields,
			month: z.coerce.string().regex(/^\d{4}-\d{2}$/),
			title: z.string().optional().default(""),
			published: z.date().optional(),
			summary: z.string().optional().default(""),
			cover: z.string().optional().default(""),
		})
		.transform((d) => {
			const [y, m] = d.month.split("-").map(Number);
			return {
				...d,
				title: d.title || `${y} 年 ${m} 月`,
				// 没写发布日期就算当月最后一天，首页和归档按它排序
				published: d.published ?? new Date(Date.UTC(y, m, 0)),
				description: d.description || d.summary,
				image: d.image || d.cover,
				category: d.category || "月记",
				tags: d.tags.length > 0 ? d.tags : ["月记"],
			};
		}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	manga: mangaCollection,
	portfolio: portfolioCollection,
	"manga-categories": mangaCategoriesCollection,
	"entertainment-resources": entertainmentResourcesCollection,
	library: libraryCollection,
	journal: journalCollection,
};
