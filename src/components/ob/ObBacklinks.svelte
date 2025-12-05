<script lang="ts">
export type BacklinkItem = {
	slug: string;
	title: string;
	excerpt?: string;
	tags?: string[];
};

export let items: BacklinkItem[] = [];
</script>

<section class="card-base p-4 space-y-2">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold text-black/80 dark:text-white/80">反向链接</h2>
		<span class="px-3 py-1 rounded-full bg-white/70 dark:bg-white/5 text-sm text-black/60 dark:text-white/60">
			共 {items.length}
		</span>
	</div>
	{#if items.length === 0}
		<p class="text-black/50 dark:text-white/50 text-sm">暂无反链</p>
	{:else}
		<ul class="grid gap-2">
			{#each items as item}
				<li class="p-3 rounded-xl bg-white/85 dark:bg-white/10 border border-white/60 dark:border-white/10 shadow-lg flex flex-col gap-1">
					<div class="flex items-center justify-between gap-2">
						<a href={`/${item.slug}`} class="font-semibold text-black/80 dark:text-white/80 hover:text-[var(--primary)]">
							{item.title}
						</a>
						<span class="text-xs text-black/50 dark:text-white/50">/{item.slug}</span>
					</div>
					{#if item.excerpt}
						<p class="text-sm text-black/60 dark:text-white/60 line-clamp-2">{item.excerpt}</p>
					{/if}
					{#if item.tags?.length}
						<div class="flex flex-wrap gap-1">
							{#each item.tags as tag}
								<span class="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
