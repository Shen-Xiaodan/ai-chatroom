/**
 * 配置UI管理器 - 负责配置界面的显示和交互
 */
class ConfigUI {
  constructor(configManager, apiClient, uiUtils) {
    this.configManager = configManager;
    this.apiClient = apiClient;
    this.uiUtils = uiUtils;
    
    // 获取DOM元素
    this.initializeElements();
    
    // 绑定事件
    this.bindEvents();
  }

  /**
   * 初始化DOM元素
   */
  initializeElements() {
    // 配置相关元素
    this.settingsBtn = document.getElementById('settings-btn');
    this.configModal = document.getElementById('config-modal');
    this.welcomeConfigModal = document.getElementById('welcome-config-modal');
    this.closeConfigModal = document.getElementById('close-config-modal');
    this.startConfigBtn = document.getElementById('start-config');
    this.configStatusElement = document.getElementById('config-status');
    this.aiNameElement = document.getElementById('ai-name');

    // 配置表单元素
    this.apiProviderSelect = document.getElementById('api-provider');
    this.apiKeyInput = document.getElementById('api-key');
    this.baseUrlInput = document.getElementById('base-url');
    this.modelNameSelect = document.getElementById('model-name');
    this.customModelInput = document.getElementById('custom-model');
    this.maxTokensInput = document.getElementById('max-tokens');
    this.temperatureInput = document.getElementById('temperature');
    this.toggleApiKeyBtn = document.getElementById('toggle-api-key');
    this.testConfigBtn = document.getElementById('test-config');
    this.resetConfigBtn = document.getElementById('reset-config');
    this.saveConfigBtn = document.getElementById('save-config');
    this.configStatusMessage = document.getElementById('config-status-message');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 设置按钮
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener('click', () => this.showConfigModal());
    }

    // 关闭模态框
    if (this.closeConfigModal) {
      this.closeConfigModal.addEventListener('click', () => this.hideConfigModal());
    }

    // 开始配置按钮
    if (this.startConfigBtn) {
      this.startConfigBtn.addEventListener('click', () => {
        this.hideWelcomeConfigModal();
        this.showConfigModal();
      });
    }

    // API 提供商选择
    if (this.apiProviderSelect) {
      this.apiProviderSelect.addEventListener('change', () => this.onApiProviderChange());
    }

    // 密码显示/隐藏
    if (this.toggleApiKeyBtn) {
      this.toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
    }

    // 配置操作按钮
    if (this.testConfigBtn) {
      this.testConfigBtn.addEventListener('click', () => this.testApiConnection());
    }
    if (this.resetConfigBtn) {
      this.resetConfigBtn.addEventListener('click', () => this.resetConfiguration());
    }
    if (this.saveConfigBtn) {
      this.saveConfigBtn.addEventListener('click', () => this.saveConfiguration());
    }

    // 点击模态框外部关闭
    if (this.configModal) {
      this.configModal.addEventListener('click', (e) => {
        if (e.target === this.configModal) {
          this.hideConfigModal();
        }
      });
    }

    if (this.welcomeConfigModal) {
      this.welcomeConfigModal.addEventListener('click', (e) => {
        if (e.target === this.welcomeConfigModal) {
          // 首次配置模态框不允许点击外部关闭
        }
      });
    }

    // 模型选择变化
    if (this.modelNameSelect) {
      this.modelNameSelect.addEventListener('change', () => {
        if (this.modelNameSelect.value === 'custom') {
          this.customModelInput.style.display = 'block';
          this.customModelInput.required = true;
        } else {
          this.customModelInput.style.display = 'none';
          this.customModelInput.required = false;
        }
      });
    }
  }

  /**
   * 初始化配置UI
   */
  async initialize() {
    try {
      // 从本地配置管理器获取配置状态
      const config = this.configManager.getConfig();
      const isConfigured = this.configManager.isConfigured();

      // 更新界面状态
      this.updateConfigStatus({
        isConfigured: isConfigured,
        model: config.model,
        apiProvider: config.apiProvider,
        baseURL: config.baseURL,
        hasApiKey: !!config.apiKey
      });

      // 如果未配置，显示欢迎配置界面
      if (!isConfigured) {
        this.showWelcomeConfigModal();
      }

    } catch (error) {
      console.error('Failed to initialize config UI:', error);
      this.showConfigStatusMessage('配置初始化失败', 'error');
    }
  }

  /**
   * 显示配置模态框
   */
  showConfigModal() {
    this.loadCurrentConfig();
    if (this.configModal) {
      this.configModal.classList.add('show');
    }
  }

  /**
   * 隐藏配置模态框
   */
  hideConfigModal() {
    if (this.configModal) {
      this.configModal.classList.remove('show');
    }
  }

  /**
   * 显示欢迎配置模态框
   */
  showWelcomeConfigModal() {
    if (this.welcomeConfigModal) {
      this.welcomeConfigModal.classList.add('show');
    }
  }

  /**
   * 隐藏欢迎配置模态框
   */
  hideWelcomeConfigModal() {
    if (this.welcomeConfigModal) {
      this.welcomeConfigModal.classList.remove('show');
    }
  }

  /**
   * 加载当前配置
   */
  async loadCurrentConfig() {
    try {
      const config = this.configManager.getConfig();

      // 填充表单
      if (this.apiProviderSelect) this.apiProviderSelect.value = config.apiProvider || 'siliconflow';
      if (this.baseUrlInput) this.baseUrlInput.value = config.baseURL || '';
      if (this.maxTokensInput) this.maxTokensInput.value = config.maxTokens || 2048;
      if (this.temperatureInput) this.temperatureInput.value = config.temperature || 0.7;

      // 处理 API Key 显示
      if (this.apiKeyInput) {
        if (config.apiKey) {
          this.apiKeyInput.value = config.apiKey;
          this.apiKeyInput.placeholder = '请输入您的 API Key';
        } else {
          this.apiKeyInput.value = '';
          this.apiKeyInput.placeholder = '请输入您的 API Key';
        }
      }

      // 触发提供商变更以加载模型列表
      this.onApiProviderChange();

      // 设置模型（需要在模型列表加载后）
      setTimeout(() => {
        if (config.model && this.modelNameSelect) {
          const modelOption = Array.from(this.modelNameSelect.options).find(option => option.value === config.model);
          if (modelOption) {
            this.modelNameSelect.value = config.model;
          } else {
            // 如果是自定义模型
            this.modelNameSelect.value = 'custom';
            if (this.customModelInput) {
              this.customModelInput.style.display = 'block';
              this.customModelInput.value = config.model;
            }
          }
        }
      }, 100);

    } catch (error) {
      console.error('Failed to load config:', error);
      this.showConfigStatusMessage('加载配置失败', 'error');
    }
  }

  /**
   * API 提供商变更处理
   */
  onApiProviderChange() {
    if (!this.apiProviderSelect) return;
    
    const provider = this.apiProviderSelect.value;
    const presets = this.configManager.getPresets();
    const preset = presets[provider];

    if (preset) {
      if (this.baseUrlInput) {
        this.baseUrlInput.value = preset.baseURL;
      }

      // 更新模型列表
      if (this.modelNameSelect) {
        this.modelNameSelect.innerHTML = '<option value="">请选择模型</option>';
        preset.models.forEach(model => {
          const option = document.createElement('option');
          option.value = model;
          option.textContent = model;
          this.modelNameSelect.appendChild(option);
        });

        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '自定义模型';
        this.modelNameSelect.appendChild(customOption);
      }
    }
  }

  /**
   * 切换 API Key 可见性
   */
  toggleApiKeyVisibility() {
    if (!this.apiKeyInput || !this.toggleApiKeyBtn) return;
    
    if (this.apiKeyInput.type === 'password') {
      this.apiKeyInput.type = 'text';
      this.toggleApiKeyBtn.textContent = '🙈';
    } else {
      this.apiKeyInput.type = 'password';
      this.toggleApiKeyBtn.textContent = '👁️';
    }
  }

  /**
   * 测试 API 连接
   */
  async testApiConnection() {
    const config = this.getFormConfig();

    if (!config.apiKey || !config.baseURL || !config.model) {
      this.showConfigStatusMessage('请填写完整的配置信息', 'error');
      return;
    }

    // 立即显示测试中状态
    this.showConfigStatusMessage('正在测试 API 连接...', 'info');

    if (this.testConfigBtn) {
      this.testConfigBtn.disabled = true;
      this.testConfigBtn.textContent = '测试中...';
    }

    try {
      const result = await this.apiClient.testConnection(config);

      if (result.success) {
        this.showConfigStatusMessage('API 连接测试成功！配置有效，可以正常使用。', 'success');
      } else {
        this.showConfigStatusMessage(`API 连接测试失败: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showConfigStatusMessage(`测试失败: ${error.message}`, 'error');
    } finally {
      if (this.testConfigBtn) {
        this.testConfigBtn.disabled = false;
        this.testConfigBtn.textContent = '测试连接';
      }
    }
  }

  /**
   * 重置配置
   */
  async resetConfiguration() {
    if (!this.uiUtils.showConfirm('确定要重置所有配置吗？这将清除当前的 API 配置。')) {
      return;
    }

    try {
      const resetConfig = this.configManager.resetConfig();

      this.showConfigStatusMessage('配置已重置', 'success');
      this.loadCurrentConfig();
      this.updateConfigStatus({
        isConfigured: false,
        model: resetConfig.model,
        apiProvider: resetConfig.apiProvider,
        baseURL: resetConfig.baseURL,
        hasApiKey: false
      });

      // 触发配置重置事件
      this.dispatchEvent('configReset');
    } catch (error) {
      this.showConfigStatusMessage(`重置失败: ${error.message}`, 'error');
    }
  }

  /**
   * 保存配置
   */
  async saveConfiguration() {
    const config = this.getFormConfig();

    // 验证配置
    const validation = this.configManager.validateConfig(config);
    if (!validation.isValid) {
      this.showConfigStatusMessage(`配置验证失败: ${validation.errors.join(', ')}`, 'error');
      return;
    }

    if (this.saveConfigBtn) {
      this.saveConfigBtn.disabled = true;
      this.saveConfigBtn.textContent = '保存中...';
    }

    try {
      // 更新本地配置管理器
      const updatedConfig = this.configManager.updateConfig(config);

      this.showConfigStatusMessage('配置保存成功！', 'success');
      this.updateConfigStatus({
        isConfigured: true,
        model: updatedConfig.model,
        apiProvider: updatedConfig.apiProvider,
        baseURL: updatedConfig.baseURL,
        hasApiKey: !!updatedConfig.apiKey
      });

      // 触发配置保存事件
      this.dispatchEvent('configSaved', { config: updatedConfig });

      // 延迟关闭模态框
      setTimeout(() => {
        this.hideConfigModal();
        this.hideWelcomeConfigModal();
      }, 1500);
    } catch (error) {
      this.showConfigStatusMessage(`保存失败: ${error.message}`, 'error');
    } finally {
      if (this.saveConfigBtn) {
        this.saveConfigBtn.disabled = false;
        this.saveConfigBtn.textContent = '保存配置';
      }
    }
  }

  /**
   * 从表单获取配置
   */
  getFormConfig() {
    let apiKey = this.apiKeyInput ? this.apiKeyInput.value.trim() : '';

    // 如果 API Key 为空，但本地有保存的 API Key，使用本地的
    if (!apiKey) {
      const localConfig = this.configManager.getConfig();
      if (localConfig.apiKey) {
        apiKey = localConfig.apiKey;
      }
    }

    return {
      apiProvider: this.apiProviderSelect ? this.apiProviderSelect.value : 'siliconflow',
      apiKey: apiKey,
      baseURL: this.baseUrlInput ? this.baseUrlInput.value.trim() : '',
      model: this.modelNameSelect && this.modelNameSelect.value === 'custom' 
        ? (this.customModelInput ? this.customModelInput.value.trim() : '')
        : (this.modelNameSelect ? this.modelNameSelect.value : ''),
      maxTokens: this.maxTokensInput ? parseInt(this.maxTokensInput.value) || 2048 : 2048,
      temperature: this.temperatureInput ? parseFloat(this.temperatureInput.value) || 0.7 : 0.7
    };
  }

  /**
   * 更新配置状态显示
   */
  updateConfigStatus(config) {
    if (config.isConfigured) {
      if (this.configStatusElement) {
        this.configStatusElement.textContent = '已配置';
        this.configStatusElement.classList.add('configured');
      }
      if (this.aiNameElement) {
        this.aiNameElement.textContent = config.model || 'AI Assistant';
      }
    } else {
      if (this.configStatusElement) {
        this.configStatusElement.textContent = '未配置';
        this.configStatusElement.classList.remove('configured');
      }
      if (this.aiNameElement) {
        this.aiNameElement.textContent = 'AI Assistant';
      }
    }
  }

  /**
   * 显示配置状态消息
   */
  showConfigStatusMessage(message, type = 'info') {
    if (!this.configStatusMessage) return;
    
    this.configStatusMessage.textContent = message;
    this.configStatusMessage.className = `config-status-message ${type}`;

    // 滚动到状态消息位置，确保用户能看到
    setTimeout(() => {
      this.uiUtils.scrollToElement(this.configStatusMessage);
    }, 100);

    // 自动隐藏成功和信息消息
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.configStatusMessage.className = 'config-status-message';
      }, type === 'success' ? 5000 : 4000);
    }
  }

  /**
   * 分发自定义事件
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  /**
   * 检查配置是否完整
   */
  isConfigured() {
    return this.configManager.isConfigured();
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return this.configManager.getConfig();
  }
}

// 导出到全局作用域
window.ConfigUI = ConfigUI;
