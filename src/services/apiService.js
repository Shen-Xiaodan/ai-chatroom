/**
 * AI API 服务模块
 * 支持多种 AI API 提供商的统一接口
 */

class APIService {
  constructor() {
    this.abortController = null;
  }

  /**
   * 发送消息到 AI 模型
   * @param {Array} messages - 消息历史数组
   * @param {Object} config - API 配置
   * @returns {Promise<string>} AI 回复
   */
  async sendMessage(messages, config) {
    const { apiKey, baseUrl, model, maxTokens, temperature } = config;

    if (!apiKey || !baseUrl || !model) {
      throw new Error('API 配置不完整，请检查 API Key、Base URL 和模型名称');
    }

    // 创建新的 AbortController 用于取消请求
    this.abortController = new AbortController();

    try {
      // 构建请求体
      const requestBody = {
        model: model,
        messages: this.formatMessages(messages),
        max_tokens: maxTokens || 2048,
        temperature: temperature || 0.7,
        stream: false
      };

      // 发送请求
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(this.getErrorMessage(response.status, errorData));
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 响应格式错误');
      }

      return data.choices[0].message.content;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求已取消');
      }
      throw error;
    }
  }

  /**
   * 格式化消息数组为 API 所需格式
   * @param {Array} messages - 原始消息数组
   * @returns {Array} 格式化后的消息数组
   */
  formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.sender === 'User' ? 'user' : 'assistant',
      content: msg.text
    }));
  }

  /**
   * 根据错误状态码返回友好的错误信息
   * @param {number} status - HTTP 状态码
   * @param {Object} errorData - 错误响应数据
   * @returns {string} 错误信息
   */
  getErrorMessage(status, errorData) {
    const errorMessage = errorData.error?.message || errorData.message || '';
    
    switch (status) {
      case 400:
        return `请求参数错误: ${errorMessage}`;
      case 401:
        return 'API Key 无效或已过期，请检查您的 API Key';
      case 403:
        return 'API Key 权限不足，请检查您的账户权限';
      case 404:
        return '模型不存在或 API 端点错误，请检查模型名称和 Base URL';
      case 429:
        return 'API 调用频率超限，请稍后重试';
      case 500:
        return 'API 服务器内部错误，请稍后重试';
      case 502:
      case 503:
      case 504:
        return 'API 服务暂时不可用，请稍后重试';
      default:
        return `API 请求失败 (${status}): ${errorMessage || '未知错误'}`;
    }
  }

  /**
   * 测试 API 连接
   * @param {Object} config - API 配置
   * @returns {Promise<boolean>} 连接是否成功
   */
  async testConnection(config) {
    try {
      const testMessages = [
        { sender: 'User', text: 'Hello', time: new Date().toISOString() }
      ];
      
      await this.sendMessage(testMessages, config);
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 取消当前请求
   */
  cancelRequest() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// 创建单例实例
const apiService = new APIService();

export default apiService;
