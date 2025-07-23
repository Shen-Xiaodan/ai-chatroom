# AI Chatroom - 纯前端版

一个完全基于前端的 AI 聊天室应用，无需后端服务器，可直接作为静态文件部署。

## ✨ 特性

- 🔒 **隐私保护**: 所有配置和聊天记录仅存储在本地浏览器中
- 🌐 **纯前端**: 无需后端服务器，可直接部署到任何静态文件托管服务
- 🔑 **API 兼容**: 支持 OpenAI 兼容的 API（如 SiliconFlow、OpenAI 等）
- 💬 **会话管理**: 支持多个聊天会话，自动保存聊天历史
- 📝 **Markdown 支持**: 完整的 Markdown 渲染支持，支持代码高亮
- 🎨 **现代界面**: 响应式设计，支持移动设备，优雅的用户体验
- ⚡ **即开即用**: 无需安装，直接在浏览器中使用
- 🔧 **模块化设计**: 代码结构清晰，易于维护和扩展
- 🚀 **自动化构建**: 支持一键构建和部署
- 🔄 **智能重试**: 自动处理网络错误和API限制

## 🚀 在线演示

**GitHub Pages**: [https://shen-xiaodan.github.io/ai-chatroom/](https://shen-xiaodan.github.io/ai-chatroom/)

## 🎯 快速开始

### 方式一：在线使用
直接访问 [GitHub Pages 演示](https://shen-xiaodan.github.io/ai-chatroom/) 即可使用。

### 方式二：本地开发
1. 克隆此仓库：`git clone https://github.com/Shen-Xiaodan/ai-chatroom.git`
2. 进入项目目录：`cd ai-chatroom`
3. 安装依赖：`npm install`
4. 启动开发服务器：`npm start`
5. 浏览器会自动打开 `http://localhost:3000`

### 方式三：本地直接使用
1. 下载项目源码
2. 用浏览器直接打开 `src/index.html` 文件
3. 配置您的 API 信息即可开始使用

### 方式四：部署到其他平台
1. 运行构建命令：`npm run build`
2. 将 `dist` 目录下的文件上传到静态托管服务：
   - Netlify
   - Vercel
   - GitHub Pages
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
ai-chatroom/
├── src/                    # 源代码目录
│   ├── index.html          # 主页面
│   ├── script.js           # 主要逻辑和UI控制
│   ├── api-client.js       # API客户端和请求处理
│   ├── config-manager.js   # 配置管理和存储
│   ├── session-manager.js  # 会话和消息管理
│   ├── message-manager.js  # 消息处理和渲染
│   ├── config-ui.js        # 配置界面管理
│   ├── state-manager.js    # 应用状态管理
│   ├── ui-utils.js         # UI工具函数
│   └── styles.css          # 样式文件
├── build/                  # 构建脚本
│   └── build.js            # 自动化构建脚本
├── dist/                   # 构建输出目录（部署用）
├── package.json            # 项目配置和依赖
└── README.md               # 项目说明文档
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

- **前端框架**: 纯 HTML/CSS/JavaScript (ES6+)
- **Markdown 渲染**: Marked.js (CDN 引入)
- **数据存储**: localStorage (浏览器本地存储)
- **HTTP 请求**: Fetch API (原生支持)
- **模块化**: ES6 类和模块化设计
- **构建工具**: Node.js 构建脚本
- **部署**: GitHub Pages / 静态文件托管

## 📋 可用脚本

```bash
npm start          # 启动开发服务器 (http://localhost:3000)
npm run dev        # 同上，启动开发服务器
npm run build      # 构建项目到 dist 目录
npm run deploy     # 构建并部署到 GitHub Pages
```

## 🚀 开发和部署

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/Shen-Xiaodan/ai-chatroom.git
cd ai-chatroom

# 安装依赖
npm install

# 启动开发服务器
npm start
# 或者
npm run dev
```

### 构建和部署
```bash
# 构建项目
npm run build

# 部署到 GitHub Pages
npm run deploy
```

### 部署到 GitHub Pages

#### 自动部署（推荐）
1. Fork 此仓库到您的 GitHub 账号
2. 在仓库设置中启用 GitHub Pages
3. 选择 GitHub Actions 作为源
4. 推送代码后会自动部署

#### 手动部署
1. 运行 `npm run build` 构建项目
2. 运行 `npm run deploy` 部署到 gh-pages 分支
3. 在仓库设置中启用 GitHub Pages
4. 选择 `gh-pages` 分支作为源

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

**模块加载错误**
- 确保所有 JavaScript 文件都在同一目录下
- 检查浏览器控制台是否有错误信息
- 尝试刷新页面或清除浏览器缓存

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔄 更新日志

### v2.1.0 (当前版本)
- 🏗️ **架构重构**: 采用模块化设计，代码结构更清晰
- 🔧 **构建系统**: 添加自动化构建和部署脚本
- 🎯 **API客户端**: 独立的API客户端模块，支持智能重试
- 🎨 **UI优化**: 改进用户界面和交互体验
- 📱 **响应式**: 更好的移动端适配
- 🔄 **状态管理**: 统一的应用状态管理
- 🛠️ **开发体验**: 支持本地开发服务器

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
