<script lang="ts">
import { onDestroy, onMount } from "svelte";

export type Meta = {
	title: string;
	excerpt?: string;
	tags?: string[];
	props?: Record<string, string>;
	slug?: string;
};

export let metaMap: Record<string, Meta> = {};
export let rootSelector = "article";

let hover: {
	x: number;
	y: number;
	slug: string;
	meta: Meta;
} | null = null;

let anchors: HTMLAnchorElement[] = [];
let previewWidth = 400;
let previewHeight = 300;
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let startWidth = 0;
let startHeight = 0;

onMount(() => {
	const root = document.querySelector(rootSelector);
	if (!root) return;
	anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));

	const handleEnter = (ev: MouseEvent) => {
		const target = ev.currentTarget as HTMLAnchorElement;
		const originalHref = target.getAttribute("href") ?? "";

		console.log("=== 悬停链接调试 ===");
		console.log("1. 原始 href:", originalHref);

		let slug = originalHref.replace(/^\//, "").replace(/\/$/, "").split("#")[0];

		console.log("2. 移除前后斜杠和锚点后:", slug);

		// Remove /posts/ prefix if exists
		slug = slug.replace(/^posts\//, "");

		console.log("3. 移除 /posts/ 前缀后:", slug);
		console.log("4. metaMap 中的所有键:", Object.keys(metaMap));

		const meta = metaMap[slug];
		console.log("5. 查找到的 meta:", meta);

		if (!meta) {
			console.log("❌ 未找到匹配的文章元数据");
			return;
		}

		console.log("6. 设置 hover 状态:", { slug, title: meta.title });

		// 获取链接元素的位置
		const rect = target.getBoundingClientRect();

		// 默认显示在链接下方，左对齐
		let x = rect.left;
		let y = rect.bottom + 8; // 链接下方 8px

		// 检查右侧空间是否足够
		const rightSpace = window.innerWidth - rect.left;
		if (rightSpace < previewWidth + 40) {
			// 右侧空间不足，尝试右对齐到链接右边
			x = rect.right - previewWidth;
			// 如果还是超出左边界，就贴着右边界显示
			if (x < 20) {
				x = window.innerWidth - previewWidth - 20;
			}
		}

		// 检查下方空间是否足够
		const bottomSpace = window.innerHeight - rect.bottom;
		if (bottomSpace < previewHeight + 40) {
			// 下方空间不足，显示在链接上方
			y = rect.top - previewHeight - 8;
		}

		// 最终确保不会超出屏幕边界
		x = Math.max(20, Math.min(x, window.innerWidth - previewWidth - 20));
		y = Math.max(20, Math.min(y, window.innerHeight - previewHeight - 20));

		console.log("7. 最终位置:", {
			x,
			y,
			linkLeft: rect.left,
			linkRight: rect.right,
			windowWidth: window.innerWidth,
			previewWidth,
		});

		hover = { x, y, slug, meta };
	};

	const handleMove = () => {
		// 预览窗口不再跟随鼠标移动
		return;
	};

	const handleLeave = () => {
		if (!isResizing) {
			hover = null;
		}
	};

	anchors.forEach((a) => {
		a.addEventListener("mouseenter", handleEnter);
		a.addEventListener("mousemove", handleMove);
		a.addEventListener("mouseleave", handleLeave);
	});

	onDestroy(() => {
		anchors.forEach((a) => {
			a.removeEventListener("mouseenter", handleEnter);
			a.removeEventListener("mousemove", handleMove);
			a.removeEventListener("mouseleave", handleLeave);
		});
	});
});

function startResize(e: MouseEvent) {
	isResizing = true;
	resizeStartX = e.clientX;
	resizeStartY = e.clientY;
	startWidth = previewWidth;
	startHeight = previewHeight;
	e.preventDefault();

	const handleMouseMove = (e: MouseEvent) => {
		if (!isResizing) return;
		const deltaX = e.clientX - resizeStartX;
		const deltaY = e.clientY - resizeStartY;
		previewWidth = Math.max(300, Math.min(800, startWidth + deltaX));
		previewHeight = Math.max(200, Math.min(600, startHeight + deltaY));
	};

	const handleMouseUp = () => {
		isResizing = false;
		document.removeEventListener("mousemove", handleMouseMove);
		document.removeEventListener("mouseup", handleMouseUp);
	};

	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("mouseup", handleMouseUp);
}

function closePreview() {
	hover = null;
}
</script>

{#if hover}
	<div
		class="fixed z-[9999] rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
		style={`left:${hover.x}px; top:${hover.y}px; width:${previewWidth}px; height:${previewHeight}px;`}
		on:mouseenter={() => {
			/* Keep preview open when hovering over it */
		}}
		on:mouseleave={closePreview}
	>
		<!-- Header -->
		<div
			class="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
		>
			<div class="flex items-center gap-2 flex-1 min-w-0">
				<svg
					class="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
					/>
				</svg>
				<span class="text-xs font-medium text-gray-600 dark:text-gray-300 truncate"
					>双链预览</span
				>
			</div>
			<button
				on:click={closePreview}
				class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
			>
				<svg
					class="w-4 h-4 text-gray-500 dark:text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto px-4 py-3">
			<h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
				{hover.meta.title}
			</h3>

			{#if hover.meta.excerpt}
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
					{hover.meta.excerpt}
				</p>
			{/if}

			{#if hover.meta.tags?.length}
				<div class="flex flex-wrap gap-1.5 mb-3">
					{#each hover.meta.tags as tag}
						<span
							class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
						>
							#{tag}
						</span>
					{/each}
				</div>
			{/if}

			<div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
				<a
					href="/posts/{hover.slug}/"
					class="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
				>
					<span>打开文章</span>
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</a>
			</div>
		</div>

		<!-- Resize Handle -->
		<div
			class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
			on:mousedown={startResize}
		>
			<svg
				class="w-4 h-4 text-gray-400 dark:text-gray-600"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path d="M22 22L2 2M22 16L16 22M22 10L10 22M22 4L4 22" stroke="currentColor" stroke-width="2" />
			</svg>
		</div>
	</div>
{/if}

<style>
	::-webkit-scrollbar {
		width: 6px;
	}

	::-webkit-scrollbar-track {
		background: transparent;
	}

	::-webkit-scrollbar-thumb {
		background: rgba(156, 163, 175, 0.3);
		border-radius: 3px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: rgba(156, 163, 175, 0.5);
	}

	.dark ::-webkit-scrollbar-thumb {
		background: rgba(75, 85, 99, 0.3);
	}

	.dark ::-webkit-scrollbar-thumb:hover {
		background: rgba(75, 85, 99, 0.5);
	}
</style>
