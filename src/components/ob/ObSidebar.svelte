<script lang="ts">
import { createEventDispatcher, onMount } from "svelte";

const STORAGE_KEY = "ob-drawer-width";
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

export let title = "头像 / 目录区域";
export let subtitle = "拖拽调宽 · 左滑呼出";
export let avatarUrl: string | undefined = undefined;
export let open = true;

const dispatch = createEventDispatcher<{ openChange: boolean }>();

let width = 300;
let startX = 0;
let startWidth = width;
let dragging = false;
const STEP = 12;

onMount(() => {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved) {
		const parsed = Number(saved);
		if (!Number.isNaN(parsed)) width = parsed;
	}
});

const beginDrag = (ev: MouseEvent) => {
	dragging = true;
	startX = ev.clientX;
	startWidth = width;
	window.addEventListener("mousemove", handleMove);
	window.addEventListener("mouseup", endDrag);
};

const handleMove = (ev: MouseEvent) => {
	if (!dragging) return;
	const delta = ev.clientX - startX;
	const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
	width = next;
};

const endDrag = () => {
	if (!dragging) return;
	dragging = false;
	localStorage.setItem(STORAGE_KEY, String(width));
	window.removeEventListener("mousemove", handleMove);
	window.removeEventListener("mouseup", endDrag);
};

const closeDrawer = () => dispatch("openChange", false);
const openDrawer = () => dispatch("openChange", true);

const handleKeyResize = (ev: KeyboardEvent) => {
	if (ev.key === "ArrowLeft") {
		width = Math.max(MIN_WIDTH, width - STEP);
		localStorage.setItem(STORAGE_KEY, String(width));
	}
	if (ev.key === "ArrowRight") {
		width = Math.min(MAX_WIDTH, width + STEP);
		localStorage.setItem(STORAGE_KEY, String(width));
	}
};
</script>

<aside
	class={`relative card-base h-full overflow-hidden flex flex-col transition-transform duration-200 lg:translate-x-0 fixed inset-y-0 left-0 lg:static z-40 ${
		open ? "translate-x-0" : "-translate-x-full"
	}`}
	style={`width:${width}px`}
>
	<div class="flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/10">
		<div class="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-400 text-white grid place-items-center shadow-lg overflow-hidden">
			{#if avatarUrl}
				<img src={avatarUrl} alt="avatar" class="h-full w-full object-cover" />
			{:else}
				Ob
			{/if}
		</div>
		<div>
			<p class="text-sm text-black/50 dark:text-white/50">{subtitle}</p>
			<h2 class="text-lg font-semibold text-black/80 dark:text-white/80">{title}</h2>
		</div>
		<button
			class="ml-auto lg:hidden text-black/50 dark:text-white/50 hover:text-black/80"
			on:click={closeDrawer}
			aria-label="关闭目录"
		>
			×
		</button>
	</div>
	<div class="flex-1 overflow-x-auto overflow-y-auto">
		<slot />
	</div>
	<div
		class={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-gradient-to-b from-[var(--primary)]/40 to-purple-400/40 ${
			dragging ? "opacity-100" : "opacity-40"
		}`}
		role="separator"
		aria-orientation="vertical"
		tabindex="0"
		on:mousedown={beginDrag}
		on:keydown={handleKeyResize}
		title="拖拽调整宽度"
	></div>
</aside>

{#if open}
	<div
		class="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-30"
		role="button"
		tabindex="0"
		on:click={closeDrawer}
		on:keydown={(ev) => (ev.key === "Enter" || ev.key === " " ? closeDrawer() : null)}
	></div>
{:else}
	<button
		class="fixed bottom-6 left-4 z-30 lg:hidden px-4 py-2 rounded-full bg-[var(--primary)] text-white shadow-lg"
		on:click={openDrawer}
	>
		左滑/点此打开目录
	</button>
{/if}
