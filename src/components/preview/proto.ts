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

// ---------- 数据库视图：所有笔记统一成一种「行」，每种类型有自己的属性列 ----------

export type BaseProp = { k: string; v?: string; chips?: string[]; accent?: boolean };
export type BaseRow = {
	kind: string;
	kindOrder: number;
	title: string;
	href: string;
	cover?: string;
	aspect: string;
	wide: boolean;
	cat: string;
	tags: string[];
	date: string;
	rating?: number;
	excerpt?: string;
	props: BaseProp[];
};

export const BASE_KINDS = ["文章", "作品", "动漫", "月记"] as const;
const order = (k: string) => BASE_KINDS.indexOf(k as (typeof BASE_KINDS)[number]) + 1;
const ymd = (d?: Date) => (d ? d.toISOString().slice(0, 10) : "");
const WORK_GROUP: Record<string, string> = { programming: "程序系", normal: "正常系" };

export async function getProtoBase(base: "b" | "c"): Promise<BaseRow[]> {
	const [notes, anime] = await Promise.all([getProtoNotes(base), getProtoAnime()]);
	const rows: BaseRow[] = notes.map((n) => {
		const kind = KIND_LABEL[n.kind];
		const cat =
			n.kind === "work"
				? WORK_GROUP[n.url.split("/")[2]] ?? "作品"
				: n.kind === "journal"
					? "月记"
					: n.category || "未分类";
		const tags = n.tags.filter((t) => t !== n.category);
		return {
			kind,
			kindOrder: order(kind),
			title: n.title,
			href: n.href,
			cover: n.cover,
			aspect: "16 / 10",
			wide: true,
			cat,
			tags,
			date: ymd(n.date),
			excerpt: n.description,
			props: [
				...(n.kind === "journal" ? [] : [{ k: n.kind === "work" ? "类别" : "分类", v: cat }]),
				{ k: "文件标签", chips: tags.slice(0, 3) },
				{ k: "date", v: ymd(n.date) },
			],
		};
	});
	for (const a of anime) {
		rows.push({
			kind: "动漫",
			kindOrder: order("动漫"),
			title: a.title,
			href: a.url,
			cover: a.cover,
			aspect: "3 / 4",
			wide: false,
			cat: a.status || "",
			tags: a.tags,
			date: ymd(a.date) || a.year || "",
			rating: a.rating,
			props: [
				{ k: "评分", v: typeof a.rating === "number" ? a.rating.toFixed(1) : "", accent: true },
				{ k: "文件标签", chips: a.tags.slice(0, 3) },
				a.date ? { k: "date", v: ymd(a.date) } : { k: "年份", v: a.year },
			],
		});
	}
	return rows;
}
