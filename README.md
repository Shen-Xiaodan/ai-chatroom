# AI Chatroom - 纯前端版

一个完全基于前端的 AI 聊天室应用，无需后端服务器，可直接作为静态文件部署。

## ✨ 特性

- 🔒 **隐私保护**: 所有配置和聊天记录仅存储在本地浏览器中
- 🌐 **纯前端**: 无需后端服务器，可直接部署到任何静态文件托管服务
- 🔑 **API 兼容**: 支持 OpenAI 兼容的 API（如 SiliconFlow、OpenAI 等）
- 💬 **会话管理**: 支持多个聊天会话，自动保存聊天历史
- 📝 **Markdown 支持**: 完整的 Markdown 渲染支持
- 🎨 **现代界面**: 响应式设计，支持移动设备
- ⚡ **即开即用**: 无需安装，直接在浏览器中使用

## 🚀 在线演示

**GitHub Pages**: [https://shen-xiaodan.github.io/ai-chatroom/](https://shen-xiaodan.github.io/ai-chatroom/)

## 🎯 快速开始

### 方式一：在线使用
直接访问 [GitHub Pages 演示](https://shen-xiaodan.github.io/ai-chatroom/) 即可使用。

### 方式二：本地使用
1. 下载或克隆此仓库
2. 用浏览器打开 `src/index.html` 文件
3. 配置您的 API 信息即可开始使用

### 方式三：部署到其他平台
将 `src` 目录下的所有文件上传到任何静态文件托管服务：
- Netlify
- Vercel
- 或任何支持静态文件的服务器

## 📖 使用说明

### 1. 配置 API
首次使用时，需要配置 API 信息：
1. 点击右上角的 ⚙️ 设置按钮
2. 选择 API 提供商（推荐 SiliconFlow）
3. 输入您的 API Key
4. 选择模型名称
5. 点击"测试连接"验证配置
6. 保存配置

### 2. 获取 API Key

#### SiliconFlow（推荐）
- 访问 [SiliconFlow](https://siliconflow.cn/)
- 注册账号并获取免费 API Key
- 支持多种开源模型，价格便宜

#### OpenAI
- 访问 [OpenAI Platform](https://platform.openai.com/)
- 创建 API Key
- 支持 GPT-4、GPT-3.5 等模型

### 3. 开始聊天
配置完成后，您就可以：
- 发送消息与 AI 对话
- 创建多个会话
- 查看聊天历史
- 编辑和重新生成消息

## 📁 项目结构

```
src/
├── index.html          # 主页面
├── script.js           # 主要逻辑
├── config-manager.js   # 配置管理
├── session-manager.js  # 会话管理
├── styles.css          # 样式文件
├── markdown-test.html  # Markdown 测试页面
├── test.html           # 功能测试页面
├── README.md           # 使用说明
├── DEPLOYMENT.md       # 部署指南
└── example-config.json # 配置示例
```

## 🔒 隐私保护

- ✅ 所有数据仅存储在您的浏览器本地
- ✅ API Key 安全存储在 localStorage 中
- ✅ 聊天记录不会上传到任何服务器
- ✅ 完全离线的配置管理
- ✅ 无需注册账号

## 🌐 浏览器兼容性

支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🛠️ 技术栈

- 纯 HTML/CSS/JavaScript
- Marked.js (Markdown 渲染)
- 本地存储 (localStorage)
- Fetch API (HTTP 请求)

## 🚀 部署到 GitHub Pages

### 自动部署（推荐）
1. Fork 此仓库到您的 GitHub 账号
2. 在仓库设置中启用 GitHub Pages
3. 选择 GitHub Actions 作为源
4. 推送代码后会自动部署

### 手动部署
1. 将 `src` 目录下的文件复制到 `gh-pages` 分支
2. 在仓库设置中启用 GitHub Pages
3. 选择 `gh-pages` 分支作为源

详细部署指南请查看 [src/DEPLOYMENT.md](src/DEPLOYMENT.md)

## ❓ 故障排除

### 常见问题

**无法连接 API**
- 检查 API Key 是否正确
- 确认 Base URL 格式正确
- 检查网络连接

**CORS 错误**
- 使用支持跨域的 API 服务（如 SiliconFlow）
- 避免使用不支持 CORS 的 API

**配置丢失**
- 配置存储在浏览器 localStorage 中
- 清除浏览器数据会导致配置丢失
- 建议定期备份配置

更多问题请查看 [故障排除指南](src/README.md#故障排除)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔄 更新日志

### v2.0.0 (纯前端版)
- ✨ 重构为纯前端应用
- 🔒 增强隐私保护
- 🚀 支持静态部署
- 📱 优化移动端体验

### v1.0.0 (原版)
- 🎉 初始版本
- 💬 基本聊天功能
- 🔧 后端 API 代理

---

**开始使用**: [在线演示](https://shen-xiaodan.github.io/ai-chatroom/) | [下载源码](https://github.com/Shen-Xiaodan/ai-chatroom/archive/main.zip)
