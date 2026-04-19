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
        <el-button type="primary" @click="handleGenerateVideos" :loading="loadingVideos"
          :disabled="!imagesReady || !selectedIds.size">
          <el-icon><VideoCamera /></el-icon> 生成视频
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

    <!-- 分镜卡片列表 -->
    <el-card style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>分镜列表</span>
          <div style="display: flex; align-items: center; gap: 8px">
            <el-button size="small" @click="selectAll">全选</el-button>
            <el-button size="small" @click="deselectAll">清空</el-button>
            <span style="color: #909399; font-size: 13px">已选 {{ selectedIds.size }}/{{ availableShots.length }}</span>
          </div>
        </div>
      </template>
      <div v-if="availableShots.length" class="select-grid">
        <el-card v-for="(shot, index) in availableShots" :key="shot.id" class="select-card"
          :class="{ selected: selectedIds.has(shot.id) }"
          @click="toggleSelect(shot)">
          <div class="select-checkbox">
            <el-checkbox :model-value="selectedIds.has(shot.id)" />
          </div>
          <div class="select-thumb">
            <el-image v-if="shot.image_path" :src="imageUrl(shot.image_path)" fit="cover" class="thumb-img" />
            <el-icon v-else :size="32" color="#c0c4cc"><Picture /></el-icon>
          </div>
          <div class="select-info">
            <div class="select-index">#{{ index + 1 }}</div>
            <div class="select-desc">{{ shot.description || '无描述' }}</div>
            <div class="select-bottom">
              <el-tag size="small" :type="shot.video_status === 'completed' ? 'success' : shot.video_status === 'failed' ? 'danger' : 'info'">
                {{ videoStatusLabel(shot.video_status) }}
              </el-tag>
              <el-button v-if="shot.video_status === 'completed' && shot.video_path"
                size="small" type="primary" circle @click.stop="playVideo(shot)">
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无已生成图片的分镜" :image-size="60" />
    </el-card>

    <!-- 进度弹窗 -->
    <el-dialog v-model="showProgressDialog" :title="progressTitle" width="460px"
      :close-on-click-modal="false" :show-close="progressStatus === 'completed' || progressStatus === 'failed'"
      @closed="onProgressDialogClosed">
      <div style="text-align: center; padding: 16px 0">
        <el-progress :percentage="progressPercent"
          :status="progressStatus === 'failed' ? 'exception' : progressStatus === 'completed' ? 'success' : undefined"
          :stroke-width="20" :text-inside="true" style="margin-bottom: 16px" />
        <p style="color: #606266; font-size: 14px">{{ progressMessage }}</p>
      </div>
      <template #footer>
        <el-button v-if="progressStatus === 'completed' || progressStatus === 'failed'"
          @click="showProgressDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 视频播放弹窗 -->
    <el-dialog v-model="showVideoDialog" title="视频预览" width="640px" @closed="videoUrl = ''">
      <div style="text-align: center">
        <video v-if="videoUrl" :src="videoUrl" controls autoplay style="max-width: 100%; max-height: 500px" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, VideoCamera, Connection, Headset, VideoPlay } from '@element-plus/icons-vue'
import { mergeVideos, addMusic, getTask, batchGenerateShotVideos } from '../../api/generation'

const props = defineProps<{
  projectId: string
  storyboard: any
  shots: any[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const loadingVideos = ref(false)
const loadingMerge = ref(false)
const loadingMusic = ref(false)

let progressTimer: ReturnType<typeof setInterval> | null = null

const imagesReady = computed(() => (props.shots || []).some((s: any) => s.image_status === 'completed'))
const videosReady = computed(() => (props.shots || []).some((s: any) => s.video_status === 'completed'))
const merged = ref(false)

// 分镜选择
const selectedIds = ref<Set<number>>(new Set())
const availableShots = computed(() => (props.shots || []).filter((s: any) => s.image_status === 'completed'))

// 进度弹窗
const showProgressDialog = ref(false)
const progressTitle = ref('')
const progressPercent = ref(0)
const progressMessage = ref('')
const progressStatus = ref<'running' | 'completed' | 'failed'>('running')

// 视频播放
const showVideoDialog = ref(false)
const videoUrl = ref('')

function playVideo(shot: any) {
  videoUrl.value = imageUrl(shot.video_path)
  showVideoDialog.value = true
}

const currentStep = computed(() => {
  if (merged.value) return 4
  if (videosReady.value) return 2
  if (imagesReady.value) return 1
  return 0
})

onMounted(() => {})

onUnmounted(() => {
  stopProgressPolling()
})

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

// ─── 分镜选择 ───

function toggleSelect(shot: any) {
  const ids = new Set(selectedIds.value)
  if (ids.has(shot.id)) ids.delete(shot.id)
  else ids.add(shot.id)
  selectedIds.value = ids
}

function selectAll() {
  selectedIds.value = new Set(availableShots.value.map((s: any) => s.id))
}

function deselectAll() {
  selectedIds.value = new Set()
}

async function handleGenerateVideos() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) {
    ElMessage.warning('请先选择要生成视频的分镜')
    return
  }

  try {
    await ElMessageBox.confirm(
      `将为选中的 ${ids.length} 个分镜批量生成视频，是否继续？`,
      '确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' },
    )
  } catch {
    return
  }

  loadingVideos.value = true
  try {
    const data: any = await batchGenerateShotVideos(props.projectId, { shot_ids: ids })
    if (!data.task_id) {
      ElMessage.info(data.message || '没有待生成的分镜视频')
      return
    }
    startProgressPolling(data.task_id, '批量生成分镜视频', data.total || ids.length)
  } catch {
    ElMessage.error('批量生成分镜视频失败')
  } finally {
    loadingVideos.value = false
  }
}

function videoStatusLabel(status: string) {
  const map: Record<string, string> = { pending: '待生成', processing: '生成中', completed: '已完成', failed: '失败' }
  return map[status] || '待生成'
}

// ─── 进度弹窗 ───

function startProgressPolling(taskId: string, title: string, total: number, onComplete?: () => void) {
  progressTitle.value = title
  progressPercent.value = 0
  progressMessage.value = `正在处理 0/${total} ...`
  progressStatus.value = 'running'
  showProgressDialog.value = true

  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(async () => {
    try {
      const data: any = await getTask(taskId)
      const progress = data.progress ?? 0
      progressPercent.value = progress
      progressMessage.value = data.message || `正在处理 ... ${progress}%`

      if (data.status === 'completed') {
        progressStatus.value = 'completed'
        progressPercent.value = 100
        progressMessage.value = '处理完成'
        stopProgressPolling()
        onComplete?.()
      } else if (data.status === 'failed') {
        progressStatus.value = 'failed'
        progressMessage.value = data.error_message || '处理失败'
        stopProgressPolling()
      }
    } catch {
      // 忽略轮询错误
    }
  }, 2000)
}

function stopProgressPolling() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function onProgressDialogClosed() {
  emit('refresh')
}

// ─── 其他操作 ───

async function handleMerge() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) {
    ElMessage.warning('请先选择要合并的分镜')
    return
  }

  loadingMerge.value = true
  try {
    const data: any = await mergeVideos(props.projectId, { shot_ids: ids })
    if (!data.task_id) {
      ElMessage.info(data.message || '合并任务创建失败')
      return
    }
    startProgressPolling(data.task_id, '合并视频', ids.length, () => { merged.value = true })
  } catch {
    ElMessage.error('合并视频失败')
  } finally {
    loadingMerge.value = false
  }
}

async function handleAddMusic() {
  loadingMusic.value = true
  try {
    await addMusic(props.projectId)
    ElMessage.success('添加音乐任务已提交')
  } finally {
    loadingMusic.value = false
  }
}

function imageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  const normalized = path.replace(/\\/g, '/')
  const servedPath = normalized.replace(/^data\//, '/static/')
  return `${base.replace(/\/api\/v1$/, '')}${servedPath}`
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

.select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.select-card {
  cursor: pointer;
  position: relative;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: var(--el-color-primary);
    background: #ecf5ff;
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  .select-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
  }

  .select-thumb {
    height: 100px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .thumb-img {
      width: 100%;
      height: 100%;
    }
  }

  .select-info {
    padding: 8px 10px;

    .select-index {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .select-desc {
      font-size: 12px;
      color: #606266;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 4px;
    }

    .select-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
