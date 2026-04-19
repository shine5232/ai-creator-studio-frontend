import request from './request'

// 生成图片
export function generateImages(projectId: string) {
  return request.post(`/projects/${projectId}/generate/images`)
}

// 生成视频
export function generateVideos(projectId: string) {
  return request.post(`/projects/${projectId}/generate/videos`)
}

// 合并视频
export function mergeVideos(projectId: string, data?: any) {
  return request.post(`/projects/${projectId}/generate/merge`, data)
}

// 添加音乐
export function addMusic(projectId: string, data?: any) {
  return request.post(`/projects/${projectId}/generate/music`, data)
}

// 批量生成人物参考图
export function batchGenerateCharacterImages(projectId: string) {
  return request.post(`/projects/${projectId}/batch/character-images`)
}

// 批量生成分镜图片
export function batchGenerateShotImages(projectId: string, data?: any) {
  return request.post(`/projects/${projectId}/batch/shot-images`, data)
}

// 批量生成分镜视频
export function batchGenerateShotVideos(projectId: string, data?: any) {
  return request.post(`/projects/${projectId}/batch/shot-videos`, data)
}

// 批量生成分镜提示词
export function batchGenerateShotPrompts(projectId: string, data?: any) {
  return request.post(`/projects/${projectId}/batch/shot-prompts`, data)
}

// 获取任务列表
export function getTasks(params?: any) {
  return request.get('/generation/tasks', { params })
}

// 获取任务详情
export function getTask(taskId: string) {
  return request.get(`/generation/tasks/${taskId}`)
}

// 重试任务
export function retryTask(taskId: string) {
  return request.post(`/generation/tasks/${taskId}/retry`)
}
