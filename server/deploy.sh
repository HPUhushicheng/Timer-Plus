#!/bin/bash
set -e

# ============================================================
#  拾光考勤系统 - 后端一键部署脚本
#  支持: Ubuntu 20.04+ / Debian 11+ / CentOS 7+ / Rocky 8+
#
#  用法: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

# ── 检测操作系统 ──────────────────────────────
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    err "无法检测操作系统，脚本仅支持 Ubuntu/Debian/CentOS/Rocky"
    exit 1
fi

echo "============================================"
echo "  拾光考勤系统 - 后端部署"
echo "  检测到系统: $OS"
echo "============================================"
echo ""

# ── 收集配置信息 ──────────────────────────────
if [ -z "$MYSQL_ROOT_PASS" ]; then
    read -sp "请输入 MySQL root 密码（留空自动生成）: " MYSQL_ROOT_PASS
    echo ""
fi
if [ -z "$MYSQL_ROOT_PASS" ]; then
    MYSQL_ROOT_PASS=$(openssl rand -base64 16 2>/dev/null || date +%s | sha256sum | base64 | head -c 16)
    log "已自动生成 MySQL root 密码: $MYSQL_ROOT_PASS"
    warn "请务必记录此密码！"
fi

APP_DB_USER="${APP_DB_USER:-timer_app}"
APP_DB_PASS="${APP_DB_PASS:-$(openssl rand -base64 12 2>/dev/null || date +%s | md5sum | head -c 12)}"
APP_DB_NAME="${APP_DB_NAME:-timer_plus}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)}"
SERVER_PORT="${SERVER_PORT:-666}"
INSTALL_DIR="/opt/timer-plus"

echo ""
echo "配置预览:"
echo "  MySQL root 密码: (已设置)"
echo "  应用数据库用户:  $APP_DB_USER"
echo "  应用数据库密码:  $APP_DB_PASS"
echo "  数据库名:        $APP_DB_NAME"
echo "  API 端口:        $SERVER_PORT"
echo "  安装目录:        $INSTALL_DIR"
echo ""

if [ -z "$SKIP_CONFIRM" ]; then
    read -p "确认部署? [Y/n]: " CONFIRM
    if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
        echo "已取消"
        exit 0
    fi
fi

# ── Step 1: 安装 Node.js 18 ────────────────────
log "Step 1/6: 安装 Node.js..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 2>/dev/null && apt-get install -y nodejs 2>/dev/null || {
        # CentOS/RHEL fallback
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - 2>/dev/null && yum install -y nodejs 2>/dev/null || {
            err "Node.js 安装失败，请手动安装 Node 18+"
            exit 1
        }
    }
else
    NODE_VER=$(node -v)
    log "Node.js 已安装: $NODE_VER"
fi

# ── Step 2: 安装 MySQL ─────────────────────────
log "Step 2/6: 安装 MySQL..."
if command -v mysql &>/dev/null; then
    log "MySQL 已安装: $(mysql --version 2>/dev/null | head -1)"
else
    case $OS in
        ubuntu|debian)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update -qq && apt-get install -y -qq mysql-server
            ;;
        centos|rocky|rhel)
            yum install -y mysql-server && systemctl start mysqld && systemctl enable mysqld
            # 获取初始临时密码
            TMP_PASS=$(grep 'temporary password' /var/log/mysqld.log 2>/dev/null | tail -1 | awk '{print $NF}')
            if [ -n "$TMP_PASS" ] && [ -z "$MYSQL_ROOT_PASS_SET" ]; then
                warn "MySQL 初始临时密码: $TMP_PASS"
            fi
            ;;
        *)
            err "不支持的系统: $OS"
            exit 1
            ;;
    esac
fi

# 确保 MySQL 运行
systemctl start mysql 2>/dev/null || systemctl start mysqld 2>/dev/null || true
systemctl enable mysql 2>/dev/null || systemctl enable mysqld 2>/dev/null || true

# ── Step 3: 配置 MySQL ─────────────────────────
log "Step 3/6: 配置数据库和用户..."

# 使用 root 登录
mysql_root() {
    mysql -u root -p"$MYSQL_ROOT_PASS" "$@" 2>/dev/null || mysql -u root "$@" 2>/dev/null
}

# 尝试设置 root 密码（如果还没设置）
if ! mysql -u root -p"$MYSQL_ROOT_PASS" -e "SELECT 1" &>/dev/null; then
    if mysql -u root -e "SELECT 1" &>/dev/null; then
        # root 无密码，设置密码
        mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASS'; FLUSH PRIVILEGES;"
        log "MySQL root 密码已设置"
    else
        warn "无法连接 MySQL，请手动输入密码后继续"
        while ! mysql -u root -p"$MYSQL_ROOT_PASS" -e "SELECT 1" &>/dev/null; do
            read -sp "请输入 MySQL root 密码: " MYSQL_ROOT_PASS
            echo ""
        done
    fi
fi

# 创建数据库
mysql_root -e "CREATE DATABASE IF NOT EXISTS \`$APP_DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
log "数据库 $APP_DB_NAME 已创建"

# 创建应用用户
mysql_root -e "
CREATE USER IF NOT EXISTS '$APP_DB_USER'@'localhost' IDENTIFIED BY '$APP_DB_PASS';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`$APP_DB_NAME\`.* TO '$APP_DB_USER'@'localhost';
FLUSH PRIVILEGES;
"
log "应用用户 $APP_DB_USER 已创建"

# 创建表
mysql_root "$APP_DB_NAME" -e "
CREATE TABLE IF NOT EXISTS info (
    id INT PRIMARY KEY,
    studentid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    password VARCHAR(200),
    major VARCHAR(100),
    tel VARCHAR(20),
    qq VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user',
    last_active BIGINT DEFAULT 0,
    \`visible\` TINYINT(1) DEFAULT 1,
    \`seat-room\` VARCHAR(50),
    \`seat-number\` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS time (
    id INT NOT NULL,
    date DATE NOT NULL,
    daytime VARCHAR(20),
    hourtime INT DEFAULT 0,
    PRIMARY KEY (id, date, daytime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"
log "数据表已创建"

# 数据库迁移：为旧数据库添加新字段（幂等，可重复执行）
log "检查数据库迁移..."
mysql_root "$APP_DB_NAME" -e "SELECT role FROM info LIMIT 1" 2>/dev/null || {
    log "添加 role 字段..."
    mysql_root "$APP_DB_NAME" -e "ALTER TABLE info ADD COLUMN role VARCHAR(20) DEFAULT 'user' AFTER qq;"
}
mysql_root "$APP_DB_NAME" -e "SELECT last_active FROM info LIMIT 1" 2>/dev/null || {
    log "添加 last_active 字段..."
    mysql_root "$APP_DB_NAME" -e "ALTER TABLE info ADD COLUMN last_active BIGINT DEFAULT 0 AFTER role;"
}
mysql_root "$APP_DB_NAME" -e "SELECT visible FROM info LIMIT 1" 2>/dev/null || {
    log "添加 visible 字段..."
    mysql_root "$APP_DB_NAME" -e "ALTER TABLE info ADD COLUMN \`visible\` TINYINT(1) DEFAULT 1 AFTER last_active;"
}
mysql_root "$APP_DB_NAME" -e "SELECT 1 FROM announcements LIMIT 1" 2>/dev/null || {
    log "创建公告表..."
    mysql_root "$APP_DB_NAME" -e "
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            created_by VARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    "
}
log "数据库迁移完成"

# ── Step 4: 部署服务端代码 ─────────────────────
log "Step 4/6: 部署服务端代码..."
mkdir -p "$INSTALL_DIR"

# 复制 server 目录下业务文件（排除部署脚本和临时文件）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
rsync -a "$SCRIPT_DIR/" "$INSTALL_DIR/" \
    --exclude node_modules \
    --exclude deploy.sh \
    --exclude .git \
    --exclude '*.log' \
    2>/dev/null || cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/" || {
    err "复制文件失败，请确认脚本在 server/ 目录下运行"
    exit 1
}

# 确保子目录存在
mkdir -p "$INSTALL_DIR/db"

# 生成 config.json
cat > "$INSTALL_DIR/db/config.json" << EOF
{
    "host": "127.0.0.1",
    "user": "$APP_DB_USER",
    "password": "$APP_DB_PASS",
    "database": "$APP_DB_NAME",
    "port": 3306,
    "remoteConfigUrl": ""
}
EOF
log "config.json 已生成"

# 安装依赖
cd "$INSTALL_DIR"
npm install --production
log "npm 依赖已安装"

# ── Step 5: 创建 systemd 服务 ──────────────────
log "Step 5/6: 创建 systemd 服务..."
cat > /etc/systemd/system/timer-plus.service << EOF
[Unit]
Description=拾光考勤系统 API
After=network.target mysql.service mysqld.service
Wants=mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment=JWT_SECRET=$JWT_SECRET
Environment=PORT=$SERVER_PORT
ExecStart=$(which node) app.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable timer-plus
systemctl restart timer-plus
log "systemd 服务已创建并启动"

# ── Step 6: 防火墙配置 ─────────────────────────
log "Step 6/6: 配置防火墙..."

if command -v ufw &>/dev/null; then
    ufw allow $SERVER_PORT/tcp 2>/dev/null || true
    log "UFW: 已开放端口 $SERVER_PORT"
elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-port=$SERVER_PORT/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    log "firewalld: 已开放端口 $SERVER_PORT"
fi

# ── 完成 ───────────────────────────────────────
echo ""
echo "============================================"
echo "  ${GREEN}部署完成！${NC}"
echo "============================================"
echo ""
echo "数据库信息:"
echo "  MySQL root 密码: $MYSQL_ROOT_PASS"
echo "  应用 DB 用户:    $APP_DB_USER"
echo "  应用 DB 密码:    $APP_DB_PASS"
echo "  数据库名:        $APP_DB_NAME"
echo ""
echo "服务信息:"
echo "  API 端口:        $SERVER_PORT"
echo "  JWT Secret:      $JWT_SECRET"
echo ""
echo "管理命令:"
echo "  systemctl status timer-plus   # 查看状态"
echo "  systemctl restart timer-plus  # 重启"
echo "  journalctl -u timer-plus -f   # 查看日志"
echo ""
echo "测试:"
echo "  curl http://localhost:$SERVER_PORT/list/all"
echo ""
echo "请将以上密码和 JWT Secret 安全保存！"
