// 收藏库书架配置
// 每个书架对应 src/content/library/<id>/ 一个文件夹，加书架 = 建文件夹 + 在这里加一项
export type Shelf = {
	id: string;
	title: string;
	description: string;
	icon: string;
	// 卡片封面比例：番剧海报用 3/4，网站截图用 16/10
	aspect: string;
	// 默认排序字段
	sort: "rating" | "date" | "title";
	// 卡片上显示哪些属性
	show: Array<"rating" | "tags" | "date" | "year" | "link">;
};

export const shelves: Shelf[] = [
	{
		id: "anime",
		title: "动漫",
		description: "看过、在看和打过分的番",
		icon: "material-symbols:movie-outline-rounded",
		aspect: "3 / 4",
		sort: "rating",
		show: ["rating", "tags", "date"],
	},
	{
		id: "sites",
		title: "资源站",
		description: "常用的轻小说站、机翻站和顺手的工具",
		icon: "material-symbols:bookmark-star-outline-rounded",
		aspect: "16 / 10",
		sort: "title",
		show: ["tags", "link"],
	},
];

export const getShelf = (id: string) => shelves.find((s) => s.id === id);
