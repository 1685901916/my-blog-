import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const avatarPath = join(__dirname, '../src/assets/images/avatar.jpg');
const icoPath = join(__dirname, '../public/favicon.ico');

console.log('生成 favicon.ico 文件...');

try {
  await sharp(avatarPath)
    .resize(32, 32, {
      fit: 'cover',
      position: 'center'
    })
    .toFormat('ico')
    .toFile(icoPath);
  
  console.log('✓ 已生成: favicon.ico (32x32)');
} catch (error) {
  // 如果 sharp 不支持 ico，生成 PNG 然后重命名
  console.log('尝试生成 PNG 格式...');
  const pngPath = join(__dirname, '../public/favicon.png');
  await sharp(avatarPath)
    .resize(32, 32, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toFile(pngPath);
  console.log('✓ 已生成: favicon.png (32x32)');
  console.log('注意: 某些系统可能需要手动转换为 .ico 格式');
}

