export type NodeType = "doc" | "tag";

export type ObNote = {
	slug: string;
	title: string;
	excerpt?: string;
	tags: string[];
	props: Record<string, string>;
	links: string[];
	aliases: string[];
	showOnHome: boolean;
};

export type GraphNode = {
	id: string;
	title: string;
	type: NodeType;
	tags?: string[];
	props?: Record<string, string>;
	excerpt?: string;
	slug?: string;
};

export type GraphEdge = {
	source: string;
	target: string;
	kind: "link" | "tag";
};

export type GraphData = {
	nodes: GraphNode[];
	edges: GraphEdge[];
};
