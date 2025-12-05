import { getCollection } from "astro:content";
import type { GraphData, GraphEdge, GraphNode, ObNote } from "@/types/ob";

// Re-export client-side functions
export {
	buildNoteMetaMap,
	filterGraph,
	findBacklinks,
} from "./ob-graph-client";

const collections = [
	"posts",
	"manga",
	"portfolio",
	"manga-categories",
	"entertainment-resources",
] as const;

const linkToken = /\[\[([^\]]+)\]\]/g;

const normalizeId = (value: string) =>
	value.trim().toLowerCase().replace(/\s+/g, "-");

const extractLinksFromBody = (body: string): string[] => {
	const found: string[] = [];
	for (const match of body.matchAll(linkToken)) {
		if (match[1]) found.push(normalizeId(match[1]));
	}
	return found;
};

type GenericEntry = {
	slug: string;
	body?: string;
	data: any;
	render?: () => Promise<any>;
};

export async function buildGraphData(): Promise<{
	graph: GraphData;
	notes: ObNote[];
}> {
	const notes: ObNote[] = [];
	const aliasMap = new Map<string, string>();

	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const tagSet = new Set<string>();

	for (const name of collections) {
		const entries = (await getCollection(name as any, ({ data }) =>
			import.meta.env.PROD ? data.draft !== true : true,
		)) as unknown as GenericEntry[];

		for (const entry of entries) {
			const slug = normalizeId((entry as any).data?.slug ?? entry.slug);
			const body = await readBody(entry);

			const note: ObNote = {
				slug,
				title: (entry as any).data?.title,
				excerpt:
					(entry as any).data?.excerpt ||
					(entry as any).data?.description ||
					"",
				tags: (entry as any).data?.tags ?? [],
				props: (entry as any).data?.props ?? {},
				links: (entry as any).data?.links ?? [],
				aliases: (entry as any).data?.aliases ?? [],
				showOnHome:
					(entry as any).data?.showOnHome ??
					(entry as any).data?.showOnHomepage ??
					true,
			};

			notes.push(note);
			for (const alias of note.aliases) {
				aliasMap.set(normalizeId(alias), note.slug);
			}

			nodes.push({
				id: note.slug,
				title: note.title,
				type: "doc",
				tags: note.tags,
				props: note.props,
				excerpt: note.excerpt,
				slug: note.slug,
			});

			for (const tag of note.tags) {
				const tagId = normalizeId(tag);
				tagSet.add(tagId);
				edges.push({
					source: note.slug,
					target: tagId,
					kind: "tag",
				});
			}

			const inlineLinks = extractLinksFromBody(body);
			const linkIds = [...note.links.map(normalizeId), ...inlineLinks];
			for (const target of linkIds) {
				if (!target) continue;
				const resolved = aliasMap.get(target) ?? target;
				edges.push({
					source: note.slug,
					target: resolved,
					kind: "link",
				});
			}
		}
	}

	for (const tagId of tagSet) {
		nodes.push({
			id: tagId,
			title: tagId,
			type: "tag",
		});
	}

	return { graph: dedupeGraph({ nodes, edges }), notes };
}

const readBody = async (entry: GenericEntry) => {
	try {
		const rendered = entry.render ? await entry.render() : null;
		const raw =
			(rendered as any)?.remarkPluginFrontmatter?.rawContent ??
			(rendered as any)?.body ??
			entry.body ??
			"";
		return String(raw);
	} catch (_e) {
		return entry.body ?? "";
	}
};

const dedupeGraph = (graph: GraphData): GraphData => {
	const nodeMap = new Map<string, GraphNode>();
	for (const node of graph.nodes) {
		if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
	}

	const edgeKey = (e: GraphEdge) => `${e.source}->${e.target}:${e.kind}`;
	const edgeMap = new Map<string, GraphEdge>();
	for (const edge of graph.edges) {
		const key = edgeKey(edge);
		if (!edgeMap.has(key)) edgeMap.set(key, edge);
	}

	return {
		nodes: Array.from(nodeMap.values()),
		edges: Array.from(edgeMap.values()),
	};
};
