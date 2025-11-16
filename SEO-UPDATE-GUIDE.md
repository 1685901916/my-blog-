# 🔍 搜索引擎 OG 图片更新指南

## 📊 当前状态

- ✅ OG 图片已配置：`https://ayano29.cn/og-image.jpg`
- ✅ Meta 标签已正确设置
- ⏳ 搜索引擎显示旧缓存（需要时间更新）

---

## 🚀 加速搜索引擎更新的方法

### 方法 1：Bing Webmaster Tools（最有效）

1. **访问 Bing Webmaster Tools**：
   - https://www.bing.com/webmasters

2. **添加/验证您的网站**：
   - 如果还没有添加，需要先验证网站所有权
   - 使用 HTML 文件验证或 Meta 标签验证

3. **提交 URL 重新索引**：
   - 进入 "URL 检查" 工具
   - 输入：`https://ayano29.cn`
   - 点击 "请求索引"

4. **提交 Sitemap**：
   - 进入 "Sitemaps" 页面
   - 提交：`https://ayano29.cn/sitemap-index.xml`

---

### 方法 2：Google Search Console

1. **访问 Google Search Console**：
   - https://search.google.com/search-console

2. **验证网站所有权**

3. **请求重新索引**：
   - 使用 "URL 检查" 工具
   - 输入：`https://ayano29.cn`
   - 点击 "请求编入索引"

---

### 方法 3：使用 Bing URL Submission API

快速提交 URL 到 Bing：

```bash
# 获取 API Key 后使用
curl -X POST "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"siteUrl":"https://ayano29.cn","url":"https://ayano29.cn"}'
```

---

## 🧪 验证 OG 图片是否正确

### 在线测试工具：

1. **Facebook Sharing Debugger**：
   - https://developers.facebook.com/tools/debug/
   - 输入：`https://ayano29.cn`
   - 点击 "Scrape Again" 刷新缓存

2. **Twitter Card Validator**：
   - https://cards-dev.twitter.com/validator
   - 输入：`https://ayano29.cn`

3. **LinkedIn Post Inspector**：
   - https://www.linkedin.com/post-inspector/
   - 输入：`https://ayano29.cn`

4. **Open Graph Check**：
   - https://opengraphcheck.com/
   - 输入：`https://ayano29.cn`

---

## 📝 当前 OG Meta 标签

您的网站应该包含以下 meta 标签：

```html
<meta property="og:site_name" content="文乃的小站">
<meta property="og:url" content="https://ayano29.cn">
<meta property="og:title" content="文乃的小站 - 记录生活，分享美好">
<meta property="og:description" content="...">
<meta property="og:image" content="https://ayano29.cn/og-image.jpg">
<meta property="og:type" content="website">
```

---

## ⏱️ 更新时间预期

- **Facebook/Twitter**：立即（使用调试工具刷新后）
- **Google**：1-7 天
- **Bing**：3-14 天
- **其他搜索引擎**：1-30 天

---

## 🔧 故障排查

### 问题 1：OG 图片无法加载

检查：
```bash
curl -I https://ayano29.cn/og-image.jpg
```

应该返回 `200 OK`

### 问题 2：Meta 标签不正确

访问：
```
https://ayano29.cn
```

查看页面源代码，搜索 `og:image`

---

## 💡 提示

- 搜索引擎缓存更新需要时间，请耐心等待
- 使用 Webmaster Tools 可以加速更新
- 社交媒体平台（Facebook/Twitter）可以立即刷新缓存

