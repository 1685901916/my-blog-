# 🚀 服务器 Git 部署详细步骤

## 📋 你需要准备的信息

- ✅ 服务器 IP 地址：`你的服务器IP`
- ✅ SSH 用户名：通常是 `root` 或你的用户名
- ✅ SSH 密码
- ✅ GitHub 仓库地址：`https://github.com/1685901916/my-blog-.git`

---

## 第一步：连接到服务器

### Windows 连接方式

**方法1：使用 PowerShell（推荐）**
```powershell
ssh root@你的服务器IP
# 输入密码后回车
```

**方法2：使用 PuTTY**
1. 下载 PuTTY：https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
2. 打开 PuTTY
3. Host Name: 填入服务器 IP
4. Port: 22
5. 点击 Open
6. 输入用户名和密码

---

## 第二步：安装 Node.js

### 2.1 检查是否已安装

```bash
node --version
npm --version
```

如果显示版本号，跳到第三步。如果没有，继续安装：

### 2.2 安装 Node.js 20.x（推荐版本）

**Ubuntu/Debian 系统：**
```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**CentOS/RHEL 系统：**
```bash
# 安装 Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

**如果使用宝塔面板：**
1. 进入宝塔面板
2. 软件商店 → 搜索 "Node.js"
3. 安装 Node.js 版本管理器
4. 安装 Node.js 20.x

---

## 第三步：克隆 GitHub 仓库

### 3.1 创建项目目录

```bash
# 创建博客源码目录
sudo mkdir -p /www/blog-source
cd /www/blog-source

# 如果提示权限问题，使用：
sudo chown -R $(whoami):$(whoami) /www/blog-source
```

### 3.2 克隆仓库

```bash
# 克隆你的 GitHub 仓库
git clone https://github.com/1685901916/my-blog-.git .

# 注意：最后有个点 (.) 表示克隆到当前目录
```

**如果提示没有 Git：**
```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo yum install git
```

---

## 第四步：安装依赖并首次构建

### 4.1 安装项目依赖

```bash
# 进入项目目录
cd /www/blog-source

# 使用国内镜像加速（推荐）
npm config set registry https://registry.npmmirror.com

# 安装依赖
npm install

# 这一步可能需要 5-10 分钟，请耐心等待
```

### 4.2 首次构建

```bash
# 构建项目
npm run build

# 构建成功后会生成 dist 目录
ls -la dist/
```

---

## 第五步：部署到网站目录

### 5.1 确定网站目录

**常见网站目录：**
- 宝塔面板：`/www/wwwroot/你的域名`
- Nginx 默认：`/var/www/html`
- Apache 默认：`/var/www/html`

**如果使用宝塔面板：**
1. 在宝塔面板创建网站
2. 记住网站目录路径

### 5.2 部署文件

```bash
# 方法1：直接部署到默认目录
sudo rm -rf /var/www/html/*
sudo cp -r /www/blog-source/dist/* /var/www/html/

# 方法2：部署到宝塔网站目录
sudo rm -rf /www/wwwroot/你的域名/*
sudo cp -r /www/blog-source/dist/* /www/wwwroot/你的域名/

# 设置权限
sudo chmod -R 755 /var/www/html
sudo chown -R www-data:www-data /var/www/html

# 如果是宝塔面板，使用：
sudo chown -R www:www /www/wwwroot/你的域名
```

---

## 第六步：配置 Web 服务器

### 6.1 如果使用 Nginx

**检查 Nginx 状态：**
```bash
sudo systemctl status nginx
```

**创建配置文件：**
```bash
sudo nano /etc/nginx/sites-available/blog
```

**配置内容：**
```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    
    root /var/www/html;
    index index.html;
    
    # 处理 Astro 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**启用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 如果使用宝塔面板

1. 进入宝塔面板
2. 网站 → 你的站点 → 设置
3. 网站目录：指向 `/www/wwwroot/你的域名`
4. 伪静态：选择 "Astro" 或添加以下规则：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 第七步：创建自动部署脚本

### 7.1 创建部署脚本

```bash
sudo nano /www/blog-source/deploy.sh
```

### 7.2 脚本内容

```bash
#!/bin/bash

echo "========================================"
echo "开始部署博客..."
echo "========================================"

# 项目目录
PROJECT_DIR="/www/blog-source"
WEB_DIR="/var/www/html"  # 修改为你的网站目录
BACKUP_DIR="/www/backup"

cd $PROJECT_DIR

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ 拉取代码失败！"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

# 备份当前版本
if [ -d "$WEB_DIR" ]; then
    echo "📦 备份当前版本..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $BACKUP_DIR
    cp -r $WEB_DIR $BACKUP_DIR/$BACKUP_NAME
    echo "✅ 已备份到: $BACKUP_DIR/$BACKUP_NAME"
fi

# 部署新版本
echo "🚀 部署新版本..."
rm -rf $WEB_DIR/*
cp -r dist/* $WEB_DIR/

# 设置权限
chmod -R 755 $WEB_DIR
chown -R www-data:www-data $WEB_DIR

echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo "部署时间: $(date)"
echo "Git 版本: $(git log -1 --format='%h - %s')"
```

### 7.3 赋予执行权限

```bash
sudo chmod +x /www/blog-source/deploy.sh
```

---

## 第八步：测试部署

### 8.1 测试脚本

```bash
sudo /www/blog-source/deploy.sh
```

### 8.2 查看结果

看到 "✅ 部署完成！" 表示成功。

### 8.3 访问网站

在浏览器打开：
```
http://你的服务器IP
或
http://你的域名
```

---

## 第九步：后续更新流程

### 9.1 本地更新文章

```powershell
# 在 Windows 本地
cd "D:\cursor\project8  blog\Mizuki-master"

# 创建或修改文章
# ...

# 提交并推送
git add .
git commit -m "更新文章"
git push
```

### 9.2 服务器更新

```bash
# SSH 连接到服务器
ssh root@你的服务器IP

# 运行部署脚本
sudo /www/blog-source/deploy.sh

# 完成！刷新网站查看更新
```

---

## 🔧 常见问题解决

### Q1: npm install 很慢？

**使用国内镜像：**
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q2: 构建失败？

**检查 Node.js 版本：**
```bash
node --version  # 需要 18.0.0 或更高
```

**清理缓存重试：**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Q3: 网站显示 403 Forbidden？

**修正权限：**
```bash
sudo chmod -R 755 /var/www/html
sudo chown -R www-data:www-data /var/www/html
```

### Q4: 页面刷新后 404？

需要配置服务器重写规则（见第六步）

### Q5: git pull 失败？

**重置本地更改：**
```bash
cd /www/blog-source
git reset --hard HEAD
git pull origin main
```

---

## 🎯 快速命令参考

```bash
# 连接服务器
ssh root@服务器IP

# 更新部署
sudo /www/blog-source/deploy.sh

# 查看日志
tail -f /var/log/nginx/access.log

# 重启服务
sudo systemctl reload nginx

# 查看进程
ps aux | grep node
```

---

## 📞 需要帮助？

如果遇到问题：
1. 查看终端错误信息
2. 检查 Web 服务器日志
3. 确认端口 80 已开放
4. 验证文件权限正确

---

**祝部署顺利！** 🚀







