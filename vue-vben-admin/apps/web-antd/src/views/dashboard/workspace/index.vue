<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { AnalysisOverview } from '@vben/common-ui';
import { SvgBellIcon, SvgCardIcon, SvgDownloadIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { useTimerStore } from '#/store';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();
const timerStore = useTimerStore();

const today = new Date();
const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const weekDay = `星期${weekDays[today.getDay()]}`;

const greeting = computed(() => {
  const hour = today.getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const onlineSeconds = computed(() => timerStore.onlineDuration);

const overviewItems: AnalysisOverviewItem[] = [
  {
    icon: SvgCardIcon,
    title: '今日在线',
    totalTitle: '本次在线',
    totalValue: onlineSeconds.value,
    value: onlineSeconds.value,
  },
  {
    icon: SvgDownloadIcon,
    title: '座次表',
    totalTitle: '查看实验室座位',
    totalValue: 0,
    value: 0,
  },
  {
    icon: SvgBellIcon,
    title: '一周数据',
    totalTitle: '本周统计排行',
    totalValue: 0,
    value: 0,
  },
  {
    icon: SvgCardIcon,
    title: '更新动态',
    totalTitle: '最新版本日志',
    totalValue: 0,
    value: 0,
  },
];

const quickNavItems = [
  { name: 'TodayTime', label: '今日时长', icon: 'lucide:clock' },
  { name: 'SiteChart', label: '座次表', icon: 'lucide:users' },
  { name: 'WeekTime', label: '一周数据', icon: 'lucide:trending-up' },
  { name: 'DongTai', label: '更新动态', icon: 'lucide:bell' },
];

const navigate = (name: string) => {
  router.push({ name });
};

onMounted(() => {
  if (userStore.userInfo?.userId) {
    timerStore.setDbId(userStore.userInfo.userId);
    timerStore.startTimer();
  }
});
</script>

<template>
  <div class="p-5">
    <!-- 欢迎区域 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          {{ greeting }}，{{ userStore.userInfo?.realName || '用户' }}
        </h1>
        <p class="mt-1 text-muted-foreground">
          {{ dateStr }} {{ weekDay }}
        </p>
      </div>
      <div class="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-sm">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
        </span>
        <span class="text-sm text-muted-foreground">在线 {{ Math.floor(onlineSeconds / 60) }} 分钟</span>
      </div>
    </div>

    <!-- 概览卡片 -->
    <AnalysisOverview :items="overviewItems" />

    <!-- 快捷入口 -->
    <div class="mt-5">
      <h2 class="mb-4 text-lg font-semibold">快捷入口</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="item in quickNavItems"
          :key="item.name"
          class="card-box flex cursor-pointer items-center gap-4 px-5 py-6 transition-all hover:shadow-md"
          @click="navigate(item.name)"
        >
          <span class="iconify size-8 text-primary" :data-icon="item.icon"></span>
          <div>
            <p class="font-medium">{{ item.label }}</p>
            <p class="text-sm text-muted-foreground">点击进入</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
