<script lang="ts">
import { createEventDispatcher } from "svelte";
import { derived, writable } from "svelte/store";

export let tags: string[] = [];
export let selectedTags: string[] = [];
export let query = "";

const dispatch = createEventDispatcher<{
	toggleTag: string;
	queryChange: string;
}>();

const uniqueTags = derived(writable(tags), ($tags) =>
	Array.from(new Set($tags)).sort((a, b) => a.localeCompare(b)),
);
</script>

<div class="card-base p-4 flex flex-col gap-3">
	<div class="flex items-center gap-2">
		<input
			value={query}
			on:input={(e) => dispatch("queryChange", (e.target as HTMLInputElement).value)}
			placeholder="搜索标题 / 摘要"
			class="flex-1 px-3 py-2 rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 text-black/80 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
		/>
		<span class="px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 text-xs text-black/60 dark:text-white/60">
			标签筛选
		</span>
	</div>
	<div class="flex flex-wrap gap-2">
		{#if $uniqueTags.length === 0}
			<span class="text-sm text-black/50 dark:text-white/50">暂无标签</span>
		{:else}
			{#each $uniqueTags as tag}
				<button
					class={`px-3 py-1 rounded-full border transition ${
						selectedTags.includes(tag)
							? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg"
							: "bg-white/80 dark:bg-white/5 text-black/80 dark:text-white/80 border-white/60 dark:border-white/10"
					}`}
					on:click={() => dispatch("toggleTag", tag)}
				>
					{tag}
				</button>
			{/each}
		{/if}
	</div>
</div>
