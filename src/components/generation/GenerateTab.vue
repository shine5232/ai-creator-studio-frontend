<template>
  <div class="generate-tab">
    <!-- 步骤进度条 -->
    <el-card class="progress-card">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="图片生成" :description="stepDesc(0)" />
        <el-step title="视频生成" :description="stepDesc(1)" />
        <el-step title="视频合并" :description="stepDesc(2)" />
        <el-step title="添加音乐" :description="stepDesc(3)" />
      </el-steps>
    </el-card>

    <!-- 操作按钮 -->
    <el-card style="margin-top: 16px">
      <div class="action-bar">
        <el-button type="primary" @click="handleGenerateImages" :loading="loadingImages"
          :disabled="!shots.length">
          <el-icon><Picture /></el-icon> 生成所有图片
        </el-button>
        <el-button type="primary" @click="handleGenerateVideos" :loading="loadingVideos"
          :disabled="!imagesReady">
          <el-icon><VideoCamera /></el-icon> 生成所有视频
        </el-button>
        <el-button type="primary" @click="handleMerge" :loading="loadingMerge"
          :disabled="!videosReady">
          <el-icon><Connection /></el-icon> 合并视频
        </el-button>
        <el-button @click="handleAddMusic" :loading="loadingMusic" :disabled="!merged">
          <el-icon><Headset /></el-icon> 添加背景音乐
        </el-button>
      </div>
    </el-card>

    <!-- 任务列表 -->
    <el-card style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>任务列表</span>
          <el-button text @click="loadTasks" :loading="loadingTasks">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>
      <el-table :data="tasks" v-loading="loadingTasks" stripe max-height="400">
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.service_type === 'text_to_image' ? '' : row.service_type === 'image_to_video' ? 'warning' : 'success'">
              {{ serviceLabel(row.service_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button v-if="row.status === 'failed'" text type="primary" size="small"
              @click="handleRetry(row.task_id)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { generateImages, generateVideos, mergeVideos, addMusic, getTasks, retryTask } from '../../api/generation'

const props = defineProps<{
  projectId: string
  storyboard: any
  shots: any[]
}>()

const tasks = ref<any[]>([])
const loadingTasks = ref(false)
const loadingImages = ref(false)
const loadingVideos = ref(false)
const loadingMerge = ref(false)
const loadingMusic = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null

const imagesReady = computed(() => (props.shots || []).some((s: any) => s.image_status === 'completed'))
const videosReady = computed(() => (props.shots || []).some((s: any) => s.video_status === 'completed'))
const merged = ref(false)

const currentStep = computed(() => {
  if (merged.value) return 4
  if (videosReady.value) return 2
  if (imagesReady.value) return 1
  return 0
})

onMounted(() => {
  loadTasks()
  pollTimer = setInterval(loadTasks, 15000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function loadTasks() {
  loadingTasks.value = true
  try {
    const res: any = await getTasks({ project_id: props.projectId })
    tasks.value = Array.isArray(res) ? res : (res.items || res.data || [])
  } catch {
    tasks.value = []
  } finally {
    loadingTasks.value = false
  }
}

function stepDesc(step: number) {
  const shots = props.shots || []
  if (step === 0) {
    const done = shots.filter((s: any) => s.image_status === 'completed').length
    return `${done}/${shots.length}`
  }
  if (step === 1) {
    const done = shots.filter((s: any) => s.video_status === 'completed').length
    return `${done}/${shots.length}`
  }
  return ''
}

async function handleGenerateImages() {
  loadingImages.value = true
  try {
    await generateImages(props.projectId)
    ElMessage.success('图片生成任务已提交')
    loadTasks()
  } finally {
    loadingImages.value = false
  }
}

async function handleGenerateVideos() {
  loadingVideos.value = true
  try {
    await generateVideos(props.projectId)
    ElMessage.success('视频生成任务已提交')
    loadTasks()
  } finally {
    loadingVideos.value = false
  }
}

async function handleMerge() {
  loadingMerge.value = true
  try {
    await mergeVideos(props.projectId)
    ElMessage.success('合并任务已提交')
    merged.value = true
    loadTasks()
  } finally {
    loadingMerge.value = false
  }
}

async function handleAddMusic() {
  loadingMusic.value = true
  try {
    await addMusic(props.projectId)
    ElMessage.success('添加音乐任务已提交')
    loadTasks()
  } finally {
    loadingMusic.value = false
  }
}

async function handleRetry(taskId: string) {
  await retryTask(taskId)
  ElMessage.success('已重试')
  loadTasks()
}

function serviceLabel(t: string) {
  const map: Record<string, string> = {
    text_to_image: '图片', image_to_video: '视频', merge: '合并', music: '音乐',
  }
  return map[t] || t
}

function statusType(s: string) {
  const map: Record<string, string> = { completed: 'success', failed: 'danger', processing: 'warning' }
  return map[s] || 'info'
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: '排队中', processing: '处理中', completed: '已完成', failed: '失败' }
  return map[s] || s
}

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}
</script>

<style scoped lang="scss">
.progress-card {
  :deep(.el-step__description) {
    font-size: 12px;
  }
}

.action-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
