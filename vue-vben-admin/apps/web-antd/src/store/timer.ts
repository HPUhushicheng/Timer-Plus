import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAccessStore } from '@vben/stores';

import { recordTimeApi } from '#/api';

/**
 * 在线时长追踪 Store
 * 每 60 秒向服务器发送一次增量时长
 */
export const useTimerStore = defineStore('timer', () => {
  const onlineDuration = ref(0);
  const dbId = ref(localStorage.getItem('timer_dbId') || '');

  let timer: ReturnType<typeof setInterval> | null = null;
  let sendTimer: ReturnType<typeof setInterval> | null = null;
  let lastSentTime = Date.now();

  function setDbId(id: string) {
    dbId.value = id;
    localStorage.setItem('timer_dbId', id);
    onlineDuration.value = 0;
    lastSentTime = Date.now();
  }

  function startTimer() {
    const currentDbId = localStorage.getItem('timer_dbId');
    if (!currentDbId) return;
    if (timer || sendTimer) return;

    lastSentTime = Math.floor(Date.now() / 1000) * 1000;

    // 每秒更新显示
    timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000) * 1000;
      onlineDuration.value = Math.floor((now - lastSentTime) / 1000);
    }, 1000);

    // 每 60 秒发送增量时长
    sendTimer = setInterval(async () => {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const elapsed = onlineDuration.value;
      if (elapsed < 30) return;

      const hourtime = Math.min(elapsed, 3600);
      const accessStore = useAccessStore();
      if (!accessStore.accessToken) return;

      try {
        await recordTimeApi({
          id: currentDbId,
          date,
          hourtime,
        });
        // 重置计数器
        lastSentTime = Math.floor(Date.now() / 1000) * 1000;
        onlineDuration.value = 0;
      } catch {
        // 静默失败
      }
    }, 60000);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (sendTimer) {
      clearInterval(sendTimer);
      sendTimer = null;
    }
  }

  function resetTimer() {
    onlineDuration.value = 0;
    lastSentTime = Math.floor(Date.now() / 1000) * 1000;
  }

  return {
    dbId,
    onlineDuration,
    setDbId,
    startTimer,
    stopTimer,
    resetTimer,
  };
});
