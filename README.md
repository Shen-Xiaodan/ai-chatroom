# AI Chatroom - 纯前端版

这是一个完全基于前端的 AI 聊天室应用，无需后端服务器，可以直接作为静态文件部署。

## 特性

- 🔒 **隐私保护**: 所有配置和聊天记录仅存储在本地浏览器中
- 🌐 **纯前端**: 无需后端服务器，可直接部署到任何静态文件托管服务
- 🔑 **API 兼容**: 支持 OpenAI 兼容的 API（如 SiliconFlow、OpenAI 等）
- 💬 **会话管理**: 支持多个聊天会话，自动保存聊天历史
- 📝 **Markdown 支持**: 完整的 Markdown 渲染支持
- 🎨 **现代界面**: 响应式设计，支持移动设备

## 使用方法

### 1. 部署方式

#### 本地使用
直接用浏览器打开 `index.html` 文件即可使用。

#### 静态托管
将 `src` 目录下的所有文件上传到任何静态文件托管服务：
- GitHub Pages
- Netlify
- Vercel
- 或任何支持静态文件的服务器

### 2. 配置 API

首次使用时，需要配置 API 信息：

1. 点击右上角的 ⚙️ 设置按钮
2. 选择 API 提供商（SiliconFlow、OpenAI 或自定义）
3. 输入您的 API Key
4. 选择或输入模型名称
5. 点击"测试连接"验证配置
6. 保存配置

### 3. 获取 API Key

#### SiliconFlow（推荐）
1. 访问 [SiliconFlow](https://siliconflow.cn/)
2. 注册账号并获取 API Key
3. 支持多种开源模型，价格便宜

#### OpenAI
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 创建 API Key
3. 支持 GPT-4、GPT-3.5 等模型

## 隐私说明

- ✅ 所有数据仅存储在您的浏览器本地
- ✅ API Key 安全存储在 localStorage 中
- ✅ 聊天记录不会上传到任何服务器
- ✅ 完全离线的配置管理

## 技术栈

- 纯 HTML/CSS/JavaScript
- Marked.js (Markdown 渲染)
- 本地存储 (localStorage)
- Fetch API (HTTP 请求)

## 文件结构

```
src/
├── index.html          # 主页面
├── script.js           # 主要逻辑
├── config-manager.js   # 配置管理
├── session-manager.js  # 会话管理
├── styles.css          # 样式文件
└── markdown-test.html  # Markdown 测试页面
```

## 浏览器兼容性

支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 故障排除

### 无法连接 API
1. 检查 API Key 是否正确
2. 确认 Base URL 格式正确
3. 检查网络连接
4. 查看浏览器控制台错误信息

### CORS 错误
某些 API 提供商可能有 CORS 限制。建议使用支持跨域的 API 服务，如 SiliconFlow。

### 配置丢失
配置存储在浏览器的 localStorage 中，清除浏览器数据会导致配置丢失。

## 开发

如需修改或扩展功能，直接编辑相应的 JavaScript 文件即可。所有代码都是纯前端的，无需构建步骤。
