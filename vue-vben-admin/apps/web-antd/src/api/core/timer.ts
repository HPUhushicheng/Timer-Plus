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
 * 获取当天时长数据
 */
export async function getTimeApi(id: string, date: string) {
  return requestClient.get<TimerApi.TimeRecord[]>('/api/time/get', {
    params: { id, date },
  });
}

/**
 * 获取所有时间记录（分页）
 */
export async function getAllTimeApi(page = 1, pageSize = 100) {
  return requestClient.get<TimerApi.TimeRecord[]>('/api/time/getall', {
    params: { page, pageSize },
  });
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
  return requestClient.get<TimerApi.UserInfo[]>('/list/all');
}

/**
 * 获取单个用户
 */
export async function getUserApi(id: string) {
  return requestClient.get<TimerApi.UserInfo[]>('/list/get', {
    params: { id },
  });
}
