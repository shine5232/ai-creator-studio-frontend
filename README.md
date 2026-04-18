# AI Creator Studio Web

AI 短视频创作平台 - 前端，基于 Vue 3 + Element Plus + TypeScript。

## 技术栈

- **Vue 3** — Composition API + `<script setup>`
- **Element Plus** — UI 组件库
- **TypeScript** — 类型安全
- **Pinia** — 状态管理
- **Vue Router** — 路由
- **Vite** — 构建工具
- **Axios** — HTTP 请求

## 环境要求

- Node.js 18+
- npm 或 yarn

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env`：

```env
VITE_API_BASE_URL=http://localhost:8090/api/v1
```

### 3. 启动开发服务器（端口 3000）

```bash
npm run dev
```

访问 `http://localhost:3000`

### 4. 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录。

## 前置条件

前端依赖后端 API，启动前请确保后端服务已运行：

1. **Redis** — `redis-server`
2. **后端 API** — `cd openclaw-server && python run.py`（端口 8090）
3. **Celery Worker** — `cd openclaw-server && python worker.py`

详见后端项目 [openclaw-server/README.md](../openclaw-server/README.md)。

## 项目结构

```
openclaw-web/
├── src/
│   ├── api/              # API 请求层（axios 封装 + 各模块接口）
│   ├── components/       # 公共组件（ScriptTab, StoryboardTab, GenerateTab 等）
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── styles/           # 全局样式（赛博朋克暗色主题）
│   ├── views/            # 页面视图
│   ├── App.vue
│   └── main.ts
├── vite.config.ts        # Vite 配置（含 API 代理）
├── .env
└── package.json
```

## 功能模块

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录/注册 | `/login` | 用户认证 |
| 仪表盘 | `/dashboard` | 项目概览与统计 |
| 项目列表 | `/projects` | 项目管理 |
| 项目工作区 | `/projects/:id` | 脚本编辑、分镜、生成、预览 |
| 知识库 | `/knowledge` | 爆款视频分析与案例管理 |
| 数据分析 | `/analytics` | 视频数据分析 |
| 系统设置 | `/settings` | AI 服务配置、社交账号、个人信息 |
