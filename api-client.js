/**
 * API客户端 - 负责与AI API的通信
 */
class APIClient {
  constructor(configManager, uiUtils) {
    this.configManager = configManager;
    this.uiUtils = uiUtils;
  }

  /**
   * 重试函数（带指数退避）
   */
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fn();

        // 如果是429错误且还有重试次数
        if (response.status === 429 && attempt < maxRetries) {
          // 指数退避
          let waitTime = baseDelay * Math.pow(2, attempt - 1);

          // 检查是否有 Retry-After 头部
          const retryAfter = response.headers.get('retry-after');
          if (retryAfter) {
            const retrySeconds = parseInt(retryAfter);
            if (!isNaN(retrySeconds)) {
              waitTime = Math.max(waitTime, retrySeconds * 1000);
            }
          }

          console.log(`API请求被限制，${waitTime/1000}秒后重试 (尝试 ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        return response;
      } catch (error) {
        // 网络错误或其他错误
        if (attempt < maxRetries) {
          const waitTime = baseDelay * Math.pow(2, attempt - 1);
          console.log(`请求失败，${waitTime/1000}秒后重试 (尝试 ${attempt}/${maxRetries})`);
          console.log('错误详情:', error.message);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * 构建消息数组
   */
  buildMessages(userMessage, history = []) {
    const messages = [];

    // 添加系统提示（可选）
    messages.push({
      role: 'system',
      content: '你是一个有用的AI助手。请用中文回答问题，并尽可能提供详细和准确的信息。'
    });

    // 添加会话历史（最多保留最近10轮对话以控制token使用）
    const recentHistory = history.slice(-20); // 最近20条消息（10轮对话）
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
      content: userMessage
    });

    return messages;
  }

  /**
   * 发送聊天请求
   */
  async sendChatRequest(userMessage, history = []) {
    // 检查配置是否完整
    if (!this.configManager.isConfigured()) {
      throw new Error('系统未配置，请先配置 API 信息才能开始对话。');
    }

    const config = this.configManager.getConfig();
    const messages = this.buildMessages(userMessage, history);

    // 发送请求到API
    const response = await this.retryWithBackoff(async () => {
      return await fetch(config.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: false
        })
      });
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        // 处理频率限制错误
        const retryAfter = errorData.retry_after || 30;
        const retrySeconds = typeof retryAfter === 'string' ? parseInt(retryAfter.replace('s', '')) : retryAfter;
        
        throw new Error(`请求过于频繁，请等待 ${retrySeconds}s 后重试。\n\n💡 建议：\n• 减慢发送消息的频率\n• 等待指定时间后重试\n• 如果经常遇到此问题，可能需要升级API计划`);
      }

      throw new Error(`HTTP ${response.status}: ${errorData.error?.message || errorData.message || 'API调用失败'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * 测试API连接
   */
  async testConnection(config) {
    try {
      const testMessages = [
        {
          role: 'system',
          content: '你是一个AI助手。'
        },
        {
          role: 'user',
          content: '你好，请简单回复一下。'
        }
      ];

      const response = await fetch(config.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: testMessages,
          temperature: 0.7,
          max_tokens: 50,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        let errorMessage = 'API连接失败';
        
        switch (response.status) {
          case 401:
            errorMessage = 'API Key 无效或已过期';
            break;
          case 403:
            errorMessage = 'API Key 权限不足';
            break;
          case 404:
            errorMessage = 'API 端点不存在，请检查 Base URL';
            break;
          case 429:
            errorMessage = '请求频率过高，请稍后重试';
            break;
          case 500:
            errorMessage = 'API 服务器内部错误';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'API 服务暂时不可用';
            break;
          default:
            errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }

      const data = await response.json();
      
      // 检查响应格式
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return {
          success: false,
          message: 'API 响应格式异常'
        };
      }

      return {
        success: true,
        message: 'API 连接测试成功',
        response: data.choices[0].message.content
      };

    } catch (error) {
      console.error('API测试失败:', error);
      
      let errorMessage = '连接测试失败';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络或 Base URL';
      } else if (error.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接';
      } else {
        errorMessage = error.message || '未知错误';
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * 处理频率限制错误的UI反馈
   */
  handleRateLimitError(retrySeconds, sendBtn, userInput) {
    // 禁用发送按钮一段时间
    sendBtn.disabled = true;
    userInput.disabled = true;

    let countdown = retrySeconds;
    const countdownInterval = setInterval(() => {
      sendBtn.textContent = `等待 ${countdown}s`;
      countdown--;

      if (countdown < 0) {
        clearInterval(countdownInterval);
        sendBtn.disabled = false;
        userInput.disabled = false;
        sendBtn.textContent = '发送';
        userInput.focus();
      }
    }, 1000);

    return countdownInterval;
  }

  /**
   * 获取模型列表（如果API支持）
   */
  async getModels() {
    try {
      const config = this.configManager.getConfig();
      
      if (!config.apiKey || !config.baseURL) {
        throw new Error('API配置不完整');
      }

      const response = await fetch(config.baseURL + '/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map(model => model.id || model.name).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.warn('获取模型列表失败:', error);
      return [];
    }
  }

  /**
   * 检查API健康状态
   */
  async checkHealth() {
    try {
      const config = this.configManager.getConfig();
      
      if (!config.baseURL) {
        return { healthy: false, message: 'Base URL 未配置' };
      }

      // 尝试访问根路径或健康检查端点
      const response = await fetch(config.baseURL, {
        method: 'GET',
        timeout: 5000
      });

      return {
        healthy: response.ok,
        status: response.status,
        message: response.ok ? 'API 服务正常' : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: error.message || '无法连接到API服务'
      };
    }
  }

  /**
   * 估算token使用量（简单估算）
   */
  estimateTokens(text) {
    // 简单的token估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
    const otherChars = text.length - chineseChars;
    
    return Math.ceil(chineseChars * 1.5 + englishWords + otherChars * 0.5);
  }

  /**
   * 计算消息历史的总token数
   */
  calculateHistoryTokens(history) {
    return history.reduce((total, msg) => {
      return total + this.estimateTokens(msg.content);
    }, 0);
  }

  /**
   * 优化消息历史（控制token使用）
   */
  optimizeHistory(history, maxTokens = 3000) {
    if (!history || history.length === 0) return [];
    
    let totalTokens = 0;
    const optimizedHistory = [];
    
    // 从最新的消息开始，向前添加直到达到token限制
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const msgTokens = this.estimateTokens(msg.content);
      
      if (totalTokens + msgTokens > maxTokens) {
        break;
      }
      
      optimizedHistory.unshift(msg);
      totalTokens += msgTokens;
    }
    
    return optimizedHistory;
  }
}

// 导出到全局作用域
window.APIClient = APIClient;
