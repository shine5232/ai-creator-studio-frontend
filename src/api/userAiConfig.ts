import request from './request'

// --- Types ---

export interface UserAIConfig {
  id: number
  user_id: number
  config_name: string
  provider: string
  model_id: string
  service_type: string
  api_base_url: string | null
  api_key_hint: string | null
  is_enabled: boolean
  is_default: boolean
  extra_config: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UserAIConfigCreate {
  config_name: string
  provider: string
  model_id: string
  service_type: string
  api_base_url?: string | null
  api_key?: string | null
  is_enabled?: boolean
  is_default?: boolean
  extra_config?: string | null
}

export interface UserAIConfigUpdate {
  config_name?: string | null
  provider?: string | null
  model_id?: string | null
  service_type?: string | null
  api_base_url?: string | null
  api_key?: string | null
  is_enabled?: boolean | null
  is_default?: boolean | null
  extra_config?: string | null
}

export interface UserAIConfigListResponse {
  items: UserAIConfig[]
  total: number
}

export interface SystemProvider {
  name: string
  services: string[]
  models: { model_id: string; name: string; capabilities: string[] }[]
}

// --- API calls ---

export function getUserAIConfigs(serviceType?: string) {
  const params: Record<string, string> = {}
  if (serviceType) params.service_type = serviceType
  return request.get('/user-ai-configs', { params }) as Promise<UserAIConfigListResponse>
}

export function getUserAIConfig(id: number) {
  return request.get(`/user-ai-configs/${id}`) as Promise<UserAIConfig>
}

export function createUserAIConfig(data: UserAIConfigCreate) {
  return request.post('/user-ai-configs', data) as Promise<UserAIConfig>
}

export function updateUserAIConfig(id: number, data: UserAIConfigUpdate) {
  return request.put(`/user-ai-configs/${id}`, data) as Promise<UserAIConfig>
}

export function deleteUserAIConfig(id: number) {
  return request.delete(`/user-ai-configs/${id}`) as Promise<{ success: boolean; message: string }>
}

export function getSystemDefaults() {
  return request.get('/user-ai-configs/system-defaults') as Promise<SystemProvider[]>
}
