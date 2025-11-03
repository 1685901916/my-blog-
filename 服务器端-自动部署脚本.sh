#!/bin/bash
# 服务器端自动部署脚本
# 使用方法：
# 1. 上传此脚本到服务器项目目录
# 2. chmod +x 服务器端-自动部署脚本.sh
# 3. 每次需要更新时运行：./服务器端-自动部署脚本.sh

# 配置变量（请根据你的实际情况修改）
PROJECT_DIR="/www/wwwroot/your-blog"          # 项目目录
WEB_DIR="/www/wwwroot/your-domain/blog"       # 网站目录
BACKUP_DIR="/www/backup/blog"                 # 备份目录
LOG_FILE="/var/log/blog-deploy.log"           # 日志文件

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR:${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  WARNING:${NC} $1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

# 检查目录是否存在
check_directory() {
    if [ ! -d "$PROJECT_DIR" ]; then
        error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
}

# 备份当前版本
backup() {
    log "📦 开始备份当前版本..."
    
    if [ -d "$WEB_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        BACKUP_NAME="backup-$(date +'%Y%m%d-%H%M%S')"
        cp -r "$WEB_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        
        if [ $? -eq 0 ]; then
            log "✅ 备份成功: $BACKUP_DIR/$BACKUP_NAME"
            
            # 只保留最近5个备份
            cd "$BACKUP_DIR"
            ls -t | tail -n +6 | xargs -r rm -rf
        else
            error "备份失败！"
            exit 1
        fi
    fi
}

# 拉取最新代码
pull_code() {
    log "📥 拉取最新代码..."
    cd "$PROJECT_DIR" || exit 1
    
    # 保存当前工作区更改
    if [ -n "$(git status --porcelain)" ]; then
        warning "检测到未提交的更改，正在暂存..."
        git stash
    fi
    
    # 拉取代码
    git pull origin main
    
    if [ $? -ne 0 ]; then
        error "拉取代码失败！"
        exit 1
    fi
    
    log "✅ 代码拉取成功"
}

# 安装依赖
install_dependencies() {
    log "📦 检查并安装依赖..."
    cd "$PROJECT_DIR" || exit 1
    
    # 检查 package.json 是否有更新
    if [ package.json -nt node_modules ]; then
        log "检测到依赖更新，正在安装..."
        npm install --production
        
        if [ $? -ne 0 ]; then
            error "依赖安装失败！"
            exit 1
        fi
    else
        log "依赖无更新，跳过安装"
    fi
}

# 构建项目
build_project() {
    log "🔨 开始构建项目..."
    cd "$PROJECT_DIR" || exit 1
    
    # 清理之前的构建
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # 构建
    npm run build
    
    if [ $? -ne 0 ]; then
        error "构建失败！"
        exit 1
    fi
    
    if [ ! -d "dist" ]; then
        error "构建输出目录不存在！"
        exit 1
    fi
    
    log "✅ 构建成功"
}

# 部署到网站目录
deploy() {
    log "🚀 开始部署..."
    
    # 创建网站目录（如果不存在）
    mkdir -p "$WEB_DIR"
    
    # 清空旧文件
    rm -rf "${WEB_DIR:?}"/*
    
    # 复制新文件
    cp -r "$PROJECT_DIR/dist/"* "$WEB_DIR/"
    
    if [ $? -ne 0 ]; then
        error "部署失败！正在恢复备份..."
        
        # 恢复最新备份
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n 1)
        if [ -n "$LATEST_BACKUP" ]; then
            rm -rf "${WEB_DIR:?}"/*
            cp -r "$BACKUP_DIR/$LATEST_BACKUP/"* "$WEB_DIR/"
            warning "已恢复到备份版本: $LATEST_BACKUP"
        fi
        
        exit 1
    fi
    
    # 设置正确的权限
    chown -R www-data:www-data "$WEB_DIR"
    chmod -R 755 "$WEB_DIR"
    
    log "✅ 部署成功"
}

# 清理缓存
clear_cache() {
    log "🧹 清理缓存..."
    
    # 清理 Astro 缓存
    if [ -d "$PROJECT_DIR/.astro" ]; then
        rm -rf "$PROJECT_DIR/.astro"
    fi
    
    # 清理 Nginx 缓存（如果使用了缓存）
    # nginx -s reload
    
    log "✅ 缓存清理完成"
}

# 主流程
main() {
    echo "============================================"
    echo "        博客自动部署脚本"
    echo "============================================"
    echo ""
    
    check_directory
    backup
    pull_code
    install_dependencies
    build_project
    deploy
    clear_cache
    
    echo ""
    echo "============================================"
    log "🎉 部署完成！"
    echo "============================================"
    echo ""
    echo "📌 部署信息："
    echo "   - 部署时间: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "   - Git 版本: $(cd "$PROJECT_DIR" && git log -1 --format='%h - %s')"
    echo "   - 网站目录: $WEB_DIR"
    echo ""
}

# 运行主流程
main

