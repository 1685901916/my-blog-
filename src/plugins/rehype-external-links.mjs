import { visit } from "unist-util-visit";

function isExternalHref(href) {
	return (
		typeof href === "string" &&
		(href.startsWith("http://") ||
			href.startsWith("https://") ||
			href.startsWith("//"))
	);
}

export function rehypeExternalLinks() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "a" || !node.properties) return;
			if (node.properties.dataWikiLink) return;

			const href = node.properties.href;
			if (!isExternalHref(href)) return;

			node.properties.target = "_blank";
			node.properties.rel = "noopener noreferrer";

			const classNames = Array.isArray(node.properties.className)
				? node.properties.className
				: node.properties.className
					? [node.properties.className]
					: [];
			if (!classNames.includes("external-link")) {
				classNames.push("external-link");
			}
			node.properties.className = classNames;
		});
	};
}
