<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <!-- AI 服务配置 -->
      <el-tab-pane label="AI 服务配置" name="ai">
        <div class="provider-list">
          <el-card v-for="p in providers" :key="p.name" class="provider-card">
            <div class="provider-header">
              <div class="provider-info">
                <span class="provider-icon">{{ providerIcon(p.name) }}</span>
                <span class="provider-name">{{ providerLabel(p.name) }}</span>
                <el-tag size="small" :type="p.configured ? 'success' : 'info'">
                  {{ p.configured ? '已配置' : '未配置' }}
                </el-tag>
              </div>
              <div class="provider-services">
                <el-tag v-for="s in p.services" :key="s" size="small" effect="plain" class="svc-tag">
                  {{ serviceLabel(s) }}
                </el-tag>
              </div>
            </div>
            <div class="provider-body">
              <div class="provider-meta">
                <span v-if="p.models?.length" class="provider-models">
                  模型: {{ p.models.map((m: any) => m.name || m.model_id).join(', ') }}
                </span>
                <span v-if="p.hint" class="provider-hint">
                  Key: {{ p.hint }}
                </span>
              </div>
              <div style="margin-top: 12px">
                <template v-if="editingProvider === p.name">
                  <div class="key-edit-row">
                    <el-input v-model="apiKeyInput" placeholder="输入 API Key" show-password
                      style="flex: 1; max-width: 400px" @keyup.enter="saveKey(p.name)" />
                    <el-button type="primary" size="small" @click="saveKey(p.name)" :loading="savingKey">
                      保存
                    </el-button>
                    <el-button size="small" @click="editingProvider = ''">取消</el-button>
                  </div>
                </template>
                <template v-else>
                  <el-button size="small" @click="editProvider(p)">
                    {{ p.configured ? '修改 Key' : '配置 Key' }}
                  </el-button>
                </template>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 社交账号（暂时注释，后续开发时启用）
      <el-tab-pane label="社交账号" name="social">
        <el-card>
          <div class="page-header">
            <h3>已绑定的社交账号</h3>
            <el-button type="primary" size="small" @click="showAddSocial = true">
              <el-icon><Plus /></el-icon> 添加账号
            </el-button>
          </div>
          <el-table :data="socialAccounts" stripe>
            <el-table-column prop="platform" label="平台" width="120" />
            <el-table-column prop="account_name" label="账号名称" min-width="200" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.is_valid ? 'success' : 'danger'">
                  {{ row.is_valid ? '有效' : '已失效' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="validateCookies(row.id)">验证</el-button>
                <el-button text type="danger" size="small" @click="removeSocial(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-dialog v-model="showAddSocial" title="添加社交账号" width="500px">
          <el-form :model="socialForm" label-width="100px">
            <el-form-item label="平台">
              <el-select v-model="socialForm.platform" style="width: 100%">
                <el-option label="抖音" value="douyin" />
                <el-option label="YouTube" value="youtube" />
                <el-option label="小红书" value="xiaohongshu" />
                <el-option label="快手" value="kuaishou" />
              </el-select>
            </el-form-item>
            <el-form-item label="账号名称">
              <el-input v-model="socialForm.account_name" />
            </el-form-item>
            <el-form-item label="Cookie">
              <el-input v-model="socialForm.cookies" type="textarea" :rows="4" placeholder="粘贴浏览器Cookie" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showAddSocial = false">取消</el-button>
            <el-button type="primary" @click="addSocialAccount" :loading="addingSocial">添加</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
      -->

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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request'
import { updateMe, changePassword as changePasswordApi } from '../api/auth'
import { getCookieStatus, saveCookie, deleteCookie } from '../api/cookie'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const activeTab = ref('ai')
const providers = ref<any[]>([])
const editingProvider = ref('')
const apiKeyInput = ref('')
const savingKey = ref(false)

// 社交账号
// 社交账号（暂时注释，后续开发时启用）
// const socialAccounts = ref<any[]>([])
// const showAddSocial = ref(false)
// const addingSocial = ref(false)
// const socialForm = reactive({ platform: 'douyin', account_name: '', cookies: '' })

// 个人信息
const profileForm = reactive({ username: '', email: '' })
const passwordForm = reactive({ old_password: '', new_password: '' })
const savingProfile = ref(false)
const changingPwd = ref(false)

// Cookie 配置
const cookiePlatforms = ref<any[]>([])
const showCookieDialog = ref(false)
const editingCookiePlatform = ref('')
const editingCookieLabel = ref('')
const cookieContent = ref('')
const savingCookie = ref(false)

onMounted(async () => {
  loadProviders()
  // loadSocialAccounts() // 暂时注释，后续开发时启用
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

async function loadProviders() {
  try {
    const res: any = await request.get('/ai/providers')
    const list = Array.isArray(res) ? res : []
    // Fetch key hints in parallel
    const withKeys = await Promise.all(
      list.map(async (p: any) => {
        try {
          const hint: any = await request.get(`/ai/keys/${p.name}`)
          return { ...p, configured: hint.configured, hint: hint.hint || null }
        } catch {
          return { ...p, configured: false, hint: null }
        }
      })
    )
    providers.value = withKeys
  } catch { /* ignore */ }
}

function editProvider(p: any) {
  editingProvider.value = p.name
  apiKeyInput.value = ''
}

async function saveKey(name: string) {
  if (!apiKeyInput.value) return ElMessage.warning('请输入 API Key')
  savingKey.value = true
  try {
    await request.post('/ai/keys', { provider: name, api_key: apiKeyInput.value })
    ElMessage.success('保存成功')
    editingProvider.value = ''
    apiKeyInput.value = ''
    loadProviders()
  } finally {
    savingKey.value = false
  }
}

function providerIcon(name: string) {
  const map: Record<string, string> = {
    qwen: '🔮', doubao: '🎨', wanx: '🎬', seedance: '🎥', nano_banana: '🍌',
  }
  return map[name] || '🤖'
}

function providerLabel(name: string) {
  const map: Record<string, string> = {
    qwen: '通义千问 Qwen', doubao: '豆包 Seedream', wanx: '通义万相',
    seedance: '豆包 Seedance', nano_banana: 'Nano Banana',
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

// async function loadSocialAccounts() {
//   try {
//     const res: any = await request.get('/publishing/social-accounts')
//     socialAccounts.value = Array.isArray(res) ? res : (res.items || [])
//   } catch { /* ignore */ }
// }

// async function addSocialAccount() {
//   addingSocial.value = true
//   try {
//     await request.post('/publishing/social-accounts', socialForm)
//     ElMessage.success('添加成功')
//     showAddSocial.value = false
//     loadSocialAccounts()
//   } finally {
//     addingSocial.value = false
//   }
// }

// async function validateCookies(id: string) {
//   try {
//     await request.post(`/publishing/social-accounts/${id}/validate-cookies`)
//     ElMessage.success('Cookie 有效')
//   } catch { /* error handled by interceptor */ }
// }

// async function removeSocial(id: string) {
//   await request.delete(`/publishing/social-accounts/${id}`)
//   ElMessage.success('已删除')
//   loadSocialAccounts()
// }

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

// ── Cookie 配置 ──────────────────────────────────────────────────────────

async function loadCookieStatus() {
  try {
    cookiePlatforms.value = await getCookieStatus()
  } catch { /* ignore */ }
}

function cookieIcon(platform: string) {
  const map: Record<string, string> = {
    youtube: '▶️', douyin: '🎵', xiaohongshu: '📕', kuaishou: '🎬',
  }
  return map[platform] || '🌐'
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
</script>

<style scoped lang="scss">
.provider-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 780px;
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
    margin-bottom: 12px;
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

    .provider-services {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;

      .svc-tag {
        border-radius: 10px;
        font-size: 12px;
      }
    }
  }

  .provider-body {
    .provider-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .provider-models {
        font-size: 12px;
        color: var(--cyber-text-dim);
      }

      .provider-hint {
        font-size: 12px;
        color: var(--cyber-cyan);
        opacity: 0.7;
        font-family: monospace;
      }
    }

    .key-edit-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }
}
</style>
