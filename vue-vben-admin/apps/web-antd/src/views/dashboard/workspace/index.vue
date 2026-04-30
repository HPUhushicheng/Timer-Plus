<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AnalysisOverview } from '@vben/common-ui';
import { SvgBellIcon, SvgCardIcon, SvgDownloadIcon } from '@vben/icons';
import { useAccessStore, useUserStore } from '@vben/stores';

import { getAnnouncementsApi } from '#/api';
import { useTimerStore } from '#/store';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();
const accessStore = useAccessStore();
const timerStore = useTimerStore();

const isAdmin = computed(() =>
  accessStore.accessCodes?.includes('admin') || false
);

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

const adminNavItems = [
  { name: 'UserManage', label: '用户管理', icon: 'lucide:user-cog' },
  { name: 'SeatManage', label: '座次管理', icon: 'lucide:layout-grid' },
  { name: 'AdminStats', label: '数据统计', icon: 'lucide:bar-chart-3' },
  { name: 'AnnounceManage', label: '公告管理', icon: 'lucide:megaphone' },
];

const latestAnnouncement = ref<{ title: string; content: string; created_at: string } | null>(null);

const navigate = (name: string) => {
  router.push({ name });
};

onMounted(async () => {
  if (userStore.userInfo?.userId) {
    timerStore.setDbId(userStore.userInfo.userId);
    timerStore.startTimer();
  }
  // 获取最新公告
  try {
    const list = await getAnnouncementsApi();
    if (list && (list as any[]).length > 0) {
      latestAnnouncement.value = (list as any[])[0];
    }
  } catch {
    // 静默失败，公告非核心功能
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
          <span
            v-if="isAdmin"
            class="ml-2 inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            管理员
          </span>
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

    <!-- 最新公告 -->
    <div
      v-if="latestAnnouncement"
      class="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 dark:border-blue-800 dark:bg-blue-950/30"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
        <span class="iconify size-4" data-icon="lucide:megaphone"></span>
        公告：{{ latestAnnouncement.title }}
      </div>
      <p class="mt-1 line-clamp-2 text-sm text-blue-600 dark:text-blue-300">
        {{ latestAnnouncement.content }}
      </p>
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

    <!-- 管理员快捷入口 -->
    <div v-if="isAdmin" class="mt-5">
      <h2 class="mb-4 text-lg font-semibold text-red-600">管理面板</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="item in adminNavItems"
          :key="item.name"
          class="card-box flex cursor-pointer items-center gap-4 px-5 py-6 transition-all hover:shadow-md"
          @click="navigate(item.name)"
        >
          <span class="iconify size-8 text-red-500" :data-icon="item.icon"></span>
          <div>
            <p class="font-medium">{{ item.label }}</p>
            <p class="text-sm text-muted-foreground">管理员专属</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
