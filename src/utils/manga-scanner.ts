import * as fs from "node:fs";
import * as path from "node:path";

export interface MangaArticle {
	id: string;
	title: string;
	description: string;
	image: string;
	tags: string[];
	category: string;
	published: Date;
	slug: string;
}

export interface MangaCategory {
	id: string;
	title: string;
	description: string;
	cover: string;
	order: number;
	articles: MangaArticle[];
}

export async function scanMangaCategories(): Promise<MangaCategory[]> {
	const categoriesDir = path.join(process.cwd(), "src/content/manga-categories");
	const categories: MangaCategory[] = [];

	// 检查目录是否存在
	if (!fs.existsSync(categoriesDir)) {
		console.warn("漫画分类目录不存在:", categoriesDir);
		return [];
	}

	// 获取所有子文件夹
	const categoryFolders = fs
		.readdirSync(categoriesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	// 处理每个分类文件夹
	for (const folder of categoryFolders) {
		const categoryPath = path.join(categoriesDir, folder);
		const category = await processCategoryFolder(categoryPath, folder);

		if (category) {
			categories.push(category);
		}
	}

	// 按order排序
	return categories.sort((a, b) => a.order - b.order);
}

// 扫描独立的漫画文章（不在文件夹中）
export async function scanStandaloneManga(): Promise<MangaArticle[]> {
	const categoriesDir = path.join(process.cwd(), "src/content/manga-categories");
	const articles: MangaArticle[] = [];

	// 检查目录是否存在
	if (!fs.existsSync(categoriesDir)) {
		return [];
	}

	// 获取根目录下的所有markdown文件
	const files = fs.readdirSync(categoriesDir, { withFileTypes: true });
	
	for (const file of files) {
		// 只处理markdown文件
		if (!file.isDirectory() && file.name.endsWith(".md")) {
			const filePath = path.join(categoriesDir, file.name);
			const fileContent = fs.readFileSync(filePath, "utf-8");

			try {
				// 手动解析 front matter
				const frontMatterMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
				if (!frontMatterMatch) {
					continue;
				}

				const frontMatterText = frontMatterMatch[1];
				const data: Record<string, any> = {};

				// 解析 YAML 格式的 front matter
				const lines = frontMatterText.split("\n");
				for (const line of lines) {
					const match = line.match(/^(\w+):\s*(.+)$/);
					if (match) {
						const key = match[1];
						let value: any = match[2].trim();

						// 处理数组格式 ["tag1", "tag2"]
						if (value.startsWith("[") && value.endsWith("]")) {
							value = value
								.slice(1, -1)
								.split(",")
								.map((v) => v.trim().replace(/['"]/g, ""));
						}
						// 处理布尔值
						else if (value === "true") value = true;
						else if (value === "false") value = false;
						// 处理字符串，去掉引号
						else if (value.startsWith('"') || value.startsWith("'")) {
							value = value.slice(1, -1);
						}

						data[key] = value;
					}
				}

				// 跳过草稿
				if (data.draft === true) {
					continue;
				}

				const slug = `manga-standalone-${file.name.replace(".md", "")}`;

				articles.push({
					id: file.name.replace(".md", ""),
					title: data.title || file.name.replace(".md", ""),
					description: data.description || "",
					image: data.image || "",
					tags: data.tags || [],
					category: data.category || "漫画",
					published: data.published ? new Date(data.published) : new Date(),
					slug,
				});
			} catch (e) {
				console.error(`解析独立文章 ${file.name} 失败:`, e);
			}
		}
	}

	// 按发布日期倒序排序
	return articles.sort(
		(a, b) => b.published.getTime() - a.published.getTime(),
	);
}

async function processCategoryFolder(
	folderPath: string,
	folderName: string,
): Promise<MangaCategory | null> {
	// 检查必要文件
	const infoPath = path.join(folderPath, "info.json");

	if (!fs.existsSync(infoPath)) {
		console.warn(`漫画分类 ${folderName} 缺少 info.json 文件`);
		return null;
	}

	// 读取分类信息
	let info: Record<string, any>;
	try {
		const infoContent = fs.readFileSync(infoPath, "utf-8");
		info = JSON.parse(infoContent);
	} catch (e) {
		console.error(`漫画分类 ${folderName} 的 info.json 格式错误:`, e);
		return null;
	}

	// 扫描该分类下的所有markdown文章
	const articles = scanArticles(folderPath, folderName);

	// 如果没有封面，使用第一篇文章的图片
	let cover = info.cover || "";
	if (!cover && articles.length > 0 && articles[0].image) {
		cover = articles[0].image;
	}

	// 构建分类对象
	return {
		id: folderName,
		title: info.title || folderName,
		description: info.description || "",
		cover,
		order: info.order || 999,
		articles,
	};
}

function scanArticles(folderPath: string, categoryId: string): MangaArticle[] {
	const articles: MangaArticle[] = [];
	const files = fs.readdirSync(folderPath);

	for (const file of files) {
		// 只处理markdown文件
		if (!file.endsWith(".md")) {
			continue;
		}

		const filePath = path.join(folderPath, file);
		const fileContent = fs.readFileSync(filePath, "utf-8");

		try {
			// 手动解析 front matter
			const frontMatterMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
			if (!frontMatterMatch) {
				continue;
			}

			const frontMatterText = frontMatterMatch[1];
			const data: Record<string, any> = {};

			// 解析 YAML 格式的 front matter
			const lines = frontMatterText.split("\n");
			for (const line of lines) {
				const match = line.match(/^(\w+):\s*(.+)$/);
				if (match) {
					const key = match[1];
					let value: any = match[2].trim();

					// 处理数组格式 ["tag1", "tag2"]
					if (value.startsWith("[") && value.endsWith("]")) {
						value = value
							.slice(1, -1)
							.split(",")
							.map((v) => v.trim().replace(/['"]/g, ""));
					}
					// 处理布尔值
					else if (value === "true") value = true;
					else if (value === "false") value = false;
					// 处理字符串，去掉引号
					else if (value.startsWith('"') || value.startsWith("'")) {
						value = value.slice(1, -1);
					}

					data[key] = value;
				}
			}

			// 跳过草稿
			if (data.draft === true) {
				continue;
			}

			const slug = `manga-${categoryId}-${file.replace(".md", "")}`;

			articles.push({
				id: file.replace(".md", ""),
				title: data.title || file.replace(".md", ""),
				description: data.description || "",
				image: data.image || "",
				tags: data.tags || [],
				category: data.category || "漫画",
				published: data.published ? new Date(data.published) : new Date(),
				slug,
			});
		} catch (e) {
			console.error(`解析文章 ${file} 失败:`, e);
		}
	}

	// 按发布日期倒序排序
	return articles.sort(
		(a, b) => b.published.getTime() - a.published.getTime(),
	);
}

