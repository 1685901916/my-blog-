<script lang="ts">
	import type { ObNote } from "@/types/ob";

	export let notes: ObNote[] = [];
	export let currentSlug: string | undefined = undefined;
</script>

<div class="p-4 space-y-4 min-w-[260px] overflow-x-auto">
	<div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/5 text-black/60 dark:text-white/60">
		<span class="text-sm">目录可左右滑动 · 标签/属性可筛</span>
	</div>
	<div class="space-y-3">
		{#each notes as note}
			<article
				class={`p-3 rounded-xl bg-white/90 dark:bg-white/10 shadow-lg border border-white/60 dark:border-white/10 transition ${
					currentSlug === note.slug ? "ring-2 ring-[var(--primary)]/50" : ""
				}`}
			>
				<div class="flex items-start justify-between gap-2">
					<div>
						<a
							href={`/${note.slug}`}
							class="font-semibold text-black/80 dark:text-white/80 hover:text-[var(--primary)] transition"
						>
							{note.title}
						</a>
						{#if note.excerpt}
							<p class="text-sm text-black/55 dark:text-white/55 mt-1 line-clamp-2">
								{note.excerpt}
							</p>
						{/if}
					</div>
					<span class="text-xs text-black/40 dark:text-white/40">/{note.slug}</span>
				</div>
				{#if note.tags.length}
					<div class="flex flex-wrap gap-2 mt-2">
						{#each note.tags as tag}
							<span class="px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-sm text-[var(--primary)]">
								{tag}
							</span>
						{/each}
					</div>
				{/if}
				{#if Object.keys(note.props).length}
					<div class="mt-2 grid grid-cols-2 gap-2 text-xs text-black/60 dark:text-white/60">
						{#each Object.entries(note.props) as [k, v]}
							<div class="flex items-center gap-1">
								<span class="font-semibold text-black/80 dark:text-white/80">{k}:</span>
								<span>{v}</span>
							</div>
						{/each}
					</div>
				{/if}
			</article>
		{/each}
	</div>
</div>
