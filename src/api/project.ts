import request from './request'

// 项目列表
export function getProjects(params?: { page?: number; page_size?: number }) {
  return request.get('/projects', { params })
}

// 创建项目
export function createProject(data: any) {
  return request.post('/projects', data)
}

// 获取项目详情
export function getProject(id: string) {
  return request.get(`/projects/${id}`)
}

// 更新项目
export function updateProject(id: string, data: any) {
  return request.put(`/projects/${id}`, data)
}

// 删除项目
export function deleteProject(id: string) {
  return request.delete(`/projects/${id}`)
}

// 获取工作流步骤
export function getWorkflow(id: string) {
  return request.get(`/projects/${id}/workflow`)
}

// 启动工作流
export function startWorkflow(id: string) {
  return request.post(`/projects/${id}/start`)
}
