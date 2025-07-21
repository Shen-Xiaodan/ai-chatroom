document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const sessionList = document.getElementById('session-list');
  const newSessionBtn = document.getElementById('new-session-btn');

  // 配置 marked.js 选项
  marked.setOptions({
    breaks: true,        // 支持换行
    gfm: true,          // 支持 GitHub Flavored Markdown
    sanitize: false,    // 我们信任 AI 的输出，但会在用户输入时转义
    smartLists: true,   // 智能列表
    smartypants: true   // 智能标点符号
  });

  // 渲染欢迎消息
  function renderWelcomeMessage() {
    const welcomeMessage = `# 👋 欢迎使用 AI 聊天室！

我是 **DeepSeek V3**，一个强大的 AI 助手。我可以帮助你：

- 📝 回答各种问题
- 💡 提供创意建议
- 🔧 协助解决问题
- 📚 解释复杂概念

试试问我任何问题吧！`;

    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement) {
      welcomeElement.innerHTML = marked.parse(welcomeMessage);
    }
  }

  // 初始渲染欢迎消息
  renderWelcomeMessage();
  
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
      </div>
      <div class="avatar">👤</div>
    `;

    chatMessages.appendChild(messageElement);
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
      </div>
    `;

    chatMessages.appendChild(messageElement);
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
  
  // 发送消息到服务器
  async function sendMessage() {
    const message = userInput.value.trim();
    
    if (message) {
      // 添加用户消息
      addUserMessage(message);
      userInput.value = '';

      // 重置textarea高度
      userInput.style.height = 'auto';

      // 禁用发送按钮和输入框
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

        // 发送请求到服务器
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            history  // 发送会话历史
          })
        });
        
        // 移除"正在输入"状态
        chatMessages.removeChild(typingIndicator);

        // 重新启用发送按钮和输入框
        sendBtn.disabled = false;
        sendBtn.textContent = '发送';

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 429) {
            // 处理频率限制错误
            const retryAfter = errorData.retryAfter || '30s';
            const retrySeconds = parseInt(retryAfter.replace('s', ''));

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

            return;
          }

          throw new Error(`HTTP ${response.status}: ${errorData.error || 'Network response was not ok'}`);
        }

        const data = await response.json();
        addAIMessage(data.response);
      } catch (error) {
        console.error('Error:', error);

        // 移除可能残留的输入指示器
        const remainingTyping = chatMessages.querySelector('.typing-indicator');
        if (remainingTyping) {
          chatMessages.removeChild(remainingTyping.closest('.message'));
        }

        // 重新启用发送按钮和输入框
        sendBtn.disabled = false;
        userInput.disabled = false;
        sendBtn.textContent = '发送';

        addAIMessage(`❌ 抱歉，遇到了错误：${error.message}\n\n请稍后重试。如果问题持续存在，可能是API配额限制或网络问题。`);
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

  // 键盘事件处理：Enter发送，Shift+Enter换行
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter：允许换行，不做任何处理
        return;
      } else {
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

  // 切换到指定会话
  function switchToSession(sessionId) {
    if (!window.sessionManager) return;

    const session = sessionManager.switchToSession(sessionId);
    if (session) {
      loadSessionMessages(session);
      updateSessionList();
    }
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
      </div>
      <div class="avatar">👤</div>
    `;

    chatMessages.appendChild(messageElement);
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
      </div>
    `;

    chatMessages.appendChild(messageElement);
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
        // 如果清空的是当前会话，重新加载界面
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
        // 如果删除的是当前会话，加载新的当前会话
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
});