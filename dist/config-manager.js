/**
 * 配置管理器 - 负责管理 API 配置的存储、加载和验证（纯前端版本）
 */
class ConfigManager {
  constructor() {
    this.storageKey = 'ai-chatroom-config';
    this.defaultConfig = {
      apiProvider: 'siliconflow',
      apiKey: '',
      baseURL: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3',
      maxTokens: 2048,
      temperature: 0.7,
      isConfigured: false
    };

    this.config = { ...this.defaultConfig };
    this.loadFromStorage();
  }

  /**
   * 从本地存储加载配置
   */
  loadFromStorage() {
    try {
      const savedConfig = localStorage.getItem(this.storageKey);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...this.defaultConfig, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  /**
   * 保存配置到本地存储
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
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
   * 更新配置
   */
  updateConfig(newConfig) {
    // 验证配置
    const validation = this.validateConfig(newConfig);
    if (!validation.isValid) {
      throw new Error('配置验证失败: ' + validation.errors.join(', '));
    }

    // 更新配置
    this.config = {
      ...this.config,
      ...newConfig,
      isConfigured: true
    };

    this.saveToStorage();
    return this.config;
  }

  /**
   * 重置配置
   */
  resetConfig() {
    this.config = { ...this.defaultConfig };
    this.saveToStorage();
    return this.config;
  }

  /**
   * 检查是否已配置
   */
  isConfigured() {
    return this.config.isConfigured && 
           this.config.apiKey && 
           this.config.baseURL && 
           this.config.model;
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
   * 获取预设配置
   */
  getPresets() {
    return {
      siliconflow: {
        name: 'SiliconFlow',
        baseURL: 'https://api.siliconflow.cn/v1',
        models: [
          'deepseek-ai/DeepSeek-V3',
          'Qwen/Qwen2.5-72B-Instruct',
          'meta-llama/Meta-Llama-3.1-70B-Instruct',
          'microsoft/WizardLM-2-8x22B'
        ]
      },
      openai: {
        name: 'OpenAI',
        baseURL: 'https://api.openai.com/v1',
        models: [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-3.5-turbo'
        ]
      },
      custom: {
        name: '自定义',
        baseURL: '',
        models: []
      }
    };
  }

  /**
   * 导出配置
   */
  exportConfig() {
    const exportData = {
      ...this.config,
      exportTime: new Date().toISOString(),
      version: '1.0'
    };

    // 不导出敏感信息
    delete exportData.apiKey;

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(jsonData) {
    try {
      const importedConfig = JSON.parse(jsonData);

      // 验证导入的配置
      const validation = this.validateConfig(importedConfig);
      if (!validation.isValid) {
        throw new Error('导入的配置无效: ' + validation.errors.join(', '));
      }

      // 合并配置（保留当前的 API Key）
      const currentApiKey = this.config.apiKey;
      this.config = {
        ...this.defaultConfig,
        ...importedConfig,
        apiKey: currentApiKey, // 保留当前的 API Key
        isConfigured: !!currentApiKey
      };

      this.saveToStorage();
      return this.config;
    } catch (error) {
      throw new Error('配置导入失败: ' + error.message);
    }
  }

  /**
   * 测试API连接（前端版本）
   */
  async testConnection(testConfig = this.config) {
    try {
      // 验证配置
      const validation = this.validateConfig(testConfig);
      if (!validation.isValid) {
        return {
          success: false,
          message: '配置验证失败: ' + validation.errors.join(', ')
        };
      }

      // 发送测试请求
      const response = await fetch(testConfig.baseURL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testConfig.apiKey}`
        },
        body: JSON.stringify({
          model: testConfig.model,
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message.'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: `API调用失败 (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`
        };
      }

      const data = await response.json();

      return {
        success: true,
        message: 'API连接测试成功！',
        data: {
          model: data.model,
          usage: data.usage
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `连接测试失败: ${error.message}`
      };
    }
  }
}

// 创建全局实例
window.configManager = new ConfigManager();

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigManager;
}
