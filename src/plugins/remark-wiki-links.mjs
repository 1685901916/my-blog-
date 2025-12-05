import { visit } from "unist-util-visit";

/**
 * Remark plugin to transform wiki-style links [[link]] into HTML links
 */
export function remarkWikiLinks() {
	return (tree) => {
		visit(tree, "text", (node, index, parent) => {
			const { value } = node;
			const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

			if (!wikiLinkRegex.test(value)) {
				return;
			}

			const newNodes = [];
			let lastIndex = 0;

			// Reset regex
			wikiLinkRegex.lastIndex = 0;

			let execResult = wikiLinkRegex.exec(value);
			while (execResult !== null) {
				const [fullMatch, linkText] = execResult;
				const matchStart = execResult.index;

				// Add text before the match
				if (matchStart > lastIndex) {
					newNodes.push({
						type: "text",
						value: value.slice(lastIndex, matchStart),
					});
				}

				// Parse link text (support "display text|actual-link" format)
				const parts = linkText.split("|");
				const displayText = parts.length > 1 ? parts[0].trim() : linkText.trim();
				const linkTarget = parts.length > 1 ? parts[1].trim() : linkText.trim();

				// Normalize link target - just lowercase and trim
				// Users should provide the actual file slug (e.g., [[wiki-link-test-a]])
				const slug = linkTarget.toLowerCase().trim();

				// Create link node with a special data attribute to mark it as wiki-link
				newNodes.push({
					type: "link",
					url: `/posts/${slug}/`,
					title: null,
					data: {
						hProperties: {
							className: ["wiki-link"],
							"data-wiki-link": slug, // Mark this as a wiki link
						},
					},
					children: [
						{
							type: "text",
							value: displayText,
						},
					],
				});

				lastIndex = matchStart + fullMatch.length;
				execResult = wikiLinkRegex.exec(value);
			}

			// Add remaining text
			if (lastIndex < value.length) {
				newNodes.push({
					type: "text",
					value: value.slice(lastIndex),
				});
			}

			// Replace the text node with the new nodes
			if (newNodes.length > 0 && parent && typeof index === "number") {
				parent.children.splice(index, 1, ...newNodes);
				return index + newNodes.length;
			}
		});
	};
}
