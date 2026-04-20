<template>
  <div class="storyboard-tab">
    <div class="page-header">
      <div>
        <h2 style="display: inline">分镜</h2>
        <span v-if="shots.length" style="margin-left: 8px; color: #909399; font-size: 14px">
          {{ shots.length }} 个镜头，总时长 {{ totalDuration }}s
        </span>
      </div>
      <div class="batch-actions">
        <el-button type="success" :loading="batchCharLoading" @click="handleBatchCharImages" :disabled="!characters.length">
          批量生成人物图片
        </el-button>
        <el-button type="primary" :loading="batchPromptLoading" @click="handleBatchShotPrompts" :disabled="!shots.length" plain>
          批量生成分镜提示词
        </el-button>
        <el-button type="warning" :loading="batchShotLoading" @click="handleBatchShotImages" :disabled="!shots.length">
          批量生成分镜图片
        </el-button>
      </div>
    </div>

    <!-- 人物参照区域 -->
    <div v-if="characters.length" class="character-section">
      <h3 class="section-title">人物参照</h3>
      <div class="character-grid">
        <el-card v-for="char in characters" :key="char.id" class="character-card" shadow="hover">
          <div class="char-image" @click="openCharDetail(char)">
            <el-image v-if="char.reference_image_path" :src="imageUrl(char.reference_image_path)" fit="cover" class="ref-img" />
            <div v-else class="char-placeholder">
              <el-icon :size="48" color="#c0c4cc"><User /></el-icon>
              <span class="placeholder-text">待生成参考图</span>
            </div>
          </div>
          <div class="char-info" @click="openCharDetail(char)">
            <div class="char-name-row">
              <span class="char-name">{{ char.name }}</span>
              <el-tag v-if="char.role_type" size="small" type="info">{{ char.role_type }}</el-tag>
            </div>
            <div class="char-tags">
              <span v-if="char.age">{{ char.age }}岁</span>
              <span v-if="char.gender"> · {{ char.gender }}</span>
              <span v-if="char.nationality"> · {{ char.nationality }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" @click.stop="handleGenCharPrompt(char)"
              :loading="promptLoading === 'char-' + char.id">
              生成提示词
            </el-button>
            <el-button size="small" @click.stop="handleGenCharImage(char)"
              :loading="imageLoading === 'char-' + char.id"
              :disabled="!char.reference_prompt_cn">
              生成图片
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 人物详情抽屉 -->
    <el-drawer v-model="showCharDetail" title="人物详情" size="500px">
      <template v-if="selectedCharacter">
        <div class="char-detail-image">
          <el-image v-if="selectedCharacter.reference_image_path" :src="imageUrl(selectedCharacter.reference_image_path)" fit="contain" class="detail-ref-img" />
          <div v-else class="detail-placeholder">
            <el-icon :size="64" color="#c0c4cc"><User /></el-icon>
            <span>暂无参考图</span>
          </div>
        </div>

        <el-form label-position="top" style="margin-top: 16px">
          <el-form-item label="姓名">
            <el-input v-model="charEditForm.name" />
          </el-form-item>
          <el-form-item label="角色类型">
            <el-input v-model="charEditForm.role_type" />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="年龄">
                <el-input-number v-model="charEditForm.age" :min="0" :max="150" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="性别">
                <el-input v-model="charEditForm.gender" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="国籍/种族">
                <el-input v-model="charEditForm.nationality" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="肤色">
            <el-input v-model="charEditForm.skin_tone" />
          </el-form-item>
          <el-form-item label="外貌特征">
            <el-input v-model="charEditForm.appearance" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="特殊标记">
            <el-input v-model="charEditForm.ethnic_features" />
          </el-form-item>
          <el-form-item label="性格特点">
            <el-input v-model="charEditForm.personality" />
          </el-form-item>
          <el-form-item label="穿着描述">
            <el-input v-model="charEditForm.clothing" type="textarea" :rows="2" />
          </el-form-item>

          <el-divider />

          <el-form-item label="参考图提示词">
            <el-input v-model="charEditForm.reference_prompt_cn" type="textarea" :rows="4" placeholder="用于文生图的提示词，留空则自动生成" />
          </el-form-item>
          <el-form-item label="图片宽高比">
            <el-radio-group v-model="charEditForm.aspect_ratio">
              <el-radio value="9:16">9:16（竖屏）</el-radio>
              <el-radio value="16:9">16:9（横屏）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveCharacter" :loading="savingChar">保存修改</el-button>
            <el-button @click="handleGenCharImage(selectedCharacter)" :loading="imageLoading === 'char-' + selectedCharacter.id">
              {{ selectedCharacter.reference_image_path ? '重新生成参考图' : '生成参考图' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="selectedCharacter.periods && selectedCharacter.periods.length" class="detail-periods">
          <h4>穿着变化</h4>
          <el-timeline>
            <el-timeline-item v-for="period in selectedCharacter.periods" :key="period.id"
              :timestamp="period.period_name" placement="top">
              {{ period.clothing_delta || '无描述' }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
    </el-drawer>

    <!-- 分镜卡片 -->
    <div class="section-title-row" style="margin-top: 24px">
      <h3 v-if="characters.length && shots.length" class="section-title" style="margin-bottom: 0">分镜列表</h3>
      <template v-if="selectMode">
        <el-button size="small" @click="selectAllShots">全选</el-button>
        <el-button size="small" @click="deselectAllShots">反选</el-button>
        <el-button size="small" type="primary" @click="confirmSelection">确认</el-button>
        <el-button size="small" @click="cancelSelection">取消</el-button>
        <span style="color: #909399; font-size: 13px; margin-left: 8px">
          已选 {{ selectedShotIds.size }}/{{ shots.length }}
        </span>
      </template>
    </div>

    <el-empty v-if="!shots.length && !generating" description="暂无分镜，请点击 AI 生成分镜" />

    <div class="shot-grid">
      <el-card v-for="(shot, index) in shots" :key="shot.id" class="shot-card"
        :class="{ active: selectedShot?.id === shot.id, selected: selectMode && selectedShotIds.has(shot.id) }"
        @click="selectMode ? toggleShotSelect(shot) : (selectedShot = shot)">
        <div v-if="selectMode" class="shot-checkbox" @click.stop="toggleShotSelect(shot)">
          <el-checkbox :model-value="selectedShotIds.has(shot.id)" />
        </div>
        <div class="shot-index">#{{ Number(index) + 1 }}</div>
        <div class="shot-thumb" @click.stop="shot.image_path && previewImage(imageUrl(shot.image_path))">
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
        <div class="card-actions">
          <el-button size="small" @click.stop="handleGenShotPrompt(shot)"
            :loading="promptLoading === 'shot-' + shot.id">
            生成提示词
          </el-button>
          <el-button size="small" @click.stop="handleGenShotImage(shot)"
            :loading="imageLoading === 'shot-' + shot.id"
            :disabled="!shot.image_prompt">
            生成图片
          </el-button>
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
          <el-form-item label="图片宽高比">
            <el-radio-group v-model="editForm.aspect_ratio">
              <el-radio value="9:16">9:16（竖屏）</el-radio>
              <el-radio value="16:9">16:9（横屏）</el-radio>
            </el-radio-group>
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

    <!-- 批量生成进度弹窗 -->
    <el-dialog v-model="showProgressDialog" :title="progressTitle" width="460px" :close-on-click-modal="false" :show-close="progressStatus === 'completed' || progressStatus === 'failed'" @closed="onProgressDialogClosed">
      <div style="text-align: center; padding: 16px 0">
        <el-progress :percentage="progressPercent" :status="progressStatus === 'failed' ? 'exception' : progressStatus === 'completed' ? 'success' : undefined" :stroke-width="20" :text-inside="true" style="margin-bottom: 16px" />
        <p style="color: #606266; font-size: 14px">{{ progressMessage }}</p>
      </div>
      <template #footer>
        <el-button v-if="progressStatus === 'completed' || progressStatus === 'failed'" @click="showProgressDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="showImagePreview" title="图片预览" width="auto" style="max-width: 90vw">
      <div style="text-align: center">
        <img :src="previewImageUrl" style="max-width: 100%; max-height: 75vh; object-fit: contain" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, User } from '@element-plus/icons-vue'
import {
  createStoryboard, updateShot, regenerateImage, regenerateVideo,
  generateShotPrompt, generateShotImage,
} from '../../api/storyboard'
import {
  getCharacters, updateCharacter, generateCharPrompt, generateCharRefImage,
} from '../../api/character'
import {
  batchGenerateCharacterImages, batchGenerateShotImages, batchGenerateShotPrompts, getTask,
} from '../../api/generation'

const props = defineProps<{
  projectId: string
  scriptId: string | undefined
  storyboard: any
}>()

const emit = defineEmits<{ refresh: [] }>()

const shots = computed(() => props.storyboard?.shots || [])
const totalDuration = computed(() => {
  const list = shots.value
  return Array.isArray(list) ? list.reduce((sum: number, s: any) => sum + (s.video_duration || 3), 0) : 0
})

const characters = ref<any[]>([])
const generating = ref(false)
const selectedShot = ref<any>(null)
const selectedCharacter = ref<any>(null)
const showDetail = ref(false)
const showCharDetail = ref(false)
const savingShot = ref(false)
const savingChar = ref(false)
const regenImage = ref(false)
const regenVideo = ref(false)

// 批量生成
const batchCharLoading = ref(false)
const batchPromptLoading = ref(false)
const batchShotLoading = ref(false)
const showProgressDialog = ref(false)
const progressTitle = ref('')
const progressPercent = ref(0)
const progressMessage = ref('')
const progressStatus = ref<'running' | 'completed' | 'failed'>('running')
let progressTimer: ReturnType<typeof setInterval> | null = null

// 图片预览
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// 每个 card 的 loading 状态，格式为 'char-1' 或 'shot-5'
const promptLoading = ref<string | null>(null)
const imageLoading = ref<string | null>(null)

// 选择模式
const selectMode = ref(false)
const selectType = ref<'prompt' | 'image'>('prompt')
const selectedShotIds = ref<Set<number>>(new Set())

const editForm = reactive({
  description: '',
  shot_type: '',
  video_duration: 3,
  image_prompt: '',
  video_prompt: '',
  aspect_ratio: '9:16',
})

const charEditForm = reactive({
  name: '',
  role_type: '',
  age: null as number | null,
  gender: '',
  nationality: '',
  skin_tone: '',
  appearance: '',
  ethnic_features: '',
  personality: '',
  clothing: '',
  reference_prompt_cn: '',
  aspect_ratio: '9:16',
})

onMounted(() => {
  loadCharacters()
})

onUnmounted(() => {
  stopPolling()
})

async function loadCharacters() {
  if (!props.projectId) return
  try {
    const res: any = await getCharacters(props.projectId)
    characters.value = res.items || res.data || res || []
  } catch {
    characters.value = []
  }
}

function openCharDetail(char: any) {
  selectedCharacter.value = char
  charEditForm.name = char.name || ''
  charEditForm.role_type = char.role_type || ''
  charEditForm.age = char.age || null
  charEditForm.gender = char.gender || ''
  charEditForm.nationality = char.nationality || ''
  charEditForm.skin_tone = char.skin_tone || ''
  charEditForm.appearance = char.appearance || ''
  charEditForm.ethnic_features = char.ethnic_features || ''
  charEditForm.personality = char.personality || ''
  charEditForm.clothing = char.clothing || ''
  charEditForm.reference_prompt_cn = char.reference_prompt_cn || ''
  charEditForm.aspect_ratio = '9:16'
  showCharDetail.value = true
}

watch(selectedShot, (s) => {
  if (s) {
    editForm.description = s.description || ''
    editForm.shot_type = s.shot_type || ''
    editForm.video_duration = s.video_duration || 3
    editForm.image_prompt = s.image_prompt || ''
    editForm.video_prompt = s.video_prompt || ''
    editForm.aspect_ratio = '9:16'
    showDetail.value = true
  }
})

// ─── 人物操作 ───

async function handleGenCharPrompt(char: any) {
  const key = `char-${char.id}`
  promptLoading.value = key
  try {
    await generateCharPrompt(char.id)
    ElMessage.success('提示词生成成功')
    await loadCharacters()
  } catch {
    ElMessage.error('提示词生成失败')
  } finally {
    promptLoading.value = null
  }
}

async function handleGenCharImage(char: any) {
  const key = `char-${char.id}`
  imageLoading.value = key
  try {
    await generateCharRefImage(char.id, { aspect_ratio: charEditForm.aspect_ratio || '9:16' })
    ElMessage.success('图片生成成功')
    await loadCharacters()
  } catch {
    ElMessage.error('图片生成失败')
  } finally {
    imageLoading.value = null
  }
}

async function handleSaveCharacter() {
  if (!selectedCharacter.value) return
  savingChar.value = true
  try {
    const { aspect_ratio, ...data } = charEditForm
    await updateCharacter(selectedCharacter.value.id, data)
    ElMessage.success('已保存')
    loadCharacters()
  } finally {
    savingChar.value = false
  }
}

// ─── 镜头操作 ───

async function handleGenShotPrompt(shot: any) {
  const key = `shot-${shot.id}`
  promptLoading.value = key
  try {
    await generateShotPrompt(shot.id)
    ElMessage.success('提示词生成成功')
    emit('refresh')
  } catch {
    ElMessage.error('提示词生成失败')
  } finally {
    promptLoading.value = null
  }
}

async function handleGenShotImage(shot: any) {
  const key = `shot-${shot.id}`
  imageLoading.value = key
  try {
    await generateShotImage(shot.id)
    ElMessage.success('图片生成成功')
    emit('refresh')
  } catch {
    ElMessage.error('图片生成失败')
  } finally {
    imageLoading.value = null
  }
}

async function handleGenerate() {
  if (!props.scriptId) return
  generating.value = true
  try {
    await createStoryboard(props.scriptId)
    ElMessage.success('分镜生成成功')
    emit('refresh')
    loadCharacters()
  } finally {
    generating.value = false
  }
}

// ─── 批量生成 ───

function startProgressPolling(taskId: string, title: string, total: number) {
  progressTitle.value = title
  progressPercent.value = 0
  progressMessage.value = `正在生成 0/${total} ...`
  progressStatus.value = 'running'
  showProgressDialog.value = true

  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(async () => {
    try {
      const data: any = await getTask(taskId)
      const progress = data.progress ?? 0
      progressPercent.value = progress
      progressMessage.value = data.message || `正在生成 ... ${progress}%`

      if (data.status === 'completed') {
        progressStatus.value = 'completed'
        progressPercent.value = 100
        progressMessage.value = '生成完成'
        stopPolling()
        loadCharacters()
        emit('refresh')
      } else if (data.status === 'failed') {
        progressStatus.value = 'failed'
        progressMessage.value = data.error_message || '生成失败'
        stopPolling()
      }
    } catch {
      // 忽略轮询错误
    }
  }, 2000)
}

function stopPolling() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function onProgressDialogClosed() {
  loadCharacters()
  emit('refresh')
}

function enterSelectMode(type: 'prompt' | 'image') {
  selectMode.value = true
  selectType.value = type
  selectedShotIds.value = new Set()
}

function cancelSelection() {
  selectMode.value = false
  selectedShotIds.value = new Set()
}

function toggleShotSelect(shot: any) {
  const ids = new Set(selectedShotIds.value)
  if (ids.has(shot.id)) {
    ids.delete(shot.id)
  } else {
    ids.add(shot.id)
  }
  selectedShotIds.value = ids
}

function selectAllShots() {
  selectedShotIds.value = new Set(shots.value.map((s: any) => s.id))
}

function deselectAllShots() {
  selectedShotIds.value = new Set()
}

async function confirmSelection() {
  const ids = Array.from(selectedShotIds.value)
  if (!ids.length) {
    ElMessage.warning('请先选择要生成的分镜')
    return
  }

  const actionLabel = selectType.value === 'prompt' ? '提示词' : '图片'
  try {
    await ElMessageBox.confirm(
      `将为选中的 ${ids.length} 个分镜批量生成${actionLabel}，是否继续？`,
      '确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' },
    )
  } catch {
    return
  }

  selectMode.value = false

  if (selectType.value === 'prompt') {
    batchPromptLoading.value = true
    try {
      const data: any = await batchGenerateShotPrompts(props.projectId!, { shot_ids: ids })
      if (!data.task_id) {
        ElMessage.info(data.message || '没有需要生成提示词的分镜')
        return
      }
      startProgressPolling(data.task_id, '批量生成分镜提示词', data.total || ids.length)
    } catch {
      ElMessage.error('批量生成分镜提示词失败')
    } finally {
      batchPromptLoading.value = false
    }
  } else {
    batchShotLoading.value = true
    try {
      const data: any = await batchGenerateShotImages(props.projectId!, { shot_ids: ids })
      if (!data.task_id) {
        ElMessage.info(data.message || '没有待生成的分镜图片')
        return
      }
      startProgressPolling(data.task_id, '批量生成分镜图片', data.total || ids.length)
    } catch {
      ElMessage.error('批量生成分镜图片失败')
    } finally {
      batchShotLoading.value = false
    }
  }
}

async function handleBatchShotPrompts() {
  if (!props.projectId || !shots.value.length) return
  enterSelectMode('prompt')
}

async function handleBatchCharImages() {
  if (!props.projectId) return
  batchCharLoading.value = true
  try {
    const data: any = await batchGenerateCharacterImages(props.projectId)
    if (!data.task_id) {
      ElMessage.info(data.message || '没有需要生成的人物图片')
      return
    }
    startProgressPolling(data.task_id, '批量生成人物图片', data.total || characters.value.length)
  } catch {
    ElMessage.error('批量生成人物图片失败')
  } finally {
    batchCharLoading.value = false
  }
}

async function handleBatchShotImages() {
  if (!props.projectId || !shots.value.length) return
  enterSelectMode('image')
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
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  // data/uploads/xxx.png → /static/uploads/xxx.png
  const normalized = path.replace(/\\/g, '/')
  const servedPath = normalized.replace(/^data\//, '/static/')
  return `${base.replace(/\/api\/v1$/, '')}${servedPath}`
}

function previewImage(url: string) {
  previewImageUrl.value = url
  showImagePreview.value = true
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
.batch-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

/* 人物参照区域 */
.character-section {
  margin-bottom: 8px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.character-card {
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  .char-image {
    height: 220px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;

    .ref-img {
      width: 100%;
      height: 100%;
    }

    .char-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .placeholder-text {
        font-size: 12px;
        color: #c0c4cc;
      }
    }
  }

  .char-info {
    padding: 12px 12px 0;
    cursor: pointer;

    .char-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .char-name {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .char-tags {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }
  }
}

/* 通用卡片操作按钮 */
.card-actions {
  padding: 8px 12px 12px;
  display: flex;
  justify-content: center;
  gap: 8px;

  .el-button {
    flex: none;
    min-width: 80px;
  }
}

/* 人物详情抽屉 */
.char-detail-image {
  width: 100%;
  height: 360px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .detail-ref-img {
    width: 100%;
    height: 100%;
  }

  .detail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: #c0c4cc;
    font-size: 14px;
  }
}

.detail-periods {
  margin-top: 20px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

/* 分镜卡片 */
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.shot-card {
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: var(--el-color-primary);
  }

  &.selected {
    border-color: var(--el-color-success);
    background: #f0f9eb;
  }

  .shot-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
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
    margin-bottom: 4px;
  }
}
</style>
