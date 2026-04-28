# 拾光考勤系统 - 后端部署复盘

> 服务器 IP: 47.120.68.44，部署日期: 2026-04-27

---

## 一、部署流程

### 1.1 服务器环境

| 项目 | 信息 |
|------|------|
| OS | Linux (Ubuntu) |
| Node.js | v23.1.0（已安装，无需更新） |
| MySQL | 8.0（脚本自动安装） |
| 部署脚本 | `server/deploy.sh`，一键完成全部安装配置 |

### 1.2 数据库信息

| 参数 | 值 |
|------|-----|
| MySQL root 密码 | `root14171417` |
| 应用 DB 用户 | `timer_app` |
| 应用 DB 密码 | `uwLyoIulf64CdD6b` |
| 数据库名 | `timer_plus` |
| API 端口 | `666` |
| JWT Secret | `rgOnFZ+rKDuennucJcKUx0wsObSG/OvpVlH0RZ2fDBk=` |

### 1.3 数据表结构

**info 表**（用户）
```sql
CREATE TABLE IF NOT EXISTS info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    password VARCHAR(200),
    major VARCHAR(100),
    tel VARCHAR(20),
    qq VARCHAR(50),
    `seat-room` VARCHAR(50),
    `seat-number` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**time 表**（在线时长）
```sql
CREATE TABLE IF NOT EXISTS time (
    id INT NOT NULL,
    date DATE NOT NULL,
    daytime VARCHAR(20),
    hourtime INT DEFAULT 0,
    PRIMARY KEY (id, date, daytime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 1.4 服务管理

```bash
systemctl status timer-plus   # 查看状态
systemctl restart timer-plus  # 重启服务
journalctl -u timer-plus -f   # 查看日志
```

---

## 二、遇到的问题与修复

### 问题 1：deploy.sh 写 config.json 时目录不存在

**现象**：`/opt/timer-plus/db/config.json: No such file or directory`

**原因**：脚本第一次运行在 Step 3 成功后但在 Step 4 文件复制前失败，导致 `/opt/timer-plus/db/` 目录还未创建。

**修复**：在写 config.json 前增加 `mkdir -p "$INSTALL_DIR/db"`。

### 问题 2：MySQL 密码不匹配

**现象**：`ER_ACCESS_DENIED_ERROR: Access denied for user 'timer_app'@'localhost'`

**原因**：部署脚本两次运行间生成了不同的随机密码——第一次创建了 MySQL 用户（密码 A），第二次重写 config.json 用了新密码（密码 B）。`CREATE USER IF NOT EXISTS` 不会覆盖已有用户的密码。

**修复**：
```bash
mysql -u root -p"root14171417" -e "ALTER USER 'timer_app'@'localhost' IDENTIFIED BY 'uwLyoIulf64CdD6b'; FLUSH PRIVILEGES;"
```

### 问题 3：学号超 INT 范围

**现象**：`ER_WARN_DATA_OUT_OF_RANGE: Out of range value for column 'id'`

**原因**：`id` 列定义为 `INT`（最大值 2,147,483,647），但学号如 `312201030299`（12 位数字）超出范围。代码把学号字符串直接插入 INT 列。

**修复**：
1. `id` 改为 `AUTO_INCREMENT`，不再与 `studentid` 混用
2. register 函数不再传入 `id` 字段，改为数据库自动生成

### 问题 4：时间表 id 类型不匹配

**现象**：前端传 `studentid`（字符串）给时间 API，但 `time.id` 是自增整数

**原因**：登录接口返回 `id: user.studentid`（学号字符串），前端把字符串存到 localStorage，时间查询时传字符串给整数列。

**修复**：
1. 服务端 login 改为返回 `id: user.id`（真实自增整数）
2. 前端 `useUserStore` 新增 `dbId` 字段（整数），与 `studentid`（字符串）分开存储
3. `useOnlineDurationStore` 改用 `dbId` 调用时间 API
4. `TodayTime.vue` 图表查询改用 `store.dbId`

### 问题 5：服务器代码未同步

**现象**：`git pull` 后 `/api/health` 仍然 404

**原因**：`git pull` 更新了 `~/Timer-Plus/server/`，但 systemd 服务跑的是 `/opt/timer-plus/`。两个目录不同步。

**修复**：每次 git pull 后必须执行：
```bash
cp -r ~/Timer-Plus/server/* /opt/timer-plus/ && systemctl restart timer-plus
```

---

## 三、API 测试结果

全部接口通过测试：

```
GET  /api/health          → {"status":200,"server":"在线","db":"在线"}
POST /auth/register       → {"status":200,"message":"注册成功"}
POST /auth/login          → {"status":200,"token":"eyJ...","user":{"id":1,...}}
GET  /list/all            → {"status":200,"data":[...]}
POST /api/time/record     → {"status":200,"message":"记录成功"}
GET  /api/time/get        → {"status":200,"data":[{"daytime":"17","hourtime":3600}]}
```

---

## 四、服务器操作备忘

### 更新代码
```bash
cd ~/Timer-Plus && git pull && cp -r ~/Timer-Plus/server/* /opt/timer-plus/ && systemctl restart timer-plus
```

### 查看日志
```bash
journalctl -u timer-plus -f
```

### 重设 MySQL 用户密码（如果密码又不匹配了）
```bash
mysql -u root -p"root14171417" -e "ALTER USER 'timer_app'@'localhost' IDENTIFIED BY 'uwLyoIulf64CdD6b'; FLUSH PRIVILEGES;"
```

### 数据库手动连接
```bash
mysql -u timer_app -p"uwLyoIulf64CdD6b" timer_plus
```

### 手动测试 API
```bash
# 健康检查
curl http://localhost:666/api/health

# 注册
curl -X POST http://localhost:666/auth/register -H 'Content-Type: application/json' -d '{"studentid":"你的学号","name":"名字","password":"密码","major":"专业","tel":"手机号"}'

# 登录（获取 token）
curl -X POST http://localhost:666/auth/login -H 'Content-Type: application/json' -d '{"studentid":"你的学号","password":"密码"}'

# 使用 token 调用接口
curl http://localhost:666/list/all -H 'Authorization: Bearer <token>'
```

---

## 五、部署脚本改进建议

1. **密码一致性**：将 `CREATE USER IF NOT EXISTS` 改为 `ALTER USER`，确保每次运行后密码一致
2. **避免重复覆盖**：部署脚本检查 `/opt/timer-plus/` 是否已存在，避免覆盖 config.json
3. **更新脚本**：提供单独的 `update.sh` 只做 git pull + cp + restart，不重置数据库

---

## 六、客户端编译

客户端通过 GitHub Actions 云端编译，无需本地环境：

```
push main → CI 自动编译 Windows/macOS/Linux → Artifacts 下载
```

下载地址：https://github.com/HPUhushicheng/Timer-Plus/actions
