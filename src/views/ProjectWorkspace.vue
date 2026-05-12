<template>
  <div class="workspace">
    <!-- 面包屑导航 -->
    <div class="breadcrumb-bar">
      <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/projects' }">项目列表</el-breadcrumb-item>
        <el-breadcrumb-item>{{ project?.name || '加载中...' }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 工作区 Tabs -->
    <el-tabs v-model="activeTab" class="workspace-tabs" @tab-change="onTabChange">
      <el-tab-pane label="脚本" name="script">
        <ScriptTab :project-id="projectId" :script="script" :reference-case-id="referenceCaseId" :project="project"
          @script-loaded="onScriptLoaded" @script-saved="onScriptSaved" @refresh="loadScript" />
      </el-tab-pane>

      <el-tab-pane label="分镜" name="storyboard" :disabled="!script">
        <StoryboardTab :project-id="projectId" :script-id="scriptId" :storyboard="storyboard" @refresh="loadStoryboard" />
      </el-tab-pane>

      <el-tab-pane label="生成" name="generate">
        <GenerateTab :project-id="projectId" :storyboard="storyboard" :shots="shots" @refresh="loadStoryboard" />
      </el-tab-pane>

      <el-tab-pane label="预览" name="preview">
        <PreviewTab :project-id="projectId" />
      </el-tab-pane>
    </el-tabs>

    <!-- 回到顶部按钮 -->
    <transition name="fade">
      <div v-show="showBackTop" class="back-to-top" @click="scrollToTop">
        <el-icon :size="20"><Top /></el-icon>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getProject } from '../api/project'
import { getScripts } from '../api/script'
import { getStoryboard } from '../api/storyboard'
import ScriptTab from '../components/script/ScriptTab.vue'
import StoryboardTab from '../components/storyboard/StoryboardTab.vue'
import GenerateTab from '../components/generation/GenerateTab.vue'
import PreviewTab from '../components/common/PreviewTab.vue'
import { Top } from '@element-plus/icons-vue'

const route = useRoute()
const projectId = route.params.id as string

const project = ref<any>(null)
const script = ref<any>(null)
const storyboard = ref<any>(null)
const shots = ref<any[]>([])
const activeTab = ref('script')
const showBackTop = ref(false)
let scrollContainer: HTMLElement | null = null

const scriptId = computed(() => script.value?.id)
const referenceCaseId = computed(() => project.value?.reference_case_id || null)

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  showBackTop.value = el.scrollTop > 300
}

function scrollToTop() {
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function bindScroll() {
  // 滚动容器是 MainLayout 中的 .main-content
  scrollContainer = document.querySelector('.main-content')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', onScroll)
  }
}

function unbindScroll() {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', onScroll)
    scrollContainer = null
  }
}

onMounted(async () => {
  project.value = await getProject(projectId)
  await loadScript()
  bindScroll()
})

onUnmounted(() => {
  unbindScroll()
})

async function loadScript() {
  const res: any = await getScripts(projectId)
  const items = res.items || res.data || res || []
  script.value = items[0] || null
  if (script.value) {
    await loadStoryboard()
  }
}

async function loadStoryboard() {
  if (!script.value) return
  try {
    const res: any = await getStoryboard(script.value.id)
    storyboard.value = res.storyboard || res
    shots.value = res.shots || res.storyboard?.shots || []
  } catch {
    storyboard.value = null
    shots.value = []
  }
}

async function onScriptLoaded(s: any) {
  if (s) {
    // ScriptTab watch 传来的正常加载，直接用
    script.value = s
    await loadStoryboard()
  } else {
    // 一键生成完成后传 null，需要重新从 API 拉取
    await loadScript()
  }
}

function onScriptSaved(s: any) {
  script.value = s
}

function onTabChange(name: string) {
  if (name === 'storyboard' || name === 'generate') loadStoryboard()
}
</script>

<style scoped lang="scss">
.workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--cyber-bg);
}

.breadcrumb-bar {
  padding: 12px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.workspace-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px;

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: auto;
    padding-bottom: 24px;
  }
}

.back-to-top {
  position: fixed;
  right: 40px;
  bottom: 40px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: opacity 0.3s, transform 0.3s;

  &:hover {
    transform: scale(1.1);
    background: var(--el-color-primary-light-3);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
