import request from './request'

// 登录
export function login(username: string, password: string) {
  return request.post('/auth/login', { username, password })
}

// 注册
export function register(data: { email: string; username: string; password: string }) {
  return request.post('/auth/register', data)
}

// 获取当前用户
export function getMe() {
  return request.get('/auth/me')
}

// 更新用户信息
export function updateMe(data: any) {
  return request.put('/auth/me', data)
}

// 修改密码
export function changePassword(data: { old_password: string; new_password: string }) {
  return request.put('/auth/password', data)
}
