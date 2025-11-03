# 🚀 GitHub 部署完整流程

## 📝 你的 GitHub 信息
- **用户名**: 1685901916
- **仓库名**: （需要创建）建议命名为 `my-blog` 或 `blog`

---

## 🎯 部署流程（推荐方案）

### 步骤1：在 GitHub 创建仓库

1. **访问 GitHub**
   ```
   https://github.com/new
   ```

2. **填写仓库信息**
   ```
   Repository name: my-blog        （仓库名称，可自定义）
   Description: 我的个人博客        （描述，可选）
   Public                          （选择 Public 公开）
   不要勾选任何初始化选项（README, .gitignore 等）
   ```

3. **点击 "Create repository"**

---

### 步骤2：本地项目关联 GitHub

打开 **PowerShell** 或 **CMD**，执行以下命令：

```batch
cd "D:\cursor\project8  blog\Mizuki-master"

# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "初始提交：博客项目"

# 4. 设置默认分支为 main
git branch -M main

# 5. 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/1685901916/my-blog.git

# 6. 推送到 GitHub
git push -u origin main
```

**⚠️ 如果遇到权限问题：**

需要配置 GitHub Token：

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选权限：`repo`（完整仓库权限）
4. 生成并复制 Token
5. 推送时使用：
   ```batch
   git push https://你的token@github.com/1685901916/my-blog.git main
   ```

---

### 步骤3：服务器部署（两种方案）

## 📦 方案A：简单部署（推荐新手）

### A1. 本地构建并打包

双击运行：
```
构建并打包.bat
```

会生成 `dist.zip` 文件

### A2. 上传到服务器

**使用 FileZilla：**
1. 下载：https://filezilla-project.org/
2. 连接服务器：
   ```
   主机: sftp://你的服务器IP
   用户名: root
   密码: 你的密码
   端口: 22
   ```
3. 上传文件到服务器：
   - `dist.zip`
   - `服务器部署脚本-简化版.sh`

### A3. 服务器部署

SSH 连接到服务器：
```bash
ssh root@你的服务器IP
```

执行部署：
```bash
# 赋予权限
chmod +x 服务器部署脚本-简化版.sh

# 运行部署
sudo ./服务器部署脚本-简化版.sh

# 按提示输入网站目录，例如：
/var/www/html
```

---

## 🔄 方案B：Git 自动部署（推荐长期使用）

### B1. 服务器安装 Node.js

```bash
# SSH 连接到服务器
ssh root@你的服务器IP

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### B2. 克隆项目到服务器

```bash
# 创建项目目录
sudo mkdir -p /www/blog-source
cd /www/blog-source

# 克隆你的仓库
sudo git clone https://github.com/1685901916/my-blog.git .

# 如果是私有仓库，会要求输入用户名和密码/token
```

### B3. 首次构建

```bash
# 安装依赖
sudo npm install

# 构建项目
sudo npm run build

# 部署到网站目录
sudo mkdir -p /var/www/html
sudo cp -r dist/* /var/www/html/
```

### B4. 创建自动部署脚本

```bash
sudo nano /www/blog-source/deploy.sh
```

粘贴以下内容：
```bash
#!/bin/bash
echo "开始部署..."
cd /www/blog-source
git pull origin main
npm install
npm run build
rm -rf /var/www/html/*
cp -r dist/* /var/www/html/
chmod -R 755 /var/www/html
chown -R www-data:www-data /var/www/html
echo "部署完成！"
```

保存并赋予权限：
```bash
sudo chmod +x /www/blog-source/deploy.sh
```

### B5. 测试部署

```bash
sudo /www/blog-source/deploy.sh
```

---

## 🎯 后续更新流程

### 方案A 后续更新：
```
1. 本地修改文章
2. 双击：构建并打包.bat
3. 上传 dist.zip 到服务器
4. SSH 运行：sudo ./服务器部署脚本-简化版.sh
```

### 方案B 后续更新：
```
1. 本地修改文章
2. git add .
3. git commit -m "更新：XXX"
4. git push
5. SSH 运行：sudo /www/blog-source/deploy.sh
```

---

## 🔧 Web 服务器配置

### 如果使用 Nginx

```bash
sudo nano /etc/nginx/sites-available/blog
```

配置内容：
```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 改成你的域名或IP
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用并重启：
```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 如果使用宝塔面板

1. 进入宝塔面板
2. 网站 → 添加站点
3. 设置网站根目录为 `/var/www/html`
4. 完成！

---

## 📝 快速命令参考

### 本地命令（Windows）

```batch
# 进入项目目录
cd "D:\cursor\project8  blog\Mizuki-master"

# 提交代码
git add .
git commit -m "更新内容"
git push

# 构建打包
双击：构建并打包.bat
```

### 服务器命令（Linux）

```bash
# 连接服务器
ssh root@服务器IP

# 方案A：运行部署脚本
sudo ./服务器部署脚本-简化版.sh

# 方案B：Git 部署
sudo /www/blog-source/deploy.sh

# 查看日志
tail -f /var/log/nginx/access.log

# 重启服务
sudo systemctl reload nginx
```

---

## ❓ 常见问题

### Q1: git push 失败，要求输入用户名密码？

**解决方法：使用 GitHub Token**

1. 生成 Token：https://github.com/settings/tokens
2. 勾选 `repo` 权限
3. 复制 Token
4. 推送时使用：
   ```batch
   git remote set-url origin https://你的token@github.com/1685901916/my-blog.git
   git push
   ```

### Q2: 服务器克隆仓库失败？

**如果是私有仓库：**
```bash
git clone https://你的token@github.com/1685901916/my-blog.git
```

**或者配置 SSH 密钥：**
```bash
ssh-keygen -t rsa -b 4096 -C "你的邮箱"
cat ~/.ssh/id_rsa.pub
# 复制输出内容到 GitHub → Settings → SSH Keys
```

### Q3: npm install 很慢？

**使用国内镜像：**
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q4: 网站访问显示 403？

**检查权限：**
```bash
sudo chmod -R 755 /var/www/html
sudo chown -R www-data:www-data /var/www/html
```

---

## 🎉 完成！

现在你有两个部署方案：
- **方案A**：适合快速部署，无需服务器安装 Node.js
- **方案B**：适合长期维护，更新更方便

选择最适合你的方案开始部署吧！

---

## 📞 需要帮助？

- 查看终端错误日志
- 检查 GitHub 仓库是否推送成功
- 确认服务器网络连接正常
- 验证 Web 服务器配置

**祝部署顺利！** 🚀

