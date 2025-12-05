import { visit } from "unist-util-visit";

/**
 * Rehype plugin to fix wiki-link URLs
 * Ensures that links marked with data-wiki-link have the correct /posts/ prefix
 */
export function rehypeFixWikiLinks() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (
				node.tagName === "a" &&
				node.properties &&
				node.properties.dataWikiLink
			) {
				const slug = node.properties.dataWikiLink;
				// Force the href to have /posts/ prefix
				node.properties.href = `/posts/${slug}/`;
			}
		});
	};
}
