#!/bin/bash
# 宝塔面板博客部署脚本
# 服务器: 156.225.28.187
# 域名: ayano29.cn

echo "================================================"
echo "开始部署博客到宝塔面板"
echo "================================================"

# 第一步：检查环境
echo ""
echo "第一步：检查当前环境..."
echo "系统信息:"
uname -a
echo ""
echo "检查 Node.js:"
node --version || echo "❌ Node.js 未安装"
npm --version || echo "❌ npm 未安装"
echo ""
echo "检查 Git:"
git --version || echo "❌ Git 未安装"
echo ""

# 如果 Node.js 未安装，安装它
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 如果 Git 未安装，安装它
if ! command -v git &> /dev/null; then
    echo "正在安装 Git..."
    apt-get update
    apt-get install -y git
fi

echo ""
echo "================================================"
echo "第二步：克隆 GitHub 仓库"
echo "================================================"

# 创建项目目录
mkdir -p /www/blog-source
cd /www/blog-source

# 如果已存在，先删除
if [ -d ".git" ]; then
    echo "检测到已存在的仓库，正在更新..."
    git pull origin main
else
    echo "正在克隆仓库..."
    git clone https://github.com/1685901916/my-blog-.git .
fi

echo ""
echo "================================================"
echo "第三步：安装依赖"
echo "================================================"

# 使用国内镜像加速
npm config set registry https://registry.npmmirror.com

# 安装依赖
echo "正在安装依赖（可能需要几分钟）..."
npm install

echo ""
echo "================================================"
echo "第四步：构建项目"
echo "================================================"

# 构建项目
echo "正在构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo ""
echo "================================================"
echo "第五步：部署到网站目录"
echo "================================================"

# 网站目录
WEB_DIR="/www/wwwroot/ayano29.cn"

# 备份当前版本
if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR)" ]; then
    echo "正在备份当前版本..."
    BACKUP_DIR="/www/backup/blog-$(date +%Y%m%d-%H%M%S)"
    mkdir -p /www/backup
    cp -r $WEB_DIR $BACKUP_DIR
    echo "✅ 已备份到: $BACKUP_DIR"
fi

# 清空网站目录并部署
echo "正在部署到网站目录..."
rm -rf $WEB_DIR/*
cp -r /www/blog-source/dist/* $WEB_DIR/

# 设置权限
chmod -R 755 $WEB_DIR
chown -R www:www $WEB_DIR

echo ""
echo "================================================"
echo "第六步：创建自动更新脚本"
echo "================================================"

# 创建更新脚本
cat > /www/blog-source/update.sh << 'EOF'
#!/bin/bash
echo "🔄 开始更新博客..."
cd /www/blog-source
git pull origin main
npm install
npm run build
rm -rf /www/wwwroot/ayano29.cn/*
cp -r dist/* /www/wwwroot/ayano29.cn/
chmod -R 755 /www/wwwroot/ayano29.cn
chown -R www:www /www/wwwroot/ayano29.cn
echo "✅ 更新完成！"
EOF

chmod +x /www/blog-source/update.sh

echo ""
echo "================================================"
echo "✅ 部署完成！"
echo "================================================"
echo ""
echo "📌 部署信息："
echo "   - 项目目录: /www/blog-source"
echo "   - 网站目录: /www/wwwroot/ayano29.cn"
echo "   - 更新脚本: /www/blog-source/update.sh"
echo ""
echo "🌐 访问网站："
echo "   http://156.225.28.187"
echo "   http://ayano29.cn"
echo ""
echo "🔄 后续更新方法："
echo "   1. 本地修改文章并推送到 GitHub"
echo "   2. SSH 到服务器运行: /www/blog-source/update.sh"
echo ""
echo "================================================"







