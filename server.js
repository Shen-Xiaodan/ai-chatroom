require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// 使用 Gemini API Key（推荐写在 .env 文件中）
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    api: 'google-gemini',
    model: 'gemini-pro' 
  });
});

// 聊天接口
app.post('/api/chat', async (req, res) => {
  if (!req.body || !req.body.message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const userInput = req.body.message;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const chat = model.startChat({ history: [] }); // 也可以保留聊天历史用于上下文对话
    const result = await chat.sendMessage(userInput);
    const response = result.response.text();

    res.json({
      response: response,
      meta: {
        model: 'gemini-pro',
        api: 'google-gemini'
      }
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: 'Gemini API调用失败',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined,
      tips: '请检查 API Key 是否正确或稍后重试'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Using Google Gemini API');
});
