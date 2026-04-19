import request from './request'

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

// 生成角色参考图
export function generateCharRefImage(characterId: string, data?: { provider?: string; aspect_ratio?: string }) {
  return request.post(`/characters/${characterId}/generate-reference`, data || {}, { timeout: 120000 } as any)
}
