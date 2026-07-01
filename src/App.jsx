import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css';
import apiService from './services/apiService';
import storageService from './services/storageService';
import MarkdownRenderer from './components/MarkdownRenderer';

export default function App() {
  const [history, setHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([
    {sender: 'AI', text: `# 欢迎使用 AI Chatroom! 🤖

我是一个强大的AI助手，我可以：

- 📝 回答各种问题
- 💡 提供创意建议
- 🔧 协助解决问题
- 📚 解释复杂概念

试试问我任何问题吧！`, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
  ]);
  const [input, setInput] = useState('');
  const [page, setPage] = useState('chat');

  // 设置表单状态
  const [settings, setSettings] = useState(storageService.getDefaultSettings());
  const [showPassword, setShowPassword] = useState(false);

  // 新增状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // 聊天容器引用，用于自动滚动
  const chatBodyRef = useRef(null);

  // 防竞态条件：保存最新状态的引用
  const historyRef = useRef(history);
  const activeChatRef = useRef(activeChat);
  const isUpdatingRef = useRef(false); // 状态更新锁

  // 同步 ref 值
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // 创建默认会话的函数
  const createDefaultChat = useCallback(() => {
    return {
      title: 'Chat 1',
      time: getCurrentTime(),
      isLoading: false,
      messages: [{sender: 'AI', text: `# 欢迎使用 AI Chatroom! 🤖

我是一个强大的AI助手，我可以：

- 📝 回答各种问题
- 💡 提供创意建议
- 🔧 协助解决问题
- 📚 解释复杂概念

试试问我任何问题吧！`, time: getCurrentTime()}]
    };
  }, []);

  // 初始化：加载保存的设置和历史记录
  useEffect(() => {
    // 加载设置
    const savedSettings = storageService.loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
    }

    // 加载聊天历史并确保每个聊天都有 isLoading 字段（向后兼容）
    const savedHistory = storageService.loadChatHistory();
    if (savedHistory && savedHistory.length > 0) {
      const updatedHistory = savedHistory.map(chat => ({
        ...chat,
        isLoading: chat.isLoading !== undefined ? chat.isLoading : false
      }));
      setHistory(updatedHistory);
      // 如果有历史记录，默认选中第一个会话
      setActiveChat(0);
      setMessages(updatedHistory[0].messages);
    } else {
      // 如果没有历史记录，自动创建第一个会话
      const defaultChat = createDefaultChat();
      setHistory([defaultChat]);
      setActiveChat(0);
      setMessages(defaultChat.messages);
    }
  }, [createDefaultChat]);

  // 自动保存历史记录
  useEffect(() => {
    // 总是保存历史记录，即使为空数组
    storageService.saveChatHistory(history);
  }, [history]);

  // 当消息或加载状态变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // 获取当前聊天的 thinking 状态
  const getCurrentChatLoading = () => {
    if (activeChat !== null && history[activeChat]) {
      return history[activeChat].isLoading;
    }
    return isLoading; // 向后兼容，如果没有活跃聊天则使用全局状态
  };

  // 安全的历史记录更新函数，防止竞态条件
  const safeUpdateHistory = useCallback((updateFn) => {
    if (isUpdatingRef.current) {
      // 如果正在更新，延迟执行
      setTimeout(() => safeUpdateHistory(updateFn), 10);
      return;
    }

    isUpdatingRef.current = true;
    setHistory(currentHistory => {
      const newHistory = updateFn(currentHistory);
      isUpdatingRef.current = false;
      return newHistory;
    });
  }, []);

  // 安全的聊天切换函数
  const safeSwitchChat = useCallback((chatIndex, newMessages) => {
    // 使用函数式更新确保状态一致性
    setActiveChat(chatIndex);
    setMessages(newMessages);
  }, []);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      setTimeout(() => {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }, 100);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || getCurrentChatLoading()) return;

    // 检查设置是否完整
    if (!storageService.validateSettings(settings)) {
      setError('请先在设置中配置完整的 API 信息');
      return;
    }

    const currentTime = getCurrentTime();
    const userMessage = {sender: 'User', text: input.trim(), time: currentTime};
    const newMessages = [...messages, userMessage];

    // 保存当前活跃聊天的索引，防止在异步过程中被改变
    const currentActiveChat = activeChatRef.current;

    setMessages(newMessages);
    setInput('');
    setError(null);

    // 使用安全的更新函数，防止竞态条件
    if (currentActiveChat !== null && historyRef.current[currentActiveChat]) {
      safeUpdateHistory(currentHistory => {
        const newHistory = [...currentHistory];
        if (newHistory[currentActiveChat]) {
          newHistory[currentActiveChat].messages = newMessages;
          newHistory[currentActiveChat].isLoading = true;
        }
        return newHistory;
      });
    } else {
      // 如果没有活跃聊天，使用全局状态（向后兼容）
      setIsLoading(true);
    }

    try {
      // 调用 AI API
      const aiResponse = await apiService.sendMessage(newMessages, settings);
      const aiMessage = {sender: 'AI', text: aiResponse, time: getCurrentTime()};
      const finalMessages = [...newMessages, aiMessage];

      // 只有当前聊天仍然是活跃聊天时才更新消息
      if (activeChatRef.current === currentActiveChat) {
        setMessages(finalMessages);
      }

      // 使用安全的更新函数更新历史记录
      if (currentActiveChat !== null && historyRef.current[currentActiveChat]) {
        safeUpdateHistory(currentHistory => {
          const newHistory = [...currentHistory];
          if (newHistory[currentActiveChat]) {
            newHistory[currentActiveChat].messages = finalMessages;
            newHistory[currentActiveChat].isLoading = false;
          }
          return newHistory;
        });
      }
    } catch (error) {
      console.error('API 调用失败:', error);
      setError(error.message || 'AI 响应失败，请稍后重试');

      // 添加错误消息到聊天中
      const errorMessage = {
        sender: 'AI',
        text: `抱歉，我遇到了一些问题：${error.message || '未知错误'}`,
        time: getCurrentTime(),
        isError: true
      };
      const finalMessages = [...newMessages, errorMessage];

      // 只有当前聊天仍然是活跃聊天时才更新消息
      if (activeChatRef.current === currentActiveChat) {
        setMessages(finalMessages);
      }

      // 使用安全的更新函数更新历史记录
      if (currentActiveChat !== null && historyRef.current[currentActiveChat]) {
        safeUpdateHistory(currentHistory => {
          const newHistory = [...currentHistory];
          if (newHistory[currentActiveChat]) {
            newHistory[currentActiveChat].messages = finalMessages;
            newHistory[currentActiveChat].isLoading = false;
          }
          return newHistory;
        });
      }
    } finally {
      // 如果没有活跃聊天，清除全局状态（向后兼容）
      if (currentActiveChat === null) {
        setIsLoading(false);
      }
    }
  }

  // 取消当前请求
  const handleCancelRequest = () => {
    apiService.cancelRequest();

    const currentActiveChat = activeChatRef.current;

    // 使用安全的更新函数清除当前聊天的 thinking 状态
    if (currentActiveChat !== null && historyRef.current[currentActiveChat]) {
      safeUpdateHistory(currentHistory => {
        const newHistory = [...currentHistory];
        if (newHistory[currentActiveChat]) {
          newHistory[currentActiveChat].isLoading = false;
        }
        return newHistory;
      });
    } else {
      // 如果没有活跃聊天，清除全局状态（向后兼容）
      setIsLoading(false);
    }

    setError(null);
  };

  // 重试发送消息
  const handleRetry = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'User');
      if (lastUserMessage) {
        setInput(lastUserMessage.text);
        setError(null);
      }
    }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSend();
      }
    };

  const handleDeleteHistory = (index, e) => {
    if (!historyRef.current[index]) return;
    e.stopPropagation(); // 防止触发点击事件

    // 使用安全的更新函数删除聊天
    safeUpdateHistory(currentHistory => {
      const newHistory = currentHistory.filter((_, i) => i !== index);

      // 如果删除后没有剩余会话，自动创建一个新会话
      if (newHistory.length === 0) {
        const defaultChat = createDefaultChat();
        return [defaultChat];
      }

      return newHistory;
    });

    // 处理活跃聊天的状态更新
    const currentHistory = historyRef.current;
    const newHistoryLength = currentHistory.length - 1;

    if (newHistoryLength === 0) {
      // 如果删除后没有剩余会话，切换到新创建的默认会话
      const defaultChat = createDefaultChat();
      safeSwitchChat(0, defaultChat.messages);
    } else if (activeChatRef.current === index) {
      // 如果删除的是当前活跃的聊天，切换到第一个可用的会话
      const targetIndex = index > 0 ? index - 1 : 0;
      // 延迟执行以确保历史记录已更新
      setTimeout(() => {
        const updatedHistory = historyRef.current;
        if (updatedHistory[targetIndex]) {
          safeSwitchChat(targetIndex, updatedHistory[targetIndex].messages);
        }
      }, 50);
    } else if (activeChatRef.current > index) {
      // 如果删除的会话在当前活跃会话之前，调整活跃会话索引
      setActiveChat(activeChatRef.current - 1);
    }
  }

  const handleEditHistory = (index, e) => {
    e.stopPropagation(); // 防止触发点击事件
    const newTitle = prompt('Enter new title');
    if (newTitle) {
      safeUpdateHistory(currentHistory => {
        const newHistory = [...currentHistory];
        if (newHistory[index]) {
          newHistory[index].title = newTitle;
        }
        return newHistory;
      });
    }
  }

  const handleNewChat = () => {
    const currentHistoryLength = historyRef.current.length;
    const newChat = {
      title: `Chat ${currentHistoryLength + 1}`,
      time: getCurrentTime(),
      isLoading: false, // 为每个聊天添加独立的 thinking 状态
      messages: [{sender: 'AI', text: `# 欢迎使用 AI Chatroom! 🤖

我是一个强大的AI助手，我可以：

- 📝 回答各种问题
- 💡 提供创意建议
- 🔧 协助解决问题
- 📚 解释复杂概念

试试问我任何问题吧！`, time: getCurrentTime()}]
    };

    // 使用安全的更新函数添加新聊天
    safeUpdateHistory(currentHistory => [...currentHistory, newChat]);

    // 使用安全的聊天切换函数
    safeSwitchChat(currentHistoryLength, newChat.messages);
  }

  const handleChatSelect = (index) => {
    const currentHistory = historyRef.current;
    if (currentHistory[index] && currentHistory[index].messages) {
      safeSwitchChat(index, currentHistory[index].messages);
    } else {
      const defaultMessages = [{sender: 'AI', text: `# 欢迎使用 AI Chatroom! 🤖

我现在支持 **Markdown** 格式渲染了！你可以：

- 发送普通文本消息
- 我会用 *Markdown* 格式回复
- 支持代码高亮：

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> 现在就开始聊天吧！`, time: getCurrentTime()}];
      safeSwitchChat(index, defaultMessages);
    }
  }

  const handleClearMessages = (e) => {
    e.stopPropagation(); // 防止触发点击事件
    const welcomeMessage = {sender: 'AI', text: `# 欢迎使用 AI Chatroom! 🤖

我现在支持 **Markdown** 格式渲染了！你可以：

- 发送普通文本消息
- 我会用 *Markdown* 格式回复
- 支持代码高亮：

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> 现在就开始聊天吧！`, time: getCurrentTime()};
    setMessages([welcomeMessage]);

    // 如果有活跃的聊天，也更新历史记录中的消息
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat !== null && historyRef.current[currentActiveChat]) {
      safeUpdateHistory(currentHistory => {
        const newHistory = [...currentHistory];
        if (newHistory[currentActiveChat]) {
          newHistory[currentActiveChat].messages = [welcomeMessage];
        }
        return newHistory;
      });
    }
  }

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  }

  const handleRegenerateResponse = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'User');
      if (lastUserMessage) {
        setInput(lastUserMessage.text);
        handleSend();
      }
    }
  }

  const handleEditMessage = (index) => {
    const newMessage = prompt('Enter new message');
    if (newMessage) {
      const newMessages = [...messages];
      newMessages[index].text = newMessage;
      setMessages(newMessages);

      // 同时更新历史记录
      const currentActiveChat = activeChatRef.current;
      if (currentActiveChat !== null && historyRef.current[currentActiveChat]) {
        safeUpdateHistory(currentHistory => {
          const newHistory = [...currentHistory];
          if (newHistory[currentActiveChat]) {
            newHistory[currentActiveChat].messages = newMessages;
          }
          return newHistory;
        });
      }
    }
  }

  const handleOpenSettings = () => {
    setPage('settings');
  }

  const handleBackToChat = () => {
    setPage('chat');
  }

  // 设置相关处理函数
  const handleSaveSettings = () => {
    if (!storageService.validateSettings(settings)) {
      setError('请填写完整的 API 配置信息');
      return;
    }

    const success = storageService.saveSettings(settings);
    if (success) {
      setError(null);
      alert('设置保存成功！');
    } else {
      setError('设置保存失败，请重试');
    }
  };

  const handleResetSettings = () => {
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      const defaultSettings = storageService.resetSettings();
      setSettings(defaultSettings);
      setError(null);
      alert('设置已重置为默认值');
    }
  };

  const handleTestConnection = async () => {
    if (!storageService.validateSettings(settings)) {
      setError('请先填写完整的 API 配置信息');
      return;
    }

    setIsTestingConnection(true);
    setError(null);
  
    try {
      await apiService.testConnection(settings);
      alert('连接测试成功！API 配置正常。');
    } catch (error) {
      console.error('连接测试失败:', error);
      setError(`连接测试失败: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="App">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span className="chat-icon">AI</span>
            历史对话
          </div>
          <button
          onClick={handleNewChat}
          className="new-chat-btn">+</button>
        </div>
        <div className="chat-history">
          {history.map((chat, index) => (
            <div
              key={index}
              className={`history-item ${activeChat === index ? 'active' : ''}`}
              onClick={() => handleChatSelect(index)}
            >
              <div className="history-title">{chat.title}</div>
              <div className="history-time">{chat.time}</div>
              <div className="history-actions">
                <button
                onClick={(e) => handleEditHistory(index, e)}
                className="edit-btn">Edit</button>
                <button
                onClick={handleClearMessages}
                className="clean-btn">Clear</button>
                <button
                onClick={(e) => handleDeleteHistory(index, e)}
                className="delete-btn">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {page === 'chat' ? (
        <div className="main-chat">
          <div className="chat-header">
            <div className="header-left">
              <span className="ai-icon">AI</span>
              <span className="ai-title">AI Chatroom</span>
              <span className="model-info">deepseek-ai/DeepSeek-V3</span>
            </div>
            <div className="header-right">
              <button
              onClick={handleOpenSettings}
              className="header-btn">Menu</button>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender === 'AI' ? 'ai-message' : 'user-message'} ${message.isError ? 'error-message-item' : ''}`}>
                <div className="message-wrapper">
                  {message.sender === 'AI' ? (
                    <>
                      <div className="avatar ai-avatar">AI</div>
                      <div className="message-content">
                        <MarkdownRenderer content={message.text} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="message-content">
                        {message.text}
                      </div>
                      <div className="avatar user-avatar">YOU</div>
                    </>
                  )}
                </div>
                <div className="message-footer">
                  <div className="message-actions">
                    {message.sender === 'AI' && (
                      <>
                        <div className="message-time">{message.time || getCurrentTime()}</div>
                        <button
                        onClick={() => handleCopyToClipboard(message.text)}
                        className="action-btn">Copy</button>
                        <button
                        onClick={() => handleRegenerateResponse(index)}
                        className="action-btn">Retry</button>
                      </>
                    )}
                    {message.sender === 'User' && (
                      <>
                        <button
                        onClick={() => handleCopyToClipboard(message.text)}
                        className="action-btn">Copy</button>
                        <button
                        onClick={() => handleEditMessage(index)}
                        className="action-btn">Edit</button>
                        <div className="message-time">{message.time || getCurrentTime()}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading 指示器 - 根据当前聊天的 thinking 状态显示 */}
            {getCurrentChatLoading() && (
              <div className="message ai-message loading-message">
                <div className="message-wrapper">
                  <div className="avatar ai-avatar">AI</div>
                  <div className="message-content loading-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    I'm thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-footer">
            {error && (
              <div className="error-banner">
                ⚠️ {error}
                <button
                  className="error-close"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </div>
            )}
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getCurrentChatLoading() ? "I'm thinking..." : "Type your message here..."}
                disabled={getCurrentChatLoading()}
              />
              {getCurrentChatLoading() ? (
                <button
                  onClick={handleCancelRequest}
                  className="send-btn cancel-btn"
                >
                  取消
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  className="send-btn"
                  disabled={input.trim() === ''}
                >
                  Send
                </button>
              )}
              {error && (
                <button
                  onClick={handleRetry}
                  className="retry-btn"
                  title="重试上一条消息"
                >
                  🔄
                </button>
              )}
            </div>
            <div className="footer-info">
              AI Chatroom
            </div>
          </div>
        </div>
      ) : (
        <div className="settings">
          <div className="settings-modal">
            <div className="settings-header">
              <h2 className="settings-title">
                <span className="settings-icon">⚙️</span>
                API 配置
              </h2>
              <button onClick={handleBackToChat} className="close-btn">✕</button>
            </div>

            <div className="settings-content">
              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">API 提供商:</label>
                <select
                  className="form-select"
                  value={settings.provider}
                  onChange={(e) => setSettings({...settings, provider: e.target.value})}
                >
                  <option value="SiliconFlow">SiliconFlow</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Other">其他</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">API Key:</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                    placeholder="请输入API Key"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="help-text">您的 API Key 将安全地存储在浏览器本地，不会上传到任何服务器</div>
              </div>

              <div className="form-group">
                <label className="form-label required">Base URL:</label>
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({...settings, baseUrl: e.target.value})}
                  placeholder="请输入Base URL"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label required">模型名称:</label>
                <select
                  className="form-select"
                  value={settings.model}
                  onChange={(e) => setSettings({...settings, model: e.target.value})}
                >
                  <option value="deepseek-ai/DeepSeek-V3">deepseek-ai/DeepSeek-V3</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">最大 Token 数:</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                  placeholder="请输入最大Token数"
                  className="form-input"
                  min="1"
                  max="32000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">温度值 (0-2):</label>
                <input
                  type="number"
                  value={settings.temperature}
                  onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  placeholder="请输入温度值"
                  className="form-input"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </div>
            <div className="settings-actions">
              <button
                className="btn btn-secondary"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? '测试中...' : '测试连接'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleResetSettings}
              >
                重置配置
              </button>
              <button
                className="btn btn-success"
                onClick={handleSaveSettings}
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


