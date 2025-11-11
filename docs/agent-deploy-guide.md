## 项目自动化提交与部署指南（给初始 AI/脚本）

本指南提供最小必需信息与可直接执行的命令，确保任何“初始级”Agent/脚本都能完成提交、触发 GitHub Actions 构建并部署更新。

### 1. 仓库与分支
- 仓库：`https://github.com/1685901916/my-blog-`
- 默认分支：`main`
- 本地路径：`d:\cursor\project8  blog\Mizuki-master`

### 2. 凭据（推荐 HTTPS + PAT）
1) 在 GitHub 生成 PAT：Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token  
2) 作用域：至少勾选 repo 全部  
3) 记住凭据（Windows）
```bash
git config --global credential.helper manager
```
4) 首次推送时使用 GitHub 用户名 + PAT（作为密码）。

### 3. 设置远程与推送
```bash
cd "d:\cursor\project8  blog\Mizuki-master"
git remote set-url origin https://github.com/1685901916/my-blog-.git
git remote -v
git add -A
git commit -m "chore: sync"
git push
```

### 4. 必须存在/保持的代码改动
- 公告与 favicon：文件 `src/config.ts`
  - 公告内容：
    本站正在建设中，大部分文件多是AI生成，主要用于测试，不代表最终成果。
  - 自定义 favicon（确保文件已存在 `public/favicon/`）
    ```ts
    favicon: [
      { src: "/favicon/avatar-32.png", sizes: "32x32" },
      { src: "/favicon/avatar-128.png", sizes: "128x128" },
      { src: "/favicon/avatar-180.png", sizes: "180x180" },
      { src: "/favicon/avatar-192.png", sizes: "192x192" },
    ],
    ```
- 修复 `src/pages/manga.astro` 语法（已完成）：删除误入的 `image.png` 文本，补全 `map` 的 else 分支与闭合。

### 5. GitHub Actions 必须使用 pnpm + Node 20
工作流目录：`.github/workflows/`

- `build.yml`（检查+构建，Node 20，pnpm；示例）
```yaml
name: Build and Check

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    name: Astro Check (Node.js 20)
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { run_install: false }
      - run: pnpm install --frozen-lockfile
      - run: pnpm astro check

  build:
    runs-on: ubuntu-latest
    name: Astro Build (Node.js 20)
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { run_install: false }
      - run: pnpm install --frozen-lockfile
      - run: pnpm astro build
```

- `deploy.yml`（若使用 GitHub Pages，安装/构建同样用 pnpm；将 `dist` 部署到 `pages` 分支）

- `deploy-to-server.yml`（若部署服务器）
  - 需要 Secrets：`SERVER_HOST`、`SERVER_USER`、`SERVER_PATH`、`SERVER_SSH_KEY`
  - 构建产物目录：`dist/`

### 6. 一次性全流程（最少命令集）
```bash
cd "d:\cursor\project8  blog\Mizuki-master"
git remote set-url origin https://github.com/1685901916/my-blog-.git
git config --global credential.helper manager

git pull
git add -A
git commit -m "build: trigger"
git push
# 首次推送时用 GitHub 用户名 + PAT 登录
```
推送后，打开 GitHub → Actions，观察最新运行是否成功。

### 7. 常见故障与快速判断
- 安装依赖被拦截：项目 `preinstall` 强制 pnpm → 工作流必须用 `pnpm install`
- Node 版本过新：Node 22/23 可能导致 sharp/pagefind 等原生依赖无预编译 → 固定 Node 20
- 推送被拒（publickey）：说明使用 SSH 且未配置 Key → 切 HTTPS+PAT 或配置 SSH Key
- Vite/Esbuild 语法错误：
  - “Expected '}' but found 'image'” → 检查 `src/pages/manga.astro` 是否有多余文本或缺少括号/分支（本项目已修复为可构建状态）

### 8. 提交信息建议
- `ci: use pnpm and Node 20 in workflows`
- `fix: repair manga page syntax error`
- `feat: set custom avatar favicons`
- `chore: update announcement text`

以上内容足以让任何初始 AI/脚本完成提交与部署。*** End Patch*** }】" }}}### 8. 提交信息建议
- `ci: use pnpm and Node 20 in workflows`
- `fix: repair manga page syntax error`
- `feat: set custom avatar favicons`
- `chore: update announcement text`

以上内容足以让任何初始 AI/脚本完成提交与部署。

