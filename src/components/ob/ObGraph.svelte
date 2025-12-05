<script lang="ts">
import {
	forceCenter,
	forceLink,
	forceManyBody,
	forceSimulation,
} from "d3-force";
import { onMount } from "svelte";
import type { GraphData, GraphNode } from "@/types/ob";

export let data: GraphData;
export let noteMeta: Record<
	string,
	{
		title: string;
		excerpt?: string;
		tags?: string[];
		props?: Record<string, string>;
		slug?: string;
	}
> = {};
export let currentSlug: string | undefined = undefined;

type PositionNode = GraphNode & {
	x: number;
	y: number;
	vx?: number;
	vy?: number;
};

let nodes: PositionNode[] = [];
let hoverId: string | null = null;
let transform = { x: 0, y: 0, scale: 1 };
let panState = {
	dragging: false,
	startX: 0,
	startY: 0,
	originX: 0,
	originY: 0,
};

onMount(() => {
	runSimulation(data);
});

$: runSimulation(data);

function runSimulation(graph: GraphData) {
	if (!graph || graph.nodes.length === 0) {
		nodes = [];
		return;
	}
	const n: PositionNode[] = graph.nodes.map((node) => ({
		...node,
		x: (Math.random() - 0.5) * 200,
		y: (Math.random() - 0.5) * 200,
	}));
	const links = graph.edges.map((edge) => ({ ...edge }));

	const sim = forceSimulation(n)
		.force(
			"link",
			forceLink(links)
				.id((d: any) => d.id)
				.distance((d) => (d.kind === "tag" ? 60 : 90))
				.strength(0.4),
		)
		.force("charge", forceManyBody().strength(-180))
		.force("center", forceCenter(0, 0));

	for (let i = 0; i < 200; i++) sim.tick();
	sim.stop();
	nodes = [...n];
}

const handleWheel = (ev: WheelEvent) => {
	const delta = ev.deltaY > 0 ? -0.1 : 0.1;
	const nextScale = Math.min(2.2, Math.max(0.5, transform.scale + delta));
	transform = { ...transform, scale: nextScale };
};

const beginPan = (ev: MouseEvent) => {
	panState = {
		dragging: true,
		startX: ev.clientX,
		startY: ev.clientY,
		originX: transform.x,
		originY: transform.y,
	};
	window.addEventListener("mousemove", movePan);
	window.addEventListener("mouseup", endPan);
};

const movePan = (ev: MouseEvent) => {
	if (!panState.dragging) return;
	const dx = ev.clientX - panState.startX;
	const dy = ev.clientY - panState.startY;
	transform = {
		...transform,
		x: panState.originX + dx,
		y: panState.originY + dy,
	};
};

const endPan = () => {
	panState.dragging = false;
	window.removeEventListener("mousemove", movePan);
	window.removeEventListener("mouseup", endPan);
};

const handleNodeActivate = (slug?: string) => {
	if (slug) window.location.href = `/${slug}`;
};

$: hovered = hoverId ? noteMeta[hoverId] : undefined;
</script>

<div class="card-base p-4 space-y-3">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-sm text-black/50 dark:text-white/50">Obsidian 风格关系图谱</p>
			<h3 class="text-xl font-semibold text-black/80 dark:text-white/80">缩放 / 拖拽 / 筛选</h3>
		</div>
		<div class="flex gap-2 flex-wrap">
			<span class="px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 text-sm text-black/60 dark:text-white/60">
				节点 {data.nodes.length}
			</span>
			<span class="px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 text-sm text-black/60 dark:text-white/60">
				边 {data.edges.length}
			</span>
			{#if currentSlug}
				<span class="px-3 py-1 rounded-full bg-[var(--primary)]/20 text-black/80 dark:text-white/80">
					当前 {currentSlug}
				</span>
			{/if}
		</div>
	</div>
	<div
		class="relative h-80 rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 overflow-hidden touch-none"
		role="application"
		tabindex="0"
		on:wheel|preventDefault={handleWheel}
		on:mousedown={beginPan}
	>
		<svg class="h-full w-full">
			<g transform={`translate(${transform.x + 200} ${transform.y + 160}) scale(${transform.scale})`}>
				{#each data.edges as edge}
					{#if nodes.length}
						{#if nodes.find((n) => n.id === edge.source) && nodes.find((n) => n.id === edge.target)}
							{@const source = nodes.find((n) => n.id === edge.source)!}
							{@const target = nodes.find((n) => n.id === edge.target)!}
							<line
								x1={source.x}
								y1={source.y}
								x2={target.x}
								y2={target.y}
								stroke={edge.kind === "tag" ? "rgba(110,156,251,0.45)" : "rgba(181,106,217,0.55)"}
								stroke-width={edge.kind === "tag" ? 1.5 : 2}
								opacity="0.85"
							/>
						{/if}
					{/if}
				{/each}

				{#each nodes as node}
					<g
						class="cursor-pointer"
						role="button"
						tabindex="0"
						on:mouseenter={() => (hoverId = node.id)}
						on:mouseleave={() => (hoverId = hoverId === node.id ? null : hoverId)}
						on:click={() => handleNodeActivate(noteMeta[node.id]?.slug)}
						on:keydown={(ev) => {
							if (ev.key === "Enter" || ev.key === " ") handleNodeActivate(noteMeta[node.id]?.slug);
						}}
					>
						<circle
							cx={node.x}
							cy={node.y}
							r={node.type === "tag" ? 8 : 12}
							fill={
								node.id === currentSlug
									? "#b56ad9"
									: node.type === "tag"
										? "#6e9cfb"
										: "#9b5ae0"
							}
							stroke="white"
							stroke-width="2"
							opacity={node.type === "tag" ? 0.9 : 0.95}
						/>
						<text x={node.x + 14} y={node.y + 4} font-size="12" fill="#2c2f3a" opacity="0.9">
							{noteMeta[node.id]?.title ?? node.title}
						</text>
					</g>
				{/each}
			</g>
		</svg>

		{#if hovered && hoverId}
			<div class="absolute left-3 bottom-3 p-3 rounded-xl bg-white shadow-lg border border-white/70 w-64">
				<p class="text-xs text-black/50">双链预览</p>
				<h4 class="font-semibold text-black/85">{hovered.title}</h4>
				{#if hovered.excerpt}
					<p class="text-sm text-black/60 line-clamp-3">{hovered.excerpt}</p>
				{/if}
				{#if hovered.tags?.length}
					<div class="flex flex-wrap gap-1 mt-2">
						{#each hovered.tags as t}
							<span class="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs">
								{t}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
