/**
 * 服务器端配置管理器
 */
const fs = require('fs');
const path = require('path');

class ServerConfigManager {
  constructor() {
    this.configFile = path.join(__dirname, '..', 'runtime-config.json');
    this.defaultConfig = {
      apiProvider: 'siliconflow',
      apiKey: process.env.SILICONFLOW_API_KEY || '',
      baseURL: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3',
      maxTokens: 2048,
      temperature: 0.7,
      isConfigured: false
    };
    
    this.config = { ...this.defaultConfig };
    this.loadConfig();
  }

  /**
   * 加载配置
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const configData = fs.readFileSync(this.configFile, 'utf8');
        const savedConfig = JSON.parse(configData);
        this.config = { ...this.defaultConfig, ...savedConfig };
      }
      
      // 如果有环境变量中的 API Key，使用它
      if (process.env.SILICONFLOW_API_KEY && !this.config.apiKey) {
        this.config.apiKey = process.env.SILICONFLOW_API_KEY;
        this.config.isConfigured = true;
      }
      
      // 检查配置是否完整
      this.config.isConfigured = this.isConfigured();
      
    } catch (error) {
      console.error('Failed to load runtime config:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  /**
   * 保存配置
   */
  saveConfig() {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save runtime config:', error);
      throw new Error('配置保存失败');
    }
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 获取公开配置（不包含敏感信息）
   */
  getPublicConfig() {
    const config = { ...this.config };
    // 隐藏 API Key，只显示是否已设置
    config.hasApiKey = !!config.apiKey;
    delete config.apiKey;
    return config;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    // 验证必要字段
    if (!newConfig.apiKey || !newConfig.baseURL || !newConfig.model) {
      throw new Error('API Key、Base URL 和模型名称都是必填项');
    }

    // 验证 URL 格式
    try {
      new URL(newConfig.baseURL);
    } catch (error) {
      throw new Error('Base URL 格式不正确');
    }

    // 更新配置
    this.config = {
      ...this.config,
      ...newConfig,
      isConfigured: true
    };

    this.saveConfig();
    return this.config;
  }

  /**
   * 检查是否已配置
   */
  isConfigured() {
    return !!(this.config.apiKey && 
              this.config.baseURL && 
              this.config.model);
  }

  /**
   * 验证配置
   */
  validateConfig(config = this.config) {
    const errors = [];

    if (!config.apiKey) {
      errors.push('API Key 不能为空');
    }

    if (!config.baseURL) {
      errors.push('Base URL 不能为空');
    } else {
      try {
        new URL(config.baseURL);
      } catch (error) {
        errors.push('Base URL 格式不正确');
      }
    }

    if (!config.model) {
      errors.push('模型名称不能为空');
    }

    if (config.maxTokens && (config.maxTokens < 1 || config.maxTokens > 8192)) {
      errors.push('最大 Token 数量应在 1-8192 之间');
    }

    if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('温度值应在 0-2 之间');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 重置配置
   */
  resetConfig() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
    return this.config;
  }

  /**
   * 测试 API 连接
   */
  async testConnection(config = this.config) {
    const OpenAI = require('openai');
    
    try {
      const openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL
      });

      // 发送一个简单的测试请求
      const response = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });

      return {
        success: true,
        message: 'API 连接测试成功',
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      return {
        success: false,
        message: 'API 连接测试失败',
        error: error.message,
        status: error.status
      };
    }
  }
}

module.exports = ServerConfigManager;
