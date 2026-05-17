/**
 * 活性证明系统 - 公共 API
 *
 * 对外暴露统一的接口，按需导入：
 *
 * // 完整活性证明引擎（推荐方式）
 * import { activityProofEngine } from '@/utils/activity'
 * activityProofEngine.setDependencies(activitySampler, clockDriftDetector)
 * activityProofEngine.start()
 *
 * // 或单独使用各模块
 * import { ActivitySampler, BehavioralFingerprint } from '@/utils/activity'
 */

export { ActivitySampler, activitySampler } from './ActivitySampler'
export { BehavioralFingerprint } from './BehavioralFingerprint'
export { ActivityProofEngine, activityProofEngine } from './ActivityProofEngine'
export { ClockDriftDetector, clockDriftDetector } from './ClockDriftDetector'

export default {
  ActivitySampler,
  activitySampler,
  BehavioralFingerprint,
  ActivityProofEngine,
  activityProofEngine,
  ClockDriftDetector,
  clockDriftDetector
}
