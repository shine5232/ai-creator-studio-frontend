import request from './request'

export interface CookieStatus {
  platform: string
  label: string
  configured: boolean
}

export interface CookieDetail {
  platform: string
  configured: boolean
  line_count?: number
  preview?: string
}

// 获取各平台 Cookie 配置状态
export function getCookieStatus() {
  return request.get('/cookies') as Promise<CookieStatus[]>
}

// 获取某平台 Cookie 详情（脱敏）
export function getCookieDetail(platform: string) {
  return request.get(`/cookies/${platform}`) as Promise<CookieDetail>
}

// 保存某平台 Cookie
export function saveCookie(platform: string, content: string) {
  return request.post(`/cookies/${platform}`, { content }) as Promise<any>
}

// 删除某平台 Cookie
export function deleteCookie(platform: string) {
  return request.delete(`/cookies/${platform}`) as Promise<any>
}
