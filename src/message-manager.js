/**
 * 消息管理器 - 负责消息的显示、操作和管理
 */
class MessageManager {
  constructor(chatMessages, sessionManager, uiUtils) {
    this.chatMessages = chatMessages;
    this.sessionManager = sessionManager;
    this.uiUtils = uiUtils;
  }

  /**
   * HTML 转义函数
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * 添加用户消息
   */
  addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');

    // 转义用户输入以防止 XSS
    const escapedMessage = this.escapeHtml(message);

    messageElement.innerHTML = `
      <div class="content">
        <div class="text">${escapedMessage}</div>
        <div class="timestamp">${this.getCurrentTime()}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn edit-btn" title="编辑消息">✏️</button>
        </div>
      </div>
      <div class="avatar">👤</div>
    `;

    this.chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    this.bindUserMessageActionEvents(messageElement, message);

    this.scrollToBottom();

    // 保存到会话管理器
    if (this.sessionManager) {
      this.sessionManager.addMessage('user', message);
      // 触发会话列表更新事件
      this.dispatchEvent('sessionUpdated');
    }
  }

  /**
   * 添加AI消息
   */
  addAIMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');

    // 使用 marked 渲染 Markdown
    const renderedMessage = marked.parse(message);

    messageElement.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text">${renderedMessage}</div>
        <div class="timestamp">${this.getCurrentTime()}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn regenerate-btn" title="重新生成">🔄</button>
        </div>
      </div>
    `;

    this.chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    this.bindMessageActionEvents(messageElement, message);

    this.scrollToBottom();

    // 保存到会话管理器
    if (this.sessionManager) {
      this.sessionManager.addMessage('ai', message);
      // 触发会话列表更新事件
      this.dispatchEvent('sessionUpdated');
    }
  }

  /**
   * 从历史记录添加用户消息（不保存到会话管理器）
   */
  addUserMessageFromHistory(message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');

    const escapedMessage = this.escapeHtml(message);

    messageElement.innerHTML = `
      <div class="content">
        <div class="text">${escapedMessage}</div>
        <div class="timestamp">${this.formatTimestamp(timestamp)}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn edit-btn" title="编辑消息">✏️</button>
        </div>
      </div>
      <div class="avatar">👤</div>
    `;

    this.chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    this.bindUserMessageActionEvents(messageElement, message);
  }

  /**
   * 从历史记录添加AI消息（不保存到会话管理器）
   */
  addAIMessageFromHistory(message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');

    const renderedMessage = marked.parse(message);

    messageElement.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text">${renderedMessage}</div>
        <div class="timestamp">${this.formatTimestamp(timestamp)}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="复制消息">📋</button>
          <button class="action-btn regenerate-btn" title="重新生成">🔄</button>
        </div>
      </div>
    `;

    this.chatMessages.appendChild(messageElement);

    // 绑定按钮事件
    this.bindMessageActionEvents(messageElement, message);
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * 绑定消息操作事件
   */
  bindMessageActionEvents(messageElement, messageContent) {
    const copyBtn = messageElement.querySelector('.copy-btn');
    const regenerateBtn = messageElement.querySelector('.regenerate-btn');

    // 复制按钮事件
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyMessageToClipboard(messageContent);
      });
    }

    // 重新生成按钮事件
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.regenerateMessage(messageElement);
      });
    }
  }

  /**
   * 绑定用户消息操作事件
   */
  bindUserMessageActionEvents(messageElement, messageContent) {
    const copyBtn = messageElement.querySelector('.copy-btn');
    const editBtn = messageElement.querySelector('.edit-btn');

    // 复制按钮事件
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyMessageToClipboard(messageContent);
      });
    }

    // 编辑按钮事件
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editUserMessage(messageElement, messageContent);
      });
    }
  }

  /**
   * 复制消息到剪贴板
   */
  async copyMessageToClipboard(messageContent) {
    try {
      await navigator.clipboard.writeText(messageContent);
      this.uiUtils.showToast('消息已复制到剪贴板', 'success');
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

        this.uiUtils.showToast('消息已复制到剪贴板', 'success');
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr);
        this.uiUtils.showToast('复制失败，请手动选择文本复制', 'error');
      }
    }
  }

  /**
   * 重新生成消息
   */
  async regenerateMessage(messageElement) {
    if (!this.sessionManager) {
      this.uiUtils.showToast('会话管理器未初始化', 'error');
      return;
    }

    // 获取当前会话的消息历史
    const currentSession = this.sessionManager.getCurrentSession();
    const messages = currentSession.messages || [];

    if (messages.length === 0) {
      this.uiUtils.showToast('没有可重新生成的消息', 'error');
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
      this.uiUtils.showToast('找不到用户消息，无法重新生成', 'error');
      return;
    }

    // 移除当前AI消息
    messageElement.remove();

    // 从会话历史中移除最后一条AI消息
    if (messages.length > 0 && messages[messages.length - 1].type === 'ai') {
      this.sessionManager.removeLastMessage();
    }

    // 触发重新生成事件
    this.dispatchEvent('regenerateMessage', { userMessage: lastUserMessage });
  }

  /**
   * 编辑用户消息
   */
  editUserMessage(messageElement, originalContent) {
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
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    textarea.addEventListener('input', autoResize);
    autoResize();

    // 保存按钮事件
    saveBtn.addEventListener('click', () => {
      const newContent = textarea.value.trim();
      if (newContent && newContent !== originalContent) {
        this.saveEditedMessage(messageElement, newContent, editContainer);
      } else {
        this.cancelEdit(editContainer, textElement, actionsElement);
      }
    });

    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
      this.cancelEdit(editContainer, textElement, actionsElement);
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

  /**
   * 取消编辑
   */
  cancelEdit(editContainer, textElement, actionsElement) {
    editContainer.remove();
    textElement.style.display = '';
    actionsElement.style.display = '';
  }

  /**
   * 保存编辑后的消息
   */
  saveEditedMessage(messageElement, newContent, editContainer) {
    if (!this.sessionManager) {
      this.uiUtils.showToast('会话管理器未初始化', 'error');
      return;
    }

    try {
      // 更新会话中的消息
      const success = this.updateUserMessageInSession(messageElement, newContent);

      if (success) {
        // 更新DOM显示
        const textElement = messageElement.querySelector('.text');
        const actionsElement = messageElement.querySelector('.message-actions');

        textElement.innerHTML = this.escapeHtml(newContent);

        // 移除编辑界面，显示原始内容
        editContainer.remove();
        textElement.style.display = '';
        actionsElement.style.display = '';

        // 重新绑定事件（因为内容已更改）
        this.bindUserMessageActionEvents(messageElement, newContent);

        // 触发会话更新事件
        this.dispatchEvent('sessionUpdated');

        this.uiUtils.showToast('消息已更新', 'success');
      } else {
        this.uiUtils.showToast('更新消息失败', 'error');
      }
    } catch (error) {
      console.error('保存编辑失败:', error);
      this.uiUtils.showToast('保存失败：' + error.message, 'error');
    }
  }

  /**
   * 在会话中更新用户消息
   */
  updateUserMessageInSession(messageElement, newContent) {
    const currentSession = this.sessionManager.getCurrentSession();
    if (!currentSession || !currentSession.messages) return false;

    // 找到对应的消息（通过时间戳或位置）
    const timestampElement = messageElement.querySelector('.timestamp');
    if (!timestampElement) return false;

    const timestamp = timestampElement.textContent;

    // 查找匹配的消息
    for (let i = currentSession.messages.length - 1; i >= 0; i--) {
      const msg = currentSession.messages[i];
      if (msg.type === 'user') {
        const msgTime = this.formatTimestamp(msg.timestamp);
        if (msgTime === timestamp) {
          // 找到匹配的消息，更新内容
          currentSession.messages[i].content = newContent;
          currentSession.updatedAt = new Date().toISOString();
          this.sessionManager.saveToStorage();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 清空消息区域（保留欢迎消息）
   */
  clearMessages() {
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
      const welcomeMessageElement = welcomeMessage.closest('.message');
      this.chatMessages.innerHTML = '';
      if (welcomeMessageElement) {
        this.chatMessages.appendChild(welcomeMessageElement);
      }
    } else {
      this.chatMessages.innerHTML = '';
    }
  }

  /**
   * 分发自定义事件
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}

// 导出到全局作用域
window.MessageManager = MessageManager;
