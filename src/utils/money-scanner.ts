import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";
import { getCategorySlug } from "../constants/category-slugs";

export interface MoneyArticle {
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

export interface MoneyCategory {
	id: string;
	title: string;
	description: string;
	cover: string;
	order: number;
	hidden?: boolean;
	articles: MoneyArticle[];
}

export async function scanMoneyCategories(): Promise<MoneyCategory[]> {
	const categoriesDir = path.join(
		process.cwd(),
		"src/content/money-resources",
	);
	const categories: MoneyCategory[] = [];

	if (!fs.existsSync(categoriesDir)) {
		console.warn("赚钱资源分类目录不存在:", categoriesDir);
		return [];
	}

	const categoryFolders = fs
		.readdirSync(categoriesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	for (const folder of categoryFolders) {
		const categoryPath = path.join(categoriesDir, folder);
		const category = await processCategoryFolder(categoryPath, folder);

		if (category && !category.hidden) {
			categories.push(category);
		}
	}

	return categories.sort((a, b) => a.order - b.order);
}

async function processCategoryFolder(
	folderPath: string,
	folderName: string,
): Promise<MoneyCategory | null> {
	const infoPath = path.join(folderPath, "info.json");

	if (!fs.existsSync(infoPath)) {
		console.warn(`赚钱资源分类 ${folderName} 缺少 info.json 文件`);
		return null;
	}

	let info: Record<string, any>;
	try {
		const infoContent = fs.readFileSync(infoPath, "utf-8");
		info = JSON.parse(infoContent);
	} catch (e) {
		console.error(`赚钱资源分类 ${folderName} 的 info.json 格式错误:`, e);
		return null;
	}

	const articles = scanArticles(folderPath, folderName);

	let cover = info.cover || "";
	if (!cover && articles.length > 0 && articles[0].image) {
		cover = articles[0].image;
	}

	const categorySlug = getCategorySlug(folderName);
	return {
		id: categorySlug,
		title: info.title || folderName,
		description: info.description || "",
		cover,
		order: info.order || 999,
		hidden: info.hidden === true,
		articles,
	};
}

function scanArticles(
	folderPath: string,
	categoryId: string,
): MoneyArticle[] {
	const articles: MoneyArticle[] = [];
	const files = fs.readdirSync(folderPath);

	for (const file of files) {
		if (!file.endsWith(".md")) {
			continue;
		}

		const filePath = path.join(folderPath, file);
		const fileContent = fs.readFileSync(filePath, "utf-8");

		try {
			const frontMatterMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
			if (!frontMatterMatch) {
				continue;
			}

			const frontMatterText = frontMatterMatch[1];
			const data = yaml.load(frontMatterText) as Record<string, any>;

			if (data.draft === true) {
				continue;
			}

			const categorySlug = getCategorySlug(categoryId);
			const articleSlug = data.customSlug || file.replace(".md", "");
			const slug = `${categorySlug}/${articleSlug}`;

			const content = fileContent.replace(/^---\s*\n[\s\S]*?\n---/, "").trim();
			const words = content.length;

			articles.push({
				id: file.replace(".md", ""),
				title: data.title || file.replace(".md", ""),
				description: data.description || "",
				image: data.image || "",
				tags: data.tags || [],
				category: data.category || "赚钱",
				published: data.published ? new Date(data.published) : new Date(),
				slug,
				words,
			});
		} catch (e) {
			console.error(`解析文章 ${file} 失败:`, e);
		}
	}

	return articles.sort((a, b) => b.published.getTime() - a.published.getTime());
}
