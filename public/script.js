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
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        addAIMessage(data.response);
      } catch (error) {
        console.error('Error:', error);
        addAIMessage('Sorry, I encountered an error. Please try again.');
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