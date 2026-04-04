/**
 * 分类名称到英文 slug 的映射表
 * 用于解决中文URL的SEO问题
 */
export const CATEGORY_SLUG_MAP: Record<string, string> = {
	// 娱乐资源分类
	'小说资源': 'novels',
	'漫画资源': 'manga',
	'动漫资源': 'anime',
	'游戏资源': 'games',

	// 赚钱资源分类
	'网赚平台': 'earning-platforms',

	// 其他分类可以在这里添加
	'实用工具': 'tools',
	'实用信息': 'info',
};

/**
 * 将中文分类名转换为英文 slug
 * @param category 中文分类名
 * @returns 英文 slug，如果没有映射则返回原值
 */
export function getCategorySlug(category: string): string {
	return CATEGORY_SLUG_MAP[category] || category;
}

/**
 * 将英文 slug 转换回中文分类名
 * @param slug 英文 slug
 * @returns 中文分类名，如果没有映射则返回原值
 */
export function getCategoryFromSlug(slug: string): string {
	const entry = Object.entries(CATEGORY_SLUG_MAP).find(([_, value]) => value === slug);
	return entry ? entry[0] : slug;
}
