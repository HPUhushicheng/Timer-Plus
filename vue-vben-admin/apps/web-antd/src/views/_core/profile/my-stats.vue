<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { Card } from 'ant-design-vue';

import { getAllTimeApi, getTimeApi } from '#/api';

defineOptions({ name: 'MyStats' });

const loading = ref(true);
const todayMinutes = ref(0);
const monthMinutes = ref(0);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

onMounted(async () => {
  const userStore = useUserStore();
  const userId = userStore.userInfo?.userId;
  if (!userId) {
    loading.value = false;
    return;
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

  try {
    const [todayRecords, monthRecords] = await Promise.all([
      getTimeApi(userId, today),
      getAllTimeApi(1, 10000, monthStart, today),
    ]);

    // Calculate today's total minutes
    todayMinutes.value = ((todayRecords ?? []) as any[]).reduce(
      (sum: number, r: any) => sum + (r.hourtime || 0),
      0,
    );
    todayMinutes.value = Math.round(todayMinutes.value / 60);

    // Calculate this month's total minutes
    monthMinutes.value = ((monthRecords ?? []) as any[]).reduce(
      (sum: number, r: any) => sum + (r.hourtime || 0),
      0,
    );
    monthMinutes.value = Math.round(monthMinutes.value / 60);
  } catch {
    // silently fail, leave at 0
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="px-4 py-4">
    <div v-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
      <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
      加载中...
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card :bordered="false" class="text-center">
        <p class="mb-2 text-sm text-muted-foreground">今日在线时长</p>
        <p class="text-3xl font-bold text-primary">{{ todayMinutes }}</p>
        <p class="text-xs text-muted-foreground">分钟</p>
      </Card>
      <Card :bordered="false" class="text-center">
        <p class="mb-2 text-sm text-muted-foreground">本月累计时长</p>
        <p class="text-3xl font-bold text-primary">{{ monthMinutes }}</p>
        <p class="text-xs text-muted-foreground">分钟</p>
      </Card>
    </div>
  </div>
</template>
