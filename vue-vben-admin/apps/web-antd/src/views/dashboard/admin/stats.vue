<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin } from 'ant-design-vue';

import { getAdminStatsApi, getAllTimeApi } from '#/api';

defineOptions({ name: 'AdminStats' });

const loading = ref(true);
const totalUsers = ref(0);
const onlineCount = ref(0);
const todayMinutes = ref(0);
const last7Days = ref<{ date: string; minutes: number }[]>([]);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

onMounted(async () => {
  try {
    const stats = await getAdminStatsApi();
    totalUsers.value = stats.totalUsers || 0;
    onlineCount.value = stats.onlineCount || 0;
    todayMinutes.value = stats.todayTotalMinutes || 0;

    // Fetch last 7 days data for trend
    const now = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }

    const allRecords = ((await getAllTimeApi(1, 10000, days[0], days[days.length - 1])) ?? []) as any[];
    last7Days.value = days.map((date) => {
      const minutes = allRecords
        .filter((r: any) => r.date === date)
        .reduce((s: number, r: any) => s + (r.hourtime || 0), 0);
      return { date, minutes: Math.round(minutes / 60) };
    });
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-5">
    <Spin :spinning="loading">
      <!-- Stats cards -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card :bordered="false" class="text-center">
          <p class="mb-2 text-sm text-muted-foreground">总用户数</p>
          <p class="text-3xl font-bold text-primary">{{ totalUsers }}</p>
        </Card>
        <Card :bordered="false" class="text-center">
          <p class="mb-2 text-sm text-muted-foreground">当前在线</p>
          <p class="text-3xl font-bold" :class="onlineCount > 0 ? 'text-green-500' : 'text-muted-foreground'">
            {{ onlineCount }}
          </p>
        </Card>
        <Card :bordered="false" class="text-center">
          <p class="mb-2 text-sm text-muted-foreground">今日总时长</p>
          <p class="text-3xl font-bold text-primary">{{ todayMinutes }}</p>
          <p class="text-xs text-muted-foreground">分钟</p>
        </Card>
      </div>

      <!-- Last 7 days trend → simple list because reusing EchartsUI pulls in extra deps -->
      <Card title="最近7天在线时长趋势" :bordered="false">
        <div v-if="last7Days.length === 0" class="py-8 text-center text-muted-foreground">
          暂无数据
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="day in last7Days"
            :key="day.date"
            class="flex items-center gap-3"
          >
            <span class="w-24 text-sm">{{ day.date.slice(5) }}</span>
            <div class="h-5 flex-1 rounded bg-muted">
              <div
                class="h-full rounded bg-primary/60 transition-all"
                :style="{
                  width: last7Days.reduce((m, d) => Math.max(m, d.minutes), 0) > 0
                    ? `${Math.round((day.minutes / Math.max(1, last7Days.reduce((m, d) => Math.max(m, d.minutes), 0))) * 100)}%`
                    : '0%',
                }"
              />
            </div>
            <span class="w-16 text-right text-sm tabular-nums">{{ day.minutes }} 分钟</span>
          </div>
        </div>
      </Card>
    </Spin>
  </div>
</template>
