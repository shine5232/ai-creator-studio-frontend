import request from './request'

// 创建角色
export function createCharacter(projectId: string, data: any) {
  return request.post(`/projects/${projectId}/characters`, data)
}

// 获取项目角色列表
export function getCharacters(projectId: string) {
  return request.get(`/projects/${projectId}/characters`, { _silent: true } as any)
}

// 更新角色信息
export function updateCharacter(characterId: string, data: any) {
  return request.put(`/characters/${characterId}`, data)
}

// 生成角色提示词
export function generateCharPrompt(characterId: string, aspectRatio: string = '9:16') {
  return request.post(`/characters/${characterId}/generate-prompt`, { aspect_ratio: aspectRatio }, { timeout: 60000 } as any)
}

// 生成角色参考图（单张）
export function generateCharRefImage(characterId: string, data?: { provider?: string; aspect_ratio?: string }) {
  return request.post(`/characters/${characterId}/generate-reference`, data || {}, { timeout: 120000 } as any)
}

// 生成角色多角度参考图（正面/左侧/右侧/背面 4张）
export function generateCharMultiAngle(characterId: string, data?: { aspect_ratio?: string }) {
  return request.post(`/characters/${characterId}/generate-multi-angle`, data || {}, { timeout: 30000 } as any)
}

// 上传角色参考图
export function uploadCharacterImage(characterId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/characters/${characterId}/upload-image`, formData, {
    timeout: 60000,
  } as any)
}

// 更新角色角度提示词
export function updateRefImagePrompt(imageId: string, data: { prompt_cn?: string }) {
  return request.put(`/reference-images/${imageId}`, data)
}
