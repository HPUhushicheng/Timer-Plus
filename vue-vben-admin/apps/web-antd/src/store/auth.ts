import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { loginApi, registerApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作 - Timer-Plus 使用 studentid + password
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const result = await loginApi({
        studentid: params.studentid,
        password: params.password,
      });

      // Timer-Plus 返回格式: { token, user: { id, name, major, studentid } }
      if (result.token) {
        accessStore.setAccessToken(result.token);

        // 构建用户信息
        const timerUser = result.user;
        userInfo = {
          avatar: '',
          homePath: '/dashboard/workspace',
          realName: timerUser.name,
          roles: ['user'],
          username: timerUser.studentid,
          userId: String(timerUser.id),
          desc: timerUser.major,
        };

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(['user']);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  /**
   * 注册
   */
  async function authRegister(params: Recordable<any>) {
    try {
      loginLoading.value = true;
      const result = await registerApi({
        studentid: params.studentid,
        name: params.name,
        password: params.password,
        major: params.major,
        tel: params.tel,
        qq: params.qq || '',
      });
      return result;
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = userStore.userInfo;
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    authRegister,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
