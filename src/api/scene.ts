import request from './request'

// 获取项目场景列表
export function getScenes(projectId: string) {
  return request.get(`/projects/${projectId}/scenes`, { _silent: true } as any)
}

// 创建场景
export function createScene(projectId: string, data: any) {
  return request.post(`/projects/${projectId}/scenes`, data)
}

// 更新场景
export function updateScene(sceneId: string, data: any) {
  return request.put(`/scenes/${sceneId}`, data)
}

// 删除场景
export function deleteScene(sceneId: string) {
  return request.delete(`/scenes/${sceneId}`)
}

// 生成场景参照图
export function generateSceneImage(sceneId: string) {
  return request.post(`/scenes/${sceneId}/generate-image`, {}, { timeout: 120000 } as any)
}
