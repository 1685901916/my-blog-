// Notion 式彩色标签：同一个名字永远是同一种颜色（按字符算个简单哈希，落在 9 种颜色里）
export function tagColor(name: string) {
	let h = 0;
	for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
	return (h % 8) + 1;
}
