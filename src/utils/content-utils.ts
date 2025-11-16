import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils";
import { siteConfig } from "@/config";

// // Retrieve posts and sort them by publication date (including manga and portfolio)
async function getRawSortedPosts() {
	let allBlogPosts: CollectionEntry<"posts">[] = [];
	let allMangaPosts: CollectionEntry<"manga">[] = [];
	let allMangaCategoriesPosts: CollectionEntry<"manga-categories">[] = [];
	let allPortfolioPosts: CollectionEntry<"portfolio">[] = [];

	// 根据配置获取博客文章
	if (siteConfig.homepageContent.showBlogPosts) {
		allBlogPosts = await getCollection("posts", ({ data }) => {
			return import.meta.env.PROD ? data.draft !== true : true;
		});
	}

	// 根据配置获取漫画内容（包括独立文章和文件夹文章）
	if (siteConfig.homepageContent.showMangaPosts) {
		try {
			// 获取独立文章
			allMangaPosts = await getCollection("manga", ({ data }) => {
				return import.meta.env.PROD ? data.draft !== true : true;
			});

			// 获取文件夹文章
			allMangaCategoriesPosts = await getCollection(
				"manga-categories",
				({ data }) => {
					return import.meta.env.PROD ? data.draft !== true : true;
				},
			);
		} catch (_e) {
			// 如果manga collection不存在，忽略错误
			console.log("Manga collection not found or empty");
		}
	}

	// 根据配置获取作品集内容
	if (siteConfig.homepageContent.showPortfolioPosts) {
		try {
			allPortfolioPosts = await getCollection("portfolio", ({ data }) => {
				return import.meta.env.PROD ? data.draft !== true : true;
			});
		} catch (_e) {
			// 如果portfolio collection不存在，忽略错误
			console.log("Portfolio collection not found or empty");
		}
	}

	// 合并博客文章、漫画文章（独立+文件夹）和作品集文章
	const allPosts = [
		...allBlogPosts,
		...allMangaPosts,
		...allMangaCategoriesPosts,
		...allPortfolioPosts,
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
	collection: string;
	data:
		| CollectionEntry<"posts">["data"]
		| CollectionEntry<"manga">["data"]
		| CollectionEntry<"manga-categories">["data"]
		| CollectionEntry<"portfolio">["data"];
};
export async function getSortedPostsList(): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts();

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.slug,
		collection: post.collection,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
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
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
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
