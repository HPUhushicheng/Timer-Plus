import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 - Timer-Plus 使用 studentid + password */
  export interface LoginParams {
    studentid: string;
    password: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    token: string;
    user: {
      id: number;
      name: string;
      major: string;
      studentid: string;
    };
  }

  /** 注册接口参数 */
  export interface RegisterParams {
    studentid: string;
    name: string;
    password: string;
    major: string;
    tel: string;
    qq?: string;
  }
}

/**
 * 登录 - Timer-Plus 使用学号+密码登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 注册
 */
export async function registerApi(data: AuthApi.RegisterParams) {
  return requestClient.post('/auth/register', data);
}
