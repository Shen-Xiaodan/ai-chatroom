# AI Chatroom - DeepSeek V3

一个基于 Node.js 和 SiliconFlow API 的 AI 聊天室，使用 DeepSeek V3 模型。

## 🌐 在线演示

**GitHub Pages 部署**: [https://yourusername.github.io/ai-chatroom](https://yourusername.github.io/ai-chatroom)

> 注意：GitHub Pages 版本是静态演示版本，不包含后端 API 功能。完整功能请参考本地部署说明。

## 🚀 快速开始

### 方式一：在线体验（GitHub Pages）
直接访问 [GitHub Pages 演示](https://yourusername.github.io/ai-chatroom) 体验静态版本。

### 方式二：本地部署（完整功能）

#### 1. 安装依赖
```bash
npm install
```

#### 2. 配置 API Key

##### 获取 SiliconFlow API Key
1. 访问 [SiliconFlow 官网](https://siliconflow.cn/)
2. 注册并登录账户
3. 在控制台创建新的 API Key

##### 配置环境变量
1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，将 `your_siliconflow_api_key_here` 替换为你的实际 API Key：
   ```
   SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### 3. 启动服务器
```bash
npm start
```

#### 4. 访问应用
打开浏览器访问：`http://localhost:3000`

## 📋 功能特性

- ✅ **DeepSeek V3 模型** - 使用最新的 DeepSeek V3 大语言模型
- ✅ **Markdown 渲染** - AI 回复支持完整的 Markdown 格式
- ✅ **实时聊天** - 流畅的聊天体验
- ✅ **错误处理** - 智能的错误处理和重试机制
- ✅ **频率限制** - 防止 API 滥用的请求限制
- ✅ **状态监控** - 内置的系统状态检查页面
- ✅ **响应式设计** - 适配各种设备屏幕
- ✅ **安全性** - 用户输入转义，防止 XSS 攻击

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **AI API**: SiliconFlow (OpenAI 兼容)
- **模型**: deepseek-ai/DeepSeek-V3
- **前端**: 原生 HTML/CSS/JavaScript

## 📊 API 信息

- **提供商**: SiliconFlow
- **API 端点**: `https://api.siliconflow.cn/v1`
- **模型**: `deepseek-ai/DeepSeek-V3`
- **兼容性**: OpenAI API 格式

## 🔧 故障排除

### 常见问题

1. **API Key 错误**
   - 确保 `.env` 文件中的 `SILICONFLOW_API_KEY` 正确
   - 检查 API Key 是否有效且未过期

2. **429 错误（请求过于频繁）**
   - 等待指定时间后重试
   - 减慢发送消息的频率
   - 考虑升级 API 计划

3. **服务器启动失败**
   - 检查端口 3000 是否被占用
   - 确保所有依赖已正确安装

### 状态检查
访问 `http://localhost:3000/status.html` 查看系统状态和进行 API 测试。

详细的故障排除指南请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 📝 开发

### 开发模式
```bash
npm run dev
```

### 项目结构
```
ai-chatroom/
├── server.js              # 主服务器文件
├── src/                   # 前端静态文件
│   ├── index.html         # 主页面
│   ├── script.js          # 前端逻辑（支持 Markdown）
│   ├── styles.css         # 样式文件（包含 Markdown 样式）
│   ├── status.html        # 状态检查页面
│   └── markdown-test.html # Markdown 渲染测试页面
├── .env                   # 环境变量配置
├── .env.example           # 环境变量模板
└── package.json           # 项目配置
```

### Markdown 支持

AI 回复现在完全支持 Markdown 格式，包括：

- **文本格式**: 粗体、斜体、删除线
- **标题**: H1-H6 各级标题
- **列表**: 有序和无序列表，支持嵌套
- **代码**: 行内代码和代码块，支持语法高亮
- **引用**: 块引用
- **链接**: 自动链接和命名链接
- **表格**: 完整的表格支持
- **分隔线**: 水平分隔线

访问 `/markdown-test.html` 查看渲染效果示例。

## 🌐 GitHub Pages 部署

### 自动部署（推荐）

本项目已配置 GitHub Actions 自动部署到 GitHub Pages。每次推送到 `main` 分支时会自动部署。

### 手动配置 GitHub Pages

如果需要手动配置 GitHub Pages：

1. **Fork 或克隆项目到你的 GitHub 账户**

2. **进入仓库设置**
   - 在 GitHub 仓库页面，点击 `Settings` 标签
   - 在左侧菜单中找到 `Pages` 选项

3. **配置 Pages 设置**
   - **Source**: 选择 `Deploy from a branch`
   - **Branch**: 选择 `main` 分支
   - **Folder**: 选择 `/ (root)` 或 `/public` （如果你想只部署 public 文件夹）

4. **等待部署完成**
   - GitHub 会自动构建和部署你的网站
   - 部署完成后，你会看到网站的 URL：`https://yourusername.github.io/ai-chatroom`

5. **更新 README 中的链接**
   - 将 README 中的 `yourusername` 替换为你的实际 GitHub 用户名

### 部署注意事项

- **静态版本限制**: GitHub Pages 只能托管静态文件，不支持 Node.js 后端
- **API 功能**: 在线演示版本无法连接到 SiliconFlow API，仅展示界面
- **完整功能**: 要体验完整的 AI 聊天功能，请按照本地部署说明运行

### 自定义域名（可选）

如果你有自己的域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入你的域名（如：`chatroom.yourdomain.com`）
3. 在域名提供商处配置 DNS 记录指向 GitHub Pages

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果遇到问题，请：
1. 查看 [故障排除指南](./TROUBLESHOOTING.md)
2. 检查 [SiliconFlow 文档](https://docs.siliconflow.cn/)
3. 提交 Issue
