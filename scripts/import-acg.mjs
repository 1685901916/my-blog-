// 把 Obsidian ACG 库的「管理」文件夹导入博客：src/content/acg/<分区>/<条目>.md
//
// 用法：node scripts/import-acg.mjs <管理文件夹路径> [--covers]
//   --covers  给没有图片的动画 / 漫画 / 小说 / 游戏去 Bangumi 搜封面，结果缓存在 src/data/acg-covers.json，
//             搜错了直接改这个文件（或把值改成 null 表示不要封面），下次导入会沿用
//
// 做的事：
//   - 一个顶层文件夹 = 一个分区，子文件夹 = 子分类（异能系 / 异世界 …）
//   - 文件名开头的 ♡ ☆ 拆成「喜欢 / 推荐」标记；文件名以 0 / 1 开头的（0粮仓、1梦…）算分区的随笔，不算条目
//   - frontmatter 的 tags 和正文开头的 #标签 合并成标签
//   - ![[图片]] 转成 webp 复制到 public/acg/img/，只复制被引用的图
//   - [[笔记]] 转成指向对应条目的相对链接（../<id>/），同时记下出链，用来算反向链接
//   - 每次导入都会清空 src/content/acg/ 重新生成
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import sharp from "sharp";

const [vaultArg, ...flags] = process.argv.slice(2);
if (!vaultArg) {
	console.error("用法：node scripts/import-acg.mjs <管理文件夹路径> [--covers]");
	process.exit(1);
}
const VAULT = path.resolve(vaultArg);
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "src/content/acg");
const IMG_OUT = path.join(ROOT, "public/acg/img");
const COVERS = path.join(ROOT, "src/data/acg-covers.json");
const WANT_COVERS = flags.includes("--covers");

// 文件夹 → 分区；顺序就是网站上的顺序
const SECTIONS = [
	{ dir: "1管理动漫", key: "anime", name: "动画", bgm: 2 },
	{ dir: "3漫画", key: "manga", name: "漫画", bgm: 1 },
	{ dir: "8小说", key: "novel", name: "小说", bgm: 1 },
	{ dir: "6游戏", key: "game", name: "游戏", bgm: 4 },
	// 人物类去 Bangumi 搜头像：角色搜 characters，其余搜 persons（制作公司在 Bangumi 里也是 person）
	{ dir: "2角色", key: "character", name: "角色", mono: "characters" },
	{ dir: "5cv", key: "cv", name: "声优", mono: "persons" },
	{ dir: "4音乐", key: "music", name: "音乐", mono: "persons" },
	{ dir: "7画", key: "artist", name: "画师", mono: "persons" },
	{ dir: "6动漫公司", key: "studio", name: "动画公司", mono: "persons" },
	{ dir: "收集", key: "collect", name: "收集" },
];
const SKIP_DIRS = new Set(["0折叠", "00附件", "数据库", "模板"]);
const SKIP_FILE = (name) => /^(未命名|CV模板)/.test(name) || /\.(png|jpe?g|webp|gif)$/i.test(name);
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp)$/i;

// 已经有评分的番（旧收藏库里从 Obsidian Bases 拷来的）
const RATINGS = {
	人类衰退之后: 9.8, 无职转生: 9.8, 辉夜大小姐想让我告白: 9.5, 明日酱的水手服: 9.5, 游戏人生: 9.5,
	隐瞒之事: 9.4, 轻音少女: 9.4, 悠久之翼ef: 9.4, 天元突破: 9.3, 冰海战记: 9.2,
};

// 文件名和 Bangumi 上的名字对不上时，用这里的词去搜；null = 不搜
const SEARCH_AS = {
	re0: "Re：从零开始的异世界生活",
	崩坏三: "崩坏3",
	青春猪头少年不会梦见兔女郎学姐: "青春猪头少年不会梦到兔女郎学姐",
	反派目标是拯救女主: null,
	// 人物
	尼娅: "ニア・テッペリン",
	艾丽丝: "エリス・ボレアス・グレイラット",
	上田里奈: "上田麗奈",
	东映: "東映アニメーション",
	omu: null,
	aur: null,
	轉生為睡走情色遊戲女主角的男人但我絕不會幹這種事: null,
};

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
		const p = path.join(dir, d.name);
		if (d.isDirectory()) return SKIP_DIRS.has(d.name) || d.name.startsWith(".") ? [] : walk(p);
		return d.name.endsWith(".md") ? [p] : [];
	});

// 标题 → 标记 + 干净标题 + 是否随笔
function parseName(file) {
	let name = path.basename(file, ".md").trim();
	const marks = [];
	while (/^[♡☆★❤]/.test(name)) {
		marks.push(/^[☆★]/.test(name) ? "star" : "heart");
		name = name.slice(1).trim();
	}
	const essay = /^[01](?![0-9])/.test(name);
	if (essay) name = name.slice(1).trim();
	return { title: name, marks, essay };
}

const toId = (title) =>
	title
		.replace(/[\s　]+/g, "-")
		.replace(/[\\/?#%:*"<>|，。、！？!?“”‘’'（）()[\]【】{}<>《》~～·…,.;；：]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "") || "note";

// 附件索引：文件名 → 路径（整个库里找，Obsidian 的附件可能不在一个地方）
const attachments = new Map();
for (const dir of [path.join(VAULT, "00附件"), path.join(VAULT, "..", "平日", "0附件"), VAULT]) {
	if (!fs.existsSync(dir)) continue;
	for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
		if (d.isFile() && IMAGE_EXT.test(d.name) && !attachments.has(d.name)) attachments.set(d.name, path.join(dir, d.name));
	}
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(IMG_OUT, { recursive: true });
const covers = fs.existsSync(COVERS) ? JSON.parse(fs.readFileSync(COVERS, "utf8")) : {};

// 第一遍：收集所有笔记，建立 标题 → id 的表，给 [[链接]] 用
const notes = [];
for (const sec of SECTIONS) {
	const base = path.join(VAULT, sec.dir);
	if (!fs.existsSync(base)) continue;
	for (const file of walk(base)) {
		if (SKIP_FILE(path.basename(file, ".md"))) continue;
		const rel = path.relative(base, path.dirname(file));
		const sub = rel ? rel.split(path.sep) : [];
		const { title, marks, essay } = parseName(file);
		notes.push({ file, sec, sub, title, marks, essay, id: toId(title) });
	}
}
// 同一分区里重名的（比如 声优/神谷浩史 和 声优/男性cv/神谷浩史）合并成一条，保留内容多的那份
const byKey = new Map();
for (const n of notes) {
	const k = `${n.sec.key}/${n.id}`;
	const prev = byKey.get(k);
	const size = fs.statSync(n.file).size;
	if (!prev || size > prev.size) byKey.set(k, { ...n, size, sub: prev && prev.sub.length > n.sub.length ? prev.sub : n.sub });
}
const entries = [...byKey.values()];
const titleIndex = new Map();
for (const n of entries) {
	for (const t of [n.title, path.basename(n.file, ".md"), n.id]) if (!titleIndex.has(t)) titleIndex.set(t, n);
}

async function copyImage(name) {
	const src = attachments.get(name);
	if (!src) return null;
	const out = `${createHash("md5").update(name).digest("hex").slice(0, 12)}.webp`;
	const dest = path.join(IMG_OUT, out);
	if (!fs.existsSync(dest)) {
		await sharp(src).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
	}
	return `/acg/img/${out}`;
}

// 按标题搜 Bangumi 条目封面（只取第一个结果，搜错了去 acg-covers.json 改）
async function searchBangumi(title, type) {
	try {
		const query = title in SEARCH_AS ? SEARCH_AS[title] : title;
		if (query === null) return null;
		const res = await fetch(
			`https://api.bgm.tv/search/subject/${encodeURIComponent(query)}?type=${type}&responseGroup=small&max_results=1`,
			{ headers: { "User-Agent": "ayano-blog/acg-import (https://ayano29.cn)" } },
		);
		const hit = (await res.json())?.list?.[0];
		await new Promise((r) => setTimeout(r, 400));
		return hit?.images?.large
			? { cover: hit.images.large.replace(/^http:/, "https:"), bgm: hit.id, name: hit.name_cn || hit.name }
			: null;
	} catch (e) {
		console.warn("封面搜索失败", title, e.message);
		return undefined;
	}
}

// 人物头像：Bangumi v0 搜索，取第一个结果；缓存的键是「人物:名字」，搜错了去 acg-covers.json 改
// 不是具体人物的笔记（角色理论、杂、中文圈…）不搜
const NOT_A_PERSON = new Set(["角色理论", "杂", "中文圈", "甜系", "八王子", "你的守护天使"]);
async function searchMono(title, type) {
	try {
		const query = title in SEARCH_AS ? SEARCH_AS[title] : title;
		if (query === null) return null;
		const res = await fetch(`https://api.bgm.tv/v0/search/${type}?limit=1`, {
			method: "POST",
			headers: { "User-Agent": "ayano-blog/acg-import (https://ayano29.cn)", "Content-Type": "application/json" },
			body: JSON.stringify({ keyword: query }),
		});
		const hit = (await res.json())?.data?.[0];
		await new Promise((r) => setTimeout(r, 400));
		return hit?.images?.medium ? { cover: hit.images.medium, bgm: hit.id, name: hit.name, mono: type } : null;
	} catch (e) {
		console.warn("头像搜索失败", title, e.message);
		return undefined;
	}
}

const SECTION_NAMES = new Set(["动漫", "动画", "漫画", "小说", "游戏", "角色", "cv", "CV", "音乐", "画", "画师", "动漫公司"]);

// 第二遍：转换正文、写文件
let imgCount = 0;
for (const n of entries) {
	const raw = fs.readFileSync(n.file, "utf8").replace(/\r\n/g, "\n");
	let data = {};
	let body = raw;
	const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
	if (fm) {
		try {
			data = yaml.load(fm[1]) ?? {};
		} catch {}
		body = raw.slice(fm[0].length);
	}
	const tags = new Set([...(Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [])].map(String));
	// 正文开头只放标签的行：#mapa #wit #史诗
	body = body.replace(/^(?:[ \t]*#[^\s#][^\s]*[ \t]*)+$/gm, (line) => {
		for (const t of line.match(/#[^\s#]+/g) ?? []) tags.add(t.slice(1));
		return "";
	});
	// frontmatter 里可能写成 "#书"；分区名本身不当标签
	for (const t of [...tags]) {
		tags.delete(t);
		const clean = t.replace(/^#+/, "").trim();
		if (clean && !SECTION_NAMES.has(clean)) tags.add(clean);
	}

	const links = new Set();
	let cover = "";
	// 图片嵌入
	const embeds = [...body.matchAll(/!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)];
	for (const m of embeds) {
		const url = IMAGE_EXT.test(m[1]) ? await copyImage(m[1].trim()) : null;
		if (url) imgCount++;
		body = body.replace(m[0], url ? `![](${url})` : "");
		if (url && !cover) cover = url;
	}
	// 外链图片：![alt|100](url) → 去掉尺寸
	body = body.replace(/!\[([^\]|]*)\|[^\]]*\]\(([^)]+)\)/g, "![$1]($2)");
	if (!cover) cover = body.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/)?.[1] ?? "";
	// 双链
	body = body.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
		const t = target.trim();
		const hit = titleIndex.get(t) ?? titleIndex.get(parseName(`${t}.md`).title);
		const text = alias?.trim() || parseName(`${t}.md`).title;
		if (!hit || hit === n) return text;
		links.add(`${hit.sec.key}/${hit.id}`);
		return `[${text}](../${encodeURIComponent(hit.id)}/)`;
	});
	// 块引用 ^abc123、和标题重复的一级标题、多余空行
	body = body
		.replace(/\s\^[a-z0-9-]{4,}$/gm, "")
		.replace(new RegExp(`^#\\s+${n.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m"), "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	const text = body
		.split("\n")
		// 摘要里不要网址（有的笔记第一行就是一条链接）
		// Obsidian 的 callout（> [!NOTE]）只是个标记，不当摘要
		.filter((l) => !/^>\s*\[!/.test(l.trim()))
		.map((l) =>
			l
				.replace(/^>\s*/, "")
				// 任务列表的 [ ] / [x]
				.replace(/^([-*+]\s+)?\[[ xX]\]\s*/, "")
				.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
				.replace(/https?:\/\/\S+/g, "")
				.trim(),
		)
		.find((l) => l && !/^(#|!\[|\||```|>?\s*$)/.test(l) && l.replace(/[-*+\s[\]()]/g, "").length > 4);
	const excerpt = (text ?? "")
		.replace(/^[-*+]\s+/, "")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*_`~]/g, "")
		.slice(0, 90);
	const words = (body.replace(/!\[[^\]]*\]\([^)]*\)|\]\([^)]*\)/g, "").match(/[一-鿿]|[A-Za-z0-9]+/g) ?? []).length;

	const image = cover;
	if (n.sec.bgm && !n.essay) {
		if (WANT_COVERS && !(n.title in covers)) covers[n.title] = await searchBangumi(n.title, n.sec.bgm);
		cover = covers[n.title]?.cover || cover;
	}
	// 人物：Bangumi 头像优先（笔记里的图多半是截图）
	const monoKey = `人物:${n.title}`;
	if (n.sec.mono && !n.essay && !NOT_A_PERSON.has(n.title)) {
		if (WANT_COVERS && !(monoKey in covers)) covers[monoKey] = await searchMono(n.title, n.sec.mono);
		cover = covers[monoKey]?.cover || cover;
	}
	const fmOut = {
		title: n.title,
		section: n.sec.key,
		sub: n.sub,
		marks: n.marks,
		essay: n.essay,
		tags: [...tags],
		cover,
		image: image !== cover ? image : undefined,
		bgm: n.sec.bgm ? covers[n.title]?.bgm : undefined,
		rating: RATINGS[n.title],
		date: fs.statSync(n.file).mtime.toISOString().slice(0, 10),
		words,
		excerpt,
		links: [...links],
		source: path.relative(path.dirname(VAULT), n.file).split(path.sep).join("/"),
	};
	for (const k of Object.keys(fmOut)) if (fmOut[k] === undefined) delete fmOut[k];
	const dir = path.join(OUT, n.sec.key);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, `${n.id}.md`), `---\n${yaml.dump(fmOut, { lineWidth: -1 })}slug: ${JSON.stringify(n.id)}\n---\n\n${body}\n`);
}

if (WANT_COVERS) fs.writeFileSync(COVERS, `${JSON.stringify(covers, null, "\t")}\n`);

const count = (k) => entries.filter((n) => n.sec.key === k).length;
console.log(`导入 ${entries.length} 条笔记，${imgCount} 张图片`);
console.log(SECTIONS.map((s) => `${s.name} ${count(s.key)}`).join(" · "));
