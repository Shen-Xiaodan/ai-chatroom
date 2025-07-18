# AI Chatroom - DeepSeek V3

一个基于 Node.js 和 SiliconFlow API 的 AI 聊天室，使用 DeepSeek V3 模型。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 API Key

#### 获取 SiliconFlow API Key
1. 访问 [SiliconFlow 官网](https://siliconflow.cn/)
2. 注册并登录账户
3. 在控制台创建新的 API Key

#### 配置环境变量
1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，将 `your_siliconflow_api_key_here` 替换为你的实际 API Key：
   ```
   SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. 启动服务器
```bash
npm start
```

### 4. 访问应用
打开浏览器访问：`http://localhost:3000`

## 📋 功能特性

- ✅ **DeepSeek V3 模型** - 使用最新的 DeepSeek V3 大语言模型
- ✅ **实时聊天** - 流畅的聊天体验
- ✅ **错误处理** - 智能的错误处理和重试机制
- ✅ **频率限制** - 防止 API 滥用的请求限制
- ✅ **状态监控** - 内置的系统状态检查页面
- ✅ **响应式设计** - 适配各种设备屏幕

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
├── server.js          # 主服务器文件
├── public/            # 前端静态文件
│   ├── index.html     # 主页面
│   ├── script.js      # 前端逻辑
│   ├── styles.css     # 样式文件
│   └── status.html    # 状态检查页面
├── .env               # 环境变量配置
├── .env.example       # 环境变量模板
└── package.json       # 项目配置
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果遇到问题，请：
1. 查看 [故障排除指南](./TROUBLESHOOTING.md)
2. 检查 [SiliconFlow 文档](https://docs.siliconflow.cn/)
3. 提交 Issue
