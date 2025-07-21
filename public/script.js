document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  
  // 添加用户消息
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    
    messageElement.innerHTML = `
      <div class="avatar">👤</div>
      <div class="content">
        <div class="text">${message}</div>
        <div class="timestamp">${getCurrentTime()}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // 添加AI消息
  function addAIMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'ai-message');
    
    messageElement.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text">${message}</div>
        <div class="timestamp">${getCurrentTime()}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
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
      
      try {
        // 显示"正在输入"状态
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'ai-message');
        typingIndicator.innerHTML = `
          <div class="avatar">🤖</div>
          <div class="content">
            <div class="text typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // 发送请求到服务器
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });
        
        // 移除"正在输入"状态
        chatMessages.removeChild(typingIndicator);

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

        addAIMessage(`❌ 抱歉，遇到了错误：${error.message}\n\n请稍后重试。如果问题持续存在，可能是API配额限制或网络问题。`);
      }
    }
  }
  
  // 发送按钮点击事件
  sendBtn.addEventListener('click', sendMessage);
  
  // 回车键发送消息
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // 初始聚焦到输入框
  userInput.focus();
});