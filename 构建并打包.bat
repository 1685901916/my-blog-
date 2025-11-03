@echo off
chcp 65001 >nul
title 构建并打包博客项目

color 0B
echo.
echo ============================================
echo         构建并打包博客项目
echo ============================================
echo.

cd /d "D:\cursor\project8  blog\Mizuki-master"

REM 清理旧的构建
echo 🧹 清理旧的构建文件...
if exist dist rmdir /s /q dist
if exist dist.zip del /f /q dist.zip
echo.

REM 构建项目
echo 🔨 开始构建项目...
echo.
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ❌ 构建失败！请检查错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo.

REM 检查 dist 目录
if not exist dist (
    echo ❌ dist 目录不存在，构建可能失败了
    pause
    exit /b 1
)

echo ✅ 构建成功！
echo.
echo 📦 开始打包...

REM 使用 PowerShell 压缩
powershell -command "Compress-Archive -Path 'dist\*' -DestinationPath 'dist.zip' -Force"

if %errorlevel% neq 0 (
    echo.
    echo ❌ 打包失败！
    pause
    exit /b 1
)

echo.
echo ============================================
echo.
echo ✅ 打包完成！
echo.
echo 📦 生成的文件：
echo    - dist 文件夹（包含所有网站文件）
echo    - dist.zip（压缩包，可直接上传到服务器）
echo.
echo 📁 文件位置：
echo    D:\cursor\project8  blog\Mizuki-master\dist.zip
echo.
echo 📌 下一步操作：
echo    1. 使用 FileZilla 或 WinSCP 上传 dist.zip 到服务器
echo    2. SSH 连接到服务器
echo    3. 解压并部署文件
echo.
echo 📚 详细教程请查看：部署到服务器完整教程.md
echo.

REM 询问是否打开文件夹
choice /C YN /M "是否打开 dist 文件夹查看内容？"
if %errorlevel%==1 (
    explorer dist
)

echo.
pause

