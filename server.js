require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors'); // 可选：如果需要跨域请求

const app = express();
const port = process.env.PORT || 3000;

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 中间件
app.use(express.static('public')); // 提供静态文件
app.use(express.json()); // 解析 JSON 请求体
app.use(cors()); // 启用 CORS（可选）

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// 聊天端点
app.post('/api/chat', async (req, res) => {
  // 验证请求体
  if (!req.body || !req.body.message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const { message, chatHistory = [] } = req.body;

    // 构建消息历史（包括系统消息）
    const messages = [
      { 
        role: 'system', 
        content: 'You are a helpful AI assistant. Respond in the same language as the user.'
      },
      ...chatHistory,
      { role: 'user', content: message }
    ];

    // 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // 获取 AI 回复
    const aiResponse = completion.choices[0].message.content;

    // 返回响应
    res.json({ 
      response: aiResponse,
      usage: completion.usage,
      model: completion.model,
      id: completion.id
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);

    // 更详细的错误处理
    let statusCode = 500;
    let errorMessage = 'Failed to get AI response';

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data.error?.message || errorMessage;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Using OpenAI model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
});