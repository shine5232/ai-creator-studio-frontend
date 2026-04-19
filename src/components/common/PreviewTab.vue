<template>
  <div class="preview-tab">
    <el-empty v-if="!videoUrl" description="暂无预览视频，请先生成并合并视频" />

    <template v-else>
      <div class="video-wrapper">
        <video :src="videoUrl" controls class="video-player" />
      </div>

      <div class="video-actions">
        <el-button type="primary" @click="handleDownload">
          <el-icon><Download /></el-icon> 下载视频
        </el-button>
        <span class="video-meta" v-if="videoInfo">
          {{ videoInfo }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getProject } from '../../api/project'

const props = defineProps<{
  projectId: string
}>()

const project = ref<any>(null)

onMounted(async () => {
  project.value = await getProject(props.projectId)
})

const videoUrl = computed(() => {
  if (!project.value?.output_video_path) return ''
  if (project.value.output_video_path.startsWith('http')) return project.value.output_video_path
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  const normalized = project.value.output_video_path.replace(/\\/g, '/')
  const servedPath = normalized.replace(/^data\//, '/static/')
  return `${base.replace(/\/api\/v1$/, '')}${servedPath}`
})

const videoInfo = computed(() => {
  // 可扩展：显示分辨率、大小等信息
  return ''
})

function handleDownload() {
  if (!videoUrl.value) return
  const a = document.createElement('a')
  a.href = videoUrl.value
  a.download = `${project.value?.title || 'video'}.mp4`
  a.click()
}
</script>

<style scoped lang="scss">
.preview-tab {
  max-width: 900px;
  margin: 0 auto;
  padding-top: 20px;
}

.video-wrapper {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;

  .video-player {
    width: 100%;
    max-height: 70vh;
    display: block;
  }
}

.video-actions {
  display: flex;
  align-items: center;
  gap: 16px;

  .video-meta {
    color: #909399;
    font-size: 13px;
  }
}
</style>
