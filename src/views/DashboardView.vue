<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">{{ stats.projects }}</div>
            <div class="stat-label">我的项目</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">{{ stats.videos }}</div>
            <div class="stat-label">已生成视频</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">{{ stats.aiCalls }}</div>
            <div class="stat-label">AI 调用量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">¥{{ stats.cost }}</div>
            <div class="stat-label">总成本</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近项目 -->
    <div class="page-header" style="margin-top: 24px">
      <h2>最近项目</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 新建项目
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="6" v-for="p in projects" :key="p.id">
        <el-card shadow="hover" class="project-card" @click="$router.push(`/projects/${p.id}`)">
          <div class="project-thumb">
            <el-icon :size="48" color="#c0c4cc"><VideoCamera /></el-icon>
          </div>
          <div class="project-info">
            <div class="project-title">{{ p.name }}</div>
            <div class="project-meta">{{ formatTime(p.created_at) }}</div>
            <el-tag :type="statusType(p.status)" size="small">{{ statusLabel(p.status) }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建项目对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建项目" width="500px">
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
import { ElMessage } from 'element-plus'
import { getProjects, createProject } from '../api/project'

const router = useRouter()
const projects = ref<any[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)

const stats = reactive({ projects: 0, videos: 0, aiCalls: 0, cost: '0.00' })
const createForm = reactive({ name: '', description: '', output_duration: 60 })

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getProjects({ page: 1, page_size: 8 })
    projects.value = res.items || res.data || []
    stats.projects = res.total || projects.value.length
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!createForm.name) return ElMessage.warning('请输入项目标题')
  creating.value = true
  try {
    const res: any = await createProject(createForm)
    ElMessage.success('项目创建成功')
    showCreateDialog.value = false
    router.push(`/projects/${res.id}`)
  } finally {
    creating.value = false
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleDateString('zh-CN')
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
.stats-row {
  .el-card {
    text-align: center;
  }
}

.project-card {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  .project-thumb {
    height: 120px;
    background: var(--cyber-bg-input);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .project-info {
    .project-title {
      font-weight: 600;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-meta {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }
  }
}
</style>
