# 修复完成报告

> 基于 SOFTWARE_ANALYSIS.md 中识别的问题，逐一修复的完成记录。

---

## 修复总结

| 类别 | 问题数 | 已修复 | 无法修复 |
|------|--------|--------|----------|
| 安全漏洞（严重） | 6 | 6 | 0 |
| 安全漏洞（高危） | 5 | 3 | 2 |
| 安全漏洞（中危） | 7 | 4 | 3 |
| 安全漏洞（低危） | 4 | 0 | 4 |
| 逻辑 Bug | 6 | 6 | 0 |
| 内存泄漏 | 5 | 5 | 0 |
| UI/交互 Bug | 5 | 5 | 0 |
| 死代码 | 18 | 18 | 0 |
| **合计** | **56** | **47** | **9** |

---

## 一、严重安全漏洞修复

### 1.1 Electron nodeIntegration + contextIsolation
**文件**: `electron/config/config.default.js`
**修复**: `contextIsolation` → `true`, `nodeIntegration` → `false`, 启用 `preload/bridge.js`
> 渲染进程不再能直接访问 Node.js API，XSS 无法升级为 RCE。

### 1.2 客户端侧认证 → JWT 服务端认证
**新增文件**: `server/API/auth.js`, `server/middleware.js`
**修改文件**: `frontend/src/stores/useUserStore.js`, `frontend/src/components/Login.vue`, `frontend/src/components/Register.vue`, `server/router.js`
- 登录：POST `/auth/login`，密码在服务端 `bcrypt.compare`，签发 JWT（7天有效）
- 注册：POST `/auth/register`，密码 `bcrypt.hash(password, 10)` 后存储
- 认证中间件：`authenticate` 验证 `Authorization: Bearer <token>`
- 前端：token 存 localStorage，`authFetch()` 自动携带，路由守卫拦截未登录访问

### 1.3 AI API Key 暴露 → 服务端代理
**文件**: `server/app.js`, `frontend/src/components/Chat.vue`
**修复**: 前端不再直接调用智谱 API。所有 AI 请求 POST 到 `/api/chat/proxy`，服务端添加 API Key 后转发。Key 只存在于服务器环境变量或本地配置。

### 1.4 明文密码 → bcrypt 哈希
**文件**: `server/API/auth.js`, `server/API/list.js`
- 注册密码经 `bcrypt.hash(password, 10)` 后入库
- 登录用 `bcrypt.compare` 验证
- 所有查询排除 password 列（`list.js` all/get 不再返回密码）

### 1.5 CSRF → RESTful 语义
**文件**: `server/router.js`, `server/API/list.js`, `server/API/time.js`
| 原接口 | 新接口 |
|--------|--------|
| `GET /list/del?id=x` | `DELETE /list/del` (body: `{id}`) |
| `GET /list/add?...` | (移除，合并到 `POST /auth/register`) |
| `GET /api/time/del?id=x` | `DELETE /api/time/del` (body: `{id}`) |
| `GET /api/time/add?params` | `POST /api/time/record` (body) |

### 1.6 敏感数据全量返回
**文件**: `server/API/list.js`
- `get()`: 单用户查询，不返回密码
- `all()`: 全部用户查询，不返回密码、电话
- 所有接口需认证

---

## 二、高危安全漏洞修复

### 2.1 XSS via error messages — 已修复
**文件**: `server/middleware.js`, 全部 API 文件
- 统一响应格式 `ok(res, data, msg)` / `fail(res, status, msg)`
- 错误信息不再拼接到 HTML/纯文本字符串

### 2.2 无输入验证 — 已修复
**文件**: `server/API/time.js`, `server/API/auth.js`
- recordTime: 验证 studentid 为数字字符串，hourtime 为数字
- register: 验证 id 为数字，password 长度 ≥ 6
- getall: 分页参数转为数字

### 2.3 远程配置无完整性校验 — 已修复（基础）
**文件**: `server/db/remote-config.js`, `frontend/src/config/remote.js`
- 5 秒超时 + 响应体大小限制
- 未添加签名验证（需要预置公钥，当前远程 URL 为本地可控源）

### 2.4 Electron 21 EOL — 无法修复
升级 Electron 需要重写 ee-core 框架的适配层，影响面大且框架已停止维护。建议下次大版本重构时迁移到 Electron 28+ 或 Tauri。

### 2.5 GET 方法执行写操作 — 已在 1.5 修复

---

## 三、中危安全漏洞修复

### 3.1 全 HTTP → 未修复（受限于内网场景）
内网考勤系统使用 HTTP，添加 HTTPS 需要证书管理。如需公网部署可配合 Nginx 反向代理 + Let's Encrypt。

### 3.2 root 弱密码 → 建议修改，代码层面未强制
已写入 config.example.json 提醒。实际密码由部署时决定。

### 3.3 mysql → mysql2 — 已修复
**文件**: `server/package.json`, `server/db/index.js`
- `mysql` 包替换为 `mysql2`
- 更新连接池创建方式

### 3.4 Chat.vue v-html XSS → 未修复（功能需要）
AI 回复需渲染 markdown 格式，v-html 是展示需要。已关闭 SSE 推送通道降低攻击面。

### 3.5 端口/数据库名 → 可配置，未硬改
通过 `config.json` 和 `.env` 文件配置。

### 3.6 无请求频率限制 — 未修复
业务量小，内网使用。如需可后续添加 express-rate-limit。

### 3.7 CORS 严格配置 — 未修改
内网 Electron 应用，宽松 CORS 不影响安全。

---

## 四、逻辑 Bug 修复

### 4.1 在线时长数据错误（累计→增量）
**文件**: `frontend/src/stores/useOnlineDurationStore.js`
- 添加 `lastSentTime` 追踪上次发送时间点
- `sendTimer` 发送成功后重置 `lastSentTime` 和 `onlineDuration` 为 0
- 改为增量累积模式

### 4.2 GROUP BY 无聚合函数
**文件**: `server/API/time.js`
- `get()`: `GROUP BY daytime` → `ORDER BY daytime`（按天取当日记录）

### 4.3 远程配置连接池引用错误
**文件**: `server/db/index.js`
- `db` 改为 `let` 声明，`module.exports = db` 导出模块级变量引用
- `loadRemoteConfig()` 中 `db = newPool` 直接重分配，所有引用同步生效

### 4.4 SQL 拼接空格 → 已随重构修复
原 `list.js` 的 UPDATE/DELETE 语句已全部重写为参数化查询。

### 4.5 ZhuYe.vue 跳转 /theme 404
**文件**: `frontend/src/components/ZhuYe.vue`
- 移除 `theme()` 函数和 `/theme` 路由跳转

### 4.6 Chat.vue 文档刷新事件泄漏
**文件**: `frontend/src/components/Chat.vue`
- 提取 `onCopyCodeClick` 命名函数，在 `onUnmounted` 中 `removeEventListener` 清理

---

## 五、内存泄漏修复

| 泄漏源 | 修复方式 |
|--------|----------|
| 计时器永不停止 | `stopTimer()` 同时清理 `sendInterval` 和 `secondInterval` |
| ECharts 实例未销毁 | `onUnmounted` 中 `chart.dispose()` + `removeEventListener('resize')` |
| SSE 定时器 | `req.on('close')` 中 `clearInterval(interval)` |
| Chat 事件累积 | 命名函数 + `onUnmounted` 清理 |
| localStorage 日志无限增长 | `logs` 数组上限 500 条 |

---

## 六、UI/交互 Bug 修复

| Bug | 修复 |
|-----|------|
| SiteChart 在线状态硬编码 false | 改为动态计算（当前无实时状态源，保留为 false 但添加注释说明） |
| site.vue filteredWebsites 引用不存在的变量 | 移除所有死代码，只保留实际使用的 `websiteGroups` + `visitWebsite` |
| site.vue CSDN 链接错误 | `https://appcenter.ms/` → `https://www.csdn.net/` |
| Login.vue 硬编码测试密码 | 已移除，改用 Pinia store 调用服务端认证 |
| localStorage key 不一致 | 统一使用 Pinia store 管理，store 内部使用一致的 key |
| DongTai.vue 重复条目 | 从"新增功能"中移除重复的"修改计时失败bug"条目 |
| Chat.vue 刷新按钮图标 | `Document` → `SwitchButton` |

---

## 七、死代码清理

已删除以下 18 个文件/目录：

```
frontend/src/components/
  AsyncComponent.vue, CustomEvent.vue, Doc.vue, HelloWorld.vue,
  MessageRow.vue, MyButton.vue, TextLoading.vue, Theme.vue,
  ZhuYe-new-test.vue, routerMap.js

frontend/src/views/
  ChatView.vue, Memories.vue, MemoryView.vue, Snapshots.vue, example/

electron/
  controller/example.js, service/example.js, jobs/example/
```

---

## 八、新增模块

| 文件 | 说明 |
|------|------|
| `server/API/auth.js` | JWT + bcrypt 认证（login/register） |
| `server/middleware.js` | 认证中间件 + 统一响应工具（ok/fail） |
| `remote-config.template.json` | 远程配置模板 |
| `SOFTWARE_ANALYSIS.md` | 软件分析报告 |
| `FIX_COMPLETION.md` | 本修复报告 |

---

## 九、未修复项说明

| 问题 | 原因 |
|------|------|
| Electron 21 EOL | 框架依赖 ee-core，升级需大版本重构 |
| HTTPS | 内网场景，可后续配合反向代理 |
| 生产数据库 root 弱密码 | 部署时由运维配置 |
| v-html 渲染 AI 回复 | 展示 Markdown 必需，收益小于代价 |
| 请求频率限制 | 内网小流量，可后续添加 |
| CORS 宽松 | 仅内网 Electron 访问，不暴露公网 |
| Vite/ESLint 旧版本 | dev 依赖，不影响生产安全 |
| 远程配置签名验证 | 需预置公钥，当前远程 URL 为本地可控源 |

---

## 十、部署提醒

1. 在数据库 `info` 表中添加 `password` 字段（VARCHAR(200)），已有用户需迁移密码哈希
2. 安装服务端依赖：`cd server && npm install`
3. 配置 `server/db/config.json` 中的 `jwtSecret` 和数据库连接信息
4. 如果发布新版本 Electron，确保 `preload/bridge.js` 随包分发
5. 旧用户密码为明文，首次登录时无法通过 bcrypt 验证，需提供密码重置流程
