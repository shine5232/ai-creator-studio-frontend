# AI Creator Studio Frontend - 开发规范指引

## 项目概述

AI驱动的短视频创作平台前端，提供脚本编写、分镜设计、AI内容生成、视频预览和社交媒体发布等功能。

- **技术栈**: Vue 3 (Composition API) / TypeScript / Vite / Element Plus / Pinia / Axios
- **运行端口**: 3000（开发模式）
- **API代理**: Vite 将 `/api` 请求代理至 `http://localhost:8090`（后端服务）

---

## 项目结构

```
ai-creator-studio-frontend/
├── public/                       # 静态资源
├── src/
│   ├── main.ts                   # 应用入口（注册Pinia/Router/ElementPlus）
│   ├── App.vue                   # 根组件（仅 <router-view />）
│   ├── api/                      # API服务层（按领域分文件）
│   │   ├── request.ts            # Axios实例 + 拦截器
│   │   ├── auth.ts               # 认证相关API
│   │   ├── project.ts            # 项目管理API
│   │   ├── script.ts             # 脚本管理API
│   │   ├── storyboard.ts         # 分镜管理API
│   │   ├── character.ts          # 角色管理API
│   │   ├── generation.ts         # AI内容生成API
│   │   ├── knowledge.ts          # 知识库API
│   │   ├── analytics.ts          # 数据分析API
│   │   ├── cookie.ts             # Cookie管理API
│   │   └── userAiConfig.ts       # 用户AI配置API
│   ├── components/               # 可复用业务组件（按领域分目录）
│   │   ├── common/               # 通用组件（PreviewTab）
│   │   ├── script/               # 脚本相关（ScriptTab, MarkdownPreview）
│   │   ├── storyboard/           # 分镜相关（StoryboardTab）
│   │   └── generation/           # 生成相关（GenerateTab）
│   ├── layouts/                  # 布局组件
│   │   └── MainLayout.vue        # 主布局（顶部导航 + 内容区）
│   ├── router/                   # 路由配置
│   │   └── index.ts              # 路由表 + 导航守卫
│   ├── stores/                   # Pinia状态管理
│   │   └── auth.ts               # 认证Store
│   ├── styles/                   # 全局样式
│   │   └── global.scss           # 赛博朋克暗色主题 + Element Plus覆盖
│   └── views/                    # 页面级组件
│       ├── LoginView.vue         # 登录/注册页
│       ├── DashboardView.vue     # 仪表盘（统计概览）
│       ├── ProjectListView.vue   # 项目列表页
│       ├── ProjectWorkspace.vue  # 项目工作台（核心页面）
│       ├── KnowledgeView.vue     # 知识库/素材库
│       ├── AnalyticsView.vue     # 数据分析页
│       └── SettingsView.vue      # 设置页（AI服务商配置）
├── .env                          # 环境变量
├── vite.config.ts                # Vite构建配置
├── tsconfig.json                 # TypeScript配置
└── package.json                  # 依赖管理
```

---

## 架构分层

```
Vue组件(Views/Components)
  ↕ Pinia Store（状态管理）
  ↕ API服务层（src/api/）
  ↕ Axios拦截器（request.ts）
  ↕ 后端API（/api/v1）
```

### 各层职责

| 层 | 目录 | 职责 |
|---|---|---|
| **Views** | `src/views/` | 页面级组件，组合布局和业务组件 |
| **Components** | `src/components/` | 可复用业务组件，按领域分子目录 |
| **Layouts** | `src/layouts/` | 页面布局骨架（导航栏+内容区） |
| **Store** | `src/stores/` | Pinia状态管理，目前仅有auth store |
| **API** | `src/api/` | 按领域组织的API调用函数 |
| **Styles** | `src/styles/` | 全局主题样式 |

---

## 开发规范

### 新增页面

1. 在 `src/views/` 创建 `XxxView.vue` 页面组件
2. 在 `src/router/index.ts` 的 `MainLayout children` 中添加路由
3. 路由使用懒加载：`component: () => import('../views/XxxView.vue')`
4. 页面默认受 `requiresAuth: true` 保护，无需额外配置
5. 如需导航入口，在 `MainLayout.vue` 的 `el-menu` 中添加菜单项

### 新增API接口

1. 在 `src/api/` 下找到对应的领域文件（如 `project.ts`、`script.ts`）
2. 使用 `request.get/post/put/delete` 调用后端API
3. 路径前缀已通过 `baseURL` 配置为 `/api/v1`，只需写相对路径
4. 如需静默请求（不弹错误提示），在config中加 `_silent: true`

### 新增可复用组件

1. 在 `src/components/` 下按领域创建子目录（如 `character/`）
2. 使用 `<script setup lang="ts">` + Composition API
3. 通过 `defineProps` / `defineEmits` 与父组件通信
4. 样式使用 `<style scoped lang="scss">`

### 新增状态管理

1. 在 `src/stores/` 下创建新store文件
2. 使用 Composition API 风格：`defineStore('name', () => { ... })`
3. 在组件中通过 `const store = useXxxStore()` 使用

---

## 路由结构

| 路径 | 页面 | 说明 |
|---|---|---|
| `/login` | LoginView | 登录/注册（公开，无需认证） |
| `/dashboard` | DashboardView | 仪表盘，统计概览 |
| `/projects` | ProjectListView | 项目列表 |
| `/projects/:id` | ProjectWorkspace | 项目工作台（核心页面） |
| `/knowledge` | KnowledgeView | 知识库/素材库 |
| `/analytics` | AnalyticsView | 数据分析 |
| `/settings` | SettingsView | AI服务商配置 |

**路由守卫**: `router.beforeEach` 检查 `localStorage.token`，未认证重定向到 `/login`

---

## 核心工作台（ProjectWorkspace）

项目工作台是核心页面，通过Tab组织视频创作全流程：

```
ScriptTab → StoryboardTab → GenerateTab → PreviewTab
  脚本编辑      分镜设计        内容生成       预览发布
```

- Tab间有依赖关系：分镜需先有脚本，生成需先有分镜
- 各Tab组件位于 `src/components/` 对应子目录
- 父组件 ProjectWorkspace 管理项目数据，通过 props 传递给子Tab

---

## 认证机制

```
登录 → API返回token → 存入localStorage → Axios请求拦截器自动附加Bearer头
                                        → 路由守卫检查token存在性
                                        → 401响应自动清除token并跳转登录页
```

- **Token存储**: `localStorage.getItem('token')`
- **请求头**: `Authorization: Bearer ${token}`
- **Store**: `useAuthStore()` 管理 `token` 和 `user` 状态
- **401处理**: 响应拦截器自动清除token + 跳转 `/login` + 弹出提示

---

## API层规范

### Axios配置（`src/api/request.ts`）

- `baseURL`: 读取 `VITE_API_BASE_URL` 环境变量
- `timeout`: 30秒
- **请求拦截器**: 自动添加 Bearer token
- **响应拦截器**: 自动解包 `response.data`、全局错误提示、401自动登出

### API文件组织

每个文件对应后端一个API模块，函数命名遵循 `动词 + 资源名`：

```typescript
// src/api/project.ts
export function getProjects(params) { return request.get('/projects', { params }) }
export function createProject(data) { return request.post('/projects', data) }
export function getProject(id) { return request.get(`/projects/${id}`) }
```

---

## UI与样式规范

### UI框架

- **Element Plus** 全局注册，所有图标也全局注册
- 使用 Element Plus 的 Card、Table、Form、Dialog、Tabs 等组件
- 中文界面

### 主题系统

赛博朋克暗色主题，通过 CSS 自定义属性定义：

| 变量 | 值 | 用途 |
|---|---|---|
| `--cyber-bg` | `#080c14` | 页面背景 |
| `--cyber-bg-card` | `#0d1117` | 卡片背景 |
| `--cyber-bg-input` | `#0a0f18` | 输入框背景 |
| `--cyber-cyan` | `#00e5ff` | 主色（强调/链接/高亮） |
| `--cyber-magenta` | `#ff2d95` | 危险色 |
| `--cyber-green` | `#00ff88` | 成功色 |
| `--cyber-text` | `#e2e8f0` | 主文字色 |
| `--cyber-text-dim` | `#5a6a7e` | 次要文字色 |
| `--cyber-border` | `#1b2838` | 边框色 |

### 样式约定

- 全局样式在 `src/styles/global.scss` 中定义，包含 Element Plus 深度覆盖
- 组件使用 `<style scoped lang="scss">`
- 新增颜色必须使用 CSS 自定义属性，不要硬编码色值
- Element Plus 组件样式覆盖写在 `global.scss` 中，不要散落在各组件

---

## 环境配置

### 启动命令

```bash
npm run dev       # 启动开发服务器（端口3000，热更新）
npm run build     # TypeScript检查 + 生产构建（输出到 dist/）
npm run preview   # 预览生产构建
```

### 环境变量

```env
# .env
VITE_API_BASE_URL=http://localhost:8090/api/v1
```

### Vite代理配置

开发模式下 `/api` 请求自动代理到后端 `http://localhost:8090`，无需跨域处理。

---

## 组件规范

### Vue组件写法

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Props & Emits
const props = defineProps<{ projectId: number }>()
const emit = defineEmits<{ (e: 'update', data: any): void }>()

// 响应式状态
const loading = ref(false)
const list = ref([])

// 计算属性
const total = computed(() => list.value.length)

// 方法
async function fetchData() { ... }

// 生命周期
onMounted(() => fetchData())
</script>

<template>
  <div class="page-container">
    <!-- Element Plus 组件 -->
  </div>
</template>

<style scoped lang="scss">
// 组件局部样式
</style>
```

### 异步任务状态管理

- 使用 `loading` ref 控制加载状态
- 通过 `setInterval` 轮询异步任务进度（如AI生成，2秒间隔）
- 组件销毁时在 `onUnmounted` 中清理定时器

---

## 与后端对接

### API对应关系

| 前端API文件 | 后端路由前缀 | 功能域 |
|---|---|---|
| `auth.ts` | `/api/v1/auth` | 认证 |
| `project.ts` | `/api/v1/projects` | 项目管理 |
| `script.ts` | `/api/v1/scripts` | 脚本管理 |
| `storyboard.ts` | `/api/v1/storyboards` | 分镜管理 |
| `character.ts` | `/api/v1/characters` | 角色管理 |
| `generation.ts` | `/api/v1/generation` | AI内容生成 |
| `knowledge.ts` | `/api/v1/knowledge` | 知识库 |
| `analytics.ts` | `/api/v1/analytics` | 数据分析 |
| `userAiConfig.ts` | `/api/v1/user-ai-configs` | AI配置 |
| `cookie.ts` | `/api/v1/cookies` | Cookie管理 |

### 后端API响应格式

- 成功：直接返回数据对象（拦截器已解包 `response.data`）
- 错误：`{ detail: "错误信息" }`（拦截器自动弹出 ElMessage 提示）

---

## 关键依赖

| 依赖 | 版本 | 用途 |
|---|---|---|
| vue | ^3.5 | 核心框架 |
| vue-router | ^4.6 | 路由管理 |
| pinia | ^3.0 | 状态管理 |
| element-plus | ^2.13 | UI组件库 |
| axios | ^1.15 | HTTP客户端 |
| sass | ^1.99 | SCSS编译 |
| markdown-it | ^14.1 | Markdown渲染 |
| dompurify | ^3.4 | HTML消毒 |
| vite | ^8.0 | 构建工具 |
| typescript | ~6.0 | 类型检查 |
