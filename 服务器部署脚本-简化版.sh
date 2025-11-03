#!/bin/bash
# 服务器端简化部署脚本
# 使用方法：
# 1. 上传此脚本和 dist.zip 到服务器
# 2. chmod +x 服务器部署脚本-简化版.sh
# 3. sudo ./服务器部署脚本-简化版.sh

echo "============================================"
echo "        博客部署脚本（简化版）"
echo "============================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 询问网站目录
echo -e "${YELLOW}请输入网站目录路径（例如：/var/www/html/blog）：${NC}"
read -e WEB_DIR

if [ -z "$WEB_DIR" ]; then
    echo -e "${RED}❌ 错误：网站目录不能为空${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}网站目录：${NC}$WEB_DIR"
echo ""

# 确认操作
echo -e "${YELLOW}⚠️  警告：此操作将删除 $WEB_DIR 中的所有文件！${NC}"
echo -e "${YELLOW}是否继续？(yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "============================================"
echo ""

# 检查 dist.zip 是否存在
if [ ! -f "dist.zip" ]; then
    echo -e "${RED}❌ 错误：当前目录没有找到 dist.zip 文件${NC}"
    echo ""
    echo "请确保："
    echo "  1. dist.zip 和此脚本在同一目录"
    echo "  2. 或者将 dist.zip 复制到当前目录"
    echo ""
    exit 1
fi

# 创建网站目录
echo -e "${GREEN}📁 创建网站目录...${NC}"
mkdir -p "$WEB_DIR"

# 备份旧版本
if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR)" ]; then
    echo -e "${GREEN}📦 备份当前版本...${NC}"
    BACKUP_DIR="$WEB_DIR.backup-$(date +%Y%m%d-%H%M%S)"
    cp -r "$WEB_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}✅ 已备份到: $BACKUP_DIR${NC}"
fi

# 清空网站目录
echo -e "${GREEN}🧹 清空网站目录...${NC}"
rm -rf "$WEB_DIR"/*

# 解压文件
echo -e "${GREEN}📦 解压文件...${NC}"
unzip -q -o dist.zip -d "$WEB_DIR"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 解压失败！${NC}"
    
    # 尝试恢复备份
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}正在恢复备份...${NC}"
        rm -rf "$WEB_DIR"/*
        cp -r "$BACKUP_DIR"/* "$WEB_DIR"/
        echo -e "${YELLOW}已恢复到备份版本${NC}"
    fi
    
    exit 1
fi

# 设置权限
echo -e "${GREEN}🔐 设置文件权限...${NC}"
chmod -R 755 "$WEB_DIR"

# 尝试设置所有者（可能需要 root 权限）
if [ "$EUID" -eq 0 ]; then
    # 检测 web 服务器用户
    if id "www-data" &>/dev/null; then
        chown -R www-data:www-data "$WEB_DIR"
        echo -e "${GREEN}✅ 设置所有者为 www-data${NC}"
    elif id "apache" &>/dev/null; then
        chown -R apache:apache "$WEB_DIR"
        echo -e "${GREEN}✅ 设置所有者为 apache${NC}"
    elif id "nginx" &>/dev/null; then
        chown -R nginx:nginx "$WEB_DIR"
        echo -e "${GREEN}✅ 设置所有者为 nginx${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  提示：非 root 用户，跳过所有者设置${NC}"
    echo -e "${YELLOW}如果网站无法访问，请使用 sudo 运行此脚本${NC}"
fi

# 清理
echo -e "${GREEN}🧹 清理临时文件...${NC}"
# 保留 dist.zip，以防需要重新部署

echo ""
echo "============================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "============================================"
echo ""
echo "📌 部署信息："
echo "   - 部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   - 网站目录: $WEB_DIR"
echo "   - 文件数量: $(find "$WEB_DIR" -type f | wc -l)"
echo ""

# 列出部署的文件
echo "📂 部署的主要文件："
ls -lh "$WEB_DIR" | head -10
echo ""

echo "🌐 访问测试："
echo "   如果使用域名：http://yourdomain.com"
echo "   如果使用IP：http://your-server-ip"
echo ""

echo "❓ 如果网站无法访问，请检查："
echo "   1. Web 服务器（Nginx/Apache）是否运行"
echo "   2. 网站目录配置是否正确"
echo "   3. 防火墙是否开放 80 端口"
echo "   4. 文件权限是否正确"
echo ""

# 询问是否重启 web 服务器
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}是否需要重启 Web 服务器？(yes/no)${NC}"
    read -r RESTART
    
    if [ "$RESTART" = "yes" ]; then
        if systemctl is-active --quiet nginx; then
            echo -e "${GREEN}重启 Nginx...${NC}"
            systemctl reload nginx
            echo -e "${GREEN}✅ Nginx 已重启${NC}"
        elif systemctl is-active --quiet apache2; then
            echo -e "${GREEN}重启 Apache...${NC}"
            systemctl reload apache2
            echo -e "${GREEN}✅ Apache 已重启${NC}"
        elif systemctl is-active --quiet httpd; then
            echo -e "${GREEN}重启 httpd...${NC}"
            systemctl reload httpd
            echo -e "${GREEN}✅ httpd 已重启${NC}"
        else
            echo -e "${YELLOW}⚠️  未检测到运行中的 Web 服务器${NC}"
        fi
    fi
fi

echo ""
echo "🎉 部署完成！祝使用愉快！"
echo ""

