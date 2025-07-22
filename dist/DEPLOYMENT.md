# AI Chatroom 部署指南

本指南介绍如何将 AI Chatroom 纯前端版部署到各种静态文件托管服务。

## 部署前准备

确保您有以下文件：
- `index.html` - 主页面
- `script.js` - 主要逻辑
- `config-manager.js` - 配置管理
- `session-manager.js` - 会话管理
- `styles.css` - 样式文件
- `markdown-test.html` - Markdown 测试页面
- `README.md` - 使用说明
- `test.html` - 功能测试页面（可选）

## 部署方式

### 1. GitHub Pages

#### 步骤：
1. 将 `src` 目录下的所有文件推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择源分支（通常是 `main` 或 `gh-pages`）
4. 访问 `https://yourusername.github.io/your-repo-name/`

#### 示例配置：
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./src
```

### 2. Netlify

#### 方式一：拖拽部署
1. 访问 [Netlify](https://netlify.com)
2. 将 `src` 文件夹拖拽到部署区域
3. 获得自动生成的 URL

#### 方式二：Git 集成
1. 连接 GitHub 仓库
2. 设置构建命令：无需构建
3. 设置发布目录：`src`
4. 部署完成

#### netlify.toml 配置：
```toml
[build]
  publish = "src"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Vercel

#### 步骤：
1. 访问 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 设置根目录为 `src`
4. 部署完成

#### vercel.json 配置：
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4. Firebase Hosting

#### 步骤：
1. 安装 Firebase CLI：`npm install -g firebase-tools`
2. 登录：`firebase login`
3. 初始化项目：`firebase init hosting`
4. 设置公共目录为 `src`
5. 部署：`firebase deploy`

#### firebase.json 配置：
```json
{
  "hosting": {
    "public": "src",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 5. 自己的服务器

#### Nginx 配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/src;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Apache 配置（.htaccess）：
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 启用压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## 部署后配置

### 1. HTTPS 配置
确保您的部署支持 HTTPS，因为现代浏览器要求 HTTPS 才能使用某些 API。

### 2. 域名配置
如果使用自定义域名，确保正确配置 DNS 记录。

### 3. 缓存策略
建议设置适当的缓存头：
```
Cache-Control: public, max-age=31536000  # 对于静态资源
Cache-Control: no-cache                  # 对于 HTML 文件
```

## 性能优化

### 1. 文件压缩
- 启用 gzip 压缩
- 考虑使用 Brotli 压缩

### 2. CDN 加速
- 使用 CDN 加速静态资源
- 考虑使用 Cloudflare 等服务

### 3. 资源优化
- 压缩 CSS 和 JavaScript（如果需要）
- 优化图片资源

## 故障排除

### 常见问题：

1. **CORS 错误**
   - 确保 API 提供商支持跨域请求
   - 使用支持 CORS 的 API 服务

2. **404 错误**
   - 检查文件路径是否正确
   - 确保服务器配置了正确的重写规则

3. **配置丢失**
   - 提醒用户配置存储在本地
   - 考虑添加配置导出/导入功能

4. **API 调用失败**
   - 检查 API Key 是否正确
   - 确认网络连接正常

## 监控和分析

建议添加以下监控：
- Google Analytics（可选）
- 错误监控（如 Sentry）
- 性能监控

## 安全考虑

- API Key 仅存储在用户本地
- 不收集用户数据
- 使用 HTTPS 传输
- 定期更新依赖项

## 备份和恢复

用户数据备份：
- 提供配置导出功能
- 提醒用户定期备份聊天记录
- 考虑添加云同步功能（可选）
