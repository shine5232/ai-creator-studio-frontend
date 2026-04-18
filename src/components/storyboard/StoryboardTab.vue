<template>
  <div class="storyboard-tab">
    <div class="page-header">
      <div>
        <h2 style="display: inline">分镜</h2>
        <span v-if="shots.length" style="margin-left: 8px; color: #909399; font-size: 14px">
          {{ shots.length }} 个镜头，总时长 {{ totalDuration }}s
        </span>
      </div>
      <el-button type="primary" :loading="generating" @click="handleGenerate" :disabled="!scriptId">
        AI 生成分镜
      </el-button>
    </div>

    <!-- 镜头卡片网格 -->
    <el-empty v-if="!shots.length && !generating" description="暂无分镜，请点击 AI 生成分镜" />

    <div class="shot-grid">
      <el-card v-for="(shot, index) in shots" :key="shot.id" class="shot-card"
        :class="{ active: selectedShot?.id === shot.id }" @click="selectedShot = shot">
        <div class="shot-index">#{{ Number(index) + 1 }}</div>
        <div class="shot-thumb">
          <el-image v-if="shot.image_path" :src="imageUrl(shot.image_path)" fit="cover" class="thumb-img" />
          <el-icon v-else :size="40" color="#c0c4cc"><Picture /></el-icon>
        </div>
        <div class="shot-meta">
          <el-tag size="small" type="info">{{ shot.shot_type || '—' }}</el-tag>
          <span class="shot-time">{{ shot.time_range || `${shot.video_duration || 3}s` }}</span>
        </div>
        <div class="shot-desc">{{ shot.description || '无描述' }}</div>
        <div class="shot-status">
          <el-tag size="small" :type="shotStatusType(shot)">
            {{ shotStatusLabel(shot) }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 镜头详情抽屉 -->
    <el-drawer v-model="showDetail" title="镜头详情" size="500px">
      <template v-if="selectedShot">
        <el-form label-position="top">
          <el-form-item label="画面描述">
            <el-input v-model="editForm.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="镜头类型">
            <el-select v-model="editForm.shot_type">
              <el-option label="特写" value="close_up" />
              <el-option label="近景" value="medium_close_up" />
              <el-option label="中景" value="medium" />
              <el-option label="全景" value="wide" />
              <el-option label="大远景" value="establishing" />
            </el-select>
          </el-form-item>
          <el-form-item label="时长（秒）">
            <el-input-number v-model="editForm.video_duration" :min="1" :max="30" />
          </el-form-item>
          <el-form-item label="Image Prompt">
            <el-input v-model="editForm.image_prompt" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="Video Prompt">
            <el-input v-model="editForm.video_prompt" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveShot" :loading="savingShot">保存修改</el-button>
            <el-button v-if="selectedShot.image_path" @click="handleRegenImage" :loading="regenImage">
              重新生成图片
            </el-button>
            <el-button v-if="selectedShot.video_path" @click="handleRegenVideo" :loading="regenVideo">
              重新生成视频
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createStoryboard, updateShot, regenerateImage, regenerateVideo } from '../../api/storyboard'

const props = defineProps<{
  scriptId: string | undefined
  storyboard: any
}>()

const emit = defineEmits<{ refresh: [] }>()

const shots = computed(() => props.storyboard?.shots || [])
const totalDuration = computed(() => {
  const list = shots.value
  return Array.isArray(list) ? list.reduce((sum: number, s: any) => sum + (s.video_duration || 3), 0) : 0
})

const generating = ref(false)
const selectedShot = ref<any>(null)
const showDetail = ref(false)
const savingShot = ref(false)
const regenImage = ref(false)
const regenVideo = ref(false)

const editForm = reactive({
  description: '',
  shot_type: '',
  video_duration: 3,
  image_prompt: '',
  video_prompt: '',
})

watch(selectedShot, (s) => {
  if (s) {
    editForm.description = s.description || ''
    editForm.shot_type = s.shot_type || ''
    editForm.video_duration = s.video_duration || 3
    editForm.image_prompt = s.image_prompt || ''
    editForm.video_prompt = s.video_prompt || ''
    showDetail.value = true
  }
})

async function handleGenerate() {
  if (!props.scriptId) return
  generating.value = true
  try {
    await createStoryboard(props.scriptId)
    ElMessage.success('分镜生成成功')
    emit('refresh')
  } finally {
    generating.value = false
  }
}

async function handleSaveShot() {
  if (!selectedShot.value) return
  savingShot.value = true
  try {
    await updateShot(selectedShot.value.id, editForm)
    ElMessage.success('已保存')
    emit('refresh')
  } finally {
    savingShot.value = false
  }
}

async function handleRegenImage() {
  if (!selectedShot.value) return
  regenImage.value = true
  try {
    await regenerateImage(selectedShot.value.id)
    ElMessage.success('图片重新生成已提交')
  } finally {
    regenImage.value = false
  }
}

async function handleRegenVideo() {
  if (!selectedShot.value) return
  regenVideo.value = true
  try {
    await regenerateVideo(selectedShot.value.id)
    ElMessage.success('视频重新生成已提交')
  } finally {
    regenVideo.value = false
  }
}

function imageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  return `${base}${path}`
}

function shotStatusType(shot: any) {
  if (shot.video_status === 'completed') return 'success'
  if (shot.video_status === 'failed') return 'danger'
  if (shot.video_status === 'processing') return 'warning'
  if (shot.image_status === 'completed') return ''
  if (shot.image_status === 'processing') return 'warning'
  if (shot.image_status === 'failed') return 'danger'
  return 'info'
}

function shotStatusLabel(shot: any) {
  if (shot.video_status === 'completed') return '视频完成'
  if (shot.video_status === 'processing') return '视频生成中'
  if (shot.video_status === 'failed') return '视频失败'
  if (shot.image_status === 'completed') return '图片完成'
  if (shot.image_status === 'processing') return '图片生成中'
  if (shot.image_status === 'failed') return '图片失败'
  return '待生成'
}
</script>

<style scoped lang="scss">
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.shot-card {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: var(--el-color-primary);
  }

  .shot-index {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .shot-thumb {
    height: 120px;
    background: var(--cyber-bg-input);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 8px;

    .thumb-img {
      width: 100%;
      height: 100%;
    }
  }

  .shot-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .shot-time {
      font-size: 12px;
      color: #909399;
    }
  }

  .shot-desc {
    font-size: 13px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 8px;
  }

  .shot-status {
    text-align: right;
  }
}
</style>
