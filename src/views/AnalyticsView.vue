<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">¥{{ overview.monthly_cost || '0.00' }}</div>
            <div class="stat-label">本月成本</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">{{ overview.ai_calls || 0 }}</div>
            <div class="stat-label">AI 调用</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">{{ overview.videos_produced || 0 }}</div>
            <div class="stat-label">视频产出</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stats-card">
            <div class="stat-value">{{ overview.avg_time || '0' }}</div>
            <div class="stat-label">平均耗时</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" style="margin-top: 24px">
      <el-col :span="14">
        <el-card>
          <template #header>AI 成本趋势 (近30天)</template>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div v-for="(d, i) in costTrend" :key="i" class="bar-item">
                <div class="bar" :style="{ height: d.pct + '%' }"></div>
                <span class="bar-label">{{ d.label }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>AI 调用分布</template>
          <div class="distribution">
            <div v-for="item in distribution" :key="item.label" class="dist-item">
              <div class="dist-label">{{ item.label }}</div>
              <el-progress :percentage="item.pct" :stroke-width="18" :text-inside="true" :color="item.color" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 内容表现 -->
    <el-card style="margin-top: 24px">
      <template #header>内容表现</template>
      <el-table :data="performances" stripe>
        <el-table-column prop="title" label="项目标题" min-width="200" />
        <el-table-column label="视频时长" width="100">
          <template #default="{ row }">{{ row.duration || '—' }}</template>
        </el-table-column>
        <el-table-column label="生成成本" width="100">
          <template #default="{ row }">¥{{ row.cost || '0.00' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'completed' ? 'success' : 'info'">
              {{ row.status === 'completed' ? '已完成' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOverview, getGenerationCosts, getAIUsage, getContentPerformance } from '../api/analytics'

const overview = reactive({
  monthly_cost: '0.00',
  ai_calls: 0,
  videos_produced: 0,
  avg_time: '0分钟',
})

const costTrend = ref<{ label: string; pct: number }[]>([])
const distribution = ref<{ label: string; pct: number; color: string }[]>([])
const performances = ref<any[]>([])

onMounted(async () => {
  try {
    const [ov, costs, usage, perf]: any[] = await Promise.all([
      getOverview().catch(() => ({})),
      getGenerationCosts().catch(() => ([])),
      getAIUsage().catch(() => ([])),
      getContentPerformance().catch(() => ([])),
    ])

    Object.assign(overview, ov)

    // 成本趋势 - 简易柱状图
    const costData = Array.isArray(costs) ? costs : (costs.items || [])
    costTrend.value = costData.slice(-14).map((d: any) => ({
      label: d.date?.slice(5) || '',
      pct: Math.min((d.cost / ( Math.max(...costData.map((x: any) => x.cost || 0)) || 1)) * 100, 100),
    }))

    // AI 调用分布
    const usageData = Array.isArray(usage) ? usage : (usage.items || [])
    const totalCalls = usageData.reduce((s: number, d: any) => s + (d.count || 0), 0) || 1
    distribution.value = usageData.map((d: any) => ({
      label: d.service_type || d.type || '其他',
      pct: Math.round(((d.count || 0) / totalCalls) * 100),
      color: d.color || '#409eff',
    }))

    // 内容表现
    performances.value = Array.isArray(perf) ? perf : (perf.items || [])
  } catch { /* handled */ }
})
</script>

<style scoped lang="scss">
.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: flex-end;
  padding: 0 8px;

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    width: 100%;
    height: 100%;

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;

      .bar {
        width: 100%;
        max-width: 24px;
        background: linear-gradient(180deg, #00e5ff, #3b82f6);
        border-radius: 4px 4px 0 0;
        min-height: 2px;
      }

      .bar-label {
        font-size: 10px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}

.distribution {
  .dist-item {
    margin-bottom: 16px;

    .dist-label {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
    }
  }
}
</style>
