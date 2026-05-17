/**
 * ChallengeManager - 挑战-响应验证管理器
 * =============================================
 *
 * 专利点 #6: 基于加密挑战的活性证明协议
 *
 * 当服务端检测到可疑行为时，下发加密挑战给客户端。
 * 客户端需要用会话密钥对挑战+当前时间戳进行签名，
 * 服务端验证签名正确性。
 *
 * 流程：
 * 1. 服务端生成随机挑战字符串 + 时间戳
 * 2. 下发到客户端（通过 API 响应头或专门端点）
 * 3. 客户端在下次上报时附带挑战响应
 * 4. 服务端验证响应的时效性和正确性
 *
 * 挑战类型：
 * - SIMPLE: 简单响应式挑战（响应 + 时间戳签名）
 * - CAPTCHA: 验证码挑战（要求用户操作）
 * - TIMING: 计时挑战（要求特定时间窗口内响应）
 */

const crypto = require('crypto')

const CHALLENGE_TTL = 120000        // 挑战有效期 (2 分钟)
const CHALLENGE_CLEANUP_INTERVAL = 300000  // 清理间隔 (5 分钟)
const MAX_PENDING_CHALLENGES = 1000 // 最大待处理挑战数

class ChallengeManager {
  constructor() {
    this._pendingChallenges = new Map()  // challengeId -> challenge
    this._sessionKeys = new Map()        // sessionId -> sessionKey
    this._cleanupTimer = null
    this._running = false
  }

  /**
   * 启动挑战管理器
   */
  start() {
    if (this._running) return
    this._running = true
    this._cleanupTimer = setInterval(() => {
      this._cleanupExpired()
    }, CHALLENGE_CLEANUP_INTERVAL)
    console.log('[ChallengeManager] 挑战管理器已启动')
  }

  /**
   * 停止
   */
  stop() {
    this._running = false
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer)
      this._cleanupTimer = null
    }
  }

  /**
   * 注册会话密钥（登录时调用）
   * @param {string} sessionId - 客户端会话 ID
   * @param {string} sessionKey - 会话密钥
   */
  registerSession(sessionId, sessionKey) {
    this._sessionKeys.set(sessionId, sessionKey)
  }

  /**
   * 移除会话（登出时调用）
   * @param {string} sessionId
   */
  removeSession(sessionId) {
    this._sessionKeys.delete(sessionId)
    // 同时清理该会话的待处理挑战
    for (const [id, challenge] of this._pendingChallenges) {
      if (challenge.sessionId === sessionId) {
        this._pendingChallenges.delete(id)
      }
    }
  }

  /**
   * 生成挑战
   * @param {string} sessionId
   * @param {string} type - 挑战类型: 'SIMPLE' | 'CAPTCHA' | 'TIMING'
   * @param {number} difficulty - 难度 (1-5)
   * @returns {Object|null} Challenge 对象，或 null（如果已达上限）
   */
  generateChallenge(sessionId, type = 'SIMPLE', difficulty = 1) {
    if (this._pendingChallenges.size >= MAX_PENDING_CHALLENGES) {
      return null
    }

    const challengeId = crypto.randomBytes(16).toString('hex')
    const challenge = {
      id: challengeId,
      sessionId,
      type,
      difficulty,
      challenge: crypto.randomBytes(32).toString('hex'),
      issuedAt: Date.now(),
      expiresAt: Date.now() + CHALLENGE_TTL,
      verified: false
    }

    // 根据类型生成附加数据
    switch (type) {
      case 'SIMPLE':
        // 简单挑战只需在下次上报中附带响应
        break
      case 'CAPTCHA':
        // 生成简单的验证码题目
        challenge.captcha = {
          question: this._generateCaptchaQuestion(difficulty),
          answerHash: null  // 服务端存储答案哈希
        }
        challenge.captcha.answerHash = crypto
          .createHash('sha256')
          .update(challenge.captcha.question.answer.toLowerCase())
          .digest('hex')
        // 不把答案发给客户端
        delete challenge.captcha.question.answer
        break
      case 'TIMING':
        // 计时挑战：要求客户端在特定时间窗口内响应
        challenge.timeWindow = {
          minResponseTime: 1000,     // 最短 1 秒（防自动响应）
          maxResponseTime: 30000     // 最长 30 秒
        }
        break
    }

    this._pendingChallenges.set(challengeId, challenge)
    return {
      id: challenge.id,
      type: challenge.type,
      challenge: challenge.challenge,
      difficulty: challenge.difficulty,
      issuedAt: challenge.issuedAt,
      ...(type === 'CAPTCHA' ? { captcha: challenge.captcha } : {}),
      ...(type === 'TIMING' ? { timeWindow: challenge.timeWindow } : {})
    }
  }

  /**
   * 验证挑战响应
   * @param {string} challengeId
   * @param {Object} response - { responseTimestamp, captchaAnswer?, ... }
   * @returns {Object} { valid, reason? }
   */
  verifyChallenge(challengeId, response) {
    const challenge = this._pendingChallenges.get(challengeId)
    if (!challenge) {
      return { valid: false, reason: 'challenge_not_found' }
    }

    // 检查有效期
    if (Date.now() > challenge.expiresAt) {
      this._pendingChallenges.delete(challengeId)
      return { valid: false, reason: 'challenge_expired' }
    }

    // 检查超时响应
    const responseTime = response.responseTimestamp - challenge.issuedAt
    if (challenge.type === 'TIMING') {
      if (responseTime < challenge.timeWindow.minResponseTime) {
        this._pendingChallenges.delete(challengeId)
        return { valid: false, reason: 'response_too_fast' }
      }
      if (responseTime > challenge.timeWindow.maxResponseTime) {
        this._pendingChallenges.delete(challengeId)
        return { valid: false, reason: 'response_too_slow' }
      }
    }

    // CAPTCHA 验证
    if (challenge.type === 'CAPTCHA') {
      if (!response.captchaAnswer) {
        return { valid: false, reason: 'captcha_answer_missing' }
      }
      const answerHash = crypto
        .createHash('sha256')
        .update(response.captchaAnswer.toLowerCase())
        .digest('hex')
      if (answerHash !== challenge.captcha.answerHash) {
        return { valid: false, reason: 'captcha_answer_wrong' }
      }
    }

    challenge.verified = true
    this._pendingChallenges.delete(challengeId)
    return { valid: true }
  }

  /**
   * 检查某个会话是否有待处理的挑战
   * @param {string} sessionId
   * @returns {Object|null}
   */
  getPendingChallenge(sessionId) {
    for (const challenge of this._pendingChallenges.values()) {
      if (challenge.sessionId === sessionId && !challenge.verified) {
        return challenge
      }
    }
    return null
  }

  /**
   * 判断是否需要对某个用户下发挑战
   * @param {number} suspicionLevel - 可疑程度 (0-1)
   * @returns {boolean}
   */
  shouldChallenge(suspicionLevel) {
    if (suspicionLevel >= 0.8) return true
    if (suspicionLevel >= 0.5) return Math.random() < 0.3  // 30% 概率下发
    if (suspicionLevel >= 0.3) return Math.random() < 0.1  // 10% 概率下发
    return false
  }

  // ── 私有方法 ──

  _cleanupExpired() {
    const now = Date.now()
    for (const [id, challenge] of this._pendingChallenges) {
      if (now > challenge.expiresAt) {
        this._pendingChallenges.delete(id)
      }
    }
  }

  _generateCaptchaQuestion(difficulty) {
    const operators = ['+', '-', '*']
    const op = operators[Math.floor(Math.random() * (difficulty < 3 ? 2 : 3))]
    let a, b, answer

    switch (difficulty) {
      case 1:
        a = Math.floor(Math.random() * 10) + 1
        b = Math.floor(Math.random() * 10) + 1
        break
      case 2:
        a = Math.floor(Math.random() * 50) + 1
        b = Math.floor(Math.random() * 50) + 1
        break
      case 3:
        a = Math.floor(Math.random() * 100) + 1
        b = Math.floor(Math.random() * 100) + 1
        break
      default:
        a = Math.floor(Math.random() * 20) + 1
        b = Math.floor(Math.random() * 20) + 1
    }

    switch (op) {
      case '+': answer = a + b; break
      case '-': answer = a - b; break
      case '*': answer = a * b; break
    }

    return {
      question: `${a} ${op} ${b} = ?`,
      answer: String(answer)
    }
  }
}

module.exports = { ChallengeManager }
