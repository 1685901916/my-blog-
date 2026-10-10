// 原型页共用的数据：文章、作品、手写的月记都当「笔记」，放进同一条时间线；
// 链接指向各原型自己的文章阅读页（/preview/<方案>/p/… 和 /w/…）
import { type CollectionEntry, getCollection } from "astro:content";
import { type FeedItem, getEntries, getLibrary, KIND_LABEL } from "../../utils/kit/content";

export type ProtoNote = FeedItem & { href: string; type: string };

const visible = ({ data }: { data: { draft?: boolean } }) =>
	!(import.meta.env.PROD && data.draft === true);

export async function getProtoNotes(base: "b" | "c"): Promise<ProtoNote[]> {
	const entries = await getEntries();
	return entries.map((e) => ({
		...e,
		type: e.kind === "post" ? e.category || "文章" : KIND_LABEL[e.kind],
		href:
			e.kind === "post"
				? e.url.replace("/posts/", `/preview/${base}/p/`)
				: e.kind === "work"
					? e.url.replace("/portfolio/", `/preview/${base}/w/`)
					: e.url,
	}));
}

export async function getProtoAnime() {
	return (await getLibrary("anime")).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

export type ProtoArticle = {
	entry: CollectionEntry<"posts"> | CollectionEntry<"portfolio">;
	kind: "post" | "work";
	prev?: { title: string; href: string };
	next?: { title: string; href: string };
};

// 文章阅读页的静态路径：p/<文章> 和 w/<作品>
export async function getProtoArticlePaths(base: "b" | "c") {
	const [posts, works] = await Promise.all([getCollection("posts", visible), getCollection("portfolio", visible)]);
	const all = [
		...posts.map((entry) => ({ entry, kind: "post" as const, slug: `p/${entry.slug}` })),
		...works.map((entry) => ({ entry, kind: "work" as const, slug: `w/${entry.slug}` })),
	].sort((a, b) => b.entry.data.published.getTime() - a.entry.data.published.getTime());
	return all.map((a, i) => ({
		params: { slug: a.slug },
		props: {
			entry: a.entry,
			kind: a.kind,
			// 时间线上的上一篇（更新的）/ 下一篇（更早的）
			prev: all[i - 1] && { title: all[i - 1].entry.data.title, href: `/preview/${base}/${all[i - 1].slug}/` },
			next: all[i + 1] && { title: all[i + 1].entry.data.title, href: `/preview/${base}/${all[i + 1].slug}/` },
		} satisfies ProtoArticle,
	}));
}

export const cnDate = (d: Date) => `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
