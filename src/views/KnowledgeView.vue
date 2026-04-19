<template>
  <div class="page-container">
    <div class="page-header">
      <h2>知识库 ({{ total }})</h2>
      <div>
        <el-input v-model="search" placeholder="搜索案例" style="width: 200px; margin-right: 12px" clearable
          prefix-icon="Search" />
        <el-button @click="loadCases">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon> 添加案例
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterPlatform" placeholder="全部平台" clearable style="width: 140px">
        <el-option label="抖音" value="douyin" />
        <el-option label="YouTube" value="youtube" />
        <el-option label="小红书" value="xiaohongshu" />
        <el-option label="快手" value="kuaishou" />
      </el-select>
      <el-select v-model="filterStyle" placeholder="全部风格" clearable style="width: 140px; margin-left: 12px">
        <el-option label="电影感" value="cinematic" />
        <el-option label="纪实" value="documentary" />
        <el-option label="港风" value="hong_kong" />
        <el-option label="复古" value="vintage" />
        <el-option label="清新" value="fresh" />
      </el-select>
      <el-select v-model="sortBy" style="width: 160px; margin-left: 12px">
        <el-option label="高点赞率优先" value="like_rate_desc" />
        <el-option label="最近添加" value="created_desc" />
      </el-select>
    </div>

    <!-- 案例卡片网格 -->
    <el-empty v-if="!cases.length" description="暂无案例" />

    <div class="case-grid">
      <el-card v-for="c in cases" :key="c.id" class="case-card" shadow="hover" @click="openDetail(c)">
        <div class="case-thumb">
          <el-image v-if="c.thumbnail_url" :src="thumbSrc(c.thumbnail_url)" fit="cover" class="thumb-img" />
          <el-icon v-else :size="48" color="#c0c4cc"><VideoCamera /></el-icon>
        </div>

        <div class="case-title">{{ c.title }}</div>
        <div class="case-meta">
          <span>{{ platformLabel(c.platform) }}</span>
          <span v-if="c.view_count != null">{{ formatCount(c.view_count) }} 播放</span>
          <span v-if="c.like_count != null">{{ formatCount(c.like_count) }} 赞</span>
          <span v-if="c.duration_seconds">{{ formatDuration(c.duration_seconds) }}</span>
        </div>

        <div class="case-tags">
          <el-tag v-for="tag in parseStyle(c.visual_style)" :key="tag" size="small" effect="plain" class="style-tag">
            {{ tag }}
          </el-tag>
        </div>

        <div class="case-actions">
          <el-button text type="primary" size="small" @click.stop="openDetail(c)">查看详情</el-button>
          <el-button text size="small" @click.stop="handleQuote(c)">引用</el-button>
          <el-button text type="warning" size="small" @click.stop="handleReanalyze(c)">重新分析</el-button>
          <el-button text type="danger" size="small" @click.stop="handleDelete(c)">删除</el-button>
        </div>
      </el-card>
    </div>

    <el-pagination v-if="total > pageSize" style="margin-top: 24px; justify-content: center"
      :current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next"
      @current-change="(p: number) => { page = p; loadCases() }" />

    <!-- 添加案例对话框 -->
    <el-dialog v-model="showAddDialog" title="添加案例" width="600px" :close-on-click-modal="!analyzing">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="视频链接">
          <el-input v-model="addForm.url" placeholder="输入视频URL，自动分析" :disabled="analyzing" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="addForm.platform" style="width: 100%" :disabled="analyzing">
            <el-option label="抖音" value="douyin" />
            <el-option label="YouTube" value="youtube" />
            <el-option label="小红书" value="xiaohongshu" />
            <el-option label="快手" value="kuaishou" />
          </el-select>
        </el-form-item>

        <!-- 分析进度 -->
        <div v-if="analyzing" class="analysis-progress">
          <el-progress :percentage="analysisProgress" :status="analysisStatus === 'failed' ? 'exception' : undefined"
            :stroke-width="16" striped striped-flow />
          <p class="progress-text">{{ analysisMessage }}</p>
        </div>

        <!-- 分析结果预览 -->
        <template v-if="analysisResult">
          <el-divider>分析结果</el-divider>
          <el-form-item label="标题">
            <el-input v-model="analysisResult.title" disabled />
          </el-form-item>
          <el-form-item label="视觉风格">
            <div class="detail-tags">
              <el-tag v-for="tag in parseStyle(analysisResult.visual_style)" :key="tag" effect="plain">{{ tag }}</el-tag>
            </div>
          </el-form-item>
          <el-form-item label="爆款元素">
            <div class="detail-tags">
              <el-tag v-for="s in parseArray(analysisResult.viral_elements)" :key="s" type="warning" effect="plain">{{ s }}</el-tag>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <template v-if="analysisResult">
          <el-button type="primary" @click="confirmAnalysis">确认</el-button>
        </template>
        <template v-else>
          <el-button @click="cancelAnalysis" :disabled="false">取消</el-button>
          <el-button type="primary" @click="handleAnalyze" :loading="analyzing" :disabled="analyzing || !addForm.url">
            {{ analyzing ? '分析中...' : '开始分析' }}
          </el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="showDetail" :title="detailCase?.title || '案例详情'" size="520px">
      <template v-if="detailCase">
        <el-tabs v-model="detailActiveTab" class="detail-tabs">
          <el-tab-pane label="基本信息" name="basic"></el-tab-pane>
          <el-tab-pane label="分析报告" name="report" :disabled="detailCase.analysis_status !== 'completed'"></el-tab-pane>
        </el-tabs>

        <!-- 基本信息 Tab -->
        <div v-show="detailActiveTab === 'basic'">
        <div class="detail-cover">
          <el-image v-if="detailCase.thumbnail_url" :src="thumbSrc(detailCase.thumbnail_url)" fit="cover" />
        </div>

        <!-- 基本信息 -->
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="平台">{{ platformLabel(detailCase.platform) }}</el-descriptions-item>
            <el-descriptions-item label="时长">{{ detailCase.duration_seconds ? formatDuration(detailCase.duration_seconds) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="播放量">{{ detailCase.view_count != null ? formatCount(detailCase.view_count) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="点赞数">{{ detailCase.like_count != null ? formatCount(detailCase.like_count) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="点赞率">{{ detailCase.like_rate != null ? (detailCase.like_rate * 100).toFixed(2) + '%' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="分析状态">
              <el-tag :type="detailCase.analysis_status === 'completed' ? 'success' : detailCase.analysis_status === 'failed' ? 'danger' : 'warning'" size="small">
                {{ statusLabel(detailCase.analysis_status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="detailCase.uploader" label="上传者">{{ detailCase.uploader }}</el-descriptions-item>
            <el-descriptions-item v-if="detailCase.upload_date" label="上传日期">{{ detailCase.upload_date }}</el-descriptions-item>
            <el-descriptions-item v-if="detailCase.source_url" label="来源链接" :span="2">
              <a :href="detailCase.source_url" target="_blank" class="source-link">{{ detailCase.source_url }}</a>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 分析结果 -->
        <template v-if="detailCase.analysis_status === 'completed'">
          <div class="detail-section" v-if="detailCase.theme">
            <h4>主题</h4>
            <el-tag type="primary" effect="dark">{{ detailCase.theme }}</el-tag>
          </div>

          <div class="detail-section" v-if="detailCase.narrative_type">
            <h4>叙事类型</h4>
            <el-tag effect="plain">{{ detailCase.narrative_type }}</el-tag>
          </div>

          <div class="detail-section" v-if="detailCase.story_summary">
            <h4>故事内容</h4>
            <p class="detail-text">{{ detailCase.story_summary }}</p>
          </div>

          <div class="detail-section" v-if="detailCase.visual_style">
            <h4>视觉风格</h4>
            <div class="detail-tags">
              <el-tag v-for="tag in parseStyle(detailCase.visual_style)" :key="tag" effect="plain">{{ tag }}</el-tag>
            </div>
          </div>

          <div class="detail-section" v-if="parseEmotionCurve(detailCase.emotion_curve).length">
            <h4>情感曲线</h4>
            <svg viewBox="0 0 200 60" class="emotion-svg-lg">
              <polyline :points="emotionPoints(detailCase.emotion_curve, 200, 60)" fill="none" stroke="#409eff"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <div class="detail-section" v-if="detailCase.viral_elements?.length">
            <h4>爆款元素</h4>
            <div class="detail-tags">
              <el-tag v-for="s in detailCase.viral_elements" :key="s" type="danger" effect="plain">{{ s }}</el-tag>
            </div>
          </div>

          <div class="detail-section" v-if="detailCase.visual_symbols?.length">
            <h4>视觉符号</h4>
            <div class="detail-tags">
              <el-tag v-for="s in detailCase.visual_symbols" :key="s" type="warning" effect="plain">{{ s }}</el-tag>
            </div>
          </div>

          <div class="detail-section" v-if="detailCase.title_formula">
            <h4>标题公式</h4>
            <p class="detail-text">{{ detailCase.title_formula }}</p>
          </div>

          <div class="detail-section" v-if="detailCase.characters_ethnicity">
            <h4>人物特征</h4>
            <p class="detail-text">{{ detailCase.characters_ethnicity }}</p>
          </div>
        </template>

        <div class="detail-section" v-if="detailCase.created_at">
          <h4>收录时间</h4>
          <p class="detail-text">{{ detailCase.created_at }}</p>
        </div>
        </div>

        <!-- 分析报告 Tab -->
        <div v-show="detailActiveTab === 'report' && detailCase.analysis_status === 'completed'">
          <MarkdownPreview :case-id="detailCase.id" ref="markdownPreviewRef" />
        </div>
      </template>
    </el-drawer>

    <!-- 重新分析进度弹窗 -->
    <el-dialog v-model="showReanalyzeDialog" title="重新分析" width="450px" :close-on-click-modal="false" :show-close="!reanalyzing">
      <div class="analysis-progress">
        <el-progress :percentage="reanalyzeProgress" :status="reanalyzeStatus === 'failed' ? 'exception' : undefined"
          :stroke-width="16" striped striped-flow />
        <p class="progress-text">{{ reanalyzeMessage }}</p>
      </div>
      <template #footer v-if="!reanalyzing">
        <el-button type="primary" @click="showReanalyzeDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKnowledgeCases, getKnowledgeCase, analyzeVideo, getAnalysisStatus, deleteKnowledgeCase, reanalyzeCase } from '../api/knowledge'
import MarkdownPreview from '../components/script/MarkdownPreview.vue'

const cases = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 12
const search = ref('')
const filterPlatform = ref('')
const filterStyle = ref('')
const sortBy = ref('like_rate_desc')
const showAddDialog = ref(false)
const showDetail = ref(false)
const detailActiveTab = ref('basic')
const detailCase = ref<any>(null)
const analyzing = ref(false)
const analysisProgress = ref(0)
const analysisStatus = ref('')
const analysisMessage = ref('')
const analysisResult = ref<any>(null)
const markdownPreviewRef = ref<InstanceType<typeof MarkdownPreview> | null>(null)

// Reanalyze state
const showReanalyzeDialog = ref(false)
const reanalyzing = ref(false)
const reanalyzeProgress = ref(0)
const reanalyzeStatus = ref('')
const reanalyzeMessage = ref('')
const reanalyzeCaseId = ref<number | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null

const addForm = reactive({
  url: '',
  platform: 'douyin',
})

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

function thumbSrc(path: string) {
  if (path.startsWith('http')) return path
  return apiBase.replace(/\/api\/v1\/?$/, '') + path
}

onMounted(() => loadCases())

async function loadCases() {
  try {
    const res: any = await getKnowledgeCases({
      page: page.value,
      page_size: pageSize,
      platform: filterPlatform.value || undefined,
      search: search.value || undefined,
    })
    cases.value = res.items || res.data || []
    total.value = res.total || 0
  } catch { /* handled by interceptor */ }
}

async function openDetail(c: any) {
  try {
    const res: any = await getKnowledgeCase(c.id)
    detailCase.value = res.data || res
  } catch {
    detailCase.value = c
  }
  showDetail.value = true
}

function parseStyle(style: string | string[]) {
  if (!style) return []
  if (Array.isArray(style)) return style
  return style.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
}

function emotionPoints(curve: number[] | string, w = 100, h = 30) {
  if (!curve || !Array.isArray(curve) || curve.length === 0) return ''
  const max = Math.max(...curve, 1)
  return curve.map((v: number, i: number) => {
    const x = (i / (curve.length - 1)) * w
    const y = h - (v / max) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
}

function platformLabel(p: string) {
  const map: Record<string, string> = { douyin: '抖音', youtube: 'YouTube', xiaohongshu: '小红书', kuaishou: '快手' }
  return map[p] || p || '未知'
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: '等待中', processing: '分析中', completed: '已完成', failed: '失败' }
  return map[s] || s || '未知'
}

function parseEmotionCurve(curve: any): number[] {
  if (!curve) return []
  if (Array.isArray(curve)) return curve
  if (typeof curve === 'string') {
    try { return JSON.parse(curve) } catch { return [] }
  }
  return []
}

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

async function handleAnalyze() {
  if (!addForm.url) return
  analyzing.value = true
  analysisProgress.value = 0
  analysisStatus.value = 'pending'
  analysisMessage.value = '正在提交分析任务...'
  analysisResult.value = null

  try {
    const res: any = await analyzeVideo({ source_url: addForm.url, platform: addForm.platform })
    const caseId = res.case_id
    if (!caseId) {
      ElMessage.error('提交失败，未获取到任务ID')
      return
    }
    analysisMessage.value = '任务已提交，等待分析...'
    analysisProgress.value = 10

    // 开始轮询
    pollTimer = setInterval(async () => {
      try {
        const status: any = await getAnalysisStatus(caseId)
        analysisStatus.value = status.analysis_status || status.step_status || ''

        // 更新进度
        if (status.progress != null) {
          analysisProgress.value = Math.max(10, Math.min(95, status.progress))
        }

        // 更新提示信息
        const statusMessages: Record<string, string> = {
          pending: '排队等待中...',
          processing: '正在分析视频...',
        }
        analysisMessage.value = statusMessages[analysisStatus.value] || `状态: ${analysisStatus.value}`

        // 完成
        if (status.analysis_status === 'completed') {
          stopPolling()
          analysisProgress.value = 100
          analysisMessage.value = '分析完成!'
          analysisResult.value = status
          ElMessage.success('视频分析完成')
        }

        // 失败
        if (status.analysis_status === 'failed') {
          stopPolling()
          analysisProgress.value = 100
          analysisMessage.value = `分析失败: ${status.error_message || '未知错误'}`
          ElMessage.error('视频分析失败')
        }
      } catch {
        // 轮询请求失败，静默忽略
      }
    }, 3000)
  } catch {
    analyzing.value = false
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  analyzing.value = false
}

function cancelAnalysis() {
  stopPolling()
  analysisProgress.value = 0
  analysisStatus.value = ''
  analysisMessage.value = ''
  analysisResult.value = null
  showAddDialog.value = false
}

function confirmAnalysis() {
  analysisProgress.value = 0
  analysisStatus.value = ''
  analysisMessage.value = ''
  analysisResult.value = null
  showAddDialog.value = false
  loadCases()
}

function parseArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return val.split(',') }
  }
  return []
}

onUnmounted(() => { stopPolling(); stopReanalyzePolling() })

// 切换到分析报告 tab 时刷新内容
watch(detailActiveTab, (tab) => {
  if (tab === 'report' && detailCase.value?.id) {
    markdownPreviewRef.value?.loadMarkdown()
  }
})

function handleQuote(c: any) {
  navigator.clipboard.writeText(String(c.id))
  ElMessage.success('案例ID已复制，可在创建项目时引用')
}

let reanalyzePollTimer: ReturnType<typeof setInterval> | null = null

async function handleReanalyze(c: any) {
  try {
    await ElMessageBox.confirm(`确定重新分析案例「${c.title}」？将使用已有帧图片重新生成分析报告。`, '重新分析确认', {
      confirmButtonText: '开始分析',
      cancelButtonText: '取消',
      type: 'info',
    })
  } catch {
    return // cancelled
  }

  reanalyzing.value = true
  reanalyzeProgress.value = 0
  reanalyzeStatus.value = 'pending'
  reanalyzeMessage.value = '正在提交重新分析任务...'
  reanalyzeCaseId.value = c.id
  showReanalyzeDialog.value = true

  try {
    const res: any = await reanalyzeCase(c.id)
    if (!res.case_id) {
      ElMessage.error('提交失败')
      reanalyzing.value = false
      return
    }
    reanalyzeMessage.value = '任务已提交，等待分析...'

    reanalyzePollTimer = setInterval(async () => {
      try {
        const status: any = await getAnalysisStatus(res.case_id)
        reanalyzeStatus.value = status.analysis_status || ''

        if (status.analysis_progress != null) {
          reanalyzeProgress.value = Math.min(95, status.analysis_progress)
        }

        const statusMessages: Record<string, string> = {
          pending: '排队等待中...',
          processing: '正在分析帧图片...',
        }
        reanalyzeMessage.value = statusMessages[reanalyzeStatus.value] || `状态: ${reanalyzeStatus.value}`

        if (status.analysis_status === 'completed') {
          stopReanalyzePolling()
          reanalyzeProgress.value = 100
          reanalyzeMessage.value = '分析完成!'
          ElMessage.success('重新分析完成')
          loadCases()
        }

        if (status.analysis_status === 'failed') {
          stopReanalyzePolling()
          reanalyzeProgress.value = 100
          reanalyzeMessage.value = `分析失败: ${status.error_message || '未知错误'}`
          ElMessage.error('重新分析失败')
        }
      } catch {
        // poll request failed, ignore
      }
    }, 3000)
  } catch {
    reanalyzing.value = false
  }
}

function stopReanalyzePolling() {
  if (reanalyzePollTimer) {
    clearInterval(reanalyzePollTimer)
    reanalyzePollTimer = null
  }
  reanalyzing.value = false
}

async function handleDelete(c: any) {
  try {
    await ElMessageBox.confirm(`确定删除案例「${c.title}」？此操作不可恢复。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return // cancelled
  }
  try {
    await deleteKnowledgeCase(c.id)
    ElMessage.success('删除成功')
    loadCases()
  } catch { /* handled by interceptor */ }
}
</script>

<style scoped lang="scss">
.filter-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.case-card {
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
  }

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .case-thumb {
    height: 160px;
    background: var(--cyber-bg-input);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 12px;

    .thumb-img {
      width: 100%;
      height: 100%;
    }
  }

  .case-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .case-meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
    display: flex;
    gap: 12px;
  }

  .case-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
    max-height: 52px;
    overflow: hidden;

    .style-tag {
      border-radius: 12px;
    }
  }

  .case-emotion {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .emotion-label {
      font-size: 12px;
      color: #909399;
      flex-shrink: 0;
    }

    .mini-chart {
      flex: 1;
      height: 24px;

      .emotion-svg {
        width: 100%;
        height: 100%;
      }
    }
  }

  .case-actions {
    display: flex;
    gap: 2px;
    margin-top: auto;
    padding-top: 4px;
  }
}

.detail-cover {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--cyber-bg-input);
  margin-bottom: 20px;
}

.analysis-progress {
  margin: 16px 0;

  .progress-text {
    text-align: center;
    font-size: 13px;
    color: var(--cyber-text-dim);
    margin-top: 8px;
  }
}

.detail-tabs {
  margin-bottom: 16px;

  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
}

.detail-section {
  margin-bottom: 20px;

  h4 {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .detail-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .emotion-svg-lg {
    width: 100%;
    height: 50px;
  }

  .detail-text {
    color: #606266;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .source-link {
    color: #409eff;
    text-decoration: none;
    word-break: break-all;
    &:hover { text-decoration: underline; }
  }
}
</style>
