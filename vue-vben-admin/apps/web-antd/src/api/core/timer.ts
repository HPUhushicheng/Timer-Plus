import { useAccessStore } from '@vben/stores';

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
  }

  /** 记录在线时长参数 */
  export interface RecordTimeParams {
    id: string;
    date: string;
    hourtime: number;
  }
}

/**
 * 简易 authFetch - 使用 fetch() 直接请求，绕过 vben interceptor 链
 * 匹配 legacy 前端的 authFetch 行为：手动处理 { status, data, message } 格式
 */
async function authFetch(path: string): Promise<any> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(path, { headers });
  const json = await response.json();

  if (json.status === 200) {
    return json.data;
  }
  throw new Error(json.message || `请求失败 (${json.status})`);
}

/**
 * 获取当天时长数据
 * 注意：server 从 JWT token 获取用户 id，无需传 id 参数
 */
export async function getTimeApi(_id: string, date: string) {
  return authFetch(`/api/time/get?date=${encodeURIComponent(date)}`);
}

/**
 * 获取所有时间记录（分页）
 */
export async function getAllTimeApi(page = 1, pageSize = 100) {
  return authFetch(`/api/time/getall?page=${page}&pageSize=${pageSize}`);
}

/**
 * 记录在线时长
 */
export async function recordTimeApi(data: TimerApi.RecordTimeParams) {
  return requestClient.post('/api/time/record', data);
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
  return authFetch('/list/all');
}

/**
 * 获取单个用户
 */
export async function getUserApi(id: string) {
  return requestClient.get('/list/get', {
    params: { id },
  });
}
