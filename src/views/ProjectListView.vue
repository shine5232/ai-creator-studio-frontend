<template>
  <div class="page-container">
    <div class="page-header">
      <h2>项目列表 ({{ total }})</h2>
      <div>
        <el-input v-model="search" placeholder="搜索项目" style="width: 200px; margin-right: 12px" clearable
          prefix-icon="Search" />
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon> 新建项目
        </el-button>
      </div>
    </div>

    <el-table :data="projects" v-loading="loading" stripe>
      <el-table-column prop="name" label="标题" min-width="200" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="目标时长" width="100">
        <template #default="{ row }">{{ row.output_duration ? row.output_duration + 's' : '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="$router.push(`/projects/${row.id}`)">进入</el-button>
          <el-button text type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: center"
      :current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next"
      @current-change="(p: number) => { page = p; loadData() }" />

    <!-- 新建项目对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建项目" width="560px" @closed="resetCreateForm">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="项目标题">
          <el-input v-model="createForm.name" placeholder="输入项目标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="项目描述（可选）" />
        </el-form-item>
        <el-form-item label="目标时长">
          <el-input-number v-model="createForm.output_duration" :min="10" :max="300" :step="5" />
          <span style="margin-left: 8px; color: #909399">秒</span>
        </el-form-item>

        <!-- 参考案例选择 -->
        <el-form-item label="参考案例">
          <div class="ref-case-section">
            <div v-if="selectedCase" class="selected-case">
              <el-tag closable @close="selectedCase = null" type="success" size="large">
                {{ selectedCase.title }}
                <span v-if="selectedCase.theme" style="color: #909399; margin-left: 6px">
                  · {{ selectedCase.theme }}
                </span>
              </el-tag>
            </div>
            <div v-else>
              <el-button size="small" @click="handleRecommend" :loading="recommending"
                :disabled="!createForm.description">
                <el-icon><Promotion /></el-icon> 推荐案例
              </el-button>
              <span v-if="!createForm.description" style="color: #909399; font-size: 12px; margin-left: 8px">
                请先填写描述以获取推荐
              </span>
            </div>

            <!-- 推荐结果 -->
            <div v-if="recommendedCases.length > 0 && !selectedCase" class="case-list">
              <div v-for="c in recommendedCases" :key="c.id" class="case-card" @click="selectedCase = c">
                <div class="case-card-body">
                  <div class="case-title">{{ c.title }}</div>
                  <div class="case-meta">
                    <span v-if="c.theme">{{ c.theme }}</span>
                    <span v-if="c.platform">{{ c.platform }}</span>
                    <span v-if="c.like_rate">点赞率 {{ (c.like_rate * 100).toFixed(1) }}%</span>
                  </div>
                  <div v-if="c.viral_elements?.length" class="case-tags">
                    <el-tag v-for="v in c.viral_elements.slice(0, 3)" :key="v" size="small" type="info">{{ v }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProjects, createProject, deleteProject } from '../api/project'
import { recommendCases } from '../api/knowledge'

const router = useRouter()
const projects = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const showCreateDialog = ref(false)
const creating = ref(false)
const createForm = reactive({ name: '', description: '', output_duration: 60 })

// 参考案例相关
const recommendedCases = ref<any[]>([])
const selectedCase = ref<any>(null)
const recommending = ref(false)

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res: any = await getProjects({ page: page.value, page_size: pageSize })
    projects.value = res.items || res.data || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

async function handleRecommend() {
  if (!createForm.description) return
  recommending.value = true
  try {
    const res: any = await recommendCases({ description: createForm.description, limit: 5 })
    recommendedCases.value = res.cases || res.items || res.data || res || []
    if (recommendedCases.value.length === 0) {
      ElMessage.info('未找到匹配的案例')
    }
  } catch {
    ElMessage.error('推荐案例失败')
  } finally {
    recommending.value = false
  }
}

async function handleCreate() {
  if (!createForm.name) return ElMessage.warning('请输入项目标题')
  creating.value = true
  try {
    const data: any = { ...createForm }
    if (selectedCase.value) {
      data.reference_case_id = selectedCase.value.id
    }
    const res: any = await createProject(data)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    router.push(`/projects/${res.id}`)
  } finally {
    creating.value = false
  }
}

function resetCreateForm() {
  createForm.name = ''
  createForm.description = ''
  createForm.output_duration = 60
  selectedCase.value = null
  recommendedCases.value = []
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm('确定删除该项目？', '提示', { type: 'warning' })
  await deleteProject(id)
  ElMessage.success('已删除')
  loadData()
}

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

function statusType(s: string) {
  const map: Record<string, string> = { completed: 'success', failed: 'danger', processing: 'warning' }
  return map[s] || 'info'
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    draft: '草稿', script: '脚本阶段', storyboard: '分镜阶段',
    generating: '生成中', completed: '已完成', failed: '失败',
  }
  return map[s] || s || '草稿'
}
</script>

<style scoped lang="scss">
.ref-case-section {
  width: 100%;
}

.selected-case {
  display: flex;
  align-items: center;
}

.case-list {
  margin-top: 10px;
  max-height: 240px;
  overflow-y: auto;
}

.case-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.case-card-body {
  .case-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .case-meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;

    span + span::before {
      content: ' · ';
    }
  }

  .case-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
}
</style>
