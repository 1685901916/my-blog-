import type {
	GraphData,
	GraphEdge,
	GraphNode,
	NodeType,
	ObNote,
} from "@/types/ob";

type FilterOptions = {
	tags?: string[];
	props?: Record<string, string>;
	types?: NodeType[];
	query?: string;
};

export const filterGraph = (
	graph: GraphData,
	options: FilterOptions,
): GraphData => {
	const { tags = [], props = {}, types, query } = options;

	const matchProps = (node: GraphNode) => {
		if (!props || Object.keys(props).length === 0) return true;
		return Object.entries(props).every(
			([key, value]) => node.props?.[key] === value,
		);
	};

	const allowTag = (node: GraphNode) => {
		if (tags.length === 0) return true;
		return node.tags?.some((tag) => tags.includes(tag)) ?? false;
	};

	const allowType = (node: GraphNode) => {
		if (!types || types.length === 0) return true;
		return types.includes(node.type);
	};

	const allowQuery = (node: GraphNode) => {
		if (!query) return true;
		const lower = query.toLowerCase();
		return (
			node.title.toLowerCase().includes(lower) ||
			(node.excerpt ?? "").toLowerCase().includes(lower) ||
			(node.tags ?? []).some((t) => t.toLowerCase().includes(lower))
		);
	};

	const allowedIds = new Set(
		graph.nodes
			.filter(
				(node) =>
					matchProps(node) &&
					allowTag(node) &&
					allowType(node) &&
					allowQuery(node),
			)
			.map((node) => node.id),
	);

	const nodes = graph.nodes.filter((node) => allowedIds.has(node.id));
	const edges = graph.edges.filter(
		(edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target),
	);

	return { nodes, edges };
};

export const buildNoteMetaMap = (notes: ObNote[]) =>
	Object.fromEntries(
		notes.map((note) => [
			note.slug,
			{
				title: note.title,
				excerpt: note.excerpt,
				tags: note.tags,
				props: note.props,
				slug: note.slug,
			},
		]),
	);

export const findBacklinks = (graph: GraphData, slug: string) =>
	graph.edges
		.filter((edge) => edge.kind === "link" && edge.target === slug)
		.map((edge) => edge.source);
