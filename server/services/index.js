/**
 * 验证服务集合 - 统一导出
 *
 * 所有验证服务共享一个上下文：
 * - TimeValidator: 单次上报的验证
 * - BehaviorAnalyzer: 跨用户行为基线分析
 * - ChallengeManager: 挑战-响应验证
 */

const { TimeValidator } = require('./TimeValidator')
const { BehaviorAnalyzer } = require('./BehaviorAnalyzer')
const { ChallengeManager } = require('./ChallengeManager')

// 单例
const timeValidator = new TimeValidator()
const behaviorAnalyzer = new BehaviorAnalyzer()
const challengeManager = new ChallengeManager()

module.exports = {
  timeValidator,
  behaviorAnalyzer,
  challengeManager
}
