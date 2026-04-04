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
		category: z.string().optional().nullable().default("作品集"),
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

// 赚钱资源集合
const moneyResourcesCollection = defineCollection({
	schema: z.object({
		...baseFields,
		category: z.string().optional(),
		collection: z.string().optional().default("money-resources"),
	}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	manga: mangaCollection,
	portfolio: portfolioCollection,
	"manga-categories": mangaCategoriesCollection,
	"entertainment-resources": entertainmentResourcesCollection,
	"money-resources": moneyResourcesCollection,
};
