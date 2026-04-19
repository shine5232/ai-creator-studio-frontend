<template>
  <div class="markdown-preview">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="error" class="error-container">
      <el-icon :size="24"><CircleClose /></el-icon>
      <span>{{ error }}</span>
      <el-button size="small" @click="loadMarkdown">重试</el-button>
    </div>
    <div v-else-if="markdown" class="markdown-content" v-html="renderedMarkdown"></div>
    <div v-else class="empty-container">
      <el-icon :size="24"><Document /></el-icon>
      <span>{{ scriptId ? '暂无 Markdown 脚本，请先生成脚本' : '暂无分析报告，请先完成视频分析' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Loading, CircleClose, Document } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const props = defineProps<{
  scriptId?: string | null
  caseId?: string | number | null
}>()

const loading = ref(false)
const markdown = ref('')
const error = ref('')

// 配置 markdown-it
const md = new MarkdownIt({
  html: false,        // 禁用 HTML 标签
  linkify: true,      // 自动转换 URL
  typographer: true,  // 启用一些语言中性的替换
  breaks: true,       // 转换换行符
})

// 渲染后的 Markdown（经过 XSS 过滤）
const renderedMarkdown = computed(() => {
  if (!markdown.value) return ''
  const html = md.render(markdown.value)
  return DOMPurify.sanitize(html)
})

watch(() => props.scriptId || props.caseId, () => {
  loadMarkdown()
}, { immediate: true })

async function loadMarkdown() {
  loading.value = true
  error.value = ''
  try {
    if (props.scriptId) {
      console.log('[MarkdownPreview] Loading script markdown, scriptId:', props.scriptId)
      const { getScriptMarkdown } = await import('../../api/script')
      markdown.value = await getScriptMarkdown(props.scriptId)
    } else if (props.caseId) {
      console.log('[MarkdownPreview] Loading case markdown, caseId:', props.caseId, 'type:', typeof props.caseId)
      const { getCaseMarkdown } = await import('../../api/knowledge')
      markdown.value = await getCaseMarkdown(props.caseId)
      console.log('[MarkdownPreview] Markdown loaded, length:', markdown.value.length)
    } else {
      markdown.value = ''
    }
  } catch (e: any) {
    console.error('[MarkdownPreview] Failed to load markdown:', e)
    console.error('[MarkdownPreview] Response status:', e.response?.status)
    console.error('[MarkdownPreview] Response data:', e.response?.data)
    error.value = e.response?.data?.detail || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

defineExpose({
  loadMarkdown,
})
</script>

<style scoped lang="scss">
.markdown-preview {
  min-height: 200px;

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 200px;
    color: var(--el-text-color-secondary);
    padding: 40px 20px;
  }

  .error-container {
    color: var(--el-color-danger);
  }
}

.markdown-content {
  padding: 0;
  line-height: 1.7;
  color: var(--el-text-color-primary);

  // 标题样式
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    color: var(--el-text-color-primary);
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 28px;
    border-bottom: 2px solid var(--el-border-color);
    padding-bottom: 8px;
  }

  :deep(h2) {
    font-size: 24px;
    border-bottom: 1px solid var(--el-border-color);
    padding-bottom: 6px;
  }

  :deep(h3) {
    font-size: 20px;
  }

  :deep(h4) {
    font-size: 18px;
  }

  // 段落样式
  :deep(p) {
    margin: 12px 0;
    line-height: 1.8;
  }

  // 列表样式
  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 12px 0;

    li {
      margin: 4px 0;
    }
  }

  // 表格样式
  :deep(table) {
    border-collapse: collapse;
    margin: 16px 0;
    width: 100%;
    overflow-x: auto;

    th, td {
      border: 1px solid var(--el-border-color-lighter);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: var(--el-fill-color-light);
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: var(--el-fill-color-lighter);
    }
  }

  // 代码块样式
  :deep(pre) {
    background: #1e1e1e;
    border-radius: 6px;
    padding: 14px;
    overflow-x: auto;
    margin: 12px 0;

    code {
      background: transparent;
      padding: 0;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
    }
  }

  :deep(code:not(pre code)) {
    background: var(--el-fill-color-light);
    padding: 3px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    color: #e83e8c;
  }

  // 引用样式
  :deep(blockquote) {
    border-left: 4px solid var(--el-color-primary);
    padding-left: 16px;
    margin: 12px 0;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-lighter);
    padding: 12px 16px;
    border-radius: 0 4px 4px 0;
  }

  // 分隔线
  :deep(hr) {
    border: none;
    border-top: 2px solid var(--el-border-color);
    margin: 24px 0;
  }

  // 链接样式
  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // 图片样式
  :deep(img) {
    max-width: 100%;
    border-radius: 4px;
    height: auto;
  }

  // 强调
  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }
}
</style>
