// AI Chatroom - Static Version for GitHub Pages
// This version works without a backend server by directly calling AI APIs

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const configModal = document.getElementById('config-modal');
  const welcomeConfigModal = document.getElementById('welcome-config-modal');
  const closeConfigModal = document.getElementById('close-config-modal');
  const startConfigBtn = document.getElementById('start-config');
  const configStatusElement = document.getElementById('config-status');
  const aiNameElement = document.getElementById('ai-name');

  // Configuration form elements
  const apiProviderSelect = document.getElementById('api-provider');
  const apiKeyInput = document.getElementById('api-key');
  const baseUrlInput = document.getElementById('base-url');
  const modelNameSelect = document.getElementById('model-name');
  const customModelInput = document.getElementById('custom-model');
  const maxTokensInput = document.getElementById('max-tokens');
  const temperatureInput = document.getElementById('temperature');
  const testConfigBtn = document.getElementById('test-config');
  const resetConfigBtn = document.getElementById('reset-config');
  const saveConfigBtn = document.getElementById('save-config');
  const toggleApiKeyBtn = document.getElementById('toggle-api-key');
  const configStatusMessage = document.getElementById('config-status-message');

  // Initialize
  initializeApp();

  async function initializeApp() {
    // Initialize session manager
    if (typeof sessionManager !== 'undefined') {
      sessionManager.init();
    }

    // Initialize config manager
    if (typeof configManager !== 'undefined') {
      configManager.init();
      
      // Check if config exists
      if (!configManager.isConfigured()) {
        showWelcomeModal();
      } else {
        updateConfigStatus();
      }
    }

    // Setup event listeners
    setupEventListeners();
    
    // Show welcome message
    showWelcomeMessage();
  }

  function setupEventListeners() {
    // Send message
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });

    // Settings modal
    settingsBtn.addEventListener('click', showConfigModal);
    closeConfigModal.addEventListener('click', hideConfigModal);
    startConfigBtn.addEventListener('click', () => {
      hideWelcomeModal();
      showConfigModal();
    });

    // Configuration form
    apiProviderSelect.addEventListener('change', updateProviderSettings);
    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    testConfigBtn.addEventListener('click', testConfiguration);
    resetConfigBtn.addEventListener('click', resetConfiguration);
    saveConfigBtn.addEventListener('click', saveConfiguration);

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
      if (e.target === configModal) {
        hideConfigModal();
      }
      if (e.target === welcomeConfigModal) {
        hideWelcomeModal();
      }
    });
  }

  function showWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
      const message = `
# 🎉 欢迎使用 AI Chatroom！

这是一个**静态版本**的AI聊天室，可以直接在GitHub Pages上运行。

## ✨ 特性
- 🤖 支持多种AI模型（DeepSeek、OpenAI等）
- 💬 多会话管理
- 📱 响应式设计
- 🔒 本地存储配置

## 🚀 开始使用
1. 点击右上角的 ⚙️ 按钮
2. 配置您的API信息
3. 开始与AI对话！

---
*配置信息仅保存在您的浏览器本地，不会上传到任何服务器*
      `;
      welcomeMessage.innerHTML = marked.parse(message);
    }
  }

  // Message handling
  function addUserMessage(message) {
    const messageElement = createMessageElement('user', message);
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    // Save to session if session manager is available
    if (typeof sessionManager !== 'undefined') {
      const currentSessionId = sessionManager.getCurrentSessionId();
      sessionManager.addMessage(currentSessionId, 'user', message);
    }
  }

  function addAIMessage(message) {
    const messageElement = createMessageElement('ai', message);
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    // Save to session if session manager is available
    if (typeof sessionManager !== 'undefined') {
      const currentSessionId = sessionManager.getCurrentSessionId();
      sessionManager.addMessage(currentSessionId, 'ai', message);
    }
  }

  function createMessageElement(type, content, isStreaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    
    if (content) {
      if (type === 'ai') {
        textDiv.innerHTML = marked.parse(content);
      } else {
        textDiv.textContent = content;
      }
    }
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timestamp);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    if (isStreaming) {
      messageDiv.classList.add('streaming');
    }
    
    return messageDiv;
  }

  function updateMessageContent(messageElement, content) {
    const textDiv = messageElement.querySelector('.text');
    if (textDiv) {
      textDiv.innerHTML = marked.parse(content);
    }
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Chat request handling
  async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Check configuration
    if (!configManager.isConfigured()) {
      addAIMessage('⚠️ 请先配置API信息才能开始对话。');
      showConfigModal();
      return;
    }
    
    // Add user message
    addUserMessage(message);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Disable send button
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中...';
    
    // Add typing indicator
    const typingIndicator = createTypingIndicator();
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
    
    try {
      await handleChatRequest(message, typingIndicator);
    } catch (error) {
      console.error('Send message error:', error);
      addAIMessage(`❌ 发送失败：${error.message}`);
    } finally {
      // Re-enable send button
      sendBtn.disabled = false;
      sendBtn.textContent = '发送';
      
      // Remove typing indicator
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.remove();
      }
    }
  }

  function createTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message ai-message typing-indicator';
    indicator.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    return indicator;
  }

  // Chat request handling - Direct API calls
  async function handleChatRequest(message, typingIndicator) {
    const config = configManager.getConfig();

    // Prepare message history
    const messages = [];

    // Get current session history if available
    if (typeof sessionManager !== 'undefined') {
      const currentSession = sessionManager.getCurrentSession();
      if (currentSession && currentSession.messages) {
        for (const msg of currentSession.messages) {
          messages.push({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Make API request
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: messages,
        max_tokens: parseInt(config.maxTokens) || 2048,
        temperature: parseFloat(config.temperature) || 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    // Remove typing indicator
    if (typingIndicator && typingIndicator.parentNode) {
      typingIndicator.remove();
    }

    // Create AI message element for streaming
    const aiMessageElement = createMessageElement('ai', '', true);
    chatMessages.appendChild(aiMessageElement);
    scrollToBottom();

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                aiMessage += parsed.choices[0].delta.content;
                updateMessageContent(aiMessageElement, aiMessage);
                scrollToBottom();
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } finally {
      // Remove streaming class
      aiMessageElement.classList.remove('streaming');

      // Save final message to session
      if (typeof sessionManager !== 'undefined' && aiMessage) {
        const currentSessionId = sessionManager.getCurrentSessionId();
        sessionManager.addMessage(currentSessionId, 'ai', aiMessage);
      }
    }
  }

  // Modal functions
  function showConfigModal() {
    loadCurrentConfig();
    configModal.style.display = 'block';
  }

  function hideConfigModal() {
    configModal.style.display = 'none';
  }

  function showWelcomeModal() {
    welcomeConfigModal.style.display = 'block';
  }

  function hideWelcomeModal() {
    welcomeConfigModal.style.display = 'none';
  }

  // Configuration functions
  function updateProviderSettings() {
    const provider = apiProviderSelect.value;
    const presets = {
      'siliconflow': {
        baseURL: 'https://api.siliconflow.cn/v1',
        models: ['deepseek-chat', 'Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Meta-Llama-3.1-8B-Instruct']
      },
      'openai': {
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
      },
      'custom': {
        baseURL: '',
        models: []
      }
    };

    const preset = presets[provider];
    if (preset) {
      baseUrlInput.value = preset.baseURL;

      // Update model options
      modelNameSelect.innerHTML = '<option value="">请选择模型</option>';
      preset.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelNameSelect.appendChild(option);
      });

      // Show/hide custom model input
      if (provider === 'custom') {
        customModelInput.style.display = 'block';
        modelNameSelect.style.display = 'none';
      } else {
        customModelInput.style.display = 'none';
        modelNameSelect.style.display = 'block';
      }
    }
  }

  function toggleApiKeyVisibility() {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    toggleApiKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
  }

  function loadCurrentConfig() {
    if (typeof configManager !== 'undefined') {
      const config = configManager.getConfig();

      apiProviderSelect.value = config.apiProvider || 'siliconflow';
      apiKeyInput.value = config.apiKey || '';
      baseUrlInput.value = config.baseURL || '';
      maxTokensInput.value = config.maxTokens || 2048;
      temperatureInput.value = config.temperature || 0.7;

      if (config.modelName) {
        modelNameSelect.value = config.modelName;
        customModelInput.value = config.modelName;
      }

      updateProviderSettings();
    }
  }

  async function testConfiguration() {
    const config = getFormConfig();

    if (!config.apiKey || !config.baseURL) {
      showConfigMessage('请填写API Key和Base URL', 'error');
      return;
    }

    testConfigBtn.disabled = true;
    testConfigBtn.textContent = '测试中...';
    showConfigMessage('正在测试连接...', 'info');

    try {
      const response = await fetch(`${config.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (response.ok) {
        showConfigMessage('✅ 连接测试成功！', 'success');
      } else {
        showConfigMessage(`❌ 连接测试失败: ${response.status}`, 'error');
      }
    } catch (error) {
      showConfigMessage(`❌ 连接测试失败: ${error.message}`, 'error');
    } finally {
      testConfigBtn.disabled = false;
      testConfigBtn.textContent = '测试连接';
    }
  }

  function resetConfiguration() {
    if (confirm('确定要重置所有配置吗？')) {
      if (typeof configManager !== 'undefined') {
        configManager.resetConfig();
        loadCurrentConfig();
        updateConfigStatus();
        showConfigMessage('配置已重置', 'success');
      }
    }
  }

  function saveConfiguration() {
    const config = getFormConfig();

    if (!config.apiKey || !config.baseURL || !config.modelName) {
      showConfigMessage('请填写所有必填项', 'error');
      return;
    }

    if (typeof configManager !== 'undefined') {
      configManager.saveConfig(config);
      updateConfigStatus();
      hideConfigModal();
      showConfigMessage('配置已保存', 'success');
    }
  }

  function getFormConfig() {
    const provider = apiProviderSelect.value;
    const modelName = provider === 'custom' ? customModelInput.value : modelNameSelect.value;

    return {
      apiProvider: provider,
      apiKey: apiKeyInput.value.trim(),
      baseURL: baseUrlInput.value.trim(),
      modelName: modelName.trim(),
      maxTokens: parseInt(maxTokensInput.value) || 2048,
      temperature: parseFloat(temperatureInput.value) || 0.7
    };
  }

  function showConfigMessage(message, type) {
    configStatusMessage.textContent = message;
    configStatusMessage.className = `config-status-message ${type}`;

    setTimeout(() => {
      configStatusMessage.textContent = '';
      configStatusMessage.className = 'config-status-message';
    }, 3000);
  }

  function updateConfigStatus() {
    if (typeof configManager !== 'undefined') {
      const isConfigured = configManager.isConfigured();
      const config = configManager.getConfig();

      if (isConfigured) {
        configStatusElement.textContent = '已配置';
        configStatusElement.className = 'config-status configured';
        aiNameElement.textContent = config.modelName || 'AI';
      } else {
        configStatusElement.textContent = '未配置';
        configStatusElement.className = 'config-status';
        aiNameElement.textContent = 'AI';
      }
    }
  }

  // Make functions globally available
  window.showConfigModal = showConfigModal;
  window.hideConfigModal = hideConfigModal;
  window.showWelcomeModal = showWelcomeModal;
  window.hideWelcomeModal = hideWelcomeModal;
  window.updateConfigStatus = updateConfigStatus;
});
