import request from './request'

// 获取故事板
export function getStoryboard(scriptId: string) {
  return request.get(`/scripts/${scriptId}/storyboard`, { _silent: true } as any)
}

// 创建故事板（AI生成分镜）
export function createStoryboard(scriptId: string) {
  return request.post(`/scripts/${scriptId}/storyboard`)
}

// 获取故事板详情
export function getStoryboardDetail(storyboardId: string) {
  return request.get(`/storyboards/${storyboardId}`)
}

// 更新镜头
export function updateShot(shotId: string, data: any) {
  return request.put(`/shots/${shotId}`, data)
}

// 重新生成图片
export function regenerateImage(shotId: string) {
  return request.post(`/shots/${shotId}/regenerate-image`)
}

// 重新生成视频
export function regenerateVideo(shotId: string) {
  return request.post(`/shots/${shotId}/regenerate-video`)
}

// 同步生成单个镜头提示词
export function generateShotPrompt(shotId: string) {
  return request.post(`/shots/${shotId}/generate-prompt`, {}, { timeout: 60000 } as any)
}

// 生成单个镜头图片（异步任务，返回 task_id）
export function generateShotImage(shotId: string, aspectRatio: string = '9:16') {
  return request.post(`/shots/${shotId}/generate-image`, { aspect_ratio: aspectRatio })
}
