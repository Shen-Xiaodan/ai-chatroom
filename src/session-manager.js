/**
 * 会话管理器 - 负责管理聊天会话和消息存储
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.currentSessionId = null;
    this.storageKey = 'ai-chatroom-sessions';
    this.currentSessionKey = 'ai-chatroom-current-session';
    
    // 从本地存储加载数据
    this.loadFromStorage();
    
    // 如果没有会话，创建默认会话
    if (this.sessions.size === 0) {
      this.createSession();
    }
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成会话标题
   */
  generateSessionTitle(messageCount = 0) {
    if (messageCount === 0) {
      return '新对话';
    }
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `对话 ${timeStr}`;
  }

  /**
   * 创建新会话
   */
  createSession(title = null) {
    const sessionId = this.generateId();
    const session = {
      id: sessionId,
      title: title || this.generateSessionTitle(),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    this.saveToStorage();
    
    return session;
  }

  /**
   * 切换到指定会话
   */
  switchToSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
      this.saveCurrentSession();
      return this.sessions.get(sessionId);
    }
    return null;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession() {
    if (this.currentSessionId && this.sessions.has(this.currentSessionId)) {
      return this.sessions.get(this.currentSessionId);
    }
    
    // 如果当前会话不存在，创建新会话
    return this.createSession();
  }

  /**
   * 获取所有会话（按更新时间倒序）
   */
  getAllSessions() {
    return Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * 添加消息到当前会话
   */
  addMessage(type, content, timestamp = null) {
    const session = this.getCurrentSession();
    if (!session) return;

    const message = {
      id: this.generateId(),
      type: type, // 'user' 或 'ai'
      content: content,
      timestamp: timestamp || new Date().toISOString()
    };

    session.messages.push(message);
    session.messageCount = session.messages.length;
    session.updatedAt = new Date().toISOString();

    // 如果是第一条用户消息，自动生成标题
    if (type === 'user' && session.messageCount === 1 && session.title === '新对话') {
      session.title = this.generateTitleFromMessage(content);
    }

    this.saveToStorage();
    return message;
  }

  /**
   * 根据消息内容生成标题
   */
  generateTitleFromMessage(content) {
    // 取前20个字符作为标题
    let title = content.trim().substring(0, 20);
    if (content.length > 20) {
      title += '...';
    }
    return title || this.generateSessionTitle(1);
  }

  /**
   * 重命名会话
   */
  renameSession(sessionId, newTitle) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = newTitle;
      session.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 清空会话消息
   */
  clearSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      session.messageCount = 0;
      session.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      
      // 如果删除的是当前会话，切换到其他会话
      if (this.currentSessionId === sessionId) {
        const remainingSessions = this.getAllSessions();
        if (remainingSessions.length > 0) {
          this.currentSessionId = remainingSessions[0].id;
        } else {
          // 如果没有其他会话，创建新会话
          this.createSession();
        }
      }
      
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * 保存到本地存储
   */
  saveToStorage() {
    try {
      const sessionsData = {};
      this.sessions.forEach((session, id) => {
        sessionsData[id] = session;
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(sessionsData));
      this.saveCurrentSession();
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error);
    }
  }

  /**
   * 保存当前会话ID
   */
  saveCurrentSession() {
    try {
      localStorage.setItem(this.currentSessionKey, this.currentSessionId || '');
    } catch (error) {
      console.error('Failed to save current session to localStorage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage() {
    try {
      // 加载会话数据
      const sessionsData = localStorage.getItem(this.storageKey);
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData);
        this.sessions.clear();
        
        Object.entries(parsed).forEach(([id, session]) => {
          this.sessions.set(id, session);
        });
      }

      // 加载当前会话ID
      const currentSessionId = localStorage.getItem(this.currentSessionKey);
      if (currentSessionId && this.sessions.has(currentSessionId)) {
        this.currentSessionId = currentSessionId;
      } else if (this.sessions.size > 0) {
        // 如果当前会话ID无效，选择最新的会话
        const latestSession = this.getAllSessions()[0];
        this.currentSessionId = latestSession.id;
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      this.sessions.clear();
      this.currentSessionId = null;
    }
  }

  /**
   * 清空所有数据
   */
  clearAllData() {
    this.sessions.clear();
    this.currentSessionId = null;
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.currentSessionKey);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * 导出会话数据
   */
  exportSessions() {
    const data = {
      sessions: {},
      currentSessionId: this.currentSessionId,
      exportTime: new Date().toISOString()
    };

    this.sessions.forEach((session, id) => {
      data.sessions[id] = session;
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入会话数据
   */
  importSessions(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.sessions) {
        this.sessions.clear();
        Object.entries(data.sessions).forEach(([id, session]) => {
          this.sessions.set(id, session);
        });

        if (data.currentSessionId && this.sessions.has(data.currentSessionId)) {
          this.currentSessionId = data.currentSessionId;
        } else if (this.sessions.size > 0) {
          this.currentSessionId = this.getAllSessions()[0].id;
        }

        this.saveToStorage();
        return true;
      }
    } catch (error) {
      console.error('Failed to import sessions:', error);
    }
    return false;
  }
}

// 创建全局实例
window.sessionManager = new SessionManager();

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}
