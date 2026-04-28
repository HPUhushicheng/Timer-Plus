# Timer-Plus（拾光）软件分析报告

> 供二次开发参考的全面分析，涵盖架构、功能、UI、Bug、安全漏洞

---

## 一、项目概览

| 项目 | 详情 |
|------|------|
| 名称 | 拾光 (Timer-Plus) |
| 用途 | 高校实验室考勤管理系统：在线时长统计、座次管理、AI 教务问答、团队协作 |
| 技术栈 | Vue 3 + Vite + Element-Plus + Pinia / Electron 21 (ee-core) / Express + MySQL |
| 当前版本 | v2.1.0 (package.json: v2.0.5) |

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│  Electron 壳 (ee-core v2.11.0)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Vue 3 SPA (Vite 打包)                            │  │
│  │  ┌──────┐ ┌───────┐ ┌─────────┐ ┌────────────┐   │  │
│  │  │Login │ │ZhuYe  │ │TodayTime│ │SiteChart   │   │  │
│  │  │      │ │(主页) │ │(今日)   │ │(座次表)    │   │  │
│  │  ├──────┤ ├───────┤ ├─────────┤ ├────────────┤   │  │
│  │  │Regist│ │WeekTim│ │DongTai  │ │Chat (AI)   │   │  │
│  │  │(注册)│ │(周统计)│ │(动态)   │ │(AI问答)    │   │  │
│  │  └──────┘ └───────┘ └─────────┘ └────────────┘   │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │ HTTP (47.120.68.44:666)             │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────┐
│  Express API Server  │ (server/app.js :666)              │
│  ┌───────────────────┴───────────────────────────────┐  │
│  │  /list/*   (用户 CRUD)   /api/time/* (时长 CRUD)  │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │ MySQL                         │
│                   ┌──────┴──────┐                       │
│                   │  MySQL DB    │  (111.170.163.14)       │
│                   │  database:   │                       │
│                   │  test        │                       │
│                   └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

---

## 二、目录结构

```
Timer-Plus/
├── main.js                     # Electron 入口 (ee-core)
├── package.json                # 根依赖 (Electron, ee-core)
├── remote-config.template.json # 远程配置模板
├── electron/                   # Electron 主进程
│   ├── index.js                # 生命周期钩子
│   ├── config/                 # 配置层 (default → local/prod)
│   ├── preload/bridge.js       # 预加载桥 (contextBridge)
│   ├── addon/                  # 插件: tray, security, autoUpdater, awaken
│   ├── controller/example.js   # IPC 控制器示例
│   ├── service/example.js      # 业务逻辑示例
│   └── jobs/example/           # 后台任务示例
├── frontend/                   # Vue 3 SPA
│   ├── .env.development        # 开发环境变量
│   ├── .env.production         # 生产环境变量
│   ├── vite.config.js
│   └── src/
│       ├── main.js             # 应用启动 + 远程配置拉取
│       ├── App.vue             # 根组件
│       ├── config/             # 配置模块
│       │   ├── index.js        # getApiBaseUrl() / getStaticBaseUrl()
│       │   └── remote.js       # 远程配置拉取+缓存
│       ├── router/             # 路由定义
│       ├── store/index.js      # Vuex (AI 聊天状态)
│       ├── stores/             # Pinia
│       │   ├── useOnlineDurationStore.js  # 在线计时
│       │   └── useUserStore.js            # 用户状态
│       ├── components/         # 业务组件 (12+)
│       ├── views/              # 视图 (ChatView, Memories, Snapshots)
│       ├── assets/global.less  # 全局样式
│       └── api/main.js         # IPC 通道
├── server/                     # Express API
│   ├── app.js                  # Express 入口 (port 666)
│   ├── router.js               # 路由映射
│   ├── db/
│   │   ├── index.js            # MySQL 连接池 + 远程配置
│   │   ├── remote-config.js    # 远程配置拉取
│   │   └── config.json         # 本地配置 (gitignored)
│   └── API/
│       ├── list.js             # 用户 CRUD
│       └── time.js             # 时长 CRUD
└── public/dist/                # 前端构建产物
```

---

## 三、功能清单

### 3.1 已实现功能

| 功能 | 对应路由 | 文件 | 状态 |
|------|----------|------|------|
| 登录 | `/` | Login.vue | 可用（有严重安全问题） |
| 注册 | `/register` | Register.vue | 可用（有严重安全问题） |
| 主页面板 | `/zy` | ZhuYe.vue | 可用 |
| 今日在线时长图表 | `/todaytime` | TodayTime.vue | 可用（数据逻辑有 bug） |
| 周在线时长排行 | `/weektime` | WeekTime.vue | 可用 |
| 座次表 | `/sitechart` | SiteChart.vue | 可用（在线状态不可用） |
| 更新日志 | `/dongtai` | DongTai.vue | 静态页面 |
| QQ群 | `/qq` | qq.vue | 静态页面 |
| 网址导航 | `/site` | site.vue | 部分功能不可用 |
| AI 教务问答 | `/chat` | Chat.vue | 可用（API Key 暴露） |
| 在线计时器 | (store) | useOnlineDurationStore.js | 有逻辑 bug |
| 系统托盘 | (addon) | electron/addon/tray | 已启用 |
| 自动更新 | (addon) | electron/addon/autoUpdater | 配置未完成 |

### 3.2 死代码（存在但未使用）

这些文件存在于源码中但**永远不会被执行**，可以在二次开发时删除或重新启用：

| 文件 | 原因 |
|------|------|
| `routerMap.js` | 定义但从未被 `router/index.js` 引入 |
| `ZhuYe-new-test.vue` | 旧版主页，路由器中未引用 |
| `AsyncComponent.vue` | 演示代码 |
| `CustomEvent.vue` | 演示代码 |
| `Doc.vue` | 未完成的编辑器 |
| `HelloWorld.vue` | 脚手架模板 |
| `MessageRow.vue` | 聊天行组件，未被使用 |
| `MyButton.vue` | 通用按钮，未被使用 |
| `TextLoading.vue` | 加载动画，未被使用 |
| `Theme.vue` | 主题切换（引用 `dist/` 路径，构建后不可用） |
| `views/ChatView.vue` | 替代聊天界面（引用了不存在的组件，构建会报错） |
| `views/Memories.vue` | 记忆管理页 |
| `views/MemoryView.vue` | 记忆+快照查看器 |
| `views/Snapshots.vue` | 快照查看器 |
| `views/example/hello/` | 示例页面 |
| `electron/controller/example.js` | 示例控制器 |
| `electron/service/example.js` | 示例服务 |
| `electron/jobs/example/` | 示例后台任务 |

### 3.3 功能缺失

| 缺失功能 | 说明 |
|----------|------|
| 路由鉴权守卫 | 任何路由可直接访问，无需登录 |
| 在线状态实时更新 | SiteChart 中 `isOnline` 始终为 `false` |
| 网站导航搜索/筛选 | site.vue 中搜索和分类逻辑全部不可用 |
| `/theme` 路由 | ZhuYe.vue 调用了 `router.push('/theme')` 但路由未定义 |

---

## 四、UI 问题

| 问题 | 位置 | 严重度 |
|------|------|--------|
| **全局布局限制**：`#app` 设置了 `max-width: 1280px; text-align: center`，影响全屏组件 | `global.less` | 中 |
| **固定高度**：`.layout-container` 和 `.sidebar` 固定 800px，大屏不填充、小屏溢出 | `ZhuYe.vue` | 中 |
| **blur 值异常**：`backdrop-filter: blur(500px)`，超过 20px 无意义，可能影响性能 | `Login.vue` | 低 |
| **菜单索引重复**：两个菜单项都用了 `index="3"` | `ZhuYe-new-test.vue` | 低 |
| **退出按钮定位脆弱**：`position: absolute; bottom: 210px`，菜单项增减后会错位 | `ZhuYe.vue` | 低 |
| **内容区 class 名误导**：`content-expanded` 对应的是侧边栏展开状态 | `ZhuYe.vue` | 低 |
| **刷新按钮无图标**：返回主页和清除按钮都用了 `Document` 图标 | `Chat.vue` | 低 |
| **QQ头像无兜底**：QQ号为空时头像显示裂图 | `SiteChart.vue` | 低 |
| **更新日志内容重复**：v2.1.0 的"新增功能"和"问题修复"含相同条目 | `DongTai.vue` | 低 |

---

## 五、Bug 清单

### 5.1 逻辑 Bug（影响功能正确性）

| Bug | 位置 | 影响 |
|-----|------|------|
| **在线时长数据错误**：`sendTimer` 每 60 秒发送的是累计时长而非增量时长。第 2 分钟发送 120，第 3 分钟又发送 180，导致同一时段被重复记录且数值不断膨胀 | `useOnlineDurationStore.js` | 严重 |
| **GROUP BY 无聚合函数**：`select daytime, hourtime from time group by daytime`，在 `ONLY_FULL_GROUP_BY` 模式下直接报错，宽松模式下返回随机 row | `server/API/time.js:5` | 严重 |
| **远程配置的数据库连接池从未更新**：`index.js` 中 `module.exports = db` 导出的是初始连接池，异步替换的 `db` 只修改了局部变量，所有 `require` 该模块的文件用的仍是旧连接池 | `server/db/index.js:44-58` | 严重 |
| **SQL 拼写错误**：`qq = ?where id = ?`（缺少空格） | `server/API/list.js:83` | 中 |
| **ZhuYe.vue 跳转 `/theme` 会 404**：路由未定义 `/theme` | `ZhuYe.vue` | 中 |
| **Chat.vue 文档刷新按钮点击事件泄漏**：`onMounted` 中 `document.addEventListener('click')` 未在 `onUnmounted` 中移除，每次进入页面增加一个监听器 | `Chat.vue` | 中 |

### 5.2 内存泄漏

| 泄漏源 | 位置 | 说明 |
|--------|------|------|
| 计时器永不停止 | `useOnlineDurationStore.js` | `setInterval` 在组件卸载后继续运行 |
| ECharts 实例未销毁 | `TodayTime.vue`, `WeekTime.vue` | chart 对象和 resize 事件监听未清理 |
| SSE 定时器永不释放 | `server/app.js:25` | `setInterval` 在客户端断开后继续运行，每次连接 +1 个定时器 |
| Chat 事件监听累积 | `Chat.vue` | `document.addEventListener` 未清理 |
| localStorage 日志无限增长 | `useOnlineDurationStore.js` | logs 上限未设置，可能撑满 storage |

### 5.3 UI/交互 Bug

- SiteChart 在线状态始终为 `false`（硬编码，非动态）
- site.vue 中 `filteredWebsites` 引用了不存在的 `websites` 变量和 `site.description`/`site.tags`
- site.vue CSDN 链接指向的是 `https://appcenter.ms/`（微软应用中心），不是 CSDN
- Login.vue 预填了硬编码的测试账号密码
- `localStorage` key 不一致：Login.vue 用 `'studentId'`（大写 I），其他用 `'studentid'`

---

## 六、安全漏洞

### 6.1 严重（Critical）

#### 6.1.1 Electron: nodeIntegration + contextIsolation 全关
**文件**: `electron/config/config.default.js:31-33`
```js
contextIsolation: false,
nodeIntegration: true,
```
**后果**: 任何 XSS 漏洞直接升级为**远程代码执行（RCE）**——攻击者可通过 `require('child_process')` 在用户电脑上执行任意命令。

**修复**: 将 `contextIsolation` 设为 `true`，`nodeIntegration` 设为 `false`，用已有的 `bridge.js` 通过 `contextBridge` 暴露有限 API。

#### 6.1.2 客户端侧认证（无服务端鉴权）
**文件**: `Login.vue:73-84`
```
fetch('/list/all')  →  获取所有用户的密码  →  客户端比对
```
**后果**:
- 任何用户可以看到所有其他用户的密码（打开 Network 面板即可）
- 没有 session/token，伪造请求即可冒充任意用户
- 完全无服务端鉴权

**修复**: 实现服务端 JWT/session 认证，密码 compare 在服务端做，登录后签发 token。

#### 6.1.3 硬编码 AI API Key
**文件**: `Chat.vue:181`
```
'Authorization': 'Bearer 22606a69f086091bf77ab7fce62b138f.tavKWRae98u42Qys'
```
**后果**: 智谱 AI (GLM-4 Flash) 的**生产 API Key** 暴露在客户端打包产物中。任何人可通过源码或 Network 面板窃取，以你的名义调用 API 并产生费用。

**修复**: 将 API Key 移至服务端，前端通过自己的后端代理调用 AI API。

#### 6.1.4 明文密码存储与传输
- 数据库存明文密码（没有任何哈希）
- 注册时密码通过 GET 请求的 URL 参数传输（浏览器历史、服务器日志、Referrer 头全部可见）
- API 响应中返回密码明文

**修复**: 使用 bcrypt/argon2 哈希存储密码；注册/登录改为 POST + body 传输。

#### 6.1.5 CSRF 漏洞（GET 方法执行写操作）
| 危险操作 | 路由 |
|----------|------|
| 删除用户 | `GET /list/del?id=xxx` |
| 删除时间记录 | `GET /api/time/del?id=xxx` |
| 添加时间记录 | `GET /api/time/add?params` |

**后果**: 攻击者只需诱导用户访问一个包含 `<img src="http://服务器:666/list/del?id=5">` 的页面即可删除数据。

### 6.2 高危（High）

| 问题 | 位置 | 说明 |
|------|------|------|
| Electron 21 已 EOL | `package.json` | 2022年发布，2023年停更，含多个已知 CVE（RCE、沙箱逃逸） |
| XSS via error messages | `list.js`, `time.js` | `err.message` 直接拼接到响应字符串，MySQL 错误信息可能含用户输入 |
| 无输入验证 | 全部 API | 无长度限制、格式校验、类型检查。`update` 接口传不存在的字段会导致 SQL 异常 |
| 远程配置无完整性校验 | `remote-config.js` | 无签名/哈希验证、无证书 pinning、无响应体大小限制 |
| 敏感数据全量返回 | `GET /list/all` | 一次性返回所有用户的姓名、学号、QQ、电话、密码 |

### 6.3 中危（Medium）

| 问题 | 位置 |
|------|------|
| 全 HTTP 无 HTTPS | `server/app.js` |
| 生产数据库使用 root 账号 + 弱密码 | `server/db/config.json` |
| `mysql` npm 包已废弃（迁移到 `mysql2`） | `server/package.json` |
| Chat.vue 使用 `v-html` 渲染 AI 回复（潜在 XSS） | `Chat.vue:13` |
| 端口 666 硬编码，数据库名 `test` 是测试命名 | `server/app.js`, `server/db/` |

### 6.4 低危（Low）

- 无请求频率限制（Rate Limiting）
- 无 CORS 严格配置（`cors` 中间件允许全部来源）
- Vite 4 和 ESLint 5 存在已知漏洞（dev 依赖）

---

## 七、代码质量问题

### 7.1 架构问题

| 问题 | 说明 |
|------|------|
| **两套路由定义** | `router/index.js` 和 `routerMap.js` 各自定义了路由，后者未被使用 |
| **两套状态管理** | 同时使用 Vuex (`store/index.js`) 和 Pinia (`stores/`) |
| **两个主页** | `ZhuYe.vue` 在用，`ZhuYe-new-test.vue` 未使用但保留 |
| **学生 ID 存储不一致** | 有的用 `localStorage` key `'studentId'`，有的用 `'studentid'` |
| **注册函数重复** | `list.js` 中 `add` 和 `zhuce` 功能几乎相同，后者还是孤儿函数（未路由） |

### 7.2 API 设计问题

| 问题 | 说明 |
|------|------|
| **HTTP 方法语义混乱** | 增删改用 GET query params，更新又是 POST body，没有一致性 |
| **响应格式不统一** | 有的返回 JSON `{status, data}`，有的返回裸数组，错误返回纯文本字符串 |
| **无分页** | `getall` 接口全量返回，数据量大时可能 OOM |
| **孤儿函数** | `list.js` 的 `exports.zhuce` 从未被路由注册 |
| **`id` 和 `studentid` 冗余** | `list.js:add` 把 `studentid` 同时插入 `id` 和 `studentid` 列，一列完全多余 |

### 7.3 前端反模式

| 问题 | 位置 | 说明 |
|------|------|------|
| **直接 DOM 操作** | `SiteChart.vue:88-102` | `document.querySelectorAll` 操作样式，应该在模板中用 `:style` / `:class` 绑定 |
| **全局事件未清理** | `Chat.vue` + `WeekTime.vue` | `addEventListener` 无对应的 `removeEventListener` |
| **空函数** | `site.vue:107` | `handleSearch()` 空实现 |
| **废弃 API** | `global/index.js` | `import.meta.globEager` 在新版 Vite 中已废弃 |
| **固定尺寸** | 多处 | `width:800px`, `height:800px` 非响应式 |

---

## 八、依赖版本与已知漏洞

### 8.1 关键依赖状态

| 依赖 | 当前版本 | 最新版本 | 风险 |
|------|---------|---------|------|
| **Electron** | 21.4.4 | 33+ | **EOL，有 RCE/Sandbox escape CVE** |
| **ee-core** | 2.11.0 | - | 框架绑定 Electron 21，升级需框架支持 |
| **Vite** | 4.4.4 | 6.x | 4.x 有已知漏洞 |
| **Vue** | 3.2.33 | 3.5.x | 版本较老但风险可控 |
| **ESLint** | 5.13.0 | 9.x | 极老，仅 dev 依赖 |
| **mysql** | 2.18.1 | (迁移到 mysql2) | **已废弃，无安全更新** |
| **electron-builder** | 23.6.0 | 25.x | 较老 |

### 8.2 冗余依赖

- `body-parser`（Express 4.16+ 已内置，无需单独安装）
- `vuex`（项目已迁移 Pinia，Vuex 仅 AI 聊天部分在用）

---

## 九、二次开发建议优先级

### 紧急（安全先修）

1. **修复 Electron 安全配置** — `contextIsolation: true` + `nodeIntegration: false`
2. **实现服务端认证** — JWT + bcrypt 密码哈希
3. **将 AI API Key 移至服务端** — 通过后端代理调用
4. **所有变更操作改为 POST/PUT/DELETE** — 消除 CSRF
5. **升级 Electron** — 至少到 31+ LTS

### 优先（功能修复）

1. 修复在线时长增量逻辑（`useOnlineDurationStore.js`）
2. 修复远程配置连接池替换无效的问题（`server/db/index.js`）
3. 为所有路由添加鉴权守卫（router.beforeEach）
4. 修复 `GET /api/time/get` 的 GROUP BY 问题
5. 清理所有死代码文件

### 建议（质量提升）

1. 统一路由定义（删除 `routerMap.js`）
2. 清理未使用的组件和 views
3. 统一 localStorage key 命名
4. 实现分页（`getall` 接口）
5. 统一 API 响应格式
6. 修复所有内存泄漏点
7. 将 `mysql` 替换为 `mysql2`
8. 升级依赖（Vite, Vue, Element-Plus）
9. 实现实时在线状态监控
10. 修复 site.vue 搜索/筛选功能
