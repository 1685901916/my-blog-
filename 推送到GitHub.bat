@echo off
chcp 65001 >nul
title 推送博客到 GitHub

color 0E
echo.
echo ============================================
echo         推送博客到 GitHub
echo ============================================
echo.

cd /d "D:\cursor\project8  blog\Mizuki-master"

REM 检查是否已初始化 Git
if not exist ".git" (
    echo 📦 初始化 Git 仓库...
    git init
    git branch -M main
    echo.
)

REM 检查是否已设置远程仓库
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  还未设置远程仓库地址
    echo.
    echo 请先在 GitHub 创建仓库，然后输入仓库地址
    echo 格式：https://github.com/1685901916/仓库名.git
    echo.
    set /p repo_url="请输入 GitHub 仓库地址: "
    
    if "!repo_url!"=="" (
        echo ❌ 仓库地址不能为空
        pause
        exit /b 1
    )
    
    git remote add origin !repo_url!
    echo ✅ 已设置远程仓库
    echo.
)

REM 检查是否有更改
git status --short > temp.txt
set /p changes=<temp.txt
del temp.txt

if "%changes%"=="" (
    echo ℹ️  没有检测到任何更改
    echo.
    
    choice /C YN /M "是否强制推送？"
    if %errorlevel%==2 (
        echo 操作已取消
        pause
        exit /b 0
    )
) else (
    echo 📋 检测到以下更改：
    echo.
    git status --short
    echo.
)

REM 输入提交信息
set /p commit_msg="📝 请输入提交信息（例如：更新文章）: "

if "%commit_msg%"=="" (
    set commit_msg=更新博客内容
    echo ℹ️  使用默认提交信息：更新博客内容
)

echo.
echo ============================================
echo.

REM 添加文件
echo 1️⃣ 添加文件到 Git...
git add .

REM 提交
echo.
echo 2️⃣ 提交更改...
git commit -m "%commit_msg%"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  没有需要提交的更改
    echo.
)

REM 推送
echo.
echo 3️⃣ 推送到 GitHub...
echo.

git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo.
    echo ❌ 推送失败！
    echo.
    echo 📌 可能的原因：
    echo    1. 需要设置 GitHub Token
    echo    2. 网络连接问题
    echo    3. 权限不足
    echo.
    echo 💡 解决方法：
    echo.
    echo 【方法1】使用 GitHub Token（推荐）
    echo    1. 访问：https://github.com/settings/tokens
    echo    2. Generate new token (classic)
    echo    3. 勾选 repo 权限
    echo    4. 生成并复制 Token
    echo    5. 设置远程地址：
    echo       git remote set-url origin https://你的token@github.com/1685901916/仓库名.git
    echo    6. 重新运行此脚本
    echo.
    echo 【方法2】使用 SSH 密钥
    echo    1. 生成密钥：ssh-keygen -t rsa -b 4096
    echo    2. 复制公钥：cat ~/.ssh/id_rsa.pub
    echo    3. 添加到 GitHub Settings - SSH Keys
    echo    4. 更换仓库地址为 SSH 格式
    echo.
    
    choice /C YN /M "是否打开 GitHub Token 设置页面？"
    if %errorlevel%==1 (
        start https://github.com/settings/tokens
    )
    
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo.
echo ✅ 推送成功！
echo.
echo 📌 GitHub 仓库：
echo    https://github.com/1685901916/仓库名
echo.
echo 📌 提交信息：%commit_msg%
echo.

REM 询问是否打开 GitHub 仓库
choice /C YN /M "是否打开 GitHub 仓库查看？"
if %errorlevel%==1 (
    start https://github.com/1685901916
)

echo.
pause

