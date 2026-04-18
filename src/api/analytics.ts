import request from './request'

// 概览
export function getOverview() {
  return request.get('/analytics/overview')
}

// 生成成本
export function getGenerationCosts(params?: any) {
  return request.get('/analytics/generation-costs', { params })
}

// 内容表现
export function getContentPerformance(params?: any) {
  return request.get('/analytics/content-performance', { params })
}

// AI使用情况
export function getAIUsage(params?: any) {
  return request.get('/analytics/ai-usage', { params })
}

// 配额信息
export function getQuotas() {
  return request.get('/analytics/quotas')
}
