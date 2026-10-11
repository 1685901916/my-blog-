// 内容设计系统（kit）的运行时
// 全站只加载这一个脚本，首次加载和 swup 换页后都会扫描页面、按 data-* 属性挂载功能：
//   data-split       标题逐字弹入
//   data-reveal      滚动到视口时模糊对焦入场（--i 控制错峰）
//   data-tabs        分段标签的滑动指示条
//   data-tilt        指针悬停时 3D 微倾斜
//   data-count       数字从 0 滚动到目标值
//   data-collection  Bases 式卡片视图：搜索 / 分类 + 标签筛选 / 排序 / 分组 / 卡片-列表切换

const reduceMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- 入场 ----------

let observer: IntersectionObserver | null = null;

function reveal(el: Element) {
	el.classList.add("is-in");
	if (el.hasAttribute("data-count")) countUp(el as HTMLElement);
	// 等最慢的那段 transition 结束后清理 filter
	const done = () => el.classList.add("is-done");
	const delay = Number.parseFloat(getComputedStyle(el).transitionDelay) || 0;
	const chars = el.querySelectorAll(".kit-char").length;
	window.setTimeout(done, 900 + delay * 1000 + chars * 38);
}

function getObserver() {
	if (observer) return observer;
	observer = new IntersectionObserver(
		(entries) => {
			// 同一批进入视口的元素按位置错峰，滚到哪里就从哪里开始依次出现
			const batch = entries
				.filter((e) => e.isIntersecting)
				.sort(
					(a, b) =>
						a.boundingClientRect.top - b.boundingClientRect.top ||
						a.boundingClientRect.left - b.boundingClientRect.left,
				);
			batch.forEach((e, i) => {
				observer?.unobserve(e.target);
				(e.target as HTMLElement).style.setProperty(
					"--i",
					String(Math.min(i, 10)),
				);
				reveal(e.target);
			});
		},
		{ rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
	);
	return observer;
}

function initReveal(root: ParentNode) {
	const io = getObserver();
	for (const el of root.querySelectorAll("[data-reveal]:not(.is-in)")) {
		io.observe(el);
	}
}

function initSplit(root: ParentNode) {
	root
		.querySelectorAll<HTMLElement>("[data-split]:not([data-split-ready])")
		.forEach((el) => {
			const text = el.textContent ?? "";
			el.setAttribute("aria-label", text);
			el.textContent = "";
			[...text].forEach((ch, i) => {
				const span = document.createElement("span");
				span.className = "kit-char";
				span.setAttribute("aria-hidden", "true");
				span.style.setProperty("--ci", String(i));
				span.textContent = ch;
				el.appendChild(span);
			});
			el.setAttribute("data-split-ready", "");
			getObserver().observe(el);
		});
}

// ---------- 数字滚动 ----------

function countUp(el: HTMLElement) {
	const target = Number(el.dataset.count);
	if (!Number.isFinite(target)) return;
	const decimals = Number(el.dataset.decimals ?? 0);
	const out = el.querySelector<HTMLElement>("[data-count-value]") ?? el;
	if (reduceMotion()) {
		out.textContent = target.toFixed(decimals);
		return;
	}
	const start = performance.now();
	const dur = 900;
	const tick = (now: number) => {
		const t = Math.min(1, (now - start) / dur);
		const eased = 1 - (1 - t) ** 4;
		out.textContent = (target * eased).toFixed(decimals);
		if (t < 1) requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}

// ---------- 分段标签指示条 ----------

function placeIndicator(tabs: HTMLElement, item: HTMLElement | null) {
	const ind = tabs.querySelector<HTMLElement>(".kit-tabs__ind");
	if (!ind || !item) return;
	ind.style.setProperty("--x", `${item.offsetLeft}px`);
	ind.style.setProperty("--w", `${item.offsetWidth}px`);
}

const activeTab = (tabs: HTMLElement) =>
	tabs.querySelector<HTMLElement>(
		'.kit-tabs__item[aria-current="page"], .kit-tabs__item[aria-pressed="true"]',
	);

function initTabs(root: ParentNode) {
	root
		.querySelectorAll<HTMLElement>("[data-tabs]:not([data-tabs-ready])")
		.forEach((tabs) => {
			tabs.setAttribute("data-tabs-ready", "");
			if (!tabs.querySelector(".kit-tabs__ind")) {
				const ind = document.createElement("span");
				ind.className = "kit-tabs__ind";
				tabs.prepend(ind);
			}
			placeIndicator(tabs, activeTab(tabs));
			requestAnimationFrame(() => tabs.classList.add("is-ready"));
			// 点链接时先把指示条滑过去，换页动画和它同时进行
			tabs.addEventListener("click", (ev) => {
				const item = (ev.target as HTMLElement).closest<HTMLElement>(
					".kit-tabs__item",
				);
				if (item) placeIndicator(tabs, item);
			});
			new ResizeObserver(() => placeIndicator(tabs, activeTab(tabs))).observe(
				tabs,
			);
		});
}

// ---------- 3D 微倾斜 ----------

function initTilt(root: ParentNode) {
	if (!window.matchMedia("(pointer: fine)").matches) return;
	root
		.querySelectorAll<HTMLElement>("[data-tilt]:not([data-tilt-ready])")
		.forEach((el) => {
			el.setAttribute("data-tilt-ready", "");
			const max = Number(el.dataset.tilt || 5);
			el.addEventListener("pointermove", (e) => {
				if (reduceMotion()) return;
				const r = el.getBoundingClientRect();
				const px = (e.clientX - r.left) / r.width - 0.5;
				const py = (e.clientY - r.top) / r.height - 0.5;
				el.classList.add("is-tilting");
				el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
				el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
				el.style.setProperty("--ty", "-4px");
			});
			el.addEventListener("pointerleave", () => {
				el.classList.remove("is-tilting");
				el.style.setProperty("--rx", "0deg");
				el.style.setProperty("--ry", "0deg");
				el.style.setProperty("--ty", "0");
			});
		});
}

// ---------- 图片淡入 ----------

function initImages(root: ParentNode) {
	root
		.querySelectorAll<HTMLImageElement>("img[data-loading]")
		.forEach((img) => {
			const done = () => img.removeAttribute("data-loading");
			if (img.complete && img.naturalWidth > 0) done();
			else {
				img.addEventListener("load", done, { once: true });
				img.addEventListener(
					"error",
					() => {
						// 加载失败就露出字体封面
						img.remove();
					},
					{ once: true },
				);
			}
		});
}

// ---------- Bases 式卡片视图 ----------

type State = {
	q: string;
	kind: string;
	cat: string;
	tag: string;
	sort: string;
	group: string;
	view: string;
};

const collator = new Intl.Collator("zh-Hans-CN", { numeric: true });

function withViewTransition(
	scope: HTMLElement,
	update: () => void,
	nameItems: HTMLElement[],
) {
	const doc = document as Document & {
		startViewTransition?: (cb: () => void) => { finished: Promise<void> };
	};
	if (!doc.startViewTransition || reduceMotion()) {
		update();
		return;
	}
	const prefix = scope.dataset.vtPrefix ?? "kit";
	nameItems.forEach((el, i) => {
		el.style.viewTransitionName = `${prefix}-${i}`;
	});
	document.documentElement.classList.add("kit-vt");
	const vt = doc.startViewTransition(update);
	vt.finished.finally(() => {
		document.documentElement.classList.remove("kit-vt");
		nameItems.forEach((el) => {
			el.style.viewTransitionName = "";
		});
	});
}

let collectionCount = 0;

function initCollection(scope: HTMLElement) {
	scope.setAttribute("data-collection-ready", "");
	scope.dataset.vtPrefix = `kit${collectionCount++}`;
	const grid = scope.querySelector<HTMLElement>("[data-items]");
	if (!grid) return;
	const items = [...grid.querySelectorAll<HTMLElement>("[data-item]")];
	const countEl = scope.querySelector<HTMLElement>("[data-count-out]");
	const search = scope.querySelector<HTMLInputElement>("[data-search]");
	const sortSel = scope.querySelector<HTMLSelectElement>("[data-sort]");
	const groupSel = scope.querySelector<HTMLSelectElement>("[data-group]");
	const filterBtns = [
		...scope.querySelectorAll<HTMLButtonElement>("[data-filter]"),
	];
	// 分类筛选（data-filter-cat）和标签筛选（data-filter）互相独立，可以叠加
	const catBtns = [
		...scope.querySelectorAll<HTMLButtonElement>("[data-filter-cat]"),
	];
	const viewBtns = [
		...scope.querySelectorAll<HTMLButtonElement>("[data-view]"),
	];
	// 类型标签（data-filter-kind）：全部笔记里切文章 / 作品 / 动漫…；
	// 分类和标签按钮带 data-scope 时，只在对应类型下出现（没选类型时显示带 data-scope-default 的那一组）
	const kindBtns = [
		...scope.querySelectorAll<HTMLButtonElement>("[data-filter-kind]"),
	];
	const scoped = [...scope.querySelectorAll<HTMLElement>("[data-scope]")];
	const activeTagEls = [
		...scope.querySelectorAll<HTMLElement>("[data-active-tag]"),
	];
	const tagOuts = [...scope.querySelectorAll<HTMLElement>("[data-tag-out]")];
	const storeKey = `kit-view:${location.pathname}`;
	const defaultSort = scope.dataset.defaultSort ?? "date";
	const defaultGroup = scope.dataset.defaultGroup ?? "";

	// 初始状态：URL 参数 > 本地记住的视图 > 默认值
	const params = new URLSearchParams(location.search);
	let savedView = "";
	try {
		savedView = localStorage.getItem(storeKey) ?? "";
	} catch {}
	const state: State = {
		q: params.get("q") ?? "",
		kind: params.get("type") ?? "",
		cat: params.get("cat") ?? "",
		tag: params.get("tag") ?? "",
		sort: params.get("sort") ?? defaultSort,
		group: params.has("group")
			? (params.get("group") ?? "").replace(/^none$/, "")
			: defaultGroup,
		view: params.get("view") ?? (savedView || scope.dataset.defaultView || "cards"),
	};

	const key = (el: HTMLElement, k: string) => el.dataset[k] ?? "";
	// 书架分组按书架配置里的顺序排
	const shelfOrder = new Map(
		items.map((el) => [key(el, "shelf"), Number(key(el, "shelfOrder"))]),
	);
	// 按分类分组时，卡片带 data-cat-order 就按它排（比如全部笔记里：文章、作品、动漫…）
	const catOrder = new Map(
		items
			.filter((el) => el.dataset.catOrder)
			.map((el) => [key(el, "cat"), Number(key(el, "catOrder"))]),
	);
	const kindOrder = new Map(
		items.map((el) => [key(el, "kind"), Number(key(el, "kindOrder"))]),
	);

	function sortValue(a: HTMLElement, b: HTMLElement) {
		switch (state.sort) {
			case "rating":
				return (
					Number(key(b, "rating") || -1) - Number(key(a, "rating") || -1) ||
					collator.compare(key(a, "title"), key(b, "title"))
				);
			case "title":
				return collator.compare(key(a, "title"), key(b, "title"));
			default:
				return (
					key(b, "date").localeCompare(key(a, "date")) ||
					collator.compare(key(a, "title"), key(b, "title"))
				);
		}
	}

	const RATING_BANDS = ["神作 9.5+", "佳作 9+", "其他", "未评分"];

	function groupOf(el: HTMLElement) {
		// 已经选了某个类型时，按类型分组就没意义了，直接不分组
		if (state.group === "kind") return state.kind ? "" : key(el, "kind");
		if (state.group === "shelf") return key(el, "shelf");
		if (state.group === "cat") return key(el, "cat") || "未分类";
		if (state.group === "year") return key(el, "date").slice(0, 4) || "未记录";
		if (state.group === "tag") return key(el, "tags").split("|")[0] || "无标签";
		if (state.group === "rating") {
			const r = Number(key(el, "rating"));
			if (!r) return RATING_BANDS[3];
			return r >= 9.5
				? RATING_BANDS[0]
				: r >= 9
					? RATING_BANDS[1]
					: RATING_BANDS[2];
		}
		return "";
	}

	// 年份倒序、评分段从高到低，其余按文字顺序；「未记录 / 无标签」垫底
	function compareGroups(ga: string, gb: string) {
		if (state.group === "rating") {
			return RATING_BANDS.indexOf(ga) - RATING_BANDS.indexOf(gb);
		}
		if (state.group === "shelf") {
			return (shelfOrder.get(ga) ?? 0) - (shelfOrder.get(gb) ?? 0);
		}
		if (state.group === "kind") {
			return (kindOrder.get(ga) ?? 0) - (kindOrder.get(gb) ?? 0);
		}
		if (state.group === "cat" && catOrder.size > 0) {
			return (catOrder.get(ga) ?? 99) - (catOrder.get(gb) ?? 99);
		}
		const tail = /^(未|无)/;
		if (tail.test(ga) !== tail.test(gb)) return tail.test(ga) ? 1 : -1;
		return state.group === "year"
			? gb.localeCompare(ga)
			: collator.compare(ga, gb);
	}

	function syncControls() {
		// 当前类型 / 分组写到容器上，卡片可以按它调整（比如分组标题已经写了类型，就不再显示类型角标）
		scope.dataset.activeKind = state.kind;
		scope.dataset.activeGroup = state.group;
		if (search && search.value !== state.q) search.value = state.q;
		if (sortSel) sortSel.value = state.sort;
		if (groupSel) groupSel.value = state.group;
		for (const b of filterBtns) {
			b.setAttribute("aria-pressed", String(b.dataset.filter === state.tag));
		}
		for (const b of catBtns) {
			b.setAttribute("aria-pressed", String(b.dataset.filterCat === state.cat));
		}
		for (const b of viewBtns) {
			b.setAttribute("aria-pressed", String(b.dataset.view === state.view));
		}
		for (const b of kindBtns) {
			b.setAttribute(
				"aria-pressed",
				String((b.dataset.filterKind ?? "") === state.kind),
			);
		}
		for (const el of scoped) {
			el.hidden = state.kind
				? el.dataset.scope !== state.kind
				: !el.hasAttribute("data-scope-default");
		}
		// 当前标签不在可见的标签按钮里（比如从阅读页点标签进来），单独显示一个可以取消的标签
		const tagShown = filterBtns.some(
			(b) => b.dataset.filter === state.tag && !b.hidden,
		);
		for (const el of activeTagEls) el.hidden = !state.tag || tagShown;
		for (const el of tagOuts) el.textContent = state.tag;
		for (const b of [viewBtns[0], kindBtns[0]]) {
			const tabs = b?.closest<HTMLElement>("[data-tabs]");
			if (tabs) placeIndicator(tabs, activeTab(tabs));
		}
	}

	function writeUrl() {
		const p = new URLSearchParams(location.search);
		const set = (k: string, v: string, def: string) =>
			v && v !== def ? p.set(k, v) : p.delete(k);
		set("q", state.q, "");
		set("type", state.kind, "");
		set("cat", state.cat, "");
		set("tag", state.tag, "");
		set("sort", state.sort, defaultSort);
		// 默认有分组时，「不分组」要显式写成 none，否则刷新会回到默认分组
		set("group", state.group || (defaultGroup ? "none" : ""), defaultGroup);
		const qs = p.toString();
		history.replaceState(
			history.state,
			"",
			`${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`,
		);
		try {
			localStorage.setItem(storeKey, state.view);
		} catch {}
	}

	function apply() {
		const q = state.q.trim().toLowerCase();
		const visible = items
			.filter((el) => {
				const tags = key(el, "tags").split("|");
				if (state.kind && key(el, "kind") !== state.kind) return false;
				if (state.cat && key(el, "cat") !== state.cat) return false;
				if (state.tag && !tags.includes(state.tag)) return false;
				if (!q) return true;
				return `${key(el, "title")} ${key(el, "cat")} ${tags.join(" ")}`
					.toLowerCase()
					.includes(q);
			})
			.sort((a, b) => {
				if (state.group) {
					const ga = groupOf(a);
					const gb = groupOf(b);
					if (ga !== gb) return compareGroups(ga, gb);
				}
				// 精选卡片（比如最新作品）始终排在最前
				const fa = a.hasAttribute("data-featured");
				if (fa !== b.hasAttribute("data-featured")) return fa ? -1 : 1;
				return sortValue(a, b);
			});

		for (const n of grid.querySelectorAll(".kit-group-head, .kit-empty")) {
			n.remove();
		}
		const shown = new Set(visible);
		for (const el of items) el.hidden = !shown.has(el);

		let lastGroup: string | null = null;
		const counts = new Map<string, number>();
		if (state.group) {
			for (const el of visible) {
				const g = groupOf(el);
				counts.set(g, (counts.get(g) ?? 0) + 1);
			}
		}
		visible.forEach((el) => {
			if (state.group) {
				const g = groupOf(el);
				if (g && g !== lastGroup) {
					const head = document.createElement("div");
					head.className = "kit-group-head";
					head.innerHTML = `<span></span><small>${counts.get(g)}</small>`;
					(head.firstChild as HTMLElement).textContent = g;
					grid.appendChild(head);
					lastGroup = g;
				}
			}
			grid.appendChild(el);
		});
		if (!visible.length) {
			const empty = document.createElement("div");
			empty.className = "kit-empty";
			empty.textContent = "没有符合条件的条目，换个关键词或标签试试";
			grid.appendChild(empty);
		}

		grid.classList.toggle("is-list", state.view === "list");
		if (countEl) countEl.textContent = String(visible.length);
		syncControls();
	}

	function update(patch: Partial<State>, animate = true) {
		Object.assign(state, patch);
		writeUrl();
		if (!animate) return apply();
		withViewTransition(
			scope,
			apply,
			items.filter((el) => !el.hidden),
		);
	}

	let typing = 0;
	search?.addEventListener("input", () => {
		window.clearTimeout(typing);
		typing = window.setTimeout(() => update({ q: search.value }), 160);
	});
	sortSel?.addEventListener("change", () => update({ sort: sortSel.value }));
	groupSel?.addEventListener("change", () => update({ group: groupSel.value }));
	// 左栏树里的筛选项是链接（没有脚本时也能跳转），这里拦下来原地筛选
	for (const b of filterBtns) {
		b.addEventListener("click", (ev) => {
			ev.preventDefault();
			update({
				tag: state.tag === b.dataset.filter ? "" : (b.dataset.filter ?? ""),
			});
		});
	}
	for (const b of catBtns) {
		b.addEventListener("click", (ev) => {
			ev.preventDefault();
			update({
				cat:
					state.cat === b.dataset.filterCat ? "" : (b.dataset.filterCat ?? ""),
			});
		});
	}
	for (const b of viewBtns) {
		b.addEventListener("click", () =>
			update({ view: b.dataset.view ?? "cards" }),
		);
	}
	for (const el of activeTagEls) {
		el.addEventListener("click", () => update({ tag: "" }));
	}
	// 换类型时清掉分类和标签，它们只属于原来那个类型
	for (const b of kindBtns) {
		b.addEventListener("click", () =>
			update({ kind: b.dataset.filterKind ?? "", cat: "", tag: "" }),
		);
	}
	// 卡片上的标签：点一下只看这个标签，再点一下取消
	grid.addEventListener("click", (ev) => {
		const btn = (ev.target as HTMLElement).closest<HTMLElement>(
			"[data-tag-filter]",
		);
		if (!btn) return;
		ev.preventDefault();
		const tag = btn.dataset.tagFilter ?? "";
		update({ tag: state.tag === tag ? "" : tag });
		scope.querySelector("[data-items]")?.scrollIntoView({
			behavior: reduceMotion() ? "auto" : "smooth",
			block: "nearest",
		});
	});

	apply();
}

function initCollections(root: ParentNode) {
	root
		.querySelectorAll<HTMLElement>(
			"[data-collection]:not([data-collection-ready])",
		)
		.forEach(initCollection);
}

// ---------- 左栏目录：滚动时高亮当前小节 ----------

let tocCleanup: (() => void) | null = null;

function initToc(root: ParentNode) {
	tocCleanup?.();
	tocCleanup = null;
	const nav = root.querySelector<HTMLElement>("[data-toc]");
	if (!nav) return;
	const links = [
		...nav.querySelectorAll<HTMLAnchorElement>("[data-toc-target]"),
	];
	const targets = links
		.map((a) => document.getElementById(a.dataset.tocTarget ?? ""))
		.filter((el): el is HTMLElement => !!el);
	if (!targets.length) return;

	let frame = 0;
	const update = () => {
		frame = 0;
		// 视口顶部往下 120px 以内最后一个标题算「当前」
		let current = targets[0];
		for (const t of targets) {
			if (t.getBoundingClientRect().top - 120 <= 0) current = t;
			else break;
		}
		for (const a of links) {
			a.classList.toggle("is-active", a.dataset.tocTarget === current.id);
		}
	};
	const onScroll = () => {
		if (!frame) frame = requestAnimationFrame(update);
	};
	// 主题用 OverlayScrollbars，滚动事件不一定在 window 上，所以用捕获阶段统一监听
	document.addEventListener("scroll", onScroll, {
		capture: true,
		passive: true,
	});
	update();
	tocCleanup = () =>
		document.removeEventListener("scroll", onScroll, { capture: true });
}

// ---------- 启动 ----------

function init() {
	initSplit(document);
	initCollections(document);
	initTabs(document);
	initTilt(document);
	initImages(document);
	initReveal(document);
	initToc(document);
}

// 不在卡片视图里的卡片（详情页、月记）：点标签跳到对应列表的筛选结果
document.addEventListener("click", (ev) => {
	const btn = (ev.target as HTMLElement).closest<HTMLElement>(
		"[data-tag-href]",
	);
	if (!btn || btn.closest("[data-collection]")) return;
	ev.preventDefault();
	const href = btn.dataset.tagHref ?? "/";
	const swup = (window as Window & { swup?: { navigate: (u: string) => void } })
		.swup;
	if (swup) swup.navigate(href);
	else location.href = href;
});

// 按 / 直接聚焦卡片视图的搜索框（正在输入时不拦）
document.addEventListener("keydown", (ev) => {
	if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
	const t = ev.target as HTMLElement;
	if (t.closest("input, textarea, select, [contenteditable]")) return;
	const input = document.querySelector<HTMLInputElement>(
		"[data-collection] [data-search]",
	);
	if (!input) return;
	ev.preventDefault();
	input.focus({ preventScroll: true });
	input.scrollIntoView({ block: "nearest" });
});

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
document.addEventListener("swup:page:view", init);
