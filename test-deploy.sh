#!/bin/bash

# 测试部署脚本
# 用于验证服务器连接和文件传输

set -e

echo "=========================================="
echo "测试服务器连接和部署"
echo "=========================================="

# 服务器信息（请根据实际情况修改）
SERVER_HOST="156.225.28.187"
SERVER_USER="root"
SERVER_PORT="22"

echo ""
echo "1. 测试 SSH 连接..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo '✓ SSH 连接成功'"

echo ""
echo "2. 检查服务器目录..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "ls -la /www/wwwroot/ayano29.cn/ | head -10"

echo ""
echo "3. 检查文件修改时间..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "stat /www/wwwroot/ayano29.cn/index.html | grep Modify || stat /www/wwwroot/ayano29.cn/index.html | grep Change"

echo ""
echo "4. 检查临时目录..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "ls -la /tmp/ | grep blog-deploy || echo '没有找到临时部署目录'"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
