<template>
  <div class="login-page">
    <div class="cyber-grid"></div>
    <div class="login-card">
      <h1 class="logo">AI Creator Studio</h1>
      <p class="subtitle">AI 短视频创作平台</p>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="loginRules" ref="loginRef" @submit.prevent="handleLogin">
            <el-form-item prop="email">
              <el-input v-model="loginForm.email" placeholder="用户名 / 邮箱" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="密码" size="large"
                prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
                登 录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="registerRules" ref="registerRef" @submit.prevent="handleRegister">
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" placeholder="用户名" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="registerForm.email" placeholder="邮箱" size="large" prefix-icon="Message" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="密码" size="large"
                prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">
                注 册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')
const loading = ref(false)
const loginRef = ref<FormInstance>()
const registerRef = ref<FormInstance>()

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ username: '', email: '', password: '' })

const loginRules = {
  email: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}
const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
}

async function handleLogin() {
  await loginRef.value?.validate()
  loading.value = true
  try {
    await authStore.login(loginForm.email, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  await registerRef.value?.validate()
  loading.value = true
  try {
    await authStore.register(registerForm)
    ElMessage.success('注册成功，请登录')
    activeTab.value = 'login'
    loginForm.email = registerForm.email
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0e17;
  position: relative;
  overflow: hidden;
}

.cyber-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridScroll 20s linear infinite;
}

@keyframes gridScroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(60px); }
}

.login-card {
  width: 420px;
  padding: 48px 40px;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid rgba(0, 240, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(0, 240, 255, 0.08), 0 0 80px rgba(255, 45, 149, 0.05);
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;

  .logo {
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
    background: linear-gradient(135deg, #00f0ff, #ff2d95);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 2px;
  }

  .subtitle {
    text-align: center;
    color: #6b7b8d;
    margin-bottom: 32px;
    font-size: 14px;
    letter-spacing: 2px;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #00f0ff, #3b82f6) !important;
  border: none;
  color: #0a0e17 !important;
  font-weight: 700;

  &:hover {
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  }
}

.login-tabs {
  :deep(.el-tabs__nav) {
    width: 100%;

    .el-tabs__item {
      width: 50%;
      text-align: center;
      font-size: 15px;
      letter-spacing: 2px;
    }
  }
}
</style>
