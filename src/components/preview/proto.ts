// 方案 B 的数据：文章、作品、月记，加上从 Obsidian ACG 库导入的动画 / 漫画 / 小说 / 游戏 / 人物 / 收集，
// 统一成数据库里的一行；每行带自己的阅读页路径（/preview/b/p|w|j|i/…）
// ACG 条目放在 i/<id>，正文里的双链是相对链接 ../<id>/，刚好落在同一层
import { type CollectionEntry, getCollection } from "astro:content";
import { COVERS } from "../../data/covers";
import { firstImage } from "../../utils/kit/content";
import { type AcgItem, coverOf, getAcg } from "./acg";

export type BaseProp = {
	k: string;
	v?: string;
	chips?: string[];
	accent?: boolean;
	// 属性面板里点了跳回数据库筛选：cat / tag
	filter?: "cat" | "tag";
	href?: string;
};

export type NoteEntry =
	| CollectionEntry<"posts">
	| CollectionEntry<"portfolio">
	| CollectionEntry<"journal">
	| CollectionEntry<"acg">;

export const BASE_KINDS = ["文章", "动画", "漫画", "小说", "游戏", "人物", "作品", "月记", "收集"] as const;
export type Kind = (typeof BASE_KINDS)[number];

// 卡片长什么样：文字卡 / 竖版海报 / 圆形头像 / 截图卡 / 月份卡
export type Variant = "text" | "poster" | "person" | "shot" | "month" | "line";

export const KIND_META: Record<Kind, { icon: string; facet: string; variant: Variant }> = {
	文章: { icon: "material-symbols:article-outline-rounded", facet: "分类", variant: "text" },
	动画: { icon: "material-symbols:movie-outline-rounded", facet: "分类", variant: "poster" },
	漫画: { icon: "material-symbols:menu-book-outline-rounded", facet: "分类", variant: "poster" },
	小说: { icon: "material-symbols:book-2-outline-rounded", facet: "分类", variant: "poster" },
	游戏: { icon: "material-symbols:sports-esports-outline-rounded", facet: "分类", variant: "poster" },
	人物: { icon: "material-symbols:face-outline", facet: "身份", variant: "person" },
	作品: { icon: "material-symbols:work-outline", facet: "类别", variant: "shot" },
	月记: { icon: "material-symbols:calendar-month-outline-rounded", facet: "", variant: "month" },
	// 收集多是一两句话的短笔记，用紧凑的列表行，不用大卡片
	收集: { icon: "material-symbols:inventory-2-outline-rounded", facet: "分类", variant: "line" },
};

export type BaseRow = {
	kind: Kind;
	kindOrder: number;
	variant: Variant;
	slug: string;
	href: string;
	title: string;
	cover?: string;
	cat: string;
	tags: string[];
	date: string;
	rating?: number;
	marks: Array<"heart" | "star">;
	excerpt?: string;
	words: number;
	pinned?: boolean;
	link?: string;
	// 同一类型里的推荐顺序（越小越前），排序选「推荐」时用
	rank: number;
	props: BaseProp[];
	entry: NoteEntry;
	acg?: AcgItem;
};

const order = (k: Kind) => BASE_KINDS.indexOf(k) + 1;
const ymd = (d?: Date) => (d ? d.toISOString().slice(0, 10) : "");
const countWords = (s = "") =>
	(s.replace(/!\[[^\]]*\]\([^)]*\)|\]\([^)]*\)/g, "").match(/[一-鿿]|[A-Za-z0-9]+/g) ?? []).length;
const WORK_GROUP: Record<string, string> = { programming: "程序系", normal: "正常系" };
const ACG_KIND: Record<string, Kind> = {
	anime: "动画",
	manga: "漫画",
	novel: "小说",
	game: "游戏",
	character: "人物",
	cv: "人物",
	music: "人物",
	artist: "人物",
	studio: "人物",
	collect: "收集",
};

const visible = ({ data }: { data: { draft?: boolean } }) =>
	!(import.meta.env.PROD && data.draft === true);

type Draft = Omit<BaseRow, "kindOrder" | "rank" | "variant" | "href"> & { variant?: Variant };

let cache: Promise<BaseRow[]> | undefined;

// 结果缓存一份，每次返回副本，调用方随便排序也不会改到缓存
export async function getProtoBase(_base: "b" = "b"): Promise<BaseRow[]> {
	cache ??= build();
	return (await cache).slice();
}

async function build(): Promise<BaseRow[]> {
	const [posts, works, journal, acg] = await Promise.all([
		getCollection("posts", visible),
		getCollection("portfolio", visible),
		getCollection("journal", visible),
		getAcg(),
	]);
	const drafts: Draft[] = [];

	for (const e of posts) {
		const cat = e.data.category || "未分类";
		const tags = e.data.tags.filter((t) => t !== cat);
		const cover = e.data.image || COVERS[`p/${e.slug}`];
		drafts.push({
			kind: "文章",
			// 有配图的文章用图片卡，没有的还是文字卡
			variant: cover ? "shot" : "text",
			slug: `p/${e.slug}`,
			title: e.data.title,
			cover,
			cat,
			tags,
			date: ymd(e.data.published),
			marks: [],
			excerpt: e.data.description,
			words: countWords(e.body),
			pinned: e.data.pinned,
			props: [
				{ k: "分类", v: cat, filter: "cat" },
				{ k: "文件标签", chips: tags, filter: "tag" },
				{ k: "date", v: ymd(e.data.published) },
			],
			entry: e,
		});
	}

	for (const e of works) {
		const cat = WORK_GROUP[e.slug.split("/")[0]] ?? "作品";
		const tags = e.data.tags.filter((t) => t !== cat);
		drafts.push({
			kind: "作品",
			slug: `w/${e.slug}`,
			title: e.data.title,
			// 作品的截图本身就是内容，可以当封面
			cover: e.data.image || firstImage(e.body) || undefined,
			cat,
			tags,
			date: ymd(e.data.published),
			marks: [],
			excerpt: e.data.description,
			words: countWords(e.body),
			link: e.data.sourceLink || undefined,
			props: [
				{ k: "类别", v: cat, filter: "cat" },
				{ k: "文件标签", chips: tags, filter: "tag" },
				{ k: "date", v: ymd(e.data.published) },
			],
			entry: e,
		});
	}

	for (const e of journal) {
		const tags = e.data.tags.filter((t) => t !== "月记");
		drafts.push({
			kind: "月记",
			slug: `j/${e.data.month}`,
			title: e.data.title,
			cat: "",
			tags,
			date: ymd(e.data.published),
			marks: [],
			excerpt: e.data.description,
			words: countWords(e.body),
			props: [
				{ k: "月份", v: e.data.month },
				{ k: "文件标签", chips: tags, filter: "tag" },
				{ k: "date", v: ymd(e.data.published) },
			],
			entry: e,
		});
	}

	for (const i of acg) {
		// 随笔（Obsidian 里 0/1 开头的笔记）算文章
		const kind: Kind = i.essay ? "文章" : (ACG_KIND[i.section.key] ?? "收集");
		const isPerson = kind === "人物";
		const cat = i.essay ? "随笔" : isPerson ? i.section.name : (i.sub[0] ?? "");
		// 海报：有 Bangumi 海报用海报；小说没海报时不用笔记里的手机截图，交给字体封面
		const cover = i.essay
			? COVERS[`i/${i.id}`]
			: isPerson
				? i.cover || i.image || undefined
				: i.entry.data.bgm || i.section.key !== "novel"
					? coverOf(i) || undefined
					: undefined;
		drafts.push({
			kind,
			variant: i.essay ? (COVERS[`i/${i.id}`] ? "shot" : "text") : undefined,
			slug: `i/${i.id}`,
			title: i.title,
			cover,
			cat,
			tags: i.tags.filter((t) => !i.sub.includes(t)),
			date: i.date,
			rating: i.rating,
			marks: i.marks,
			excerpt: i.excerpt,
			words: i.words,
			link: i.entry.data.bgm ? `https://bgm.tv/subject/${i.entry.data.bgm}` : undefined,
			props: [
				{ k: "分区", v: i.section.name },
				...(i.sub.length ? [{ k: "分类", v: i.sub.join(" / "), filter: "cat" as const }] : []),
				{ k: "文件标签", chips: i.tags, filter: "tag" },
				...(typeof i.rating === "number" ? [{ k: "评分", v: i.rating.toFixed(1), accent: true }] : []),
				{ k: "更新", v: i.date },
			],
			entry: i.entry,
			acg: i,
		});
	}

	// 每个类型内部的推荐顺序：文字类按日期（置顶最前），海报 / 人物按 喜欢 → 评分 → 有图 → 字数
	const rows: BaseRow[] = [];
	for (const kind of BASE_KINDS) {
		const list = drafts.filter((d) => d.kind === kind);
		const variant = KIND_META[kind].variant;
		list.sort((a, b) =>
			variant === "poster" || variant === "person"
				? b.marks.length - a.marks.length ||
					(b.rating ?? 0) - (a.rating ?? 0) ||
					Number(!!b.cover) - Number(!!a.cover) ||
					b.words - a.words
				: Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date),
		);
		list.forEach((d, n) =>
			rows.push({
				...d,
				variant: d.variant ?? variant,
				kindOrder: order(kind),
				href: `/preview/b/${d.slug}/`,
				rank: n,
			}),
		);
	}
	return rows;
}

export type LinkedRow = { row: BaseRow; dir: "提到" | "被提到" };

export type ProtoArticle = {
	row: BaseRow;
	related: BaseRow[];
	linked: LinkedRow[];
	prev?: { title: string; href: string };
	next?: { title: string; href: string };
};

// 阅读页的静态路径：每一行一页；上一篇 / 下一篇在同一类型里按推荐顺序走，
// 文末「相关」先取同分类，不够再取同类型里共享标签多的；ACG 条目另外有双链关联
export async function getProtoArticlePaths(_base: "b" = "b") {
	const rows = await getProtoBase();
	const byAcg = new Map(rows.filter((r) => r.acg).map((r) => [r.acg?.key, r]));
	return rows.map((row) => {
		const siblings = rows.filter((r) => r.kind === row.kind);
		const i = siblings.indexOf(row);
		const others = siblings.filter((r) => r !== row);
		const sameCat = (r: BaseRow) => !!row.cat && r.cat === row.cat;
		const shared = (r: BaseRow) => r.tags.filter((t) => row.tags.includes(t)).length;
		const wide = !["poster", "person"].includes(row.variant);
		const related = [
			...others.filter(sameCat),
			...others.filter((r) => !sameCat(r)).sort((a, b) => shared(b) - shared(a)),
		].slice(0, wide ? 3 : 6);
		const out = (row.acg?.links ?? []).map((k) => byAcg.get(k)).filter((r): r is BaseRow => !!r);
		const inc = (row.acg?.backlinks ?? []).map((k) => byAcg.get(k)).filter((r): r is BaseRow => !!r && !out.includes(r));
		return {
			params: { slug: row.slug },
			props: {
				row,
				related,
				linked: [...out.map((r) => ({ row: r, dir: "提到" as const })), ...inc.map((r) => ({ row: r, dir: "被提到" as const }))],
				prev: siblings[i - 1] && { title: siblings[i - 1].title, href: siblings[i - 1].href },
				next: siblings[i + 1] && { title: siblings[i + 1].title, href: siblings[i + 1].href },
			} satisfies ProtoArticle,
		};
	});
}

// 分类名 → 色相，同一个分类永远同一种颜色
export const hueOf = (s: string) => [...s].reduce((n, c) => (n * 31 + (c.codePointAt(0) ?? 0)) % 360, 7);
