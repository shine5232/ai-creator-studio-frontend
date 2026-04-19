<template>
  <div class="script-tab">
    <el-row :gutter="20">
      <!-- 左侧：脚本展示 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between">
              <el-tabs v-model="activeTab" class="script-tabs">
                <el-tab-pane label="结构化详情" name="structured"></el-tab-pane>
                <el-tab-pane label="Markdown 预览" name="markdown"></el-tab-pane>
              </el-tabs>
              <el-button size="small" @click="handleSave" :loading="saving">保存</el-button>
            </div>
          </template>

          <!-- 结构化详情 Tab -->
          <div v-show="activeTab === 'structured'">
            <!-- 基本信息 -->
            <div class="section-block">
              <div class="section-title">基本信息</div>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="标题">{{ form.title }}</el-descriptions-item>
                <el-descriptions-item label="主题">{{ form.theme }}</el-descriptions-item>
                <el-descriptions-item label="叙事类型">{{ form.narrative_type }}</el-descriptions-item>
                <el-descriptions-item label="时长">{{ durationLabel }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 脚本正文 -->
            <div class="section-block">
              <div class="section-title">脚本正文</div>
              <el-input v-model="form.content" type="textarea" :rows="8"
                placeholder="输入脚本内容，或使用右侧 AI 面板生成" />
            </div>

            <!-- 人物设定 -->
            <div v-if="characterProfiles.length" class="section-block">
              <div class="section-title">人物设定</div>
              <div class="character-cards">
                <div v-for="(char, ci) in characterProfiles" :key="ci" class="character-card">
                  <div class="char-header">
                    <span class="char-name">{{ char.role_name }}</span>
                    <el-tag v-if="char.race_ethnicity" size="small" type="warning">{{ char.race_ethnicity }}</el-tag>
                  </div>
                  <el-descriptions :column="2" border size="small" class="char-desc">
                    <el-descriptions-item label="年龄">{{ char.age }}</el-descriptions-item>
                    <el-descriptions-item label="性别">{{ char.gender }}</el-descriptions-item>
                    <el-descriptions-item label="肤色">{{ char.skin_color }}</el-descriptions-item>
                    <el-descriptions-item label="眼睛">{{ char.eyes }}</el-descriptions-item>
                    <el-descriptions-item label="发型">{{ char.hair }}</el-descriptions-item>
                    <el-descriptions-item label="体型">{{ char.body_type }}</el-descriptions-item>
                    <el-descriptions-item label="面部特征" :span="2">{{ char.facial_features }}</el-descriptions-item>
                    <el-descriptions-item label="特殊标记" :span="2">{{ char.special_marks }}</el-descriptions-item>
                    <el-descriptions-item label="性格" :span="2">{{ char.personality }}</el-descriptions-item>
                  </el-descriptions>
                  <!-- 穿着变化 -->
                  <div v-if="char.clothing_phases?.length" class="clothing-phases">
                    <div class="clothing-label">穿着变化</div>
                    <div class="clothing-row">
                      <div v-for="cp in char.clothing_phases" :key="cp.phase" class="clothing-item">
                        <el-tag size="small" effect="dark" class="phase-tag">{{ cp.phase }}</el-tag>
                        <span class="phase-desc">{{ cp.description }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分镜脚本 -->
            <div v-if="acts.length" class="section-block">
              <div class="section-title">分镜脚本</div>
              <el-collapse v-model="expandedActs" class="acts-collapse">
                <el-collapse-item
                  v-for="act in acts" :key="act.act_number"
                  :name="act.act_number"
                >
                  <template #title>
                    <div class="act-title">
                      <el-tag size="small" type="primary">第{{ act.act_number }}幕</el-tag>
                      <span class="act-name">{{ act.act_name }}</span>
                      <span class="act-time">{{ act.time_range }}</span>
                    </div>
                  </template>

                  <div class="shots-list">
                    <div v-for="shot in act.shots" :key="shot.shot_number" class="shot-card">
                      <div class="shot-header">
                        <span class="shot-number">镜头 {{ shot.shot_number }}</span>
                        <el-tag size="small" effect="plain">{{ shot.shot_type }}</el-tag>
                        <el-tag size="small" type="info" effect="plain">{{ shot.time_range }}</el-tag>
                        <span class="shot-location">{{ shot.location }}</span>
                      </div>
                      <el-descriptions :column="1" border size="small" class="shot-desc">
                        <el-descriptions-item label="人物">
                          <span class="shot-field">{{ shot.characters }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="环境">
                          <span class="shot-field">{{ shot.environment }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="事件">
                          <span class="shot-field">{{ shot.event }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item v-if="shot.dialog" label="台词">
                          <span class="shot-dialog">{{ shot.dialog }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="">
                          <div class="shot-tags-row">
                            <el-tag v-if="shot.tone" size="small" type="warning" effect="plain">{{ shot.tone }}</el-tag>
                            <el-tag v-if="shot.mood" size="small" type="danger" effect="plain">{{ shot.mood }}</el-tag>
                          </div>
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <!-- 视觉设计 -->
            <div v-if="visualDesign && hasVisualDesign" class="section-block">
              <div class="section-title">视觉设计</div>
              <div v-if="visualDesign.color_progression" class="vd-row">
                <label>色调变化</label>
                <span>{{ visualDesign.color_progression }}</span>
              </div>
              <div v-if="visualDesign.contrasts?.length" class="vd-section">
                <label>场景对比</label>
                <el-table :data="visualDesign.contrasts" size="small" border stripe>
                  <el-table-column prop="before" label="前期" />
                  <el-table-column prop="after" label="后期" />
                  <el-table-column prop="symbol" label="象征意义" width="120" />
                </el-table>
              </div>
              <div v-if="visualDesign.visual_symbols?.length" class="vd-section">
                <label>视觉符号</label>
                <el-table :data="visualDesign.visual_symbols" size="small" border stripe>
                  <el-table-column prop="symbol" label="符号" width="150" />
                  <el-table-column prop="meaning" label="象征意义" />
                </el-table>
              </div>
            </div>

            <!-- 标题建议 -->
            <div v-if="titleSuggestions.length" class="section-block">
              <div class="section-title">标题建议</div>
              <div class="title-suggestions">
                <div v-for="(ts, i) in titleSuggestions" :key="i" class="title-item">
                  <el-tag v-if="ts.recommended" size="small" type="success" effect="dark">推荐</el-tag>
                  <span class="title-text">{{ ts.title }}</span>
                </div>
              </div>
            </div>

            <!-- 爆款元素 -->
            <div v-if="viralElements.length" class="section-block">
              <div class="section-title">爆款元素</div>
              <div class="viral-tags">
                <el-tag v-for="v in viralElements" :key="v" type="danger" effect="plain">{{ v }}</el-tag>
              </div>
            </div>
          </div>

          <!-- Markdown 预览 Tab -->
          <div v-show="activeTab === 'markdown'">
            <MarkdownPreview :script-id="scriptId" ref="markdownPreviewRef" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：AI 生成面板 -->
      <el-col :span="10">
        <!-- 参考案例信息 -->
        <el-card v-if="referenceCaseId" class="ref-case-card" shadow="never">
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer"
              @click="refCaseExpanded = !refCaseExpanded">
              <span>参考案例</span>
              <el-icon :class="{ 'expanded': refCaseExpanded }"><ArrowDown /></el-icon>
            </div>
          </template>
          <div v-if="refCaseLoading" style="text-align: center; padding: 12px">
            <el-icon class="is-loading"><Loading /></el-icon> 加载中...
          </div>
          <div v-else-if="refContext" v-show="refCaseExpanded" class="ref-case-info">
            <div class="ref-field" v-if="refContext.title">
              <label>标题</label>
              <span>{{ refContext.title }}</span>
            </div>
            <div class="ref-field" v-if="refContext.theme">
              <label>主题</label>
              <span>{{ refContext.theme }}</span>
            </div>
            <div class="ref-field" v-if="refContext.narrative_type">
              <label>叙事类型</label>
              <span>{{ refContext.narrative_type }}</span>
            </div>
            <div class="ref-field" v-if="refContext.story_summary">
              <label>故事概要</label>
              <span>{{ refContext.story_summary }}</span>
            </div>
            <div class="ref-field" v-if="refContext.emotion_curve">
              <label>情感曲线</label>
              <span>{{ refContext.emotion_curve }}</span>
            </div>
            <div class="ref-field" v-if="refContext.visual_style">
              <label>视觉风格</label>
              <span>{{ refContext.visual_style }}</span>
            </div>
            <div class="ref-field" v-if="refContext.viral_elements?.length">
              <label>爆款元素</label>
              <div class="ref-tags">
                <el-tag v-for="v in refContext.viral_elements" :key="v" size="small" type="danger">{{ v }}</el-tag>
              </div>
            </div>
            <div class="ref-field" v-if="refContext.visual_symbols?.length">
              <label>视觉符号</label>
              <div class="ref-tags">
                <el-tag v-for="v in refContext.visual_symbols" :key="v" size="small" type="info">{{ v }}</el-tag>
              </div>
            </div>
            <div class="ref-field" v-if="refContext.characters_ethnicity">
              <label>人物外貌特征</label>
              <span>{{ refContext.characters_ethnicity }}</span>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 12px">
          <template #header>AI 生成面板</template>

          <el-form :model="aiForm" label-position="top">
            <el-form-item label="脚本标题">
              <el-input v-model="aiForm.title" placeholder="如：母爱的力量" />
            </el-form-item>
            <el-form-item label="主题">
              <el-input v-model="aiForm.theme" placeholder="视频主题" />
            </el-form-item>
            <el-form-item label="叙事类型">
              <el-select v-model="aiForm.narrative_type" style="width: 100%">
                <el-option label="情感故事" value="emotional" />
                <el-option label="纪录片风格" value="documentary" />
                <el-option label="教程" value="tutorial" />
                <el-option label="Vlog" value="vlog" />
                <el-option label="悬疑" value="suspense" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标时长（秒）">
              <el-input-number v-model="aiForm.duration_seconds" :min="10" :max="300" style="width: 100%" />
            </el-form-item>
            <el-form-item label="额外要求">
              <el-input v-model="aiForm.custom_prompt" type="textarea" :rows="3" placeholder="可选的额外要求" />
            </el-form-item>
          </el-form>

          <el-button type="primary" :loading="generating" @click="handleGenerate" style="width: 100%">
            AI 生成脚本
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Loading } from '@element-plus/icons-vue'
import { generateScript, updateScript } from '../../api/script'
import { getReferenceContext } from '../../api/knowledge'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps<{
  projectId: string
  script: any
  referenceCaseId: number | null
}>()

const emit = defineEmits<{
  scriptLoaded: [script: any]
  scriptSaved: [script: any]
}>()

const saving = ref(false)
const generating = ref(false)
const scriptId = ref<string>('')
const activeTab = ref('structured')
const markdownPreviewRef = ref<InstanceType<typeof MarkdownPreview> | null>(null)

// 结构化数据
const characterProfiles = ref<any[]>([])
const acts = ref<any[]>([])
const visualDesign = ref<any>({})
const titleSuggestions = ref<any[]>([])
const viralElements = ref<string[]>([])
const expandedActs = ref<number[]>([])

const hasVisualDesign = computed(() => {
  const vd = visualDesign.value
  return vd && (vd.color_progression || vd.contrasts?.length || vd.visual_symbols?.length)
})

const durationLabel = computed(() => {
  // derive from script props if available
  return props.script?.duration_seconds ? `${props.script.duration_seconds}秒` : '未指定'
})

/** 从 content 中分离可读正文与结构化 JSON */
function parseContent(raw: string): string {
  const marker = '---STRUCTURED_DATA---'
  const idx = raw.indexOf(marker)
  if (idx < 0) {
    characterProfiles.value = []
    acts.value = []
    visualDesign.value = {}
    titleSuggestions.value = []
    viralElements.value = []
    return raw
  }
  const displayText = raw.substring(0, idx).trim()
  const jsonText = raw.substring(idx + marker.length).trim()
  try {
    const structured = JSON.parse(jsonText)
    characterProfiles.value = structured.character_profiles || []
    acts.value = structured.acts || []
    visualDesign.value = structured.visual_design || {}
    titleSuggestions.value = structured.title_suggestions || []
    viralElements.value = structured.viral_elements || []
    // 默认展开第一幕
    if (acts.value.length && expandedActs.value.length === 0) {
      expandedActs.value = acts.value.map(a => a.act_number)
    }
  } catch {
    characterProfiles.value = []
    acts.value = []
    visualDesign.value = {}
    titleSuggestions.value = []
    viralElements.value = []
  }
  return displayText
}

// 参考案例
const refContext = ref<any>(null)
const refCaseLoading = ref(false)
const refCaseExpanded = ref(true)

const form = reactive({
  title: '',
  theme: '',
  narrative_type: '',
  content: '',
})

const aiForm = reactive({
  title: '',
  theme: '',
  narrative_type: 'emotional',
  duration_seconds: 60,
  custom_prompt: '',
})

watch(() => props.script, (s) => {
  if (s) {
    form.title = s.title || ''
    form.theme = s.theme || ''
    form.narrative_type = s.narrative_type || ''
    form.content = parseContent(s.content || '')
    scriptId.value = s.id
    emit('scriptLoaded', s)
  }
}, { immediate: true })

watch(() => props.referenceCaseId, (id) => {
  if (id) {
    loadReferenceContext(id)
  } else {
    refContext.value = null
  }
}, { immediate: true })

// 切换到 Markdown tab 时刷新内容
watch(activeTab, (tab) => {
  if (tab === 'markdown' && scriptId.value) {
    markdownPreviewRef.value?.loadMarkdown()
  }
})

async function loadReferenceContext(caseId: number) {
  refCaseLoading.value = true
  try {
    const res: any = await getReferenceContext(caseId)
    refContext.value = res
  } catch {
    ElMessage.error('加载参考案例失败')
    refContext.value = null
  } finally {
    refCaseLoading.value = false
  }
}

async function handleSave() {
  if (!scriptId.value) return
  saving.value = true
  try {
    const res: any = await updateScript(scriptId.value, form)
    ElMessage.success('保存成功')
    emit('scriptSaved', res)
  } finally {
    saving.value = false
  }
}

async function handleGenerate() {
  if (!aiForm.title.trim()) {
    ElMessage.warning('请输入脚本标题')
    return
  }
  generating.value = true
  try {
    const payload: any = { ...aiForm }
    if (props.referenceCaseId) {
      payload.source_case_id = props.referenceCaseId
    }
    const res: any = await generateScript(props.projectId, payload)
    const data = res.script || res
    form.title = data.title || ''
    form.theme = data.theme || aiForm.theme
    form.narrative_type = data.narrative_type || aiForm.narrative_type
    form.content = parseContent(data.content || '')
    scriptId.value = data.id
    // 也从 viral_elements 字段解析（后端可能存了两份）
    if (data.viral_elements && !viralElements.value.length) {
      try {
        const ve = typeof data.viral_elements === 'string'
          ? JSON.parse(data.viral_elements)
          : data.viral_elements
        if (Array.isArray(ve)) viralElements.value = ve
      } catch { /* ignore */ }
    }
    ElMessage.success('脚本生成成功')
    emit('scriptLoaded', data)
  } finally {
    generating.value = false
  }
}
</script>

<style scoped lang="scss">
.section-block {
  margin-bottom: 20px;

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
    padding-left: 8px;
    border-left: 3px solid var(--el-color-primary);
  }
}

/* ---- 人物卡片 ---- */
.character-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .character-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    padding: 12px;
    background: var(--el-fill-color-lighter);

    .char-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .char-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .char-desc {
      margin-bottom: 8px;
    }

    .clothing-phases {
      .clothing-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .clothing-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .clothing-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          flex: 1;
          min-width: 120px;

          .phase-tag {
            flex-shrink: 0;
          }

          .phase-desc {
            font-size: 12px;
            color: #606266;
            line-height: 1.5;
          }
        }
      }
    }
  }
}

/* ---- 分镜脚本 ---- */
.acts-collapse {
  border: none;

  :deep(.el-collapse-item__header) {
    background: var(--el-fill-color-light);
    padding: 0 12px;
    border-radius: 6px;
    margin-bottom: 4px;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
  }

  .act-title {
    display: flex;
    align-items: center;
    gap: 8px;

    .act-name {
      font-weight: 600;
      color: #303133;
    }

    .act-time {
      font-size: 12px;
      color: #909399;
    }
  }
}

.shots-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;

  .shot-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 10px 12px;
    background: #fff;

    .shot-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      .shot-number {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
      }

      .shot-location {
        font-size: 12px;
        color: #909399;
        margin-left: auto;
      }
    }

    .shot-desc {
      :deep(.el-descriptions__label) {
        width: 50px;
        min-width: 50px;
      }
    }

    .shot-field {
      font-size: 13px;
      line-height: 1.6;
    }

    .shot-dialog {
      font-size: 13px;
      font-style: italic;
      color: var(--el-color-primary);
    }

    .shot-tags-row {
      display: flex;
      gap: 4px;
    }
  }
}

/* ---- 视觉设计 ---- */
.vd-row {
  margin-bottom: 10px;

  label {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-bottom: 2px;
  }

  span {
    font-size: 13px;
  }
}

.vd-section {
  margin-bottom: 10px;

  > label {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }
}

/* ---- 标题建议 ---- */
.title-suggestions {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .title-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .title-text {
      font-size: 13px;
      color: #303133;
    }
  }
}

/* ---- 爆款元素 ---- */
.viral-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ---- 参考案例 ---- */
.ref-case-card {
  border-color: var(--el-color-success-light-5);

  :deep(.el-card__header) {
    padding: 10px 16px;
    background: var(--el-color-success-light-9);
  }
}

.expanded {
  transform: rotate(180deg);
}

.ref-case-info {
  .ref-field {
    margin-bottom: 8px;

    label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 2px;
    }

    span {
      font-size: 13px;
      line-height: 1.5;
    }
  }

  .ref-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 2px;
  }
}
</style>
