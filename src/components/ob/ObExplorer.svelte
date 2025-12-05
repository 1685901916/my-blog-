<script lang="ts">
import type { GraphData, ObNote } from "@/types/ob";
import { filterGraph, findBacklinks } from "@/utils/ob-graph-client";
import ObBacklinks from "./ObBacklinks.svelte";
import ObDirectory from "./ObDirectory.svelte";
import ObFilters from "./ObFilters.svelte";
import ObGraph from "./ObGraph.svelte";
import ObSidebar from "./ObSidebar.svelte";

export let notes: ObNote[] = [];
export let graph: GraphData;
export let currentSlug: string | undefined = undefined;
export let showBacklinks = true;

let query = "";
let selectedTags: string[] = [];
let drawerOpen = true;

const noteMeta = Object.fromEntries(
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

$: filteredNotes = notes.filter((n) => {
	const matchQuery =
		!query ||
		n.title.toLowerCase().includes(query.toLowerCase()) ||
		(n.excerpt ?? "").toLowerCase().includes(query.toLowerCase());
	const matchTags =
		selectedTags.length === 0 || n.tags.some((t) => selectedTags.includes(t));
	return matchQuery && matchTags;
});

$: filteredGraph = filterGraph(graph, {
	tags: selectedTags.length ? selectedTags : undefined,
	query: query || undefined,
});

$: backlinks = currentSlug
	? findBacklinks(graph, currentSlug).map((slug) => ({
			slug,
			title: noteMeta[slug]?.title ?? slug,
			excerpt: noteMeta[slug]?.excerpt ?? "",
			tags: noteMeta[slug]?.tags ?? [],
		}))
	: [];
</script>

<div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
	<ObSidebar bind:open={drawerOpen} subtitle="拖拽调宽 · 左滑呼出">
		<ObDirectory notes={filteredNotes} currentSlug={currentSlug} />
	</ObSidebar>
	<div class="space-y-4">
		<ObFilters
			tags={notes.flatMap((n) => n.tags ?? [])}
			{selectedTags}
			{query}
			on:toggleTag={(e) => {
				const tag = e.detail;
				selectedTags = selectedTags.includes(tag)
					? selectedTags.filter((t) => t !== tag)
					: [...selectedTags, tag];
			}}
			on:queryChange={(e) => (query = e.detail)}
		/>
		<slot />
		<ObGraph {noteMeta} data={filteredGraph} currentSlug={currentSlug} />
		{#if showBacklinks}
			<ObBacklinks items={backlinks} />
		{/if}
	</div>
</div>
