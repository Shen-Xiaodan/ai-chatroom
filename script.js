document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const sessionList = document.getElementById('session-list');
  const newSessionBtn = document.getElementById('new-session-btn');

  // 初始化管理器实例
  let stateManager, uiUtils, apiClient, messageManager, configUI;

  // 配置 marked.js 选项
  marked.setOptions({
    breaks: true,        // 支持换行
    gfm: true,          // 支持 GitHub Flavored Markdown
    sanitize: false,    // 我们信任 AI 的输出，但会在用户输入时转义
    smartLists: true,   // 智能列表
    smartypants: true   // 智能标点符号
  });

  // 获取当前会话ID
  function getCurrentSessionId() {
    return window.sessionManager ? sessionManager.currentSessionId : null;
  }

  // 渲染欢迎消息
  function renderWelcomeMessage(isConfigured = false, modelName = 'AI Assistant') {
    let welcomeMessage;

    if (isConfigured) {
      welcomeMessage = `# 👋 欢迎使用 AI 聊天室！

我是 **${modelName}**，一个强大的 AI 助手。我可以帮助你：

- 📝 回答各种问题
- 💡 提供创意建议
- 🔧 协助解决问题
- 📚 解释复杂概念

试试问我任何问题吧！`;
    } else {
      welcomeMessage = `# 👋 欢迎使用 AI 聊天室！

⚠️ **系统未配置**

在开始对话之前，请先配置您的 API 信息：

- 🔑 API Key（从您的 AI 服务提供商获取）
- 🌐 API Base URL（通常已预设）
- 🤖 模型名称（可从列表中选择）

点击右上角的 ⚙️ 按钮开始配置，或者发送任意消息我会引导您进行配置。`;
    }

    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
      welcomeElement.innerHTML = marked.parse(welcomeMessage);
    }
  }

  // 初始化所有管理器
  function initializeManagers() {
    // 初始化工具类
    uiUtils = new UIUtils();

    // 初始化状态管理器
    stateManager = new StateManager();

    // 初始化API客户端
    apiClient = new APIClient(configManager, uiUtils);

    // 初始化消息管理器
    messageManager = new MessageManager(chatMessages, sessionManager, uiUtils);

    // 初始化配置UI
    configUI = new ConfigUI(configManager, apiClient, uiUtils);

    // 将管理器实例暴露到全局作用域以便其他模块使用
    window.stateManager = stateManager;
    window.uiUtils = uiUtils;
    window.apiClient = apiClient;
    window.messageManager = messageManager;
    window.configUI = configUI;
  }

  // 绑定事件监听器
  function bindEventListeners() {
    // 发送按钮点击事件
    sendBtn.addEventListener('click', sendMessage);

    // 自动调整textarea高度
    userInput.addEventListener('input', () => {
      uiUtils.autoResizeTextarea(userInput);
    });

    // 中文输入法状态跟踪
    let isComposing = false;

    // 监听输入法组合事件
    userInput.addEventListener('compositionstart', () => {
      isComposing = true;
    });

    userInput.addEventListener('compositionend', () => {
      isComposing = false;
    });

    // 键盘事件处理：Enter发送，Shift+Enter换行
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Shift+Enter：允许换行，不做任何处理
          return;
        } else {
          // 检查是否在输入法组合状态中
          if (isComposing) {
            // 在输入法组合状态中，不发送消息
            return;
          }
          // 单独Enter：发送消息
          e.preventDefault();
          sendMessage();
        }
      }
    });

    // 新建会话按钮
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => {
        if (!window.sessionManager) return;

        // 清理当前的thinking状态和UI
        cleanupThinkingState();

        const session = sessionManager.createSession();
        loadSessionMessages(session);
        updateSessionList();
        userInput.focus(); // 聚焦到输入框
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N: 新建会话
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (!window.sessionManager) return;

        // 清理当前的thinking状态和UI
        cleanupThinkingState();

        const session = sessionManager.createSession();
        loadSessionMessages(session);
        updateSessionList();
        userInput.focus();
      }

      // Escape: 聚焦到输入框
      if (e.key === 'Escape') {
        userInput.focus();
      }
    });

    // 监听消息管理器事件
    document.addEventListener('sessionUpdated', () => {
      updateSessionList();
    });

    document.addEventListener('regenerateMessage', async (e) => {
      const { userMessage } = e.detail;
      await regenerateAIResponse(userMessage);
    });

    // 监听配置UI事件
    document.addEventListener('configSaved', (e) => {
      const { config } = e.detail;
      renderWelcomeMessage(true, config.model);
    });

    document.addEventListener('configReset', () => {
      renderWelcomeMessage(false);
    });
  }

  // 重新生成AI回复
  async function regenerateAIResponse(userMessage) {
    try {
      // 检查是否有其他标签页正在thinking
      if (stateManager.isAnyTabThinking() && !stateManager.isCurrentTabThinking()) {
        uiUtils.showToast('另一个标签页正在处理消息，请稍后再试', 'warning');
        return;
      }

      // 检查配置
      if (!configManager.isConfigured()) {
        uiUtils.showToast('系统未配置，请先配置 API 信息', 'error');
        configUI.showConfigModal();
        return;
      }

      // 设置thinking状态
      stateManager.setThinkingState(true);

      // 显示"正在重新生成"状态
      const typingIndicator = uiUtils.createTypingIndicator('正在重新生成');
      chatMessages.appendChild(typingIndicator);
      uiUtils.scrollToBottom(chatMessages);

      // 获取当前会话的历史消息
      let history = [];
      if (window.sessionManager) {
        const currentSession = sessionManager.getCurrentSession();
        history = currentSession.messages || [];
      }

      // 使用API客户端发送请求
      const aiResponse = await apiClient.sendChatRequest(userMessage, history);

      // 移除"正在重新生成"状态
      chatMessages.removeChild(typingIndicator);

      messageManager.addAIMessage(aiResponse);

      // 清除thinking状态
      stateManager.setThinkingState(false);
      uiUtils.showToast('消息已重新生成', 'success');
    } catch (error) {
      console.error('重新生成失败:', error);

      // 移除可能残留的输入指示器
      const remainingTyping = chatMessages.querySelector('.typing-indicator');
      if (remainingTyping) {
        chatMessages.removeChild(remainingTyping.closest('.message'));
      }

      // 清除thinking状态
      stateManager.setThinkingState(false);
      uiUtils.showToast(`重新生成失败：${error.message}`, 'error');
    }
  }
  




  // 处理聊天请求
  async function handleChatRequest(sessionId, message, history, typingIndicator) {
    try {
      // 检查配置是否完整
      if (!configManager.isConfigured()) {
        const isCurrentSession = getCurrentSessionId() === sessionId;
        if (isCurrentSession) {
          if (typingIndicator && typingIndicator.parentNode) {
            chatMessages.removeChild(typingIndicator);
          }
          messageManager.addAIMessage('⚠️ 系统未配置，请先配置 API 信息才能开始对话。');
          configUI.showConfigModal();
        }
        return;
      }

      // 使用API客户端发送请求
      const aiResponse = await apiClient.sendChatRequest(message, history);

      // 检查请求是否仍然相关（用户可能已切换会话）
      const isCurrentSession = getCurrentSessionId() === sessionId;

      // 移除typing indicator（如果仍在当前会话中）
      if (isCurrentSession && typingIndicator && typingIndicator.parentNode) {
        chatMessages.removeChild(typingIndicator);
      }

      // 清除thinking状态
      stateManager.setThinkingState(false);
      stateManager.setSessionThinking(sessionId, false);
      stateManager.clearSessionRequest(sessionId);

      // 如果在当前会话中，重新启用UI
      if (isCurrentSession) {
        stateManager.setUIState({ sendBtn, userInput }, 'ready');
      }

      // 添加AI消息到指定会话
      if (window.sessionManager) {
        const targetSession = sessionManager.sessions.get(sessionId);
        if (targetSession) {
          // 直接添加到会话数据
          const aiMessage = {
            id: sessionManager.generateId(),
            type: 'ai',
            content: aiResponse,
            timestamp: new Date().toISOString()
          };
          targetSession.messages.push(aiMessage);
          targetSession.messageCount = targetSession.messages.length;
          targetSession.updatedAt = new Date().toISOString();
          sessionManager.saveToStorage();

          // 如果是当前会话，更新UI
          if (isCurrentSession) {
            messageManager.addAIMessage(aiResponse);
            updateSessionList();
          }
        }
      }

    } catch (error) {
      console.error('Error in handleChatRequest:', error);

      // 清除thinking状态
      stateManager.setThinkingState(false);
      stateManager.setSessionThinking(sessionId, false);
      stateManager.clearSessionRequest(sessionId);

      // 如果在当前会话中，处理错误UI
      if (getCurrentSessionId() === sessionId) {
        // 移除可能残留的typing indicator
        if (typingIndicator && typingIndicator.parentNode) {
          chatMessages.removeChild(typingIndicator);
        }

        // 重新启用发送按钮和输入框
        stateManager.setUIState({ sendBtn, userInput }, 'ready');

        // 处理特殊错误（如频率限制）
        if (error.message.includes('请求过于频繁')) {
          messageManager.addAIMessage(`🚫 ${error.message}`);

          // 从错误消息中提取等待时间
          const match = error.message.match(/等待 (\d+)s/);
          if (match) {
            const retrySeconds = parseInt(match[1]);
            apiClient.handleRateLimitError(retrySeconds, sendBtn, userInput);
          }
        } else {
          messageManager.addAIMessage(`❌ 抱歉，遇到了错误：${error.message}\n\n请稍后重试。如果问题持续存在，可能是API配额限制或网络问题。`);
        }
      }
    }
  }

  // 发送消息
  async function sendMessage() {
    const message = userInput.value.trim();

    if (message) {
      // 检查配置状态
      if (!configManager.isConfigured()) {
        messageManager.addAIMessage('⚠️ 系统未配置，请先配置 API 信息才能开始对话。');
        configUI.showConfigModal();
        return;
      }

      // 检查是否有其他标签页正在thinking
      if (stateManager.isAnyTabThinking() && !stateManager.isCurrentTabThinking()) {
        messageManager.addAIMessage('⚠️ 另一个标签页正在处理消息，请稍后再试。');
        return;
      }

      // 添加用户消息
      messageManager.addUserMessage(message);
      userInput.value = '';

      // 重置textarea高度
      uiUtils.autoResizeTextarea(userInput);

      const currentSessionId = getCurrentSessionId();

      // 设置thinking状态并禁用发送按钮和输入框
      stateManager.setThinkingState(true);
      stateManager.setSessionThinking(currentSessionId, true);
      stateManager.setUIState({ sendBtn, userInput }, 'thinking');

      try {
        // 显示"正在输入"状态
        const typingIndicator = uiUtils.createTypingIndicator();
        chatMessages.appendChild(typingIndicator);
        uiUtils.scrollToBottom(chatMessages);

        // 获取当前会话的历史消息
        let history = [];
        if (window.sessionManager) {
          const currentSession = sessionManager.getCurrentSession();
          history = currentSession.messages || [];
        }

        // 创建异步请求处理
        const requestPromise = handleChatRequest(currentSessionId, message, history, typingIndicator);

        // 存储请求Promise以便跟踪
        stateManager.setSessionRequest(currentSessionId, requestPromise);

        // 等待请求完成
        await requestPromise;
      } catch (error) {
        console.error('Error in sendMessage:', error);
        // 错误处理已在handleChatRequest中完成
      }
    }
  }
  

  
  // 会话管理功能

  // 更新会话列表显示
  function updateSessionList() {
    if (!window.sessionManager || !sessionList) return;

    const sessions = sessionManager.getAllSessions();
    const currentSessionId = sessionManager.currentSessionId;

    sessionList.innerHTML = '';

    sessions.forEach(session => {
      const sessionItem = document.createElement('div');
      sessionItem.classList.add('session-item');
      if (session.id === currentSessionId) {
        sessionItem.classList.add('active');
      }

      const timeAgo = uiUtils.getTimeAgo(session.updatedAt);

      sessionItem.innerHTML = `
        <div class="session-title">${uiUtils.escapeHtml(session.title)}</div>
        <div class="session-meta">
          <span>${session.messageCount} 条消息 • ${timeAgo}</span>
          <div class="session-actions">
            <button class="session-action-btn rename-btn" data-session-id="${session.id}" title="重命名">✏️</button>
            <button class="session-action-btn clear-btn" data-session-id="${session.id}" title="清空">🧹</button>
            <button class="session-action-btn delete-btn" data-session-id="${session.id}" title="删除">🗑️</button>
          </div>
        </div>
      `;

      // 点击切换会话
      sessionItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('session-action-btn')) {
          switchToSession(session.id);
        }
      });

      sessionList.appendChild(sessionItem);
    });

    // 绑定操作按钮事件
    bindSessionActionEvents();
  }

  // 绑定会话操作事件
  function bindSessionActionEvents() {
    // 重命名按钮
    document.querySelectorAll('.rename-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sessionId = btn.dataset.sessionId;
        renameSession(sessionId);
      });
    });

    // 清空按钮
    document.querySelectorAll('.clear-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sessionId = btn.dataset.sessionId;
        clearSession(sessionId);
      });
    });

    // 删除按钮
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sessionId = btn.dataset.sessionId;
        deleteSession(sessionId);
      });
    });
  }







  // 切换到指定会话
  function switchToSession(sessionId) {
    if (!window.sessionManager) return;

    // 清理当前的thinking状态和UI
    cleanupThinkingState();

    const session = sessionManager.switchToSession(sessionId);
    if (session) {
      loadSessionMessages(session);
      updateSessionList();
    }
  }

  // 清理thinking状态和相关UI（仅清理UI，不中断后台请求）
  function cleanupThinkingState() {
    // 使用状态管理器清理状态
    stateManager.cleanupThinkingState();

    // 移除可能残留的typing indicator
    const typingIndicators = chatMessages.querySelectorAll('.typing-indicator');
    typingIndicators.forEach(indicator => {
      const messageElement = indicator.closest('.message');
      if (messageElement) {
        messageElement.remove();
      }
    });

    // 重置发送按钮和输入框状态
    stateManager.setUIState({ sendBtn, userInput }, 'ready');
  }

  // 加载会话消息
  function loadSessionMessages(session) {
    // 清空当前消息（保留欢迎消息）
    messageManager.clearMessages();

    // 加载会话消息
    session.messages.forEach(msg => {
      if (msg.type === 'user') {
        messageManager.addUserMessageFromHistory(msg.content, msg.timestamp);
      } else {
        messageManager.addAIMessageFromHistory(msg.content, msg.timestamp);
      }
    });

    // 检查当前会话是否有正在进行的请求
    if (stateManager.isSessionThinking(session.id)) {
      // 显示thinking状态
      stateManager.setUIState({ sendBtn, userInput }, 'thinking');

      // 显示typing indicator
      const typingIndicator = uiUtils.createTypingIndicator();
      chatMessages.appendChild(typingIndicator);
    }

    uiUtils.scrollToBottom(chatMessages);
  }

  // 重命名会话
  function renameSession(sessionId) {
    if (!window.sessionManager) return;

    const session = sessionManager.sessions.get(sessionId);
    if (!session) return;

    const newTitle = uiUtils.showPrompt('请输入新的对话标题:', session.title);
    if (newTitle && newTitle.trim() && newTitle.trim() !== session.title) {
      sessionManager.renameSession(sessionId, newTitle.trim());
      updateSessionList();
    }
  }

  // 清空会话
  function clearSession(sessionId) {
    if (!window.sessionManager) return;

    const session = sessionManager.sessions.get(sessionId);
    if (!session) return;

    if (uiUtils.showConfirm(`确定要清空对话"${session.title}"的所有消息吗？此操作不可撤销。`)) {
      sessionManager.clearSession(sessionId);

      if (sessionId === sessionManager.currentSessionId) {
        // 如果清空的是当前会话，清理thinking状态并重新加载界面
        cleanupThinkingState();
        const currentSession = sessionManager.getCurrentSession();
        loadSessionMessages(currentSession);
      }

      updateSessionList();
    }
  }

  // 删除会话
  function deleteSession(sessionId) {
    if (!window.sessionManager) return;

    const session = sessionManager.sessions.get(sessionId);
    if (!session) return;

    if (uiUtils.showConfirm(`确定要删除对话"${session.title}"吗？此操作不可撤销。`)) {
      const wasCurrentSession = sessionId === sessionManager.currentSessionId;
      sessionManager.deleteSession(sessionId);

      if (wasCurrentSession) {
        // 如果删除的是当前会话，清理thinking状态并加载新的当前会话
        cleanupThinkingState();
        const currentSession = sessionManager.getCurrentSession();
        loadSessionMessages(currentSession);
      }

      updateSessionList();
    }
  }

  // 主初始化函数
  async function initialize() {
    try {
      // 初始化所有管理器
      initializeManagers();

      // 绑定事件监听器
      bindEventListeners();

      // 初始化配置
      await initializeConfig();

      // 初始化会话管理
      if (!window.sessionManager) {
        console.warn('SessionManager not found, session management disabled');
        return;
      }

      // 加载当前会话
      const currentSession = sessionManager.getCurrentSession();
      loadSessionMessages(currentSession);
      updateSessionList();

      // 初始聚焦到输入框
      userInput.focus();

      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
      uiUtils.showToast('应用初始化失败', 'error');
    }
  }

  // 页面加载完成后初始化
  setTimeout(initialize, 100); // 延迟一点确保所有依赖已加载

  // ==================== 配置管理功能 ====================

  // 初始化配置管理
  async function initializeConfig() {
    try {
      // 使用配置UI管理器初始化
      await configUI.initialize();

      // 根据配置状态渲染欢迎消息
      const config = configManager.getConfig();
      const isConfigured = configManager.isConfigured();
      renderWelcomeMessage(isConfigured, config.model);

    } catch (error) {
      console.error('Failed to initialize config:', error);
      // 显示未配置状态
      renderWelcomeMessage(false);
      uiUtils.showToast('配置初始化失败', 'error');
    }
  }




});