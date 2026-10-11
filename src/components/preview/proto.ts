// 原型页共用的数据：文章、作品、动漫、手写的月记都当「笔记」，统一成数据库里的一行；
// 每一行都带自己的阅读页路径（/preview/<方案>/p|w|a|j/…），原型里点哪张卡片都不会跳回旧页面
import { type CollectionEntry, getCollection } from "astro:content";
import { firstImage, getLibrary } from "../../utils/kit/content";

export type BaseProp = {
	k: string;
	v?: string;
	chips?: string[];
	accent?: boolean;
	// 属性面板里点了跳回数据库筛选：cat / tag
	filter?: "cat" | "tag";
};

export type NoteEntry =
	| CollectionEntry<"posts">
	| CollectionEntry<"portfolio">
	| CollectionEntry<"journal">
	| CollectionEntry<"library">;

export const BASE_KINDS = ["文章", "作品", "动漫", "月记"] as const;
export type Kind = (typeof BASE_KINDS)[number];

export type BaseRow = {
	kind: Kind;
	kindOrder: number;
	slug: string;
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
	pinned?: boolean;
	link?: string;
	props: BaseProp[];
	entry: NoteEntry;
};

const order = (k: Kind) => BASE_KINDS.indexOf(k) + 1;
const ymd = (d?: Date) => (d ? d.toISOString().slice(0, 10) : "");
const WORK_GROUP: Record<string, string> = { programming: "程序系", normal: "正常系" };

const visible = ({ data }: { data: { draft?: boolean } }) =>
	!(import.meta.env.PROD && data.draft === true);

export async function getProtoBase(base: "b"): Promise<BaseRow[]> {
	const [posts, works, journal, anime] = await Promise.all([
		getCollection("posts", visible),
		getCollection("portfolio", visible),
		getCollection("journal", visible),
		getLibrary("anime"),
	]);
	const root = `/preview/${base}`;
	const rows: BaseRow[] = [];

	for (const e of posts) {
		const cat = e.data.category || "未分类";
		const tags = e.data.tags.filter((t) => t !== cat);
		rows.push({
			kind: "文章",
			kindOrder: order("文章"),
			slug: `p/${e.slug}`,
			href: `${root}/p/${e.slug}/`,
			title: e.data.title,
			cover: e.data.image || firstImage(e.body),
			aspect: "16 / 10",
			wide: true,
			cat,
			tags,
			date: ymd(e.data.published),
			excerpt: e.data.description,
			pinned: e.data.pinned,
			props: [
				{ k: "分类", v: cat, filter: "cat" },
				{ k: "文件标签", chips: tags.slice(0, 3), filter: "tag" },
				{ k: "date", v: ymd(e.data.published) },
			],
			entry: e,
		});
	}

	for (const e of works) {
		const cat = WORK_GROUP[e.slug.split("/")[0]] ?? "作品";
		const tags = e.data.tags.filter((t) => t !== cat);
		rows.push({
			kind: "作品",
			kindOrder: order("作品"),
			slug: `w/${e.slug}`,
			href: `${root}/w/${e.slug}/`,
			title: e.data.title,
			cover: e.data.image || firstImage(e.body),
			aspect: "16 / 10",
			wide: true,
			cat,
			tags,
			date: ymd(e.data.published),
			excerpt: e.data.description,
			link: e.data.sourceLink || undefined,
			props: [
				{ k: "类别", v: cat, filter: "cat" },
				{ k: "文件标签", chips: tags.slice(0, 3), filter: "tag" },
				{ k: "date", v: ymd(e.data.published) },
			],
			entry: e,
		});
	}

	for (const a of anime) {
		rows.push({
			kind: "动漫",
			kindOrder: order("动漫"),
			slug: `a/${a.id}`,
			href: `${root}/a/${a.id}/`,
			title: a.title,
			cover: a.cover,
			aspect: "3 / 4",
			wide: false,
			cat: a.status || "",
			tags: a.tags,
			// 没有收录日期的按年份排
			date: ymd(a.date) || a.year || "",
			rating: a.rating,
			excerpt: a.summary,
			link: a.link,
			props: [
				{ k: "评分", v: typeof a.rating === "number" ? a.rating.toFixed(1) : "", accent: true },
				{ k: "文件标签", chips: a.tags.slice(0, 3), filter: "tag" },
				a.date ? { k: "date", v: ymd(a.date) } : { k: "年份", v: a.year },
			],
			entry: a.entry,
		});
	}

	for (const e of journal) {
		const tags = e.data.tags.filter((t) => t !== "月记");
		rows.push({
			kind: "月记",
			kindOrder: order("月记"),
			slug: `j/${e.data.month}`,
			href: `${root}/j/${e.data.month}/`,
			title: e.data.title,
			cover: e.data.image,
			aspect: "16 / 10",
			wide: true,
			cat: "月记",
			tags,
			date: ymd(e.data.published),
			excerpt: e.data.description,
			props: [
				{ k: "月份", v: e.data.month },
				{ k: "文件标签", chips: tags.slice(0, 3), filter: "tag" },
				{ k: "date", v: ymd(e.data.published) },
			],
			entry: e,
		});
	}

	return rows.sort((a, b) => a.kindOrder - b.kindOrder || b.date.localeCompare(a.date));
}

export type ProtoArticle = {
	row: BaseRow;
	related: BaseRow[];
	prev?: { title: string; href: string };
	next?: { title: string; href: string };
};

// 阅读页的静态路径：每一行一页；上一篇 / 下一篇在同一类型里按日期走，
// 文末「相关」先取同分类，不够再取同类型里共享标签多的
export async function getProtoArticlePaths(base: "b") {
	const rows = await getProtoBase(base);
	return rows.map((row) => {
		const siblings = rows.filter((r) => r.kind === row.kind);
		const i = siblings.indexOf(row);
		const others = siblings.filter((r) => r !== row);
		const sameCat = (r: BaseRow) => !!row.cat && r.cat === row.cat;
		const shared = (r: BaseRow) => r.tags.filter((t) => row.tags.includes(t)).length;
		const related = [
			...others.filter(sameCat),
			...others.filter((r) => !sameCat(r)).sort((a, b) => shared(b) - shared(a)),
		].slice(0, row.wide ? 3 : 6);
		return {
			params: { slug: row.slug },
			props: {
				row,
				related,
				prev: siblings[i - 1] && { title: siblings[i - 1].title, href: siblings[i - 1].href },
				next: siblings[i + 1] && { title: siblings[i + 1].title, href: siblings[i + 1].href },
			} satisfies ProtoArticle,
		};
	});
}
