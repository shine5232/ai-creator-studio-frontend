import request from './request'

// 脚本列表
export function getScripts(projectId: string) {
  return request.get(`/projects/${projectId}/scripts`)
}

// 创建脚本
export function createScript(projectId: string, data: any) {
  return request.post(`/projects/${projectId}/scripts`, data)
}

// AI生成脚本
export function generateScript(projectId: string, data: any) {
  return request.post(`/projects/${projectId}/scripts/generate`, data, {
    timeout: 300000, // 5分钟，脚本生成需要较长时间
  })
}

// 获取脚本详情
export function getScript(scriptId: string) {
  return request.get(`/scripts/${scriptId}`)
}

// 更新脚本
export function updateScript(scriptId: string, data: any) {
  return request.put(`/scripts/${scriptId}`, data)
}

// 删除脚本
export function deleteScript(scriptId: string) {
  return request.delete(`/scripts/${scriptId}`)
}

// 病毒传播分析
export function checkViral(scriptId: string) {
  return request.post(`/scripts/${scriptId}/check-viral`)
}

// 获取脚本 Markdown 内容
export function getScriptMarkdown(scriptId: string) {
  return request.get(`/scripts/${scriptId}/markdown`, {
    responseType: 'text'
  })
}
