import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils";
import { siteConfig } from "../config";

// 缓存变量 - 在构建时只计算一次
let cachedRawSortedPosts:
	| CollectionEntry<
			| "posts"
			| "manga"
			| "manga-categories"
			| "portfolio"
			| "entertainment-resources"
	  >[]
	| null = null;

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts() {
	// 如果已经缓存，直接返回
	if (cachedRawSortedPosts !== null) {
		return cachedRawSortedPosts;
	}
	let allBlogPosts: CollectionEntry<"posts">[] = [];
	let allMangaPosts: CollectionEntry<"manga">[] = [];
	let allMangaCategoriesPosts: CollectionEntry<"manga-categories">[] = [];
	let allPortfolioPosts: CollectionEntry<"portfolio">[] = [];
	let allEntertainmentPosts: CollectionEntry<"entertainment-resources">[] = [];

	// 根据配置获取博客内容
	if (siteConfig.homepageContent.showBlogPosts) {
		allBlogPosts = await getCollection("posts", ({ data }) => data.draft !== true);
	}

	// 根据配置获取漫画内容
	if (siteConfig.homepageContent.showMangaPosts) {
		try {
			allMangaPosts = await getCollection("manga", ({ data }) => data.draft !== true);
		} catch (_e) {
			// Manga collection might not exist
		}
	}

	// 根据配置获取漫画分类内容
	if (siteConfig.homepageContent.showMangaPosts) {
		try {
			allMangaCategoriesPosts = await getCollection(
				"manga-categories",
				({ data }) => data.draft !== true,
			);
		} catch (_e) {
			// Manga categories collection might not exist
		}
	}

	// 根据配置获取作品集内容
	if (siteConfig.homepageContent.showPortfolioPosts) {
		allPortfolioPosts = await getCollection("portfolio", ({ data }) => data.draft !== true);
	}

	// 根据配置获取娱乐资源内容
	if (siteConfig.homepageContent.showEntertainmentPosts) {
		try {
			allEntertainmentPosts = await getCollection(
				"entertainment-resources",
				({ data }) => data.draft !== true,
			);
		} catch (_e) {
			console.log("Entertainment resources collection not found or empty");
		}
	}

	// 合并博客文章、漫画文章、作品集文章和娱乐资源文章
	const allPosts = [
		...allBlogPosts,
		...allMangaPosts,
		...allMangaCategoriesPosts,
		...allPortfolioPosts,
		...allEntertainmentPosts,
	];

	const sorted = allPosts.sort((a, b) => {
		// 首先按置顶状态排序，置顶文章在前
		if (a.data.pinned && !b.data.pinned) return -1;
		if (!a.data.pinned && b.data.pinned) return 1;

		// 如果置顶状态相同，则按发布日期排序
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});

	// 缓存结果
	cachedRawSortedPosts = sorted;

	return sorted;
}

export async function getSortedPosts() {
	const sorted = await getRawSortedPosts();

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].slug;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].slug;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	// 使用 getRawSortedPosts 获取所有类型的文章（博客、漫画、作品集、娱乐资源）
	const allPosts = await getRawSortedPosts();

	const countMap: { [key: string]: number } = {};
	allPosts.forEach((post: { data: { tags: string[] } }) => {
		if (post.data.tags) {
			post.data.tags.forEach((tag: string) => {
				if (!countMap[tag]) countMap[tag] = 0;
				countMap[tag]++;
			});
		}
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(): Promise<Category[]> {
	// 使用 getRawSortedPosts 获取所有类型的文章（博客、漫画、作品集、娱乐资源）
	const allPosts = await getRawSortedPosts();
	const count: { [key: string]: number } = {};
	allPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c),
		});
	}
	return ret;
}
