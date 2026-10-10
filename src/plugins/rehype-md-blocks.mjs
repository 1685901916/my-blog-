import { SKIP, visit } from "unist-util-visit";

// 长文里的两类「块」：
// 1. 单独一行的外链（Obsidian 里常见的 [站名](url)）→ 链接卡片 p.md-link-card
// 2. 图片：和文字拆开；单张 → p.md-figure 居中，连着几张 → p.md-gallery 网格

const isWs = (n) => n.type === "text" && !n.value.trim();
const isBr = (n) => n.type === "element" && n.tagName === "br";
const isGap = (n) => isWs(n) || isBr(n);
const isImg = (n) => n.type === "element" && n.tagName === "img";
const isExternal = (href) =>
	typeof href === "string" && /^(https?:)?\/\//.test(href);

function addClass(node, name) {
	const list = node.properties.className;
	const arr = Array.isArray(list) ? list : list ? [list] : [];
	if (!arr.includes(name)) arr.push(name);
	node.properties.className = arr;
}

const textOf = (n) =>
	n.type === "text" ? n.value : (n.children ?? []).map(textOf).join("");

const span = (className, value) => ({
	type: "element",
	tagName: "span",
	properties: { className: [className] },
	children: [{ type: "text", value }],
});

function hostOf(href) {
	try {
		return new URL(
			href.startsWith("//") ? `https:${href}` : href,
		).hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
}

function trimGaps(nodes) {
	while (nodes.length && isGap(nodes[0])) nodes.shift();
	while (nodes.length && isGap(nodes[nodes.length - 1])) nodes.pop();
	return nodes;
}

export function rehypeMdBlocks() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "p" || !parent || index === undefined) return;
			const kids = node.children;

			// 1. 段落里只有一个外链 → 链接卡片
			const meaningful = kids.filter((k) => !isGap(k));
			const only = meaningful[0];
			if (
				meaningful.length === 1 &&
				only.type === "element" &&
				only.tagName === "a" &&
				isExternal(only.properties?.href) &&
				!only.children.some(isImg)
			) {
				const host = hostOf(only.properties.href);
				const label = textOf(only).trim();
				addClass(node, "md-link-card");
				// no-styling：不套用主题正文链接的虚线下划线样式
				addClass(only, "no-styling");
				only.children = [
					span("md-link-card__title", label || host),
					span("md-link-card__host", host),
				];
				return SKIP;
			}

			// 2. 含图片的段落：按「文字 / 图片」切成几段
			if (!kids.some(isImg)) return;
			const runs = [];
			let cur = null;
			for (const k of kids) {
				if (isGap(k)) {
					cur?.nodes.push(k);
					continue;
				}
				const kind = isImg(k) ? "img" : "text";
				if (!cur || cur.kind !== kind) {
					cur = { kind, nodes: [] };
					runs.push(cur);
				}
				cur.nodes.push(k);
			}
			const out = runs
				.map((r) => {
					if (r.kind === "img") {
						const imgs = r.nodes.filter(isImg);
						return {
							type: "element",
							tagName: "p",
							properties: {
								className: [imgs.length > 1 ? "md-gallery" : "md-figure"],
							},
							children: imgs,
						};
					}
					return {
						type: "element",
						tagName: "p",
						properties: { ...node.properties },
						children: trimGaps(r.nodes),
					};
				})
				.filter((p) => p.children.length > 0);
			parent.children.splice(index, 1, ...out);
			return [SKIP, index + out.length];
		});
	};
}
