# 🔧 故障排除指南 - SiliconFlow DeepSeek V3

## 429 "Too Many Requests" 错误解决方案

### 问题描述
当你看到以下错误时：
```
{
  status: 429,
  statusText: 'Too Many Requests',
  errorDetails: [
    {
      '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
      violations: [Array]
    },
    {
      '@type': 'type.googleapis.com/google.rpc.RetryInfo',
      retryDelay: '22s'
    }
  ]
}
```

### 原因分析
1. **API 配额限制** - SiliconFlow API 有使用限制
2. **请求频率过高** - 短时间内发送了太多请求
3. **API Key 问题** - API Key 可能无效或权限不足

### 解决方案

#### 1. 立即解决
- **等待重试** - 根据 `Retry-After` 头部提示等待
- **检查 API Key** - 确保 `.env` 文件中的 `SILICONFLOW_API_KEY` 正确
- **减慢请求频率** - 避免快速连续发送消息

#### 2. 代码改进（已实现）
- ✅ **请求限制** - 每分钟最多 10 个请求
- ✅ **自动重试** - 指数退避重试机制
- ✅ **错误处理** - 友好的错误提示
- ✅ **状态检查** - 访问 `/status.html` 查看系统状态

#### 3. 长期解决
- **升级 API 计划** - 考虑升级到 SiliconFlow 付费计划
- **使用多个 API Key** - 轮换使用（需要额外开发）
- **缓存机制** - 缓存常见问题的回答

### 使用建议

#### 检查系统状态
1. 访问 `http://localhost:3000/status.html`
2. 点击"重新检查"查看服务器状态
3. 点击"测试 API"验证 API 连接

#### 监控 API 使用
```bash
# 查看服务器日志
npm start

# 检查 .env 文件
cat .env
```

#### 优化使用方式
- 避免发送过长的消息
- 等待 AI 回复完成后再发送下一条消息
- 避免重复发送相同的消息

### 常见错误码

| 错误码 | 含义 | 解决方案 |
|--------|------|----------|
| 429 | 请求过于频繁 | 等待重试时间，减慢请求频率 |
| 401 | API Key 无效 | 检查 .env 文件中的 SILICONFLOW_API_KEY |
| 403 | 权限不足 | 确保 API Key 有正确权限 |
| 500 | 服务器错误 | 检查服务器日志，重启服务 |

### 获取 SiliconFlow API Key

1. 访问 [SiliconFlow 官网](https://siliconflow.cn/)
2. 注册并登录账户
3. 在控制台创建新的 API Key
4. 将 API Key 添加到 `.env` 文件：
   ```
   SILICONFLOW_API_KEY=your_api_key_here
   ```

### 配额限制说明

#### 免费版限制
- 每分钟请求数：有限制
- 每天请求数：有限制
- 每月请求数：有限制

#### 付费版优势
- 更高的请求频率限制
- 更大的每日/每月配额
- 更好的服务稳定性

### 联系支持
如果问题持续存在：
1. 检查 [SiliconFlow 状态页面](https://siliconflow.cn/status)
2. 查看 [SiliconFlow 文档](https://docs.siliconflow.cn/)
3. 联系 SiliconFlow 支持

### 开发者工具
- **状态页面**: `http://localhost:3000/status.html`
- **健康检查**: `http://localhost:3000/health`
- **API 状态**: `http://localhost:3000/api/status`
