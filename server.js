require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const ServerConfigManager = require('./src/server-config');

const app = express();
const port = process.env.PORT || 3000;

// 创建配置管理器实例
const configManager = new ServerConfigManager();

// 动态创建 OpenAI 实例的函数
function createOpenAIInstance() {
  const config = configManager.getConfig();
  if (!config.apiKey || !config.baseURL) {
    return null;
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL
  });
}

app.use(express.static('src'));
app.use(express.json());
app.use(cors());

// 健康检查
app.get('/health', (req, res) => {
  const config = configManager.getPublicConfig();
  res.json({
    status: 'running',
    api: config.apiProvider,
    model: config.model,
    isConfigured: config.isConfigured,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 状态检查
app.get('/api/status', (req, res) => {
  const config = configManager.getPublicConfig();
  res.json({
    server: {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    api: {
      provider: config.apiProvider,
      model: config.model,
      baseURL: config.baseURL,
      hasApiKey: config.hasApiKey,
      isConfigured: config.isConfigured,
      rateLimits: {
        maxRequestsPerMinute: MAX_REQUESTS_PER_MINUTE,
        windowMs: RATE_LIMIT_WINDOW
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: port
    }
  });
});

// 配置管理接口
app.get('/api/config', (req, res) => {
  const config = configManager.getPublicConfig();
  res.json(config);
});

app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;

    // 验证配置
    const validation = configManager.validateConfig(newConfig);
    if (!validation.isValid) {
      return res.status(400).json({
        error: '配置验证失败',
        errors: validation.errors
      });
    }

    // 更新配置
    const updatedConfig = configManager.updateConfig(newConfig);

    res.json({
      success: true,
      message: '配置更新成功',
      config: configManager.getPublicConfig()
    });
  } catch (error) {
    res.status(500).json({
      error: '配置更新失败',
      message: error.message
    });
  }
});

app.post('/api/config/test', async (req, res) => {
  try {
    const testConfig = req.body || configManager.getConfig();
    const result = await configManager.testConnection(testConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API 连接测试失败',
      error: error.message
    });
  }
});

app.post('/api/config/reset', (req, res) => {
  try {
    configManager.resetConfig();
    res.json({
      success: true,
      message: '配置已重置',
      config: configManager.getPublicConfig()
    });
  } catch (error) {
    res.status(500).json({
      error: '配置重置失败',
      message: error.message
    });
  }
});

// 请求限制中间件
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1分钟
const MAX_REQUESTS_PER_MINUTE = 10; // 每分钟最多10个请求

const rateLimitMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, []);
  }

  const requests = requestCounts.get(clientIP);
  // 清理过期的请求记录
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (validRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      error: '请求过于频繁',
      message: '请稍后再试，每分钟最多允许10个请求',
      retryAfter: Math.ceil((validRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }

  validRequests.push(now);
  requestCounts.set(clientIP, validRequests);
  next();
};

// 重试函数
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // 如果是429错误或 rate_limit_exceeded 错误且还有重试次数
      if ((error.status === 429 || error.code === 'rate_limit_exceeded') && attempt < maxRetries) {
        // OpenAI API 错误格式处理
        let waitTime = baseDelay * Math.pow(2, attempt - 1); // 指数退避

        // 检查是否有 Retry-After 头部
        if (error.headers && error.headers['retry-after']) {
          const retryAfter = parseInt(error.headers['retry-after']);
          if (!isNaN(retryAfter)) {
            waitTime = Math.max(waitTime, retryAfter * 1000);
          }
        }

        console.log(`API请求失败，${waitTime/1000}秒后重试 (尝试 ${attempt}/${maxRetries})`);
        console.log('错误详情:', error.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}

// 聊天接口
app.post('/api/chat', rateLimitMiddleware, async (req, res) => {
  if (!req.body || !req.body.message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 检查配置是否完整
  if (!configManager.isConfigured()) {
    return res.status(400).json({
      error: '系统未配置',
      message: '请先配置 API 信息',
      needsConfig: true
    });
  }

  try {
    const config = configManager.getConfig();
    const openai = createOpenAIInstance();

    if (!openai) {
      return res.status(500).json({
        error: 'API 配置错误',
        message: '无法创建 API 客户端'
      });
    }

    const userInput = req.body.message;
    const conversationHistory = req.body.history || []; // 接收会话历史

    // 构建消息数组，包含会话历史
    const messages = [];

    // 添加系统提示（可选）
    messages.push({
      role: 'system',
      content: '你是一个有用的AI助手。请用中文回答问题，并尽可能提供详细和准确的信息。'
    });

    // 添加会话历史（最多保留最近10轮对话以控制token使用）
    const recentHistory = conversationHistory.slice(-20); // 最近20条消息（10轮对话）
    recentHistory.forEach(msg => {
      if (msg.type === 'user') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.type === 'ai') {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    });

    // 添加当前用户输入
    messages.push({
      role: 'user',
      content: userInput
    });

    const result = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false
      });
    });

    const response = result.choices[0].message.content;

    res.json({
      response: response,
      meta: {
        model: config.model,
        api: config.apiProvider,
        usage: result.usage,
        messageCount: messages.length
      }
    });

  } catch (error) {
    console.error('SiliconFlow API Error:', error);

    // 特殊处理429错误
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      let retryAfter = '30s';

      // 检查 Retry-After 头部
      if (error.headers && error.headers['retry-after']) {
        retryAfter = `${error.headers['retry-after']}s`;
      }

      return res.status(429).json({
        error: 'API请求频率限制',
        message: '请求过于频繁，请稍后重试',
        retryAfter: retryAfter,
        tips: [
          '1. 等待指定时间后重试',
          '2. 检查是否达到API配额限制',
          '3. 考虑升级到付费计划以获得更高配额'
        ]
      });
    }

    res.status(500).json({
      error: 'SiliconFlow API调用失败',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        status: error.status,
        code: error.code
      } : undefined,
      tips: '请检查 API Key 是否正确或稍后重试'
    });
  }
});

app.listen(port, () => {
  const config = configManager.getConfig();
  console.log(`Server running at http://localhost:${port}`);

  if (config.isConfigured) {
    console.log(`Using ${config.apiProvider} API with ${config.model} model`);
    console.log(`API Base URL: ${config.baseURL}`);
    console.log('✅ API 配置已完成');
  } else {
    console.log('⚠️  API 未配置，请在浏览器中完成配置');
    console.log('📝 访问 http://localhost:' + port + ' 进行配置');
  }
});
