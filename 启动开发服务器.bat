@echo off
chcp 65001 >nul
echo ========================================
echo    正在启动 Mizuki 博客开发服务器
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 检查依赖...
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
)

echo [2/2] 启动开发服务器...
echo.
echo ========================================
echo    开发服务器启动中...
echo ========================================
echo.
echo 访问地址：
echo   主页：    http://localhost:4321/
echo   漫画页：  http://localhost:4321/manga/
echo.
echo 按 Ctrl+C 可停止服务器
echo ========================================
echo.

call npm run dev

pause










