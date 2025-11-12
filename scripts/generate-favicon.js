import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const avatarPath = join(__dirname, '../src/assets/images/avatar.jpg');
const faviconDir = join(__dirname, '../public/favicon');

// 确保 favicon 目录存在
if (!existsSync(faviconDir)) {
  mkdirSync(faviconDir, { recursive: true });
}

const sizes = [32, 128, 180, 192];

console.log('开始生成 favicon 文件...');
console.log(`源文件: ${avatarPath}`);

// 检查源文件是否存在
if (!existsSync(avatarPath)) {
  console.error(`错误: 找不到头像文件 ${avatarPath}`);
  process.exit(1);
}

// 为每个尺寸生成 favicon
for (const size of sizes) {
  const outputPath = join(faviconDir, `avatar-${size}.png`);
  
  try {
    await sharp(avatarPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ 已生成: avatar-${size}.png (${size}x${size})`);
  } catch (error) {
    console.error(`✗ 生成 avatar-${size}.png 失败:`, error.message);
  }
}

console.log('\n所有 favicon 文件生成完成！');
console.log('文件位置: public/favicon/');

