/**
 * 本地存储服务
 * 处理用户设置的保存和加载
 */

const STORAGE_KEYS = {
  SETTINGS: 'ai_chatroom_settings',
  CHAT_HISTORY: 'ai_chatroom_history'
};

class StorageService {
  /**
   * 保存设置到本地存储
   * @param {Object} settings - 设置对象
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载设置
   * @returns {Object|null} 设置对象或 null
   */
  loadSettings() {
    try {
      const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
      return null;
    } catch (error) {
      console.error('加载设置失败:', error);
      return null;
    }
  }

  /**
   * 获取默认设置
   * @returns {Object} 默认设置对象
   */
  getDefaultSettings() {
    return {
      provider: 'SiliconFlow',
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'deepseek-ai/DeepSeek-V3',
      maxTokens: 2048,
      temperature: 0.7
    };
  }

  /**
   * 重置设置为默认值
   * @returns {Object} 默认设置对象
   */
  resetSettings() {
    const defaultSettings = this.getDefaultSettings();
    this.saveSettings(defaultSettings);
    return defaultSettings;
  }

  /**
   * 保存聊天历史到本地存储
   * @param {Array} history - 聊天历史数组
   */
  saveChatHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('保存聊天历史失败:', error);
      return false;
    }
  }

  /**
   * 从本地存储加载聊天历史
   * @returns {Array} 聊天历史数组
   */
  loadChatHistory() {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (historyStr) {
        return JSON.parse(historyStr);
      }
      return [];
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      return [];
    }
  }

  /**
   * 清除所有本地存储数据
   */
  clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      return true;
    } catch (error) {
      console.error('清除数据失败:', error);
      return false;
    }
  }

  /**
   * 检查是否有保存的设置
   * @returns {boolean} 是否有保存的设置
   */
  hasSettings() {
    return localStorage.getItem(STORAGE_KEYS.SETTINGS) !== null;
  }

  /**
   * 验证设置是否完整
   * @param {Object} settings - 设置对象
   * @returns {boolean} 设置是否完整
   */
  validateSettings(settings) {
    if (!settings) return false;
    
    const requiredFields = ['apiKey', 'baseUrl', 'model'];
    return requiredFields.every(field => 
      settings[field] && settings[field].toString().trim() !== ''
    );
  }
}

// 创建单例实例
const storageService = new StorageService();

export default storageService;
