import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";

export interface EntertainmentArticle {
	id: string;
	title: string;
	description: string;
	image: string;
	tags: string[];
	category: string;
	published: Date;
	slug: string;
	words: number;
}

export interface EntertainmentCategory {
	id: string;
	title: string;
	description: string;
	cover: string;
	order: number;
	articles: EntertainmentArticle[];
}

export async function scanEntertainmentCategories(): Promise<EntertainmentCategory[]> {
	const categoriesDir = path.join(
		process.cwd(),
		"src/content/entertainment-resources",
	);
	const categories: EntertainmentCategory[] = [];

	// 检查目录是否存在
	if (!fs.existsSync(categoriesDir)) {
		console.warn("娱乐资源分类目录不存在:", categoriesDir);
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

async function scanStandaloneEntertainment(): Promise<EntertainmentArticle[]> {
	const categoriesDir = path.join(
		process.cwd(),
		"src/content/entertainment-resources",
	);
	const articles: EntertainmentArticle[] = [];

	// 检查目录是否存在
	if (!fs.existsSync(categoriesDir)) {
		return [];
	}

	const files = fs.readdirSync(categoriesDir, { withFileTypes: true });

	for (const file of files) {
		// 只处理markdown文件
		if (!file.isDirectory() && file.name.endsWith(".md")) {
			const filePath = path.join(categoriesDir, file.name);
			const fileContent = fs.readFileSync(filePath, "utf-8");

			try {
				// 解析 front matter
				const frontMatterMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
				if (!frontMatterMatch) {
					continue;
				}

				const frontMatterText = frontMatterMatch[1];
				const data = yaml.load(frontMatterText) as Record<string, any>;

				// 跳过草稿
				if (data.draft === true) {
					continue;
				}

			const slug = `entertainment-standalone-${file.name.replace(".md", "")}`;

			// 计算正文字数（排除 front matter）
			const content = fileContent.replace(/^---\s*\n[\s\S]*?\n---/, "").trim();
			const words = content.length;

			articles.push({
				id: file.name.replace(".md", ""),
				title: data.title || file.name.replace(".md", ""),
				description: data.description || "",
				image: data.image || "",
				tags: data.tags || [],
				category: data.category || "娱乐资源",
				published: data.published ? new Date(data.published) : new Date(),
				slug,
				words,
			});
			} catch (e) {
				console.error(`解析独立文章 ${file.name} 失败:`, e);
			}
		}
	}

	// 按发布日期倒序排序
	return articles.sort((a, b) => b.published.getTime() - a.published.getTime());
}

async function processCategoryFolder(
	folderPath: string,
	folderName: string,
): Promise<EntertainmentCategory | null> {
	// 检查必要文件
	const infoPath = path.join(folderPath, "info.json");

	if (!fs.existsSync(infoPath)) {
		console.warn(`娱乐资源分类 ${folderName} 缺少 info.json 文件`);
		return null;
	}

	// 读取分类信息
	let info: Record<string, any>;
	try {
		const infoContent = fs.readFileSync(infoPath, "utf-8");
		info = JSON.parse(infoContent);
	} catch (e) {
		console.error(`娱乐资源分类 ${folderName} 的 info.json 格式错误:`, e);
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

function scanArticles(folderPath: string, categoryId: string): EntertainmentArticle[] {
	const articles: EntertainmentArticle[] = [];
	const files = fs.readdirSync(folderPath);

	for (const file of files) {
		// 只处理markdown文件
		if (!file.endsWith(".md")) {
			continue;
		}

		const filePath = path.join(folderPath, file);
		const fileContent = fs.readFileSync(filePath, "utf-8");

		try {
			// 解析 front matter
			const frontMatterMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
			if (!frontMatterMatch) {
				continue;
			}

			const frontMatterText = frontMatterMatch[1];
			const data = yaml.load(frontMatterText) as Record<string, any>;

			// 跳过草稿
			if (data.draft === true) {
				continue;
			}

			const slug = `${categoryId}/${file.replace(".md", "")}`;

			// 计算正文字数（排除 front matter）
			const content = fileContent.replace(/^---\s*\n[\s\S]*?\n---/, "").trim();
			const words = content.length;

			articles.push({
				id: file.replace(".md", ""),
				title: data.title || file.replace(".md", ""),
				description: data.description || "",
				image: data.image || "",
				tags: data.tags || [],
				category: data.category || "娱乐资源",
				published: data.published ? new Date(data.published) : new Date(),
				slug,
				words,
			});
		} catch (e) {
			console.error(`解析文章 ${file} 失败:`, e);
		}
	}

	// 按发布日期倒序排序
	return articles.sort((a, b) => b.published.getTime() - a.published.getTime());
}




