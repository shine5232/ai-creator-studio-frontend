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
        <ScriptTab :project-id="projectId" :script="script" :reference-case-id="referenceCaseId"
          @script-loaded="onScriptLoaded" @script-saved="onScriptSaved" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getProject } from '../api/project'
import { getScripts } from '../api/script'
import { getStoryboard } from '../api/storyboard'
import ScriptTab from '../components/script/ScriptTab.vue'
import StoryboardTab from '../components/storyboard/StoryboardTab.vue'
import GenerateTab from '../components/generation/GenerateTab.vue'
import PreviewTab from '../components/common/PreviewTab.vue'

const route = useRoute()
const projectId = route.params.id as string

const project = ref<any>(null)
const script = ref<any>(null)
const storyboard = ref<any>(null)
const shots = ref<any[]>([])
const activeTab = ref('script')

const scriptId = computed(() => script.value?.id)
const referenceCaseId = computed(() => project.value?.reference_case_id || null)

onMounted(async () => {
  project.value = await getProject(projectId)
  await loadScript()
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
  script.value = s
  await loadStoryboard()
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
</style>
