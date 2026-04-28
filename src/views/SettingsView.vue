<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <!-- AI 服务配置 -->
      <el-tab-pane label="AI 服务配置" name="ai">
        <!-- Filter bar -->
        <div class="ai-filter-bar">
          <el-radio-group v-model="serviceTypeFilter" size="small" @change="loadConfigs">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="text_generation">文本生成</el-radio-button>
            <el-radio-button value="text_to_image">文生图</el-radio-button>
            <el-radio-button value="image_to_image">图生图</el-radio-button>
            <el-radio-button value="image_to_video">图生视频</el-radio-button>
          </el-radio-group>
          <div class="ai-filter-actions">
            <el-button type="primary" size="small" @click="openAddDialog">+ 添加模型配置</el-button>
            <el-button size="small" @click="showSystemDefaults = true">系统默认</el-button>
          </div>
        </div>

        <!-- Config card list -->
        <div class="config-list">
          <el-empty v-if="!configs.length" description="暂无自定义模型配置，点击上方按钮添加" />
          <el-card v-for="c in configs" :key="c.id" class="config-card">
            <div class="config-header">
              <div class="config-info">
                <span class="config-star">{{ c.is_default ? '\u2B50' : '' }}</span>
                <span class="config-name">{{ c.config_name }}</span>
                <el-tag size="small" :type="serviceTagType(c.service_type)">{{ serviceLabel(c.service_type) }}</el-tag>
                <el-tag size="small" :type="c.is_enabled ? 'success' : 'info'">
                  {{ c.is_enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </div>
            </div>
            <div class="config-body">
              <div class="config-meta">
                <span class="meta-line">
                  <span class="meta-label">厂商:</span> {{ providerLabel(c.provider) }}
                </span>
                <span class="meta-line">
                  <span class="meta-label">模型:</span> {{ c.model_id }}
                </span>
                <span v-if="c.api_key_hint" class="meta-line meta-hint">
                  <span class="meta-label">Key:</span> {{ c.api_key_hint }}
                </span>
                <span v-if="c.api_base_url" class="meta-line meta-hint">
                  <span class="meta-label">Base:</span> {{ c.api_base_url }}
                </span>
              </div>
              <div class="config-actions">
                <el-button text type="primary" size="small" @click="openEditDialog(c)">编辑</el-button>
                <el-button text type="danger" size="small" @click="handleDelete(c)">删除</el-button>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Add/Edit dialog -->
        <el-dialog
          v-model="showConfigDialog"
          :title="isEditing ? '编辑模型配置' : '添加模型配置'"
          width="560px"
          destroy-on-close
        >
          <el-form :model="configForm" label-width="110px" :rules="formRules" ref="formRef">
            <el-form-item label="配置名称" prop="config_name">
              <el-input v-model="configForm.config_name" placeholder="如：我的GPT-4o" maxlength="100" />
            </el-form-item>
            <el-form-item label="服务类型" prop="service_type">
              <el-select v-model="configForm.service_type" style="width: 100%" placeholder="选择服务类型">
                <el-option label="文本生成" value="text_generation" />
                <el-option label="文生图" value="text_to_image" />
                <el-option label="图生图" value="image_to_image" />
                <el-option label="图生视频" value="image_to_video" />
              </el-select>
            </el-form-item>
            <el-form-item label="API 厂商" prop="provider">
              <el-select v-model="configForm.provider" style="width: 100%" placeholder="选择厂商" @change="onProviderChange">
                <el-option label="通义千问 (Qwen)" value="qwen" />
                <el-option label="豆包 Seedream" value="doubao" />
                <el-option label="通义万相" value="wanx" />
                <el-option label="豆包 Seedance" value="seedance" />
                <el-option label="Nano Banana" value="nano_banana" />
                <el-option label="Grok (APIMart)" value="grok" />
                <el-option label="通用 (Generic)" value="generic" />
                <el-option label="自定义..." value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="configForm.provider === 'custom'" label="自定义厂商名">
              <el-input v-model="configForm.custom_provider" placeholder="自定义厂商标识" />
            </el-form-item>
            <el-form-item label="模型标识" prop="model_id">
              <el-input v-model="configForm.model_id" placeholder="如 qwen3.5-plus, doubao-seedream" />
              <div v-if="modelHints.length" class="model-hints">
                <span class="hint-label">推荐:</span>
                <el-tag
                  v-for="h in modelHints" :key="h" size="small" effect="plain"
                  class="model-hint-tag" @click="configForm.model_id = h"
                >{{ h }}</el-tag>
              </div>
            </el-form-item>
            <el-form-item label="API Base URL">
              <el-input v-model="configForm.api_base_url" placeholder="留空使用厂商默认地址" />
              <div v-if="configForm.provider === 'generic'" class="form-tip" style="margin-top: 4px">
                通用模式必须填写，如 https://api.example.com/v1
              </div>
            </el-form-item>
            <el-form-item :label="isEditing ? 'API Key (新)' : 'API Key'">
              <el-input v-model="configForm.api_key" show-password :placeholder="isEditing ? '留空不修改' : '留空使用系统 Key'" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch v-model="configForm.is_enabled" />
            </el-form-item>
            <el-form-item label="设为默认">
              <el-switch v-model="configForm.is_default" />
              <span class="form-tip">同类型只能有一个默认模型</span>
            </el-form-item>
            <el-form-item label="额外配置">
              <el-input v-model="configForm.extra_config" type="textarea" :rows="3" :placeholder="extraConfigPlaceholder" />
              <div v-if="configForm.provider === 'generic'" class="form-tip" style="margin-top: 4px">
                可配置 generate_path、poll_path、async_mode、auth_prefix 等
              </div>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showConfigDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveConfig" :loading="savingConfig">保存</el-button>
          </template>
        </el-dialog>

        <!-- System defaults dialog -->
        <el-dialog v-model="showSystemDefaults" title="系统默认模型" width="600px">
          <el-empty v-if="!systemProviders.length" description="无系统默认模型" />
          <div v-for="p in systemProviders" :key="p.name" class="sys-provider">
            <div class="sys-provider-header">
              <span>{{ providerIcon(p.name) }}</span>
              <span class="sys-provider-name">{{ providerLabel(p.name) }}</span>
              <div class="sys-provider-services">
                <el-tag v-for="s in p.services" :key="s" size="small" effect="plain" class="svc-tag">
                  {{ serviceLabel(s) }}
                </el-tag>
              </div>
            </div>
            <div v-if="p.models?.length" class="sys-models">
              <span v-for="m in p.models" :key="m.model_id" class="sys-model-item">
                {{ m.name || m.model_id }}
              </span>
            </div>
          </div>
        </el-dialog>
      </el-tab-pane>

      <!-- 下载配置 -->
      <el-tab-pane label="下载配置" name="download">
        <div class="cookie-platform-list">
          <el-card v-for="c in cookiePlatforms" :key="c.platform" class="provider-card">
            <div class="provider-header">
              <div class="provider-info">
                <span class="provider-icon">{{ cookieIcon(c.platform) }}</span>
                <span class="provider-name">{{ c.label }}</span>
                <el-tag size="small" :type="c.configured ? 'success' : 'info'">
                  {{ c.configured ? '已配置' : '未配置' }}
                </el-tag>
              </div>
              <div>
                <el-button size="small" @click="openCookieDialog(c)">
                  {{ c.configured ? '查看/修改' : '配置 Cookie' }}
                </el-button>
                <el-button v-if="c.configured" size="small" type="danger" @click="handleDeleteCookie(c.platform)">
                  删除
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <el-dialog v-model="showCookieDialog" :title="`配置 ${editingCookieLabel} Cookie`" width="640px">
          <div style="margin-bottom: 12px">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".txt"
              :on-change="handleCookieFileUpload"
            >
              <el-button size="small">导入 Cookie 文件</el-button>
            </el-upload>
            <span style="margin-left: 12px; color: var(--cyber-text-dim); font-size: 12px">
              支持 Netscape Cookie 格式的 .txt 文件，也可直接在下方粘贴
            </span>
          </div>
          <el-input
            v-model="cookieContent"
            type="textarea"
            :rows="12"
            placeholder="粘贴 Netscape 格式的 Cookie 文本，例如：
.youtube.com	TRUE	/	TRUE	1234567890	COOKIE_NAME	cookie_value"
            style="font-family: monospace"
          />
          <template #footer>
            <el-button @click="showCookieDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveCookie" :loading="savingCookie">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- 个人信息 -->
      <el-tab-pane label="个人信息" name="profile">
        <el-card style="max-width: 600px">
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile" :loading="savingProfile">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="max-width: 600px; margin-top: 24px">
          <template #header>修改密码</template>
          <el-form :model="passwordForm" label-width="100px">
            <el-form-item label="当前密码">
              <el-input v-model="passwordForm.old_password" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.new_password" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword" :loading="changingPwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { updateMe, changePassword as changePasswordApi } from '../api/auth'
import { getCookieStatus, saveCookie, deleteCookie } from '../api/cookie'
import {
  getUserAIConfigs,
  createUserAIConfig,
  updateUserAIConfig,
  deleteUserAIConfig,
  getSystemDefaults,
  type UserAIConfig,
  type UserAIConfigCreate,
  type SystemProvider,
} from '../api/userAiConfig'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const activeTab = ref('ai')

// ── AI Config state ──────────────────────────────────────────────────────
const configs = ref<UserAIConfig[]>([])
const serviceTypeFilter = ref('')
const systemProviders = ref<SystemProvider[]>([])
const showSystemDefaults = ref(false)
const showConfigDialog = ref(false)
const savingConfig = ref(false)
const isEditing = ref(false)
const editingConfigId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const configForm = reactive({
  config_name: '',
  provider: '',
  custom_provider: '',
  model_id: '',
  service_type: 'text_generation',
  api_base_url: '',
  api_key: '',
  is_enabled: true,
  is_default: false,
  extra_config: '',
})

const formRules: FormRules = {
  config_name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  service_type: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  provider: [{ required: true, message: '请选择厂商', trigger: 'change' }],
  model_id: [{ required: true, message: '请输入模型标识', trigger: 'blur' }],
}

// ── Personal info state ──────────────────────────────────────────────────
const profileForm = reactive({ username: '', email: '' })
const passwordForm = reactive({ old_password: '', new_password: '' })
const savingProfile = ref(false)
const changingPwd = ref(false)

// ── Cookie state ─────────────────────────────────────────────────────────
const cookiePlatforms = ref<any[]>([])
const showCookieDialog = ref(false)
const editingCookiePlatform = ref('')
const editingCookieLabel = ref('')
const cookieContent = ref('')
const savingCookie = ref(false)

// ── Provider presets ─────────────────────────────────────────────────────

const PROVIDER_MODEL_HINTS: Record<string, string[]> = {
  qwen: ['qwen3.5-plus', 'qwen-max', 'qwen-turbo'],
  doubao: ['doubao-seedream-3.0'],
  wanx: ['wanx2.1-t2i-turbo', 'wan2.6-i2v'],
  seedance: ['seedance-1.0-pro', 'doubao-seedance-1-5-pro-251215'],
  nano_banana: ['gemini-2.0-flash', 'gemini-3-pro-image-preview'],
  grok: ['grok-imagine-1.0-apimart', 'grok-imagine-1.0-edit-apimart', 'doubao-seedance-4-0'],
  generic: [],
  custom: [],
}

const modelHints = computed(() => {
  return PROVIDER_MODEL_HINTS[configForm.provider] || []
})

const extraConfigPlaceholder = computed(() => {
  if (configForm.provider === 'generic') {
    return '{"async_mode": "auto", "poll_interval": 5, "generate_path": "/images/generations"}'
  }
  return '可选 JSON，如 {"temperature": 0.7}'
})

function providerIcon(name: string) {
  const map: Record<string, string> = {
    qwen: '\uD83D\uDD2E', doubao: '\uD83C\uDFA8', wanx: '\uD83C\uDFAC', seedance: '\uD83C\uDFD5\uFE0F', nano_banana: '\uD83C\uDF4C', grok: '\u26A1', generic: '\uD83D\uDD27',
  }
  return map[name] || '\uD83E\uDD16'
}

function providerLabel(name: string) {
  const map: Record<string, string> = {
    qwen: '通义千问 Qwen', doubao: '豆包 Seedream', wanx: '通义万相',
    seedance: '豆包 Seedance', nano_banana: 'Nano Banana', grok: 'Grok (APIMart)', generic: '通用 Generic',
  }
  return map[name] || name
}

function serviceLabel(s: string) {
  const map: Record<string, string> = {
    text_generation: '文本生成', text_to_image: '文生图',
    image_to_image: '图生图', image_to_video: '图生视频',
  }
  return map[s] || s
}

function serviceTagType(s: string) {
  const map: Record<string, string> = {
    text_generation: '', text_to_image: 'success',
    image_to_image: 'warning', image_to_video: 'danger',
  }
  return map[s] || 'info'
}

function onProviderChange() {
  const hints = PROVIDER_MODEL_HINTS[configForm.provider]
  if (hints?.length === 1) {
    configForm.model_id = hints[0]
  }
}

// ── AI Config CRUD ───────────────────────────────────────────────────────

async function loadConfigs() {
  try {
    const res = await getUserAIConfigs(serviceTypeFilter.value || undefined)
    configs.value = res.items || []
  } catch { /* ignore */ }
}

async function loadSystemDefaults() {
  try {
    const res = await getSystemDefaults()
    systemProviders.value = res
  } catch { /* ignore */ }
}

function openAddDialog() {
  isEditing.value = false
  editingConfigId.value = null
  Object.assign(configForm, {
    config_name: '', provider: 'qwen', custom_provider: '', model_id: '',
    service_type: 'text_generation', api_base_url: '', api_key: '',
    is_enabled: true, is_default: false, extra_config: '',
  })
  showConfigDialog.value = true
}

function openEditDialog(c: UserAIConfig) {
  isEditing.value = true
  editingConfigId.value = c.id
  Object.assign(configForm, {
    config_name: c.config_name,
    provider: c.provider,
    custom_provider: '',
    model_id: c.model_id,
    service_type: c.service_type,
    api_base_url: c.api_base_url || '',
    api_key: '',
    is_enabled: c.is_enabled,
    is_default: c.is_default,
    extra_config: c.extra_config || '',
  })
  showConfigDialog.value = true
}

async function handleSaveConfig() {
  if (!formRef.value) return
  await formRef.value.validate()

  savingConfig.value = true
  try {
    const provider = configForm.provider === 'custom' ? (configForm.custom_provider || 'custom') : configForm.provider

    const payload: UserAIConfigCreate = {
      config_name: configForm.config_name,
      provider,
      model_id: configForm.model_id,
      service_type: configForm.service_type,
      api_base_url: configForm.api_base_url || null,
      api_key: configForm.api_key || null,
      is_enabled: configForm.is_enabled,
      is_default: configForm.is_default,
      extra_config: configForm.extra_config || null,
    }

    if (isEditing.value && editingConfigId.value) {
      await updateUserAIConfig(editingConfigId.value, payload)
      ElMessage.success('配置已更新')
    } else {
      await createUserAIConfig(payload)
      ElMessage.success('配置已创建')
    }

    showConfigDialog.value = false
    loadConfigs()
  } catch { /* error handled by interceptor */ } finally {
    savingConfig.value = false
  }
}

async function handleDelete(c: UserAIConfig) {
  try {
    await ElMessageBox.confirm(`确定删除配置「${c.config_name}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    await deleteUserAIConfig(c.id)
    ElMessage.success('已删除')
    loadConfigs()
  } catch { /* cancel or error */ }
}

// ── Personal info ────────────────────────────────────────────────────────

async function saveProfile() {
  savingProfile.value = true
  try {
    await updateMe({ display_name: profileForm.username })
    ElMessage.success('已保存')
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  changingPwd.value = true
  try {
    await changePasswordApi(passwordForm)
    ElMessage.success('密码已修改')
    passwordForm.old_password = ''
    passwordForm.new_password = ''
  } finally {
    changingPwd.value = false
  }
}

// ── Cookie config ────────────────────────────────────────────────────────

async function loadCookieStatus() {
  try {
    cookiePlatforms.value = await getCookieStatus()
  } catch { /* ignore */ }
}

function cookieIcon(platform: string) {
  const map: Record<string, string> = {
    youtube: '\u25B6\uFE0F', douyin: '\uD83C\uDFB5', xiaohongshu: '\uD83D\uDCD5', kuaishou: '\uD83C\uDFAC',
  }
  return map[platform] || '\uD83C\uDF10'
}

function openCookieDialog(c: any) {
  editingCookiePlatform.value = c.platform
  editingCookieLabel.value = c.label
  cookieContent.value = ''
  showCookieDialog.value = true
}

function handleCookieFileUpload(file: any) {
  const reader = new FileReader()
  reader.onload = (e) => {
    cookieContent.value = e.target?.result as string || ''
  }
  reader.readAsText(file.raw)
}

async function handleSaveCookie() {
  if (!cookieContent.value.trim()) {
    return ElMessage.warning('请输入或导入 Cookie 内容')
  }
  savingCookie.value = true
  try {
    await saveCookie(editingCookiePlatform.value, cookieContent.value)
    ElMessage.success('Cookie 保存成功')
    showCookieDialog.value = false
    loadCookieStatus()
  } finally {
    savingCookie.value = false
  }
}

async function handleDeleteCookie(platform: string) {
  try {
    await deleteCookie(platform)
    ElMessage.success('Cookie 已删除')
    loadCookieStatus()
  } catch { /* error handled by interceptor */ }
}

// ── Init ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  loadConfigs()
  loadSystemDefaults()
  loadCookieStatus()
  if (authStore.user) {
    profileForm.username = authStore.user.username || ''
    profileForm.email = authStore.user.email || ''
  } else {
    try {
      await authStore.fetchUser()
      profileForm.username = authStore.user?.username || ''
      profileForm.email = authStore.user?.email || ''
    } catch { /* ignore */ }
  }
})
</script>

<style scoped lang="scss">
.ai-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.ai-filter-actions {
  display: flex;
  gap: 8px;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 780px;
}

.config-card {
  .config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .config-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .config-star {
        font-size: 18px;
      }

      .config-name {
        font-weight: 600;
        font-size: 15px;
        color: var(--cyber-text);
      }
    }
  }

  .config-body {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .config-meta {
      display: flex;
      flex-direction: column;
      gap: 3px;

      .meta-line {
        font-size: 12px;
        color: var(--cyber-text-dim);

        .meta-label {
          color: var(--cyber-text-dim);
          opacity: 0.7;
          margin-right: 4px;
        }
      }

      .meta-hint {
        font-family: monospace;
        color: var(--cyber-cyan);
        opacity: 0.7;
      }
    }

    .config-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
  }
}

.model-hints {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .hint-label {
    font-size: 12px;
    color: var(--cyber-text-dim);
  }

  .model-hint-tag {
    cursor: pointer;
    border-radius: 10px;
    font-size: 12px;

    &:hover {
      opacity: 0.8;
    }
  }
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--cyber-text-dim);
}

.sys-provider {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .sys-provider-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .sys-provider-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--cyber-text);
    }

    .sys-provider-services {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;

      .svc-tag {
        border-radius: 10px;
        font-size: 12px;
      }
    }
  }

  .sys-models {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .sys-model-item {
      font-size: 12px;
      color: var(--cyber-text-dim);
      padding: 2px 8px;
      background: var(--el-fill-color-light);
      border-radius: 6px;
    }
  }
}

.cookie-platform-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
}

.provider-card {
  .provider-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;

    .provider-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .provider-icon {
        font-size: 24px;
      }

      .provider-name {
        font-weight: 600;
        font-size: 15px;
        color: var(--cyber-text);
      }
    }
  }
}
</style>
