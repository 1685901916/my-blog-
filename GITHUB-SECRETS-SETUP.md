# 🔐 GitHub Secrets 配置指南

在推送代码触发自动部署之前，需要先在 GitHub 配置服务器信息。

---

## 📋 需要配置的 Secrets

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `SERVER_HOST` | `156.225.28.187` | 服务器 IP 地址 |
| `SERVER_USER` | `root` | SSH 用户名 |
| `SERVER_PASSWORD` | `taznDMHB0115` | SSH 密码 |

---

## 🔧 配置步骤

### 步骤 1：打开 GitHub 仓库设置

1. 访问您的 GitHub 仓库：https://github.com/1685901916/my-blog-
2. 点击顶部的 **Settings**（设置）标签
3. 在左侧菜单找到 **Secrets and variables** → **Actions**

### 步骤 2：添加 Secrets

点击 **New repository secret** 按钮，依次添加以下 3 个 secrets：

#### Secret 1: SERVER_HOST
- **Name**: `SERVER_HOST`
- **Secret**: `156.225.28.187`
- 点击 **Add secret**

#### Secret 2: SERVER_USER
- **Name**: `SERVER_USER`
- **Secret**: `root`
- 点击 **Add secret**

#### Secret 3: SERVER_PASSWORD
- **Name**: `SERVER_PASSWORD`
- **Secret**: `taznDMHB0115`
- 点击 **Add secret**

---

## ✅ 验证配置

配置完成后，您应该在 Secrets 页面看到 3 个 secrets：
- ✅ SERVER_HOST
- ✅ SERVER_USER
- ✅ SERVER_PASSWORD

---

## 🚀 测试自动部署

配置完成后：

1. **推送代码到 GitHub**：
   ```bash
   git push origin main
   ```

2. **查看部署进度**：
   - 访问：https://github.com/1685901916/my-blog-/actions
   - 点击最新的 workflow run
   - 查看部署日志

3. **部署成功后**：
   - 访问您的网站：http://ayano29.cn
   - 测试新功能

---

## 🔄 以后的使用

配置完成后，每次您：
1. 本地修改代码
2. `git add .`
3. `git commit -m "更新内容"`
4. `git push origin main`

GitHub Actions 会自动：
1. ✅ 连接到服务器
2. ✅ 拉取最新代码
3. ✅ 安装依赖
4. ✅ 构建项目
5. ✅ 部署完成

**无需手动操作服务器！**

---

## 🐛 故障排查

### 问题 1：部署失败

查看 GitHub Actions 日志：
- https://github.com/1685901916/my-blog-/actions
- 点击失败的 workflow
- 查看错误信息

### 问题 2：SSH 连接失败

检查：
- ✅ SERVER_HOST 是否正确
- ✅ SERVER_USER 是否正确
- ✅ SERVER_PASSWORD 是否正确
- ✅ 服务器 SSH 端口是否为 22

### 问题 3：构建失败

可能原因：
- 服务器 Node.js 版本过低
- 服务器磁盘空间不足
- 依赖安装失败

---

## 📝 注意事项

⚠️ **安全提示**：
- 不要将此文件推送到 GitHub（已在 .gitignore 中）
- 不要在公开场合分享服务器密码
- 建议定期更换服务器密码

---

## 🎯 下一步

配置完成后，请告诉我，我会帮您推送代码并测试自动部署！

