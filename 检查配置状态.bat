@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo 主页内容显示配置检查工具
echo ========================================
echo.

cd /d "%~dp0"

echo 正在检查 src\config.ts 中的配置...
echo.

findstr /N "homepageContent" src\config.ts >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 homepageContent 配置！
    echo.
    pause
    exit /b 1
)

echo [✓] 找到 homepageContent 配置
echo.
echo ----------------------------------------
echo 当前配置内容:
echo ----------------------------------------
findstr /N /C:"homepageContent" /C:"showBlogPosts" /C:"showMangaPosts" /C:"showPortfolioPosts" src\config.ts
echo ----------------------------------------
echo.
echo 配置说明:
echo   showBlogPosts: true     - 主页显示博客文章
echo   showMangaPosts: true    - 主页显示漫画内容
echo   showPortfolioPosts: true - 主页显示作品集内容
echo.
echo 修改方法:
echo   1. 打开文件: src\config.ts
echo   2. 找到第 44-49 行
echo   3. 将 true 改为 false 即可关闭对应内容
echo   4. 保存后刷新浏览器（Ctrl+Shift+R）
echo.
echo ========================================
echo.

pause


