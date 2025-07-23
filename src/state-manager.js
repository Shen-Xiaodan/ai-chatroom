/**
 * 状态管理器 - 负责管理应用的各种状态
 */
class StateManager {
  constructor() {
    // 为当前标签页生成唯一ID
    this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    this.THINKING_STATE_KEY = 'ai-chatroom-thinking-state';
    
    // 会话级别的请求跟踪
    this.sessionRequests = new Map(); // sessionId -> Promise
    this.sessionThinkingState = new Map(); // sessionId -> boolean
    
    // 绑定页面卸载事件
    this.bindUnloadEvents();
  }

  /**
   * 设置全局thinking状态
   */
  setThinkingState(isThinking) {
    try {
      if (isThinking) {
        localStorage.setItem(this.THINKING_STATE_KEY, JSON.stringify({
          tabId: this.tabId,
          timestamp: Date.now()
        }));
      } else {
        const currentState = localStorage.getItem(this.THINKING_STATE_KEY);
        if (currentState) {
          const state = JSON.parse(currentState);
          // 只有当前标签页才能清除thinking状态
          if (state.tabId === this.tabId) {
            localStorage.removeItem(this.THINKING_STATE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Failed to manage thinking state:', error);
    }
  }

  /**
   * 检查是否有任何标签页在thinking
   */
  isAnyTabThinking() {
    try {
      const currentState = localStorage.getItem(this.THINKING_STATE_KEY);
      if (!currentState) return false;

      const state = JSON.parse(currentState);
      // 检查状态是否过期（超过30秒认为是异常状态）
      const isExpired = Date.now() - state.timestamp > 30000;

      if (isExpired) {
        localStorage.removeItem(this.THINKING_STATE_KEY);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check thinking state:', error);
      return false;
    }
  }

  /**
   * 检查当前标签页是否在thinking
   */
  isCurrentTabThinking() {
    try {
      const currentState = localStorage.getItem(this.THINKING_STATE_KEY);
      if (!currentState) return false;

      const state = JSON.parse(currentState);
      return state.tabId === this.tabId;
    } catch (error) {
      console.error('Failed to check current tab thinking state:', error);
      return false;
    }
  }

  /**
   * 设置会话级别的thinking状态
   */
  setSessionThinking(sessionId, isThinking) {
    if (isThinking) {
      this.sessionThinkingState.set(sessionId, true);
    } else {
      this.sessionThinkingState.delete(sessionId);
    }
  }

  /**
   * 检查指定会话是否在thinking
   */
  isSessionThinking(sessionId) {
    return this.sessionThinkingState.has(sessionId);
  }

  /**
   * 设置会话请求Promise
   */
  setSessionRequest(sessionId, requestPromise) {
    this.sessionRequests.set(sessionId, requestPromise);
  }

  /**
   * 获取会话请求Promise
   */
  getSessionRequest(sessionId) {
    return this.sessionRequests.get(sessionId);
  }

  /**
   * 清除会话请求
   */
  clearSessionRequest(sessionId) {
    this.sessionRequests.delete(sessionId);
  }

  /**
   * 检查会话是否有正在进行的请求
   */
  hasSessionRequest(sessionId) {
    return this.sessionRequests.has(sessionId);
  }

  /**
   * 清理thinking状态和相关UI（仅清理UI，不中断后台请求）
   */
  cleanupThinkingState() {
    // 只清除全局thinking状态（跨标签页的）
    this.setThinkingState(false);
  }

  /**
   * 清理指定会话的状态
   */
  cleanupSessionState(sessionId) {
    this.setSessionThinking(sessionId, false);
    this.clearSessionRequest(sessionId);
  }

  /**
   * 清理所有会话状态
   */
  cleanupAllSessionStates() {
    this.sessionThinkingState.clear();
    this.sessionRequests.clear();
  }

  /**
   * 获取当前标签页ID
   */
  getTabId() {
    return this.tabId;
  }

  /**
   * 获取所有thinking中的会话
   */
  getThinkingSessions() {
    return Array.from(this.sessionThinkingState.keys());
  }

  /**
   * 获取所有有请求的会话
   */
  getRequestingSessions() {
    return Array.from(this.sessionRequests.keys());
  }

  /**
   * 检查系统是否忙碌
   */
  isBusy() {
    return this.isAnyTabThinking() || this.sessionThinkingState.size > 0;
  }

  /**
   * 等待所有请求完成
   */
  async waitForAllRequests() {
    const promises = Array.from(this.sessionRequests.values());
    if (promises.length > 0) {
      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.error('等待请求完成时出错:', error);
      }
    }
  }

  /**
   * 取消指定会话的请求
   */
  cancelSessionRequest(sessionId) {
    const request = this.sessionRequests.get(sessionId);
    if (request && typeof request.abort === 'function') {
      request.abort();
    }
    this.cleanupSessionState(sessionId);
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests() {
    this.sessionRequests.forEach((request, sessionId) => {
      if (request && typeof request.abort === 'function') {
        request.abort();
      }
    });
    this.cleanupAllSessionStates();
  }

  /**
   * 绑定页面卸载事件
   */
  bindUnloadEvents() {
    // 页面卸载时清除thinking状态
    window.addEventListener('beforeunload', () => {
      this.setThinkingState(false);
    });

    // 页面隐藏时也清除thinking状态（用户切换标签页或最小化窗口）
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isCurrentTabThinking()) {
        this.setThinkingState(false);
      }
    });
  }

  /**
   * 重置状态管理器
   */
  reset() {
    this.setThinkingState(false);
    this.cleanupAllSessionStates();
  }

  /**
   * 获取状态统计信息
   */
  getStats() {
    return {
      tabId: this.tabId,
      isAnyTabThinking: this.isAnyTabThinking(),
      isCurrentTabThinking: this.isCurrentTabThinking(),
      thinkingSessionsCount: this.sessionThinkingState.size,
      requestingSessionsCount: this.sessionRequests.size,
      thinkingSessions: this.getThinkingSessions(),
      requestingSessions: this.getRequestingSessions(),
      isBusy: this.isBusy()
    };
  }

  /**
   * 调试信息
   */
  debug() {
    console.log('StateManager Debug Info:', this.getStats());
  }

  /**
   * 设置UI状态
   */
  setUIState(elements, state) {
    const { sendBtn, userInput } = elements;
    
    switch (state) {
      case 'thinking':
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.textContent = 'Thinking...';
        }
        if (userInput) {
          userInput.disabled = true;
        }
        break;
        
      case 'ready':
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = '发送';
        }
        if (userInput) {
          userInput.disabled = false;
          userInput.focus();
        }
        break;
        
      case 'waiting':
        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.textContent = '等待中...';
        }
        if (userInput) {
          userInput.disabled = true;
        }
        break;
        
      default:
        console.warn('Unknown UI state:', state);
    }
  }

  /**
   * 创建状态变更事件
   */
  dispatchStateChange(type, detail = {}) {
    const event = new CustomEvent('stateChange', {
      detail: {
        type,
        tabId: this.tabId,
        timestamp: Date.now(),
        ...detail
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 监听状态变更
   */
  onStateChange(callback) {
    document.addEventListener('stateChange', callback);
  }

  /**
   * 移除状态变更监听器
   */
  offStateChange(callback) {
    document.removeEventListener('stateChange', callback);
  }
}

// 导出到全局作用域
window.StateManager = StateManager;
