/**
 * 数据库迁移自动执行
 *
 * 在 app.js 启动时调用，自动检测并执行所有未完成的迁移。
 * 迁移文件位于 db/migrations/*.sql，按文件名排序逐一执行。
 * 已执行的迁移记录在 migration_log 表中。
 */

const fs = require('fs')
const path = require('path')
const db = require('./index')

/**
 * 执行所有未完成的迁移
 */
async function runMigrations() {
  console.log('[迁移] 检查数据库迁移状态...')

  // 确保 migration_log 表存在
  await _ensureMigrationTable()

  const migrationsDir = path.join(__dirname, 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.log('[迁移] 无迁移目录，跳过')
    return
  }

  // 获取所有 .sql 文件，按文件名排序
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('[迁移] 无待执行迁移')
    return
  }

  // 获取已执行的迁移
  const executed = await _getExecutedMigrations()

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`[迁移] ${file} 已执行，跳过`)
      continue
    }

    console.log(`[迁移] 正在执行: ${file}`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

    try {
      await _executeStatements(sql)
      await _logMigration(file)
      console.log(`[迁移] ✓ ${file} 执行成功`)
    } catch (err) {
      console.error(`[迁移] ✗ ${file} 执行失败:`, err.message)
      // 不阻塞启动，记录失败继续
    }
  }

  console.log('[迁移] 完成')
}

/**
 * 确保 migration_log 表存在
 */
function _ensureMigrationTable() {
  return new Promise((resolve, reject) => {
    const sql = `CREATE TABLE IF NOT EXISTS migration_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      success TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    db.query(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/**
 * 获取已执行的迁移集合
 */
function _getExecutedMigrations() {
  return new Promise((resolve) => {
    db.query('SELECT filename FROM migration_log WHERE success = 1', (err, rows) => {
      if (err) {
        console.warn('[迁移] 无法读取迁移日志:', err.message)
        resolve(new Set())
      } else {
        resolve(new Set((rows || []).map(r => r.filename)))
      }
    })
  })
}

/**
 * 逐条执行 SQL 语句（支持多条语句）
 */
function _executeStatements(sql) {
  // 按分号分割，过滤空语句和注释行
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 0)

  return new Promise((resolve, reject) => {
    // 使用一个计数器跟踪执行
    let idx = 0
    let hasError = false

    const runNext = () => {
      if (idx >= statements.length || hasError) {
        return hasError ? reject(new Error('迁移执行失败')) : resolve()
      }

      const stmt = statements[idx]
      idx++

      db.query(stmt, (err) => {
        if (err) {
          // 兼容：列已存在、表已存在等错误不算失败
          const ignoreCodes = ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR']
          if (ignoreCodes.includes(err.code)) {
            console.log(`  [迁移] 跳过（${err.code}）: ${stmt.slice(0, 60)}...`)
          } else {
            console.error(`  [迁移] 语句失败: ${err.code} — ${stmt.slice(0, 80)}`)
            hasError = true
            // 不 reject，继续执行下一条
          }
        }
        runNext()
      })
    }

    runNext()
  })
}

/**
 * 记录已执行的迁移
 */
function _logMigration(filename) {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO migration_log (filename) VALUES (?) ON DUPLICATE KEY UPDATE executed_at = NOW(), success = 1',
      [filename],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

module.exports = { runMigrations }

// 直接运行
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[迁移] 完成')
      process.exit(0)
    })
    .catch((err) => {
      console.error('[迁移] 失败:', err)
      process.exit(1)
    })
}
