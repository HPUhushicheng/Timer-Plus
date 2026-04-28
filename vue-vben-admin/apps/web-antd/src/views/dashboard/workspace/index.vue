<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';

import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { AnalysisChartCard, AnalysisOverview } from '@vben/common-ui';
import { SvgClockIcon, SvgCakeIcon, SvgCardIcon, SvgBellIcon } from '@vben/icons';
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

const onlineDisplay = computed(() => {
  const seconds = timerStore.onlineDuration;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}小时${m}分钟`;
  if (m > 0) return `${m}分钟${s}秒`;
  return `${s}秒`;
});

const overviewItems: AnalysisOverviewItem[] = [
  {
    icon: SvgClockIcon,
    title: '本次在线',
    totalTitle: '在线时长',
    totalValue: 0,
    value: 0,
  },
  {
    icon: SvgCakeIcon,
    title: '今日时长',
    totalTitle: '今日在线',
    totalValue: 0,
    value: 0,
  },
  {
    icon: SvgCardIcon,
    title: '本周天数',
    totalTitle: '本周打卡',
    totalValue: 0,
    value: 0,
  },
  {
    icon: SvgBellIcon,
    title: '累计时长',
    totalTitle: '累计在线',
    totalValue: 0,
    value: 0,
  },
];

const cards = [
  {
    name: 'TodayTime',
    label: '今日时长',
    desc: '查看今日在线时长分布',
    icon: SvgClockIcon,
    color: '#409EFF',
  },
  {
    name: 'SiteChart',
    label: '座次表',
    desc: '遇见每一位独特的灵魂',
    icon: SvgCakeIcon,
    color: '#67C23A',
  },
  {
    name: 'WeekTime',
    label: '一周数据',
    desc: '本周在线时长统计排行',
    icon: SvgCardIcon,
    color: '#E6A23C',
  },
  {
    name: 'DongTai',
    label: '更新动态',
    desc: '查看最新版本更新日志',
    icon: SvgBellIcon,
    color: '#909399',
  },
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
    <div class="mb-6">
      <h1 class="text-2xl font-bold">
        {{ greeting }}，{{ userStore.userInfo?.realName || '用户' }}
      </h1>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ dateStr }} {{ weekDay }} · 本次在线 {{ onlineDisplay }}
      </p>
    </div>

    <!-- 概览卡片 -->
    <AnalysisOverview :items="overviewItems" />

    <!-- 功能入口卡片 -->
    <div class="mt-5 w-full md:flex md:flex-wrap">
      <AnalysisChartCard
        v-for="card in cards"
        :key="card.name"
        class="mt-5 md:mr-4 md:w-[calc(50%-0.5rem)]"
        :style="{ '--card-color': card.color }"
        :title="card.label"
        @click="navigate(card.name)"
      >
        <div class="flex cursor-pointer items-center gap-4 p-4">
          <div
            class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl"
            :style="{ background: card.color }"
          >
            <component :is="card.icon" class="text-white" />
          </div>
          <div>
            <p class="text-muted-foreground text-sm">{{ card.desc }}</p>
          </div>
        </div>
      </AnalysisChartCard>
    </div>
  </div>
</template>

<style scoped>
.analysis-chart-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.analysis-chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
