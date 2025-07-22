# Thinking状态共享问题修复

## 问题描述
在发送消息到聊天室时，thinking状态出现了两个问题：
1. **跨标签页共享**：不同标签页之间thinking状态共享，导致其他标签页不能发送消息
2. **跨会话共享**：在一个会话中发送消息时，切换到另一个会话仍然显示thinking状态并报错

## 问题原因
### 跨标签页问题
- 每个标签页的DOM是独立的，但没有机制防止多个标签页同时发送请求
- 当一个标签页正在处理请求时，其他标签页的用户仍然可以尝试发送消息
- 这可能导致请求冲突或状态混乱

### 跨会话问题
- thinking状态是全局的，不区分会话
- 会话切换时没有清理UI状态（发送按钮状态、typing indicator等）
- DOM中可能残留typing indicator元素

## 解决方案
实现了一个综合的thinking状态管理机制，解决跨标签页和跨会话的问题：

### 1. 跨标签页状态管理
#### 标签页唯一标识
- 每个标签页在加载时生成唯一的`tabId`
- 使用时间戳和随机字符串确保唯一性

#### localStorage状态管理
- 使用localStorage存储当前thinking状态
- 包含正在处理请求的标签页ID和时间戳
- 状态会在30秒后自动过期（防止异常情况）

#### 状态检查机制
- 发送消息前检查是否有其他标签页正在thinking
- 如果有，显示提示信息并阻止发送
- 只有当前标签页可以清除自己设置的thinking状态

### 2. 跨会话状态管理
#### 会话级别的thinking状态跟踪
- 为每个会话单独跟踪thinking状态
- 使用`sessionThinkingState` Map存储会话thinking状态
- 使用`sessionRequests` Map跟踪正在进行的请求

#### 后台请求处理
- 请求在后台继续进行，不因UI切换而中断
- 使用`handleChatRequest`函数处理异步请求
- 请求完成后自动添加到对应会话

#### 智能UI管理
- 会话切换时只清理UI，不中断后台请求
- 切换回原会话时恢复thinking状态或显示结果
- 统一的`cleanupThinkingState()`函数处理UI清理

### 3. 自动清理机制
- 页面卸载时自动清除thinking状态
- 页面隐藏时（切换标签页）也会清除状态
- 请求完成或出错时清除状态

## 修改的文件
- `src/script.js` - 添加了thinking状态管理逻辑

## 测试方法

### 1. 基本功能测试
1. 打开聊天室页面
2. 发送一条消息
3. 验证thinking状态正常显示和清除

### 2. 多标签页测试
1. 在浏览器中打开两个聊天室标签页
2. 在第一个标签页发送消息（会显示"Thinking..."）
3. 立即切换到第二个标签页尝试发送消息
4. 应该看到提示："另一个标签页正在处理消息，请稍后再试"
5. 等待第一个标签页的消息处理完成
6. 在第二个标签页再次尝试发送消息，应该可以正常发送

### 3. 跨会话测试（重要）
1. 在当前会话中发送一条消息（进入thinking状态）
2. 立即点击侧边栏切换到另一个会话
3. 验证：
   - thinking状态应该被清除
   - 发送按钮应该恢复正常状态
   - 没有残留的typing indicator
   - 可以正常发送新消息

### 4. 会话操作测试
1. 在thinking状态下新建会话 - 状态应该被清理
2. 在thinking状态下清空当前会话 - 状态应该被清理
3. 在thinking状态下删除当前会话 - 状态应该被清理

### 5. 异常情况测试
1. 在thinking状态下关闭标签页
2. 在其他标签页应该能够正常发送消息（状态会自动清理）

## 技术细节

### 状态管理函数
- `setThinkingState(isThinking)` - 设置或清除跨标签页thinking状态
- `isAnyTabThinking()` - 检查是否有任何标签页在thinking
- `isCurrentTabThinking()` - 检查当前标签页是否在thinking
- `setSessionThinking(sessionId, isThinking)` - 设置会话级别thinking状态
- `isSessionThinking(sessionId)` - 检查指定会话是否在thinking
- `handleChatRequest(sessionId, message, history, typingIndicator)` - 处理后台聊天请求
- `cleanupThinkingState()` - 清理UI状态（不中断后台请求）

### 状态存储格式
```json
{
  "tabId": "tab_1234567890_abcdefghi",
  "timestamp": 1234567890123
}
```

### 自动过期机制
- 状态超过30秒自动过期
- 防止异常情况导致的永久锁定

## 优势
1. **简单有效** - 使用localStorage实现，无需服务器端支持
2. **全面覆盖** - 同时解决跨标签页和跨会话的问题
3. **自动清理** - 多种机制确保状态不会永久锁定
4. **用户友好** - 提供清晰的提示信息
5. **兼容性好** - 不影响现有功能
6. **状态一致性** - 确保UI状态与实际状态保持一致

## 注意事项
- 依赖localStorage，在隐私模式下可能有限制
- 30秒的过期时间可以根据需要调整
- 如果需要更复杂的状态管理，可以考虑使用BroadcastChannel API
