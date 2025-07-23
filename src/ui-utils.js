/**
 * UI工具类 - 提供通用的UI工具函数
 */
class UIUtils {
  constructor() {
    // 初始化
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
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
   * 格式化时间戳
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * 获取相对时间
   */
  getTimeAgo(timestamp) {
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

  /**
   * 自动调整textarea高度
   */
  autoResizeTextarea(textarea, maxHeight = 120) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
  }

  /**
   * 滚动到指定元素
   */
  scrollToElement(element, behavior = 'smooth', block = 'center') {
    element.scrollIntoView({
      behavior: behavior,
      block: block
    });
  }

  /**
   * 滚动到底部
   */
  scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }

  /**
   * 创建加载指示器
   */
  createLoadingIndicator(text = '加载中...') {
    const indicator = document.createElement('div');
    indicator.classList.add('loading-indicator');
    indicator.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-text">${text}</span>
    `;
    return indicator;
  }

  /**
   * 创建typing指示器
   */
  createTypingIndicator(text = 'I\'m thinking') {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'ai-message');
    indicator.innerHTML = `
      <div class="avatar">🤖</div>
      <div class="content">
        <div class="text typing-indicator">
          ${text}<span class="dots">
          <span>.</span><span>.</span><span>.</span></span>
        </div>
      </div>
    `;
    return indicator;
  }

  /**
   * 显示确认对话框
   */
  showConfirm(message, title = '确认') {
    return confirm(`${title}\n\n${message}`);
  }

  /**
   * 显示输入对话框
   */
  showPrompt(message, defaultValue = '', title = '输入') {
    return prompt(`${title}\n\n${message}`, defaultValue);
  }

  /**
   * 复制文本到剪贴板
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('已复制到剪贴板', 'success');
      return true;
    } catch (err) {
      console.error('复制失败:', err);

      // 降级方案：使用传统方法复制
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        this.showToast('已复制到剪贴板', 'success');
        return true;
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr);
        this.showToast('复制失败，请手动选择文本复制', 'error');
        return false;
      }
    }
  }

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 节流函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * 检查元素是否在视口中
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * 添加CSS类（带动画支持）
   */
  addClass(element, className, delay = 0) {
    setTimeout(() => {
      element.classList.add(className);
    }, delay);
  }

  /**
   * 移除CSS类（带动画支持）
   */
  removeClass(element, className, delay = 0) {
    setTimeout(() => {
      element.classList.remove(className);
    }, delay);
  }

  /**
   * 切换CSS类
   */
  toggleClass(element, className) {
    element.classList.toggle(className);
  }

  /**
   * 设置元素可见性
   */
  setVisible(element, visible) {
    if (visible) {
      element.style.display = '';
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  }

  /**
   * 淡入效果
   */
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = '';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * 淡出效果
   */
  fadeOut(element, duration = 300) {
    let start = null;
    const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
    
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.max(initialOpacity - (progress / duration), 0);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * 创建模态框遮罩
   */
  createModalOverlay() {
    const overlay = document.createElement('div');
    overlay.classList.add('modal-overlay');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    return overlay;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成随机ID
   */
  generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// 导出到全局作用域
window.UIUtils = UIUtils;
