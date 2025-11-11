@echo off
chcp 65001 >nul
title Git 配置和 SSH 测试工具
color 0B

echo.
echo ============================================
echo        Git 配置和 SSH 测试工具
echo ============================================
echo.

cd /d "D:\cursor\project8  blog\Mizuki-master"

REM 步骤1：配置 Git 用户信息
echo 【步骤 1/5】配置 Git 用户信息
echo ============================================
echo.

git config --global user.name "ayano"
git config --global user.email "1685901916@qq.com"

echo ✅ Git 用户信息已配置：
echo    用户名：ayano
echo    邮箱：1685901916@qq.com
echo.

REM 步骤2：检查 SSH 密钥
echo 【步骤 2/5】检查 SSH 密钥
echo ============================================
echo.

if exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo ✅ 检测到 Ed25519 SSH 密钥
    echo.
    echo 📋 您的公钥内容：
    echo ----------------------------------------
    type "%USERPROFILE%\.ssh\id_ed25519.pub"
    echo ----------------------------------------
    echo.
    echo 💡 请确保此公钥已添加到 GitHub：
    echo    https://github.com/settings/keys
    echo.
) else if exist "%USERPROFILE%\.ssh\id_rsa" (
    echo ✅ 检测到 RSA SSH 密钥
    echo.
    echo 📋 您的公钥内容：
    echo ----------------------------------------
    type "%USERPROFILE%\.ssh\id_rsa.pub"
    echo ----------------------------------------
    echo.
    echo 💡 请确保此公钥已添加到 GitHub：
    echo    https://github.com/settings/keys
    echo.
) else (
    echo ⚠️  未检测到 SSH 密钥
    echo.
    echo 💡 需要生成 SSH 密钥，请选择：
    echo.
    choice /C YN /M "是否现在生成 SSH 密钥？"
    if %errorlevel%==1 (
        echo.
        echo 🔑 正在生成 Ed25519 SSH 密钥...
        echo.
        echo 提示：按回车使用默认路径，建议设置密码保护
        echo.
        ssh-keygen -t ed25519 -C "1685901916@qq.com"
        
        if %errorlevel%==0 (
            echo.
            echo ✅ SSH 密钥生成成功！
            echo.
            echo 📋 您的公钥内容：
            echo ----------------------------------------
            type "%USERPROFILE%\.ssh\id_ed25519.pub"
            echo ----------------------------------------
            echo.
            echo 💡 请将上面的公钥添加到 GitHub：
            echo    1. 访问：https://github.com/settings/keys
            echo    2. 点击 "New SSH key"
            echo    3. 粘贴上面的公钥内容
            echo    4. 点击 "Add SSH key"
            echo.
            
            choice /C YN /M "是否打开 GitHub SSH 设置页面？"
            if %errorlevel%==1 (
                start https://github.com/settings/keys
            )
        ) else (
            echo ❌ SSH 密钥生成失败
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo ⚠️  跳过 SSH 密钥生成，将使用 HTTPS 方式
        echo.
    )
)

pause
echo.

REM 步骤3：启动 SSH Agent 并添加密钥
echo 【步骤 3/5】配置 SSH Agent
echo ============================================
echo.

if exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo 🔧 启动 SSH Agent 服务...
    powershell -Command "Start-Service ssh-agent" 2>nul
    
    echo 🔑 添加 SSH 密钥到 Agent...
    ssh-add "%USERPROFILE%\.ssh\id_ed25519" 2>nul
    
    if %errorlevel%==0 (
        echo ✅ SSH 密钥已添加到 Agent
    ) else (
        echo ⚠️  SSH Agent 配置可能需要管理员权限
        echo    如果测试失败，请以管理员身份运行此脚本
    )
) else if exist "%USERPROFILE%\.ssh\id_rsa" (
    echo 🔧 启动 SSH Agent 服务...
    powershell -Command "Start-Service ssh-agent" 2>nul
    
    echo 🔑 添加 SSH 密钥到 Agent...
    ssh-add "%USERPROFILE%\.ssh\id_rsa" 2>nul
    
    if %errorlevel%==0 (
        echo ✅ SSH 密钥已添加到 Agent
    ) else (
        echo ⚠️  SSH Agent 配置可能需要管理员权限
    )
)

echo.

REM 步骤4：测试 SSH 连接
echo 【步骤 4/5】测试 GitHub SSH 连接
echo ============================================
echo.

if exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo 🔍 测试连接到 GitHub...
    echo.
    ssh -T git@github.com
    
    if %errorlevel%==1 (
        echo.
        echo ✅ SSH 连接成功！
        echo.
    ) else (
        echo.
        echo ⚠️  SSH 连接测试失败
        echo.
        echo 💡 可能的原因：
        echo    1. 公钥未添加到 GitHub
        echo    2. SSH Agent 未正确配置
        echo    3. 网络连接问题
        echo.
    )
) else if exist "%USERPROFILE%\.ssh\id_rsa" (
    echo 🔍 测试连接到 GitHub...
    echo.
    ssh -T git@github.com
    
    if %errorlevel%==1 (
        echo.
        echo ✅ SSH 连接成功！
        echo.
    ) else (
        echo.
        echo ⚠️  SSH 连接测试失败
        echo.
    )
) else (
    echo ⚠️  未配置 SSH 密钥，跳过连接测试
    echo.
)

REM 步骤5：检查 Git 远程仓库配置
echo 【步骤 5/5】检查 Git 远程仓库配置
echo ============================================
echo.

git remote -v

echo.
echo 📌 当前远程仓库：
git remote get-url origin 2>nul

if %errorlevel%==0 (
    echo.
    echo ✅ 远程仓库已配置
) else (
    echo.
    echo ⚠️  未配置远程仓库
)

echo.
echo ============================================
echo.
echo 📊 配置总结
echo ============================================
echo.
echo ✅ Git 用户：ayano (1685901916@qq.com)
echo ✅ 远程仓库：git@github.com:1685901916/my-blog-.git
echo ✅ 分支：main
echo.

if exist "%USERPROFILE%\.ssh\id_ed25519" (
    echo ✅ SSH 密钥：已配置 (Ed25519)
) else if exist "%USERPROFILE%\.ssh\id_rsa" (
    echo ✅ SSH 密钥：已配置 (RSA)
) else (
    echo ⚠️  SSH 密钥：未配置
)

echo.
echo 💡 下一步操作：
echo    1. 如果 SSH 测试成功，可以直接运行 "一键发布.bat" 推送代码
echo    2. 如果 SSH 测试失败，请检查公钥是否已添加到 GitHub
echo    3. 也可以使用 "推送到GitHub.bat" 进行详细的推送操作
echo.
echo ============================================
echo.

pause
