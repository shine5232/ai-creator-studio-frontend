<template>
  <div class="main-layout">
    <header class="top-nav">
      <div class="logo" @click="$router.push('/dashboard')">AI Creator Studio</div>
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        class="nav-menu"
        :ellipsis="false"
        router
      >
        <el-menu-item index="/projects">项目列表</el-menu-item>
        <el-menu-item index="/knowledge">素材库</el-menu-item>
        <el-menu-item index="/analytics">数据分析</el-menu-item>
      </el-menu>
      <div class="user-area">
        <el-button text @click="$router.push('/settings')">
          <el-icon><Setting /></el-icon>
        </el-button>
        <el-dropdown @command="handleCommand">
          <el-avatar :size="32" :icon="UserFilled" style="cursor: pointer" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => {
  if (route.path.startsWith('/projects')) return '/projects'
  return route.path
})

function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (cmd === 'settings') {
    router.push('/settings')
  }
}
</script>
