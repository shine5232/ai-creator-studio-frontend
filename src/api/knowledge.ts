import request from './request'

// 素材库列表
export function getKnowledgeCases(params?: any) {
  return request.get('/kb/cases', { params })
}

// 获取案例详情
export function getKnowledgeCase(caseId: string) {
  return request.get(`/kb/cases/${caseId}`)
}

// 创建案例（通过视频分析）
export function createKnowledgeCase(data: any) {
  return request.post('/kb/analyze-video', data)
}

// 视频分析
export function analyzeVideo(data: { source_url: string; platform?: string }) {
  return request.post('/kb/analyze-video', data)
}

// 查询分析进度
export function getAnalysisStatus(caseId: number) {
  return request.get(`/kb/analysis/${caseId}`)
}

// 删除案例
export function deleteKnowledgeCase(caseId: number) {
  return request.delete(`/kb/cases/${caseId}`)
}

// 重新分析案例
export function reanalyzeCase(caseId: number) {
  return request.post(`/kb/cases/${caseId}/reanalyze`)
}

// 推荐案例
export function recommendCases(data: { description?: string; platform?: string; limit?: number }) {
  return request.post('/kb/recommend-cases', data)
}

// 获取案例参考上下文
export function getReferenceContext(caseId: number) {
  return request.get(`/kb/cases/${caseId}/reference-context`)
}

// 获取案例 Markdown 报告
export function getCaseMarkdown(caseId: string | number) {
  return request.get(`/kb/cases/${caseId}/markdown`, {
    responseType: 'text'
  })
}
