document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const sessionList = document.getElementById('session-list');
  const newSessionBtn = document.getElementById('new-session-btn');

  // 为当前标签页生成唯一ID
  const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
  const THINKING_STATE_KEY = 'ai-chatroom-thinking-state';

  // 会话级别的请求跟踪
  const sessionRequests = new Map(); // sessionId -> Promise
  const sessionThinkingState = new Map(); // sessionId -> boolean

  // Thinking状态管理函数
  function setThinkingState(isThinking) {
    try {
      if (isThinking) {
        localStorage.setItem(THINKING_STATE_KEY, JSON.stringify({
          tabId: tabId,
          timestamp: Date.now()
        }));
      } else {
        const currentState = localStorage.getItem(THINKING_STATE_KEY);
        if (currentState) {
          const state = JSON.parse(currentState);
          // 只有当前标签页才能清除thinking状态
          if (state.tabId === tabId) {
            localStorage.removeItem(THINKING_STATE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Failed to manage thinking state:', error);
    }
  }

  function isAnyTabThinking() {
    try {
      const currentState = localStorage.getItem(THINKING_STATE_KEY);
      if (!currentState) return false;

      const state = JSON.parse(currentState);
      // 检查状态是否过期（超过30秒认为是异常状态）
      const isExpired = Date.now() - state.timestamp > 30000;

      if (isExpired) {
        localStorage.removeItem(THINKING_STATE_KEY);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check thinking state:', error);
      return false;
    }
  }

  function isCurrentTabThinking() {
    try {
      const currentState = localStorage.getItem(THINKING_STATE_KEY);
      if (!currentState) return false;

      const state = JSON.parse(currentState);
      return state.tabId === tabId;
    } catch (error) {
      console.error('Failed to check current tab thinking state:', error);
      return false;
    }
  }

  // 会话级别的thinking状态管理
  function setSessionThinking(sessionId, isThinking) {
    if (isThinking) {
      sessionThinkingState.set(sessionId, true);
    } else {
      sessionThinkingState.delete(sessionId);
    }
  }

  function isSessionThinking(sessionId) {
    return sessionThinkingState.has(sessionId);
  }

  function getCurrentSessionId() {
    return window.sessionManager ? sessionManager.currentSessionId : null;
  }

  // 配置相关元素
  const settingsBtn = document.getElementById('settings-btn');
  const configModal = document.getElementById('config-modal');
  const welcomeConfigModal = document.getElementById('welcome-config-modal');
  const closeConfigModal = document.getElementById('close-config-modal');
  const startConfigBtn = document.getElementById('start-config');
  const configStatusElement = document.getElementById('config-status');
  const aiNameElement = document.getElementById('ai-name');

  // 配置表单元素
  const apiProviderSelect = document.getElementById('api-provider');
  const apiKeyInput = document.getElementById('api-key');
  const baseUrlInput = document.getElementById('base-url');
  const modelNameSelect = document.getElementById('model-name');
  const customModelInput = document.getElementById('custom-model');
  const maxTokensInput = document.getElementById('max-tokens');
  const temperatureInput = document.getElementById('temperature');
  const toggleApiKeyBtn = document.getElementById('toggle-api-key');
  const testConfigBtn = document.getElementById('test-config');
  const resetConfigBtn = document.getElementById('reset-config');
  const saveConfigBtn = document.getElementById('save-config');
  const configStatusMessage = document.getElementById('config-status-message');

  // 配置 marked.js 选项
  marked.setOptions({
    breaks: true,        // 支持换行
    gfm: true,          // 支持 GitHub Flavored Markdown
    sanitize: false,    // 我们信任 AI 的输出，但会在用户输入时转义
    smartLists: true,   // 智能列表
    smartypants: true   // 智能标点符号
  });

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

  // 初始化配置管理（会在配置加载后更新欢迎消息）
  initializeConfig();
  
  // HTML 转义函数
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 添加用户消息
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');

    // 转义用户输入以防止 XSS
    const escapedMessage = escapeHtml(message);

    messageElement.innerHTML = `
      <div class="content">
        <div class="text">${escapedMessage}</div>
        <div class="timestamp">${getCurrentTime()}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn edit-btn" title="编辑消息">✏️</button>
        </div>
      </div>
      <div class="avatar">👤</div>
    `;

    chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    bindUserMessageActionEvents(messageElement, message);

    scrollToBottom();

    // 保存到会话管理器
    if (window.sessionManager) {
      sessionManager.addMessage('user', message);
      updateSessionList();
    }
  }
  
  // 添加AI消息
  function addAIMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');

    // 使用 marked 渲染 Markdown
    const renderedMessage = marked.parse(message);

    messageElement.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text">${renderedMessage}</div>
        <div class="timestamp">${getCurrentTime()}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn regenerate-btn" title="重新生成">🔄</button>
        </div>
      </div>
    `;

    chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    bindMessageActionEvents(messageElement, message);

    scrollToBottom();

    // 保存到会话管理器
    if (window.sessionManager) {
      sessionManager.addMessage('ai', message);
      updateSessionList();
    }
  }
  
  // 获取当前时间
  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // 滚动到底部
  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 处理聊天请求（可以在后台运行）
  async function handleChatRequest(sessionId, message, history, typingIndicator) {
    try {
      // 发送请求到服务器
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          history
        })
      });

      // 检查请求是否仍然相关（用户可能已切换会话）
      const isCurrentSession = getCurrentSessionId() === sessionId;

      // 移除typing indicator（如果仍在当前会话中）
      if (isCurrentSession && typingIndicator && typingIndicator.parentNode) {
        chatMessages.removeChild(typingIndicator);
      }

      // 清除thinking状态
      setThinkingState(false);
      setSessionThinking(sessionId, false);
      sessionRequests.delete(sessionId);

      // 如果在当前会话中，重新启用UI
      if (isCurrentSession) {
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 400 && errorData.needsConfig) {
          // 处理配置错误
          if (isCurrentSession) {
            addAIMessage('⚠️ 系统未配置，请先配置 API 信息才能开始对话。');
            showConfigModal();
          }
          return;
        }

        if (response.status === 429) {
          // 处理频率限制错误
          const retryAfter = errorData.retryAfter || '30s';
          const retrySeconds = parseInt(retryAfter.replace('s', ''));

          if (isCurrentSession) {
            addAIMessage(`🚫 请求过于频繁，请等待 ${retryAfter} 后重试。\n\n💡 建议：\n• 减慢发送消息的频率\n• 等待指定时间后重试\n• 如果经常遇到此问题，可能需要升级API计划`);

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
          }
          return;
        }

        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Network response was not ok'}`);
      }

      const data = await response.json();

      // 添加AI消息到指定会话
      if (window.sessionManager) {
        const targetSession = sessionManager.sessions.get(sessionId);
        if (targetSession) {
          // 直接添加到会话数据
          const aiMessage = {
            id: sessionManager.generateId(),
            type: 'ai',
            content: data.response,
            timestamp: new Date().toISOString()
          };
          targetSession.messages.push(aiMessage);
          targetSession.messageCount = targetSession.messages.length;
          targetSession.updatedAt = new Date().toISOString();
          sessionManager.saveToStorage();

          // 如果是当前会话，更新UI
          if (isCurrentSession) {
            addAIMessage(data.response);
            updateSessionList();
          }
        }
      }

    } catch (error) {
      console.error('Error in handleChatRequest:', error);

      // 清除thinking状态
      setThinkingState(false);
      setSessionThinking(sessionId, false);
      sessionRequests.delete(sessionId);

      // 如果在当前会话中，处理错误UI
      if (getCurrentSessionId() === sessionId) {
        // 移除可能残留的typing indicator
        if (typingIndicator && typingIndicator.parentNode) {
          chatMessages.removeChild(typingIndicator);
        }

        // 重新启用发送按钮和输入框
        sendBtn.disabled = false;
        userInput.disabled = false;
        sendBtn.textContent = '发送';

        addAIMessage(`❌ 抱歉，遇到了错误：${error.message}\n\n请稍后重试。如果问题持续存在，可能是API配额限制或网络问题。`);
      }
    }
  }

  // 发送消息到服务器
  async function sendMessage() {
    const message = userInput.value.trim();

    if (message) {
      // 检查配置状态
      if (!configManager.isConfigured()) {
        addAIMessage('⚠️ 系统未配置，请先配置 API 信息才能开始对话。');
        showConfigModal();
        return;
      }

      // 检查是否有其他标签页正在thinking
      if (isAnyTabThinking() && !isCurrentTabThinking()) {
        addAIMessage('⚠️ 另一个标签页正在处理消息，请稍后再试。');
        return;
      }

      // 添加用户消息
      addUserMessage(message);
      userInput.value = '';

      // 重置textarea高度
      userInput.style.height = 'auto';

      const currentSessionId = getCurrentSessionId();

      // 设置thinking状态并禁用发送按钮和输入框
      setThinkingState(true);
      setSessionThinking(currentSessionId, true);
      sendBtn.disabled = true;
      sendBtn.textContent = 'Thinking...';

      try {
        // 显示"正在输入"状态
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'ai-message');
        typingIndicator.innerHTML = `
          <div class="avatar">🤖</div>
          <div class="content">
            <div class="text typing-indicator">
              I'm thinking<span class="dots">
              <span>.</span><span>.</span><span>.</span></span>
            </div>
          </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // 获取当前会话的历史消息
        let history = [];
        if (window.sessionManager) {
          const currentSession = sessionManager.getCurrentSession();
          history = currentSession.messages || [];
        }

        // 创建异步请求处理
        const requestPromise = handleChatRequest(currentSessionId, message, history, typingIndicator);

        // 存储请求Promise以便跟踪
        sessionRequests.set(currentSessionId, requestPromise);

        // 等待请求完成
        await requestPromise;
      } catch (error) {
        console.error('Error in sendMessage:', error);
        // 错误处理已在handleChatRequest中完成
      }
    }
  }
  
  // 发送按钮点击事件
  sendBtn.addEventListener('click', sendMessage);
  
  // 自动调整textarea高度
  function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
  }

  // 监听输入事件，自动调整高度
  userInput.addEventListener('input', autoResizeTextarea);

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

      const timeAgo = getTimeAgo(session.updatedAt);

      sessionItem.innerHTML = `
        <div class="session-title">${escapeHtml(session.title)}</div>
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

  // 绑定消息操作事件
  function bindMessageActionEvents(messageElement, messageContent) {
    const copyBtn = messageElement.querySelector('.copy-btn');
    const regenerateBtn = messageElement.querySelector('.regenerate-btn');

    // 复制按钮事件
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyMessageToClipboard(messageContent);
      });
    }

    // 重新生成按钮事件
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        regenerateMessage(messageElement);
      });
    }
  }

  // 复制消息到剪贴板
  async function copyMessageToClipboard(messageContent) {
    try {
      await navigator.clipboard.writeText(messageContent);

      // 显示复制成功提示
      showToast('消息已复制到剪贴板', 'success');
    } catch (err) {
      console.error('复制失败:', err);

      // 降级方案：使用传统方法复制
      try {
        const textArea = document.createElement('textarea');
        textArea.value = messageContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        showToast('消息已复制到剪贴板', 'success');
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr);
        showToast('复制失败，请手动选择文本复制', 'error');
      }
    }
  }

  // 重新生成消息
  async function regenerateMessage(messageElement) {
    if (!window.sessionManager) {
      showToast('会话管理器未初始化', 'error');
      return;
    }

    // 获取当前会话的消息历史
    const currentSession = sessionManager.getCurrentSession();
    const messages = currentSession.messages || [];

    if (messages.length === 0) {
      showToast('没有可重新生成的消息', 'error');
      return;
    }

    // 找到最后一个用户消息
    let lastUserMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        lastUserMessage = messages[i].content;
        break;
      }
    }

    if (!lastUserMessage) {
      showToast('找不到用户消息，无法重新生成', 'error');
      return;
    }

    // 移除当前AI消息
    messageElement.remove();

    // 从会话历史中移除最后一条AI消息
    if (messages.length > 0 && messages[messages.length - 1].type === 'ai') {
      sessionManager.removeLastMessage();
    }

    // 重新发送最后一个用户消息
    await regenerateAIResponse(lastUserMessage);
  }

  // 重新生成AI回复
  async function regenerateAIResponse(userMessage) {
    try {
      // 检查是否有其他标签页正在thinking
      if (isAnyTabThinking() && !isCurrentTabThinking()) {
        showToast('另一个标签页正在处理消息，请稍后再试', 'warning');
        return;
      }

      // 设置thinking状态
      setThinkingState(true);

      // 显示"正在重新生成"状态
      const typingIndicator = document.createElement('div');
      typingIndicator.classList.add('message', 'ai-message');
      typingIndicator.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="content">
          <div class="text typing-indicator">
            正在重新生成<span class="dots">
            <span>.</span><span>.</span><span>.</span></span>
          </div>
        </div>
      `;
      chatMessages.appendChild(typingIndicator);
      scrollToBottom();

      // 获取当前会话的历史消息
      let history = [];
      if (window.sessionManager) {
        const currentSession = sessionManager.getCurrentSession();
        history = currentSession.messages || [];
      }

      // 发送请求到服务器
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          history  // 发送会话历史
        })
      });

      // 移除"正在重新生成"状态
      chatMessages.removeChild(typingIndicator);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Network response was not ok'}`);
      }

      const data = await response.json();
      addAIMessage(data.response);

      // 清除thinking状态
      setThinkingState(false);
      showToast('消息已重新生成', 'success');
    } catch (error) {
      console.error('重新生成失败:', error);

      // 移除可能残留的输入指示器
      const remainingTyping = chatMessages.querySelector('.typing-indicator');
      if (remainingTyping) {
        chatMessages.removeChild(remainingTyping.closest('.message'));
      }

      // 清除thinking状态
      setThinkingState(false);
      showToast(`重新生成失败：${error.message}`, 'error');
    }
  }

  // 绑定用户消息操作事件
  function bindUserMessageActionEvents(messageElement, messageContent) {
    const copyBtn = messageElement.querySelector('.copy-btn');
    const editBtn = messageElement.querySelector('.edit-btn');

    // 复制按钮事件
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyMessageToClipboard(messageContent);
      });
    }

    // 编辑按钮事件
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editUserMessage(messageElement, messageContent);
      });
    }
  }

  // 编辑用户消息
  function editUserMessage(messageElement, originalContent) {
    const textElement = messageElement.querySelector('.text');
    const actionsElement = messageElement.querySelector('.message-actions');

    if (!textElement || !actionsElement) return;

    // 创建编辑界面
    const editContainer = document.createElement('div');
    editContainer.classList.add('edit-container');

    const textarea = document.createElement('textarea');
    textarea.classList.add('edit-textarea');
    textarea.value = originalContent;
    textarea.rows = Math.max(1, originalContent.split('\n').length);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('edit-buttons');

    const saveBtn = document.createElement('button');
    saveBtn.classList.add('edit-save-btn');
    saveBtn.textContent = '保存';
    saveBtn.title = '保存修改';

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('edit-cancel-btn');
    cancelBtn.textContent = '取消';
    cancelBtn.title = '取消编辑';

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    editContainer.appendChild(textarea);
    editContainer.appendChild(buttonContainer);

    // 隐藏原始内容和操作按钮
    textElement.style.display = 'none';
    actionsElement.style.display = 'none';

    // 插入编辑界面
    textElement.parentNode.insertBefore(editContainer, textElement);

    // 聚焦到文本框
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    // 自动调整高度
    function autoResize() {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    textarea.addEventListener('input', autoResize);
    autoResize();

    // 保存按钮事件
    saveBtn.addEventListener('click', () => {
      const newContent = textarea.value.trim();
      if (newContent && newContent !== originalContent) {
        saveEditedMessage(messageElement, newContent, editContainer);
      } else {
        cancelEdit(editContainer, textElement, actionsElement);
      }
    });

    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
      cancelEdit(editContainer, textElement, actionsElement);
    });

    // 键盘事件
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        // Ctrl/Cmd + Enter 保存
        e.preventDefault();
        saveBtn.click();
      } else if (e.key === 'Escape') {
        // Escape 取消
        e.preventDefault();
        cancelBtn.click();
      }
    });
  }

  // 取消编辑
  function cancelEdit(editContainer, textElement, actionsElement) {
    editContainer.remove();
    textElement.style.display = '';
    actionsElement.style.display = '';
  }

  // 保存编辑后的消息
  function saveEditedMessage(messageElement, newContent, editContainer) {
    if (!window.sessionManager) {
      showToast('会话管理器未初始化', 'error');
      return;
    }

    try {
      // 更新会话中的消息
      const success = updateUserMessageInSession(messageElement, newContent);

      if (success) {
        // 更新DOM显示
        const textElement = messageElement.querySelector('.text');
        const actionsElement = messageElement.querySelector('.message-actions');

        textElement.innerHTML = escapeHtml(newContent);

        // 移除编辑界面，显示原始内容
        editContainer.remove();
        textElement.style.display = '';
        actionsElement.style.display = '';

        // 重新绑定事件（因为内容已更改）
        bindUserMessageActionEvents(messageElement, newContent);

        // 更新会话列表
        updateSessionList();

        showToast('消息已更新', 'success');
      } else {
        showToast('更新消息失败', 'error');
      }
    } catch (error) {
      console.error('保存编辑失败:', error);
      showToast('保存失败：' + error.message, 'error');
    }
  }

  // 在会话中更新用户消息
  function updateUserMessageInSession(messageElement, newContent) {
    const currentSession = sessionManager.getCurrentSession();
    if (!currentSession || !currentSession.messages) return false;

    // 找到对应的消息（通过时间戳或位置）
    const timestampElement = messageElement.querySelector('.timestamp');
    if (!timestampElement) return false;

    const timestamp = timestampElement.textContent;

    // 查找匹配的消息
    for (let i = currentSession.messages.length - 1; i >= 0; i--) {
      const msg = currentSession.messages[i];
      if (msg.type === 'user') {
        const msgTime = formatTimestamp(msg.timestamp);
        if (msgTime === timestamp) {
          // 找到匹配的消息，更新内容
          currentSession.messages[i].content = newContent;
          currentSession.updatedAt = new Date().toISOString();
          sessionManager.saveToStorage();
          return true;
        }
      }
    }

    return false;
  }

  // 显示提示消息
  function showToast(message, type = 'info') {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;

    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // 3秒后自动隐藏
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
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
    // 只清除全局thinking状态（跨标签页的）
    setThinkingState(false);

    // 移除可能残留的typing indicator
    const typingIndicators = chatMessages.querySelectorAll('.typing-indicator');
    typingIndicators.forEach(indicator => {
      const messageElement = indicator.closest('.message');
      if (messageElement) {
        messageElement.remove();
      }
    });

    // 重置发送按钮和输入框状态
    sendBtn.disabled = false;
    userInput.disabled = false;
    sendBtn.textContent = '发送';
  }

  // 加载会话消息
  function loadSessionMessages(session) {
    // 清空当前消息（保留欢迎消息）
    const welcomeMessage = document.getElementById('welcome-message').closest('.message');
    chatMessages.innerHTML = '';
    chatMessages.appendChild(welcomeMessage);

    // 加载会话消息
    session.messages.forEach(msg => {
      if (msg.type === 'user') {
        addUserMessageFromHistory(msg.content, msg.timestamp);
      } else {
        addAIMessageFromHistory(msg.content, msg.timestamp);
      }
    });

    // 检查当前会话是否有正在进行的请求
    if (isSessionThinking(session.id)) {
      // 显示thinking状态
      sendBtn.disabled = true;
      sendBtn.textContent = 'Thinking...';

      // 显示typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.classList.add('message', 'ai-message');
      typingIndicator.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="content">
          <div class="text typing-indicator">
            I'm thinking<span class="dots">
            <span>.</span><span>.</span><span>.</span></span>
          </div>
        </div>
      `;
      chatMessages.appendChild(typingIndicator);
    }

    scrollToBottom();
  }

  // 从历史记录添加用户消息（不保存到会话管理器）
  function addUserMessageFromHistory(message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');

    const escapedMessage = escapeHtml(message);

    messageElement.innerHTML = `
      <div class="content">
        <div class="text">${escapedMessage}</div>
        <div class="timestamp">${formatTimestamp(timestamp)}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn edit-btn" title="编辑消息">✏️</button>
        </div>
      </div>
      <div class="avatar">👤</div>
    `;

    chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    bindUserMessageActionEvents(messageElement, message);
  }

  // 从历史记录添加AI消息（不保存到会话管理器）
  function addAIMessageFromHistory(message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');

    const renderedMessage = marked.parse(message);

    messageElement.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text">${renderedMessage}</div>
        <div class="timestamp">${formatTimestamp(timestamp)}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn regenerate-btn" title="重新生成">🔄</button>
        </div>
      </div>
    `;

    chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    bindMessageActionEvents(messageElement, message);
  }

  // 格式化时间戳
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // 获取相对时间
  function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return new Date(timestamp).toLocaleDateString();
  }

  // 重命名会话
  function renameSession(sessionId) {
    if (!window.sessionManager) return;

    const session = sessionManager.sessions.get(sessionId);
    if (!session) return;

    const newTitle = prompt('请输入新的对话标题:', session.title);
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

    if (confirm(`确定要清空对话"${session.title}"的所有消息吗？此操作不可撤销。`)) {
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

    if (confirm(`确定要删除对话"${session.title}"吗？此操作不可撤销。`)) {
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

  // 事件监听器

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

  // 初始化
  function initialize() {
    if (!window.sessionManager) {
      console.warn('SessionManager not found, session management disabled');
      return;
    }

    // 加载当前会话
    const currentSession = sessionManager.getCurrentSession();
    loadSessionMessages(currentSession);
    updateSessionList();
  }

  // 页面加载完成后初始化
  setTimeout(initialize, 100); // 延迟一点确保sessionManager已加载

  // 初始聚焦到输入框
  userInput.focus();

  // ==================== 配置管理功能 ====================

  // 初始化配置管理
  async function initializeConfig() {
    try {
      // 检查服务器配置状态
      const response = await fetch('/api/config');
      const serverConfig = await response.json();

      // 更新界面状态
      updateConfigStatus(serverConfig);

      // 根据配置状态渲染欢迎消息
      renderWelcomeMessage(serverConfig.isConfigured, serverConfig.model);

      // 如果未配置，显示欢迎配置界面
      if (!serverConfig.isConfigured) {
        showWelcomeConfigModal();
      }

      // 绑定配置相关事件
      bindConfigEvents();

    } catch (error) {
      console.error('Failed to initialize config:', error);
      // 如果无法连接服务器，显示未配置状态
      renderWelcomeMessage(false);
      showConfigStatusMessage('配置初始化失败', 'error');
    }
  }

  // 绑定配置相关事件
  function bindConfigEvents() {
    // 设置按钮
    settingsBtn.addEventListener('click', showConfigModal);

    // 关闭模态框
    closeConfigModal.addEventListener('click', hideConfigModal);

    // 开始配置按钮
    startConfigBtn.addEventListener('click', () => {
      hideWelcomeConfigModal();
      showConfigModal();
    });

    // API 提供商选择
    apiProviderSelect.addEventListener('change', onApiProviderChange);

    // 密码显示/隐藏
    toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);

    // 配置操作按钮
    testConfigBtn.addEventListener('click', testApiConnection);
    resetConfigBtn.addEventListener('click', resetConfiguration);
    saveConfigBtn.addEventListener('click', saveConfiguration);

    // 点击模态框外部关闭
    configModal.addEventListener('click', (e) => {
      if (e.target === configModal) {
        hideConfigModal();
      }
    });

    welcomeConfigModal.addEventListener('click', (e) => {
      if (e.target === welcomeConfigModal) {
        // 首次配置模态框不允许点击外部关闭
      }
    });
  }

  // 显示配置模态框
  function showConfigModal() {
    loadCurrentConfig();
    configModal.classList.add('show');
  }

  // 隐藏配置模态框
  function hideConfigModal() {
    configModal.classList.remove('show');
  }

  // 显示欢迎配置模态框
  function showWelcomeConfigModal() {
    welcomeConfigModal.classList.add('show');
  }

  // 隐藏欢迎配置模态框
  function hideWelcomeConfigModal() {
    welcomeConfigModal.classList.remove('show');
  }

  // 加载当前配置
  async function loadCurrentConfig() {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();

      // 填充表单
      apiProviderSelect.value = config.apiProvider || 'siliconflow';
      baseUrlInput.value = config.baseURL || '';
      maxTokensInput.value = config.maxTokens || 2048;
      temperatureInput.value = config.temperature || 0.7;

      // 处理 API Key 显示
      if (config.hasApiKey) {
        // 如果有 API Key，显示占位符，但保留本地存储的值
        const localConfig = configManager.getConfig();
        if (localConfig.apiKey) {
          apiKeyInput.value = localConfig.apiKey;
        } else {
          // 如果本地没有，显示占位符提示用户重新输入
          apiKeyInput.placeholder = '已配置 API Key，如需修改请重新输入';
          apiKeyInput.value = '';
        }
      } else {
        apiKeyInput.value = '';
        apiKeyInput.placeholder = '请输入您的 API Key';
      }

      // 触发提供商变更以加载模型列表
      onApiProviderChange();

      // 设置模型（需要在模型列表加载后）
      setTimeout(() => {
        if (config.model) {
          const modelOption = Array.from(modelNameSelect.options).find(option => option.value === config.model);
          if (modelOption) {
            modelNameSelect.value = config.model;
          } else {
            // 如果是自定义模型
            modelNameSelect.value = 'custom';
            customModelInput.style.display = 'block';
            customModelInput.value = config.model;
          }
        }
      }, 100);

    } catch (error) {
      console.error('Failed to load config:', error);
      showConfigStatusMessage('加载配置失败', 'error');
    }
  }

  // API 提供商变更处理
  function onApiProviderChange() {
    const provider = apiProviderSelect.value;
    const presets = configManager.getPresets();
    const preset = presets[provider];

    if (preset) {
      baseUrlInput.value = preset.baseURL;

      // 更新模型列表
      modelNameSelect.innerHTML = '<option value="">请选择模型</option>';
      preset.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelNameSelect.appendChild(option);
      });

      // 添加自定义选项
      const customOption = document.createElement('option');
      customOption.value = 'custom';
      customOption.textContent = '自定义模型';
      modelNameSelect.appendChild(customOption);
    }

    // 处理自定义模型输入框显示
    modelNameSelect.addEventListener('change', () => {
      if (modelNameSelect.value === 'custom') {
        customModelInput.style.display = 'block';
        customModelInput.required = true;
      } else {
        customModelInput.style.display = 'none';
        customModelInput.required = false;
      }
    });
  }

  // 切换 API Key 可见性
  function toggleApiKeyVisibility() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '👁️';
    }
  }

  // 测试 API 连接
  async function testApiConnection() {
    const config = getFormConfig();

    if (!config.apiKey || !config.baseURL || !config.model) {
      showConfigStatusMessage('请填写完整的配置信息', 'error');
      return;
    }

    // 立即显示测试中状态
    showConfigStatusMessage('正在测试 API 连接...', 'info');

    testConfigBtn.disabled = true;
    testConfigBtn.textContent = '测试中...';

    try {
      const response = await fetch('/api/config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (result.success) {
        showConfigStatusMessage('API 连接测试成功！配置有效，可以正常使用。', 'success');
      } else {
        showConfigStatusMessage(`API 连接测试失败: ${result.message || result.error}`, 'error');
      }
    } catch (error) {
      showConfigStatusMessage(`测试失败: ${error.message}`, 'error');
    } finally {
      testConfigBtn.disabled = false;
      testConfigBtn.textContent = '测试连接';
    }
  }

  // 重置配置
  async function resetConfiguration() {
    if (!confirm('确定要重置所有配置吗？这将清除当前的 API 配置。')) {
      return;
    }

    try {
      const response = await fetch('/api/config/reset', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        showConfigStatusMessage('配置已重置', 'success');
        loadCurrentConfig();
        updateConfigStatus(result.config);
      } else {
        showConfigStatusMessage('重置失败', 'error');
      }
    } catch (error) {
      showConfigStatusMessage(`重置失败: ${error.message}`, 'error');
    }
  }

  // 保存配置
  async function saveConfiguration() {
    const config = getFormConfig();

    // 验证配置
    const validation = configManager.validateConfig(config);
    if (!validation.isValid) {
      showConfigStatusMessage(`配置验证失败: ${validation.errors.join(', ')}`, 'error');
      return;
    }

    saveConfigBtn.disabled = true;
    saveConfigBtn.textContent = '保存中...';

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (result.success) {
        showConfigStatusMessage('配置保存成功！', 'success');
        updateConfigStatus(result.config);

        // 更新本地配置管理器
        configManager.updateConfig(config);

        // 延迟关闭模态框
        setTimeout(() => {
          hideConfigModal();
          hideWelcomeConfigModal();
        }, 1500);
      } else {
        showConfigStatusMessage(`保存失败: ${result.message}`, 'error');
      }
    } catch (error) {
      showConfigStatusMessage(`保存失败: ${error.message}`, 'error');
    } finally {
      saveConfigBtn.disabled = false;
      saveConfigBtn.textContent = '保存配置';
    }
  }

  // 从表单获取配置
  function getFormConfig() {
    let apiKey = apiKeyInput.value.trim();

    // 如果 API Key 为空，但本地有保存的 API Key，使用本地的
    if (!apiKey) {
      const localConfig = configManager.getConfig();
      if (localConfig.apiKey) {
        apiKey = localConfig.apiKey;
      }
    }

    return {
      apiProvider: apiProviderSelect.value,
      apiKey: apiKey,
      baseURL: baseUrlInput.value.trim(),
      model: modelNameSelect.value === 'custom' ? customModelInput.value.trim() : modelNameSelect.value,
      maxTokens: parseInt(maxTokensInput.value) || 2048,
      temperature: parseFloat(temperatureInput.value) || 0.7
    };
  }

  // 更新配置状态显示
  function updateConfigStatus(config) {
    if (config.isConfigured) {
      configStatusElement.textContent = '已配置';
      configStatusElement.classList.add('configured');
      aiNameElement.textContent = config.model || 'AI Assistant';

      // 更新欢迎消息
      renderWelcomeMessage(true, config.model);
    } else {
      configStatusElement.textContent = '未配置';
      configStatusElement.classList.remove('configured');
      aiNameElement.textContent = 'AI Assistant';

      // 更新欢迎消息
      renderWelcomeMessage(false);
    }
  }

  // 显示配置状态消息
  function showConfigStatusMessage(message, type = 'info') {
    configStatusMessage.textContent = message;
    configStatusMessage.className = `config-status-message ${type}`;

    // 滚动到状态消息位置，确保用户能看到
    setTimeout(() => {
      configStatusMessage.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);

    // 自动隐藏成功和信息消息
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        configStatusMessage.className = 'config-status-message';
      }, type === 'success' ? 5000 : 4000);
    }
  }

  // 页面卸载时清除thinking状态
  window.addEventListener('beforeunload', () => {
    setThinkingState(false);
  });

  // 页面隐藏时也清除thinking状态（用户切换标签页或最小化窗口）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isCurrentTabThinking()) {
      setThinkingState(false);
    }
  });
});