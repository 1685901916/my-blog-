// 内容设计系统的数据层
// 把 posts / portfolio / journal / library 统一成「条目」，
// 主页、文章库、收藏库、月记汇总、作品墙都只读这里，不各自去扫文件夹。
import { type CollectionEntry, getCollection } from "astro:content";
import { getShelf, type Shelf, shelves } from "../../data/shelves";
import { getPostUrlBySlug } from "../url-utils";

const isProd = import.meta.env.PROD;
const visible = ({ data }: { data: { draft?: boolean } }) =>
	!(isProd && data.draft === true);

// 正文里的第一张图，作为没有封面时的兜底
const FIRST_IMAGE = /!\[[^\]]*\]\((\S+?)(?:\s+"[^"]*")?\)/;
export function firstImage(body?: string): string {
	return body?.match(FIRST_IMAGE)?.[1] ?? "";
}

// ---------- 收藏库 ----------

export type LibraryItem = {
	id: string;
	shelf: Shelf;
	url: string;
	title: string;
	// 标题前的 ☆ / ♡ 是 Obsidian 里的标记，拆出来渲染成图标
	marks: Array<"star" | "heart">;
	cover: string;
	rating?: number;
	tags: string[];
	date?: Date;
	year?: string;
	status?: string;
	link?: string;
	summary: string;
	entry: CollectionEntry<"library">;
};

function splitMarks(raw: string) {
	const marks: LibraryItem["marks"] = [];
	let title = raw;
	while (/^[☆★♡❤]/.test(title)) {
		marks.push(/^[☆★]/.test(title) ? "star" : "heart");
		title = title.slice(1);
	}
	return { title: title.trim(), marks };
}

function toLibraryItem(entry: CollectionEntry<"library">): LibraryItem | null {
	const [shelfId, ...rest] = entry.slug.split("/");
	const shelf = getShelf(shelfId);
	if (!shelf) return null;
	const fileName =
		entry.id
			.split("/")
			.pop()
			?.replace(/\.mdx?$/, "") ?? "";
	const { title, marks } = splitMarks(entry.data.title || fileName);
	return {
		id: rest.join("/"),
		shelf,
		url: `/library/${shelf.id}/${rest.join("/")}/`,
		title,
		marks,
		cover: entry.data.cover || firstImage(entry.body),
		rating: entry.data.rating,
		// 书架本身的名字（比如「动漫」）不作为筛选标签
		tags: entry.data.tags.filter((t) => t !== shelf.title),
		date: entry.data.date,
		year: entry.data.year,
		status: entry.data.status,
		link: entry.data.link,
		summary: entry.data.summary,
		entry,
	};
}

export async function getLibrary(shelfId?: string): Promise<LibraryItem[]> {
	const entries = await getCollection("library", visible);
	return entries
		.map(toLibraryItem)
		.filter((i): i is LibraryItem => i !== null)
		.filter((i) => !shelfId || i.shelf.id === shelfId);
}

export async function getShelvesWithItems() {
	const all = await getLibrary();
	return shelves.map((shelf) => ({
		shelf,
		items: all.filter((i) => i.shelf.id === shelf.id),
	}));
}

// ---------- 文章 / 作品 ----------

export type Kind = "post" | "work" | "journal";

export const KIND_LABEL: Record<Kind, string> = {
	post: "文章",
	work: "作品",
	journal: "月记",
};

export type FeedItem = {
	kind: Kind;
	title: string;
	url: string;
	date: Date;
	description: string;
	category: string;
	tags: string[];
	cover: string;
	sourceLink?: string;
};

export async function getFeed(): Promise<FeedItem[]> {
	const [posts, works] = await Promise.all([
		getCollection("posts", visible),
		getCollection("portfolio", visible),
	]);
	const items: FeedItem[] = [
		...posts.map((e) => ({
			kind: "post" as const,
			title: e.data.title,
			url: getPostUrlBySlug(e.slug, "posts"),
			date: e.data.published,
			description: e.data.description,
			category: e.data.category ?? "",
			tags: e.data.tags,
			cover: e.data.image || firstImage(e.body),
		})),
		...works.map((e) => ({
			kind: "work" as const,
			title: e.data.title,
			url: getPostUrlBySlug(e.slug, "portfolio"),
			date: e.data.published,
			description: e.data.description,
			category: e.data.category ?? "作品",
			// 「程序系 / 正常系」是作品分组，单独存放
			tags: e.data.tags,
			cover: e.data.image || firstImage(e.body),
			sourceLink: e.data.sourceLink || undefined,
		})),
	];
	return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// 主页的「最近更新」：文章 + 作品 + 手写的月记
export async function getEntries(): Promise<FeedItem[]> {
	const [feed, notes] = await Promise.all([
		getFeed(),
		getCollection("journal", visible),
	]);
	const journal: FeedItem[] = notes.map((n) => ({
		kind: "journal",
		title: n.data.title,
		url: `/journal/${n.data.month}/`,
		date: n.data.published,
		description: n.data.description,
		category: "月记",
		tags: n.data.tags,
		cover: n.data.image,
	}));
	return [...feed, ...journal].sort(
		(a, b) => b.date.getTime() - a.date.getTime(),
	);
}

export async function getWorks() {
	return (await getFeed()).filter((i) => i.kind === "work");
}

// ---------- 月记 ----------

// 日期统一按 UTC 日历日处理：YAML 的 2026-04-01 是 UTC 零点，
// 用本地时区算月份会在西半球机器上跑到 3 月
export const monthKey = (d: Date) =>
	`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export type MonthDigest = {
	month: string; // YYYY-MM
	year: number;
	monthNumber: number;
	note?: CollectionEntry<"journal">;
	title: string;
	summary: string;
	cover: string;
	writings: FeedItem[];
	works: FeedItem[];
	library: LibraryItem[];
	stats: {
		writings: number;
		works: number;
		library: number;
		avgRating?: number;
	};
};

// 每个「有手写月记」或「有任何带日期内容」的月份都会生成一页
export async function getMonthDigests(): Promise<MonthDigest[]> {
	const [notes, feed, library] = await Promise.all([
		getCollection("journal", visible),
		getFeed(),
		getLibrary(),
	]);
	const months = new Set<string>([
		...notes.map((n) => n.data.month),
		...feed.map((i) => monthKey(i.date)),
		...library.filter((i) => i.date).map((i) => monthKey(i.date as Date)),
	]);

	return [...months]
		.sort((a, b) => b.localeCompare(a))
		.map((month) => {
			const note = notes.find((n) => n.data.month === month);
			const inMonth = feed.filter((i) => monthKey(i.date) === month);
			const writings = inMonth.filter((i) => i.kind !== "work");
			const works = inMonth.filter((i) => i.kind === "work");
			const lib = library.filter((i) => i.date && monthKey(i.date) === month);
			const rated = lib.filter((i) => typeof i.rating === "number");
			const avgRating = rated.length
				? rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length
				: undefined;
			const [y, m] = month.split("-").map(Number);
			return {
				month,
				year: y,
				monthNumber: m,
				note,
				title: note?.data.title ?? "",
				summary: note?.data.summary ?? "",
				cover:
					note?.data.cover ||
					works.find((w) => w.cover)?.cover ||
					lib.find((i) => i.cover)?.cover ||
					writings.find((w) => w.cover)?.cover ||
					"",
				writings,
				works,
				library: lib,
				stats: {
					writings: writings.length,
					works: works.length,
					library: lib.length,
					avgRating,
				},
			};
		});
}
