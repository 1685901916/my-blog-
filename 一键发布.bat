@echo off
chcp 65001 >nul
title 博客一键发布工具

color 0A
echo.
echo ============================================
echo           博客一键发布工具
echo ============================================
echo.

REM 检查是否有未提交的更改
git status --short > temp.txt
set /p changes=<temp.txt
del temp.txt

if "%changes%"=="" (
    echo ⚠️  没有检测到任何更改
    echo.
    pause
    exit
)

echo 📋 检测到以下更改：
echo.
git status --short
echo.

REM 输入提交信息
set /p commit_msg="📝 请输入提交信息（例如：新增文章-标题）: "

if "%commit_msg%"=="" (
    echo ❌ 提交信息不能为空！
    pause
    exit
)

echo.
echo ============================================
echo.

REM Git 提交
echo 1️⃣ 添加文件到 Git...
git add .

echo.
echo 2️⃣ 提交更改...
git commit -m "%commit_msg%"

echo.
echo 3️⃣ 推送到远程仓库...
git push

if %errorlevel% neq 0 (
    echo.
    echo ❌ 推送失败！请检查网络连接或 Git 配置
    echo.
    pause
    exit
)

echo.
echo ============================================
echo.
echo ✅ 发布成功！
echo.
echo 📌 提示：
echo    - 如果配置了自动部署，服务器会自动更新
echo    - 如果没有配置自动部署，请 SSH 到服务器手动更新
echo.

REM 询问是否要 SSH 到服务器
choice /C YN /M "是否需要 SSH 到服务器手动部署？"
if %errorlevel%==1 (
    echo.
    echo 📌 请手动执行以下命令：
    echo.
    echo    ssh username@your-server-ip
    echo    cd /path/to/your/blog
    echo    git pull
    echo    npm run build
    echo    # 复制 dist 到网站目录
    echo.
)

echo.
pause

