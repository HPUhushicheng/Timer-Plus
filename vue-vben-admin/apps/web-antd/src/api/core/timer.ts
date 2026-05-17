import { useUserStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace TimerApi {
  /** 时间记录 */
  export interface TimeRecord {
    id: number;
    date: string;
    daytime: number;
    hourtime: number;
  }

  /** 用户信息 */
  export interface UserInfo {
    id: number;
    name: string;
    studentid: string;
    major: string;
    tel: string;
    qq: string;
    role: string;
    visible?: boolean;
    seatRoom?: string;
    seatNumber?: string;
    online?: boolean;
    last_active?: number;
  }

  /** 记录在线时长参数 */
  export interface RecordTimeParams {
    id: string;
    date: string;
    hourtime: number;
    /** 会话跟踪字段（用于服务端连续性验证） */
    _sessionId?: string;
    _sequenceNumber?: number;
    _continuity?: { isValid: boolean; gapWallClock: number };
    _clockHealthy?: boolean;
    /** 行为指纹增强字段（由 ActivityProofEngine 填充） */
    _claimSeconds?: number;
    _activityScore?: number;
    _suspiciousFlags?: string[];
    _mouseEntropy?: number;
    _mouseFractal?: number;
    _mouseNaturalness?: number;
    _keystrokeCV?: number;
    _focusedRatio?: number;
    _visibleRatio?: number;
    _regularity?: number;
  }
}

/**
 * 获取当前用户的数字 ID（数据库中 info.id）
 * 优先从 useUserStore 读取，其次从 localStorage 的 timer_dbId 读取
 */
function getCurrentUserId(): string | null {
  try {
    const userStore = useUserStore();
    const userId = userStore.userInfo?.userId;
    if (userId) return userId;
  } catch {
    // Pinia store may not be available in some edge cases
  }
  return localStorage.getItem('timer_dbId') || null;
}

/**
 * 获取当天时长数据
 * 传入当前用户的 studentid 作为 id 参数
 */
export async function getTimeApi(_id: string, date: string) {
  const userId = _id || getCurrentUserId() || '';
  return requestClient.get('/api/time/get', { params: { id: userId, date } });
}

/**
 * 获取所有时间记录（分页，支持日期范围筛选）
 * @param pageSize 默认 10000 确保单次拉取全部数据（避免分页遗漏）
 * @param dateFrom 可选，开始日期 YYYY-MM-DD
 * @param dateTo 可选，结束日期 YYYY-MM-DD
 */
export async function getAllTimeApi(
  page = 1,
  pageSize = 10000,
  dateFrom?: string,
  dateTo?: string,
  id?: string,
) {
  const params: Record<string, any> = { page, pageSize };
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (id) params.id = id;
  return requestClient.get('/api/time/getall', { params });
}

/**
 * 记录在线时长
 */
export async function recordTimeApi(data: TimerApi.RecordTimeParams) {
  return requestClient.post('/api/time/record', data);
}

/**
 * 获取活性摘要
 */
export async function getActivitySummaryApi(id: string, date?: string) {
  const params: Record<string, any> = { id };
  if (date) params.date = date;
  return requestClient.get('/api/time/activity-summary', { params });
}

/**
 * 删除时间记录
 */
export async function deleteTimeApi(id: string, date: string) {
  return requestClient.delete('/api/time/del', { data: { id, date } });
}

/**
 * 获取所有用户
 */
export async function getAllUsersApi() {
  return requestClient.get('/list/all');
}

/**
 * 获取单个用户
 */
export async function getUserApi(id: string) {
  return requestClient.get('/list/get', {
    params: { id },
  });
}

/**
 * 更新用户信息（普通用户仅可更新自己，管理员可更新任何人）
 */
export async function updateProfileApi(data: {
  id: number;
  name?: string;
  major?: string;
  tel?: string;
  qq?: string;
  role?: string;
}) {
  return requestClient.put('/list/update', data);
}

/**
 * 修改密码（不需要旧密码）
 */
export async function changePasswordApi(data: {
  newPassword: string;
  confirmPassword: string;
}) {
  return requestClient.post('/auth/change-password', data);
}

/**
 * 分配座次（管理员专属）
 */
export async function assignSeatApi(data: {
  id: number;
  seatRoom: string;
  seatNumber: string;
}) {
  return requestClient.put('/list/seat', data);
}

/**
 * 删除用户（管理员专属）
 */
export async function deleteUserApi(id: number) {
  return requestClient.delete('/list/del', { data: { id } });
}

/**
 * 切换用户座次表可见性（管理员专属）
 */
export async function toggleVisibilityApi(id: number, visible: boolean) {
  return requestClient.put('/list/visible', { id, visible });
}

/**
 * 管理员数据概览
 */
export async function getAdminStatsApi() {
  return requestClient.get('/admin/stats');
}

/** 公告 */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
}

/**
 * 创建公告（管理员专属）
 */
export async function createAnnouncementApi(data: {
  title: string;
  content: string;
}) {
  return requestClient.post('/announcement/create', data);
}

/**
 * 获取公告列表
 */
export async function getAnnouncementsApi() {
  return requestClient.get('/announcement/list');
}

/**
 * 删除公告（管理员专属）
 */
export async function deleteAnnouncementApi(id: number) {
  return requestClient.delete('/announcement/del', { data: { id } });
}
