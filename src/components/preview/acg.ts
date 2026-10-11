// 三个结构原型共用的 ACG 数据：读 src/content/acg（由 scripts/import-acg.mjs 从 Obsidian 导入），
// 补上分区信息、反向链接；条目页统一放在 /preview/<方案>/i/<id>/，正文里的双链是相对链接 ../<id>/，三个方案都能用
import { type CollectionEntry, getCollection } from "astro:content";

export type SectionKind = "work" | "person" | "misc";
export type Section = {
	key: string;
	name: string;
	kind: SectionKind;
	icon: string;
	// 原 Obsidian 文件夹名，方案 2 照搬用
	folder: string;
};

// 顺序 = 网站上的顺序；work 用竖版海报，person 用圆形头像，misc 用文字卡片
export const SECTIONS: Section[] = [
	{ key: "anime", name: "动画", kind: "work", icon: "material-symbols:movie-outline-rounded", folder: "1管理动漫" },
	{ key: "manga", name: "漫画", kind: "work", icon: "material-symbols:menu-book-outline-rounded", folder: "3漫画" },
	{ key: "novel", name: "小说", kind: "work", icon: "material-symbols:book-2-outline-rounded", folder: "8小说" },
	{ key: "game", name: "游戏", kind: "work", icon: "material-symbols:sports-esports-outline-rounded", folder: "6游戏" },
	{ key: "character", name: "角色", kind: "person", icon: "material-symbols:face-outline", folder: "2角色" },
	{ key: "cv", name: "声优", kind: "person", icon: "material-symbols:mic-outline-rounded", folder: "5cv" },
	{ key: "music", name: "音乐", kind: "person", icon: "material-symbols:music-note-rounded", folder: "4音乐" },
	{ key: "artist", name: "画师", kind: "person", icon: "material-symbols:brush-outline", folder: "7画" },
	{ key: "studio", name: "动画公司", kind: "misc", icon: "material-symbols:apartment-rounded", folder: "6动漫公司" },
	{ key: "collect", name: "收集", kind: "misc", icon: "material-symbols:inventory-2-outline-rounded", folder: "收集" },
];
export const getSection = (key: string) => SECTIONS.find((s) => s.key === key) ?? SECTIONS[SECTIONS.length - 1];

export type AcgItem = {
	id: string;
	key: string;
	section: Section;
	title: string;
	marks: Array<"star" | "heart">;
	essay: boolean;
	sub: string[];
	tags: string[];
	cover: string;
	image?: string;
	rating?: number;
	date: string;
	words: number;
	excerpt: string;
	links: string[];
	backlinks: string[];
	entry: CollectionEntry<"acg">;
};

let cache: Promise<AcgItem[]> | undefined;

export function getAcg(): Promise<AcgItem[]> {
	cache ??= (async () => {
		const entries = await getCollection("acg");
		const items: AcgItem[] = entries.map((e) => ({
			id: e.slug,
			key: `${e.data.section}/${e.slug}`,
			section: getSection(e.data.section),
			title: e.data.title,
			marks: e.data.marks,
			essay: e.data.essay,
			sub: e.data.sub,
			tags: e.data.tags,
			cover: e.data.cover,
			image: e.data.image,
			rating: e.data.rating,
			date: e.data.date.toISOString().slice(0, 10),
			words: e.data.words,
			excerpt: e.data.excerpt,
			links: e.data.links,
			backlinks: [],
			entry: e,
		}));
		const byKey = new Map(items.map((i) => [i.key, i]));
		for (const i of items) for (const l of i.links) byKey.get(l)?.backlinks.push(i.key);
		const order = (i: AcgItem) => SECTIONS.indexOf(i.section);
		// 分区顺序 → 喜欢/推荐的在前 → 有评分的按分数 → 内容多的在前
		return items.sort(
			(a, b) =>
				order(a) - order(b) ||
				b.marks.length - a.marks.length ||
				(b.rating ?? 0) - (a.rating ?? 0) ||
				b.words - a.words,
		);
	})();
	return cache;
}

export async function getAcgByKey() {
	return new Map((await getAcg()).map((i) => [i.key, i]));
}

// 某个分区下的条目（不含随笔）和随笔
export async function getSectionData(key: string) {
	const all = (await getAcg()).filter((i) => i.section.key === key);
	const items = all.filter((i) => !i.essay);
	const essays = all.filter((i) => i.essay);
	// 子分类：用第一层子文件夹，带数量
	const subs = new Map<string, number>();
	for (const i of items) if (i.sub[0]) subs.set(i.sub[0], (subs.get(i.sub[0]) ?? 0) + 1);
	const tagCount = new Map<string, number>();
	for (const i of items) for (const t of i.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
	return {
		section: getSection(key),
		items,
		essays,
		subs: [...subs.entries()],
		tags: [...tagCount.entries()].sort((a, b) => b[1] - a[1]),
	};
}

// 条目页的静态路径：/preview/<方案>/i/<id>/
export async function getItemPaths() {
	const items = await getAcg();
	const byKey = new Map(items.map((i) => [i.key, i]));
	return items.map((item) => {
		const same = items.filter((i) => i.section === item.section && !i.essay && i !== item);
		const shared = (i: AcgItem) =>
			i.tags.filter((t) => item.tags.includes(t)).length + (i.sub[0] && i.sub[0] === item.sub[0] ? 2 : 0);
		return {
			params: { id: item.id },
			props: {
				item,
				outgoing: item.links.map((k) => byKey.get(k)).filter((i): i is AcgItem => !!i),
				incoming: item.backlinks.map((k) => byKey.get(k)).filter((i): i is AcgItem => !!i),
				related: [...same].sort((a, b) => shared(b) - shared(a)).slice(0, 6),
			},
		};
	});
}

export type ItemProps = Awaited<ReturnType<typeof getItemPaths>>[number]["props"];

export const MARK_LABEL = { heart: "喜欢", star: "推荐" } as const;

// 卡片用的图：作品类优先海报，其次笔记里的图
export const coverOf = (i: AcgItem) => i.cover || i.image || "";
// 没图时的字体封面 / 头像用的字
export const initialOf = (i: AcgItem) => [...i.title.replace(/^[^\p{L}\p{N}]+/u, "")][0]?.toUpperCase() ?? "?";
// 10 分制 → 5 颗星（含半星）
export const starsOf = (r?: number) => (typeof r === "number" ? Math.round(r) / 2 : 0);
