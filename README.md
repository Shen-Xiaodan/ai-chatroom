# AI Chatroom - GitHub Pages 静态版本

🎉 这是一个可以直接在GitHub Pages上运行的AI聊天室静态版本！

## ✨ 特性

- 🤖 **多AI支持**: 支持DeepSeek、OpenAI、SiliconFlow等多种AI提供商
- 💬 **多会话管理**: 支持创建和管理多个对话会话
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🔒 **隐私保护**: 所有配置和聊天记录仅保存在浏览器本地
- 🚀 **无需服务器**: 直接调用AI API，无需后端服务器
- 📝 **Markdown支持**: 支持Markdown格式的消息渲染

## 🌐 在线体验

访问: [https://your-username.github.io/ai-chatroom](https://your-username.github.io/ai-chatroom)

## 🚀 快速开始

### 1. 配置API信息

首次访问时，系统会提示您配置API信息：

1. 点击右上角的 ⚙️ 设置按钮
2. 选择API提供商（推荐SiliconFlow）
3. 输入您的API Key
4. 选择模型
5. 保存配置

### 2. 获取API Key

#### SiliconFlow (推荐)
- 访问 [SiliconFlow](https://siliconflow.cn/)
- 注册账号并获取API Key
- 支持DeepSeek V3等最新模型

#### OpenAI
- 访问 [OpenAI Platform](https://platform.openai.com/)
- 创建API Key

### 3. 开始聊天

配置完成后，您就可以开始与AI对话了！

## 📁 项目结构

```
├── index.html          # 主页面
├── script.js           # 主要JavaScript逻辑
├── config-manager.js   # 配置管理
├── session-manager.js  # 会话管理
├── styles.css          # 样式文件
├── status.html         # 状态页面
├── markdown-test.html  # Markdown测试页面
└── README.md          # 说明文档
```

## 🔧 本地开发

如果您想在本地运行或修改代码：

```bash
# 克隆仓库
git clone https://github.com/your-username/ai-chatroom.git
cd ai-chatroom

# 切换到gh-pages分支
git checkout gh-pages

# 使用任何HTTP服务器运行
# 例如使用Python
python -m http.server 8000

# 或使用Node.js
npx serve .
```

然后访问 `http://localhost:8000`

## 🛠️ 部署到GitHub Pages

### 方法1: 使用现有仓库

1. Fork这个仓库
2. 在仓库设置中启用GitHub Pages
3. 选择`gh-pages`分支作为源
4. 访问 `https://your-username.github.io/ai-chatroom`

### 方法2: 创建新仓库

1. 创建新的GitHub仓库
2. 将`gh-pages`分支的文件复制到新仓库
3. 在设置中启用GitHub Pages
4. 选择主分支作为源

## 🔒 隐私说明

- ✅ 所有配置信息仅保存在您的浏览器本地存储中
- ✅ 聊天记录不会上传到任何服务器
- ✅ 直接与AI API通信，无中间服务器
- ⚠️ 请妥善保管您的API Key

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Marked.js](https://marked.js.org/) - Markdown解析
- [SiliconFlow](https://siliconflow.cn/) - AI API服务
- [OpenAI](https://openai.com/) - AI API服务
