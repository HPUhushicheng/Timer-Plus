<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';
import { usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  getAdminStatsApi,
  getAllTimeApi,
  getAnnouncementsApi,
  getTimeApi,
  type Announcement,
} from '#/api';
import { useTimerStore } from '#/store';

defineOptions({ name: 'Workspace' });

const DAILY_TARGET_SECONDS = 8 * 3600;

const router = useRouter();
const userStore = useUserStore();
const accessStore = useAccessStore();
const timerStore = useTimerStore();
const { isDark } = usePreferences();

const isAdmin = computed(() => accessStore.accessCodes?.includes('admin') || false);

const toneMap = {
  amber: {
    glow: 'bg-amber-400/30',
    icon: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    tag: 'bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-300',
  },
  blue: {
    glow: 'bg-sky-400/30',
    icon: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
    tag: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
    text: 'text-sky-700 dark:text-sky-300',
  },
  emerald: {
    glow: 'bg-emerald-400/30',
    icon: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    tag: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  rose: {
    glow: 'bg-rose-400/30',
    icon: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
    tag: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
    text: 'text-rose-700 dark:text-rose-300',
  },
  teal: {
    glow: 'bg-teal-400/30',
    icon: 'bg-teal-500/12 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
    tag: 'bg-teal-500/12 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
    text: 'text-teal-700 dark:text-teal-300',
  },
} as const;

type ToneKey = keyof typeof toneMap;

const now = ref(new Date());
let clockTimer: ReturnType<typeof setInterval> | null = null;

const todayStoredSeconds = ref(0);
const monthStoredSeconds = ref(0);
const metricsLoading = ref(false);
const latestAnnouncement = ref<Announcement | null>(null);
const announcementDismissed = ref(false);
const adminOverview = ref({
  onlineCount: 0,
  todayTotalMinutes: 0,
  totalUsers: 0,
});

const subtitles: Record<string, string> = {
  '下午好': '把常用操作和关键信息收在一屏里，节奏会稳定很多。',
  '中午好': '留一点空白给休整，再把下午的节奏拉回来。',
  '夜深了': '夜深更适合做需要沉浸的事，但也别忘了留出休息。',
  '早上好': '先把最重要的事情放到前面，工作台已经替你铺好路。',
  '晚上好': '把今天收束干净，明天启动会更轻松。',
  '上午好': '复杂任务尽量在注意力最完整的时候推进。',
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const navCards: Array<{
  desc: string;
  icon: string;
  label: string;
  name: string;
  tag: string;
  tone: ToneKey;
}> = [
  {
    name: 'TodayTime',
    label: '今日时长',
    desc: '按小时查看今天的在线分布和专注节奏。',
    icon: 'lucide:clock-3',
    tag: '实时',
    tone: 'teal',
  },
  {
    name: 'WeekTime',
    label: '一周数据',
    desc: '快速看排行、分布和最近一段时间的整体状态。',
    icon: 'lucide:chart-column-big',
    tag: '统计',
    tone: 'blue',
  },
  {
    name: 'SiteChart',
    label: '座次表',
    desc: '查看实验室工位和成员座位分布。',
    icon: 'lucide:layout-grid',
    tag: '协作',
    tone: 'emerald',
  },
  {
    name: 'DongTai',
    label: '更新动态',
    desc: '跟进版本更新、界面调整和功能变更。',
    icon: 'lucide:sparkles',
    tag: '版本',
    tone: 'amber',
  },
  {
    name: 'QQGroup',
    label: '问题反馈',
    desc: '遇到使用问题时，直接进入反馈入口和群协作。',
    icon: 'lucide:message-circle-more',
    tag: '支持',
    tone: 'rose',
  },
  {
    name: 'Profile',
    label: '个人资料',
    desc: '维护个人信息、密码和基础账号设置。',
    icon: 'lucide:user-round',
    tag: '账号',
    tone: 'teal',
  },
];

const adminNavItems: Array<{ desc: string; icon: string; label: string; name: string }> = [
  {
    name: 'UserManage',
    label: '用户管理',
    icon: 'lucide:user-cog',
    desc: '维护成员资料与权限角色。',
  },
  {
    name: 'SeatManage',
    label: '座次管理',
    icon: 'lucide:armchair',
    desc: '调整展示座位和可见状态。',
  },
  {
    name: 'AdminStats',
    label: '数据统计',
    icon: 'lucide:bar-chart-3',
    desc: '查看实验室整体在线趋势。',
  },
  {
    name: 'AnnounceManage',
    label: '公告管理',
    icon: 'lucide:megaphone',
    desc: '发布、收回和维护系统公告。',
  },
];

const dateStr = computed(() => {
  const current = now.value;
  return `${current.getFullYear()}年${current.getMonth() + 1}月${current.getDate()}日`;
});

const weekDay = computed(() => `星期${weekDays[now.value.getDay()]}`);

const liveClock = computed(() => {
  const current = now.value;
  return `${pad(current.getHours())}:${pad(current.getMinutes())}`;
});

const liveClockFull = computed(() => {
  const current = now.value;
  return `${pad(current.getHours())}:${pad(current.getMinutes())}:${pad(current.getSeconds())}`;
});

const todayKey = computed(() => {
  const current = now.value;
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
});

const monthStart = computed(() => {
  const current = now.value;
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-01`;
});

const greeting = computed(() => {
  const hour = now.value.getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const todayTotalSeconds = computed(() => todayStoredSeconds.value + timerStore.onlineDuration);
const monthTotalSeconds = computed(() => monthStoredSeconds.value + timerStore.onlineDuration);
const sessionDurationLabel = computed(() => formatDurationLong(timerStore.onlineDuration));
const todayProgress = computed(() =>
  Math.min(100, Math.round((todayTotalSeconds.value / DAILY_TARGET_SECONDS) * 100)),
);
const remainingTargetSeconds = computed(() =>
  Math.max(0, DAILY_TARGET_SECONDS - todayTotalSeconds.value),
);

const progressHint = computed(() => {
  if (todayTotalSeconds.value <= 0) {
    return '今天的在线记录刚开始，先把第一段专注做完整。';
  }
  if (remainingTargetSeconds.value <= 0) {
    return '今天已经超过 8 小时目标，建议在下一个段落前短暂休息。';
  }
  return `距离 8 小时目标还差 ${formatDurationLong(remainingTargetSeconds.value)}。`;
});

const sessionSummary = computed(() => {
  const seconds = timerStore.onlineDuration;
  if (seconds < 15 * 60) {
    return '刚进入工作状态，适合先推进启动成本低的任务。';
  }
  if (seconds < 45 * 60) {
    return '节奏已经稳定，正适合连续处理需要思考的工作。';
  }
  if (seconds < 90 * 60) {
    return '当前专注段落表现不错，做完这一段再切换更顺。';
  }
  return '连续在线时段已经较长，处理完当前块后建议起身活动一下。';
});

const announcementTime = computed(() => {
  if (!latestAnnouncement.value?.created_at) return '';
  return formatAnnouncementTime(latestAnnouncement.value.created_at);
});

const heroStats = computed(() => {
  if (isAdmin.value) {
    return [
      {
        desc: metricsLoading.value ? '正在同步今日数据' : '已含当前在线时长',
        icon: 'lucide:timer',
        label: '今日累计',
        tone: 'teal' as ToneKey,
        value: formatDurationBrief(todayTotalSeconds.value),
      },
      {
        desc: `${monthStart.value.slice(5)} 至今`,
        icon: 'lucide:calendar-range',
        label: '本月累计',
        tone: 'blue' as ToneKey,
        value: formatDurationBrief(monthTotalSeconds.value),
      },
      {
        desc:
          remainingTargetSeconds.value <= 0
            ? '已完成今日目标'
            : `还差 ${formatDurationLong(remainingTargetSeconds.value)}`,
        icon: 'lucide:target',
        label: '目标进度',
        tone: 'amber' as ToneKey,
        value: `${todayProgress.value}%`,
      },
      {
        desc: `团队今日 ${adminOverview.value.todayTotalMinutes} 分钟`,
        icon: 'lucide:users-round',
        label: '实验室在线',
        tone: 'rose' as ToneKey,
        value: `${adminOverview.value.onlineCount}/${adminOverview.value.totalUsers}`,
      },
    ];
  }

  return [
    {
      desc: metricsLoading.value ? '正在同步今日数据' : '已含当前在线时长',
      icon: 'lucide:timer',
      label: '今日累计',
      tone: 'teal' as ToneKey,
      value: formatDurationBrief(todayTotalSeconds.value),
    },
    {
      desc: `${monthStart.value.slice(5)} 至今`,
      icon: 'lucide:calendar-range',
      label: '本月累计',
      tone: 'blue' as ToneKey,
      value: formatDurationBrief(monthTotalSeconds.value),
    },
    {
      desc:
        remainingTargetSeconds.value <= 0
          ? '已完成今日目标'
          : `还差 ${formatDurationLong(remainingTargetSeconds.value)}`,
      icon: 'lucide:target',
      label: '目标进度',
      tone: 'amber' as ToneKey,
      value: `${todayProgress.value}%`,
    },
    {
      desc: '每 60 秒自动回传一次在线时长',
      icon: 'lucide:radio-tower',
      label: '同步状态',
      tone: 'emerald' as ToneKey,
      value: '自动记录中',
    },
  ];
});

const insightItems = computed(() => {
  if (isAdmin.value) {
    return [
      {
        desc: sessionSummary.value,
        icon: 'lucide:gauge',
        title: '当前节奏',
      },
      {
        desc: progressHint.value,
        icon: 'lucide:target',
        title: '目标提醒',
      },
      {
        desc: `当前 ${adminOverview.value.onlineCount} / ${adminOverview.value.totalUsers} 人在线，团队今日累计 ${adminOverview.value.todayTotalMinutes} 分钟。`,
        icon: 'lucide:activity',
        title: '实验室概览',
      },
    ];
  }

  return [
    {
      desc: sessionSummary.value,
      icon: 'lucide:gauge',
      title: '当前节奏',
    },
    {
      desc: progressHint.value,
      icon: 'lucide:target',
      title: '目标提醒',
    },
    {
      desc: '遇到问题可以直接进入问题反馈页，或先查看更新动态确认是否已有说明。',
      icon: 'lucide:messages-square',
      title: '协作支持',
    },
  ];
});

function pad(num: number) {
  return String(num).padStart(2, '0');
}

function formatDurationBrief(totalSec: number) {
  const seconds = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes} 分钟`;
}

function formatDurationLong(totalSec: number) {
  const seconds = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  return `${minutes} 分钟`;
}

function formatAnnouncementTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

function navigate(name: string) {
  router.push({ name });
}

function dismissAnnouncement() {
  announcementDismissed.value = true;
  if (latestAnnouncement.value) {
    localStorage.setItem(`ann_dismissed_${latestAnnouncement.value.id}`, '1');
  }
}

async function loadUsageMetrics() {
  const currentDbId =
    userStore.userInfo?.userId || timerStore.dbId || localStorage.getItem('timer_dbId') || '';

  if (!currentDbId) {
    todayStoredSeconds.value = 0;
    monthStoredSeconds.value = 0;
    return;
  }

  metricsLoading.value = true;

  try {
    const [todayRecords, monthRecords, adminStats] = await Promise.all([
      getTimeApi(currentDbId, todayKey.value),
      getAllTimeApi(1, 10000, monthStart.value, todayKey.value),
      isAdmin.value ? getAdminStatsApi() : Promise.resolve(null),
    ]);

    todayStoredSeconds.value = ((todayRecords ?? []) as any[]).reduce(
      (sum, record) => sum + (Number(record.hourtime) || 0),
      0,
    );

    monthStoredSeconds.value = ((monthRecords ?? []) as any[])
      .filter((record: any) => String(record.id) === String(currentDbId))
      .reduce((sum, record) => sum + (Number(record.hourtime) || 0), 0);

    if (adminStats) {
      adminOverview.value = {
        onlineCount: Number((adminStats as any).onlineCount) || 0,
        todayTotalMinutes: Number((adminStats as any).todayTotalMinutes) || 0,
        totalUsers: Number((adminStats as any).totalUsers) || 0,
      };
    } else {
      adminOverview.value = {
        onlineCount: 0,
        todayTotalMinutes: 0,
        totalUsers: 0,
      };
    }
  } catch {
    // ignore request failures and keep fallback values
  } finally {
    metricsLoading.value = false;
  }
}

async function loadAnnouncement() {
  try {
    const list = ((await getAnnouncementsApi()) ?? []) as Announcement[];
    const latest = list[0] ?? null;

    latestAnnouncement.value = latest;
    announcementDismissed.value = latest
      ? localStorage.getItem(`ann_dismissed_${latest.id}`) === '1'
      : false;
  } catch {
    latestAnnouncement.value = null;
    announcementDismissed.value = false;
  }
}

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1000);

  if (userStore.userInfo?.userId) {
    timerStore.setDbId(userStore.userInfo.userId);
    timerStore.startTimer();
  }

  void loadUsageMetrics();
  void loadAnnouncement();
});

watch(todayKey, () => {
  void loadUsageMetrics();
});

watch(isAdmin, () => {
  void loadUsageMetrics();
});

onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
});
</script>

<template>
  <div :class="{ dark: isDark, 'is-dark': isDark }" class="workspace-shell -m-5">
    <section class="workbench-hero">
      <div class="glow-orb glow-orb-left" />
      <div class="glow-orb glow-orb-right" />

      <div class="relative px-5 pb-6 pt-6 sm:px-6 lg:px-8 xl:px-10 xl:pb-8 xl:pt-8">
        <div class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div class="hero-panel">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-white/70 backdrop-blur dark:bg-slate-800/75 dark:text-slate-300 dark:ring-slate-700/70">
                <IconifyIcon icon="lucide:calendar-range" class="size-4" />
                {{ dateStr }} {{ weekDay }}
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white shadow-sm dark:bg-slate-900">
                <IconifyIcon icon="lucide:clock-3" class="size-4" />
                本地时间 {{ liveClock }}
              </div>
            </div>

            <div class="mt-6">
              <div class="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                <IconifyIcon icon="lucide:panel-top" class="size-4" />
                工作台
              </div>

              <h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50">
                {{ greeting }}，{{ userStore.userInfo?.realName || '同学' }}
                <span
                  v-if="isAdmin"
                  class="ml-2 inline-flex items-center rounded-full bg-rose-500/12 px-3 py-1 align-middle text-xs font-medium text-rose-700 dark:bg-rose-400/15 dark:text-rose-300"
                >
                  管理员
                </span>
              </h1>

              <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {{ subtitles[greeting] || '把今天的节奏整理清楚，后面的操作会顺很多。' }}
              </p>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="stat in heroStats"
                :key="stat.label"
                class="metric-card"
              >
                <div
                  class="metric-icon"
                  :class="toneMap[stat.tone].icon"
                >
                  <IconifyIcon :icon="stat.icon" class="size-4" />
                </div>
                <p class="mt-5 text-[11px] font-medium uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">
                  {{ stat.label }}
                </p>
                <p class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  {{ stat.value }}
                </p>
                <p class="mt-1.5 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  {{ stat.desc }}
                </p>
              </div>
            </div>
          </div>

          <div class="dashboard-panel focus-panel">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="section-kicker">Focus</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  当前专注
                </h2>
              </div>
              <span class="status-pill">
                <span class="status-dot" />
                实时同步
              </span>
            </div>

            <div class="mt-6 rounded-[28px] bg-[linear-gradient(135deg,#0f172a,#134e4a)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.25)] dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(13,148,136,0.7))]">
              <p class="text-[11px] uppercase tracking-[0.28em] text-white/45">
                Now
              </p>
              <p class="mt-3 font-mono text-4xl font-semibold tracking-[0.14em] sm:text-5xl">
                {{ liveClockFull }}
              </p>
              <div class="mt-4 flex items-center justify-between gap-3 text-sm text-white/72">
                <span>本次在线</span>
                <span class="font-semibold text-white">{{ sessionDurationLabel }}</span>
              </div>
              <p class="mt-3 text-sm leading-6 text-white/70">
                {{ sessionSummary }}
              </p>
            </div>

            <div class="mt-5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500 dark:text-slate-400">今日目标进度</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">
                  {{ todayProgress }}%
                </span>
              </div>
              <div class="progress-track mt-3">
                <div class="progress-fill" :style="{ width: `${todayProgress}%` }" />
              </div>
              <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {{ progressHint }}
              </p>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                class="hero-action hero-action-primary"
                @click="navigate('TodayTime')"
              >
                <span class="flex items-center gap-2">
                  <IconifyIcon icon="lucide:chart-spline" class="size-4" />
                  查看今日曲线
                </span>
                <IconifyIcon icon="lucide:arrow-up-right" class="size-4 opacity-80" />
              </button>

              <button
                type="button"
                class="hero-action"
                @click="navigate(isAdmin ? 'AnnounceManage' : 'QQGroup')"
              >
                <span class="flex items-center gap-2">
                  <IconifyIcon
                    :icon="isAdmin ? 'lucide:megaphone' : 'lucide:messages-square'"
                    class="size-4"
                  />
                  {{ isAdmin ? '进入公告管理' : '提交问题反馈' }}
                </span>
                <IconifyIcon icon="lucide:arrow-right" class="size-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="px-5 pb-6 pt-6 sm:px-6 lg:px-8 xl:px-10">
      <div class="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div class="space-y-5">
          <section class="dashboard-panel">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="section-kicker">Workspace</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  工作入口
                </h2>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                常用能力集中在这里，少跳转一层就少一次打断。
              </p>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button
                v-for="item in navCards"
                :key="item.name"
                type="button"
                class="quick-card group text-left"
                @click="navigate(item.name)"
              >
                <div
                  class="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-0 blur-3xl transition duration-300 group-hover:opacity-100"
                  :class="toneMap[item.tone].glow"
                />

                <div class="flex items-start justify-between gap-4">
                  <div
                    class="quick-card-icon"
                    :class="toneMap[item.tone].icon"
                  >
                    <IconifyIcon :icon="item.icon" class="size-5" />
                  </div>

                  <span
                    class="quick-tag"
                    :class="toneMap[item.tone].tag"
                  >
                    {{ item.tag }}
                  </span>
                </div>

                <p class="mt-6 text-lg font-semibold text-slate-950 dark:text-slate-50">
                  {{ item.label }}
                </p>
                <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {{ item.desc }}
                </p>

                <div
                  class="mt-6 flex items-center text-sm font-medium"
                  :class="toneMap[item.tone].text"
                >
                  立即进入
                  <IconifyIcon
                    icon="lucide:arrow-up-right"
                    class="ml-1 size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </button>
            </div>
          </section>

          <section v-if="isAdmin" class="dashboard-panel admin-panel">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="section-kicker">Admin</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  管理面板
                </h2>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                面向管理员的高频入口单独抽出来，减少重复路径。
              </p>
            </div>

            <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <button
                v-for="item in adminNavItems"
                :key="item.name"
                type="button"
                class="admin-card"
                @click="navigate(item.name)"
              >
                <div class="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300">
                  <IconifyIcon :icon="item.icon" class="size-5" />
                </div>
                <p class="mt-5 text-base font-semibold text-slate-950 dark:text-slate-50">
                  {{ item.label }}
                </p>
                <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {{ item.desc }}
                </p>
              </button>
            </div>
          </section>
        </div>

        <div class="space-y-5">
          <section class="dashboard-panel announcement-panel">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="section-kicker">Broadcast</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  最新公告
                </h2>
              </div>

              <button
                v-if="latestAnnouncement && !announcementDismissed"
                type="button"
                class="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                @click="dismissAnnouncement"
              >
                收起
              </button>

              <button
                v-else-if="latestAnnouncement && announcementDismissed"
                type="button"
                class="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                @click="announcementDismissed = false"
              >
                重新展开
              </button>
            </div>

            <template v-if="latestAnnouncement && !announcementDismissed">
              <div class="mt-5 rounded-[28px] border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,247,237,0.88))] p-5 dark:border-amber-800/50 dark:bg-[linear-gradient(135deg,rgba(69,26,3,0.45),rgba(30,41,59,0.65))]">
                <div class="flex items-start gap-4">
                  <div class="announcement-icon">
                    <IconifyIcon icon="lucide:megaphone" class="size-5" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2 text-xs text-amber-800/80 dark:text-amber-200/70">
                      <span class="rounded-full bg-white/70 px-2.5 py-1 font-medium shadow-sm dark:bg-amber-100/10">
                        最新
                      </span>
                      <span>{{ announcementTime || '刚刚更新' }}</span>
                      <span v-if="latestAnnouncement.created_by">
                        · {{ latestAnnouncement.created_by }}
                      </span>
                    </div>

                    <h3 class="mt-3 text-lg font-semibold text-slate-950 dark:text-slate-50">
                      {{ latestAnnouncement.title }}
                    </h3>
                    <p class="mt-3 line-clamp-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
                      {{ latestAnnouncement.content }}
                    </p>
                  </div>
                </div>

                <div class="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    class="mini-action mini-action-amber"
                    @click="navigate('DongTai')"
                  >
                    查看更新动态
                  </button>
                  <button
                    v-if="isAdmin"
                    type="button"
                    class="mini-action"
                    @click="navigate('AnnounceManage')"
                  >
                    管理公告
                  </button>
                </div>
              </div>
            </template>

            <div v-else-if="latestAnnouncement && announcementDismissed" class="empty-panel mt-5">
              <IconifyIcon icon="lucide:bell-off" class="size-10 text-slate-300 dark:text-slate-600" />
              <p class="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                公告已收起
              </p>
              <p class="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                需要时可以重新展开，或者直接进入更新动态查看最近版本说明。
              </p>
            </div>

            <div v-else class="empty-panel mt-5">
              <IconifyIcon icon="lucide:inbox" class="size-10 text-slate-300 dark:text-slate-600" />
              <p class="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                暂无公告
              </p>
              <p class="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                当前没有新的广播信息，后续更新会优先出现在这里。
              </p>
            </div>
          </section>

          <section class="dashboard-panel">
            <div>
              <p class="section-kicker">Insight</p>
              <h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                今日提示
              </h2>
            </div>

            <div class="mt-5 space-y-3">
              <div
                v-for="item in insightItems"
                :key="item.title"
                class="insight-item"
              >
                <div class="insight-icon">
                  <IconifyIcon :icon="item.icon" class="size-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {{ item.title }}
                  </p>
                  <p class="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {{ item.desc }}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-shell {
  background:
    radial-gradient(circle at left top, rgba(20, 184, 166, 0.08), transparent 28%),
    radial-gradient(circle at 85% 15%, rgba(14, 165, 233, 0.08), transparent 22%),
    linear-gradient(180deg, #f8fafc 0%, #f5fffb 28%, #f8fafc 100%);
}

.workbench-hero {
  position: relative;
  overflow: hidden;
}

.workbench-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.15));
  opacity: 0.65;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(12px);
  animation: float-orb 9s ease-in-out infinite;
  pointer-events: none;
}

.glow-orb-left {
  left: -120px;
  top: -120px;
  height: 280px;
  width: 280px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.38), transparent 70%);
}

.glow-orb-right {
  right: -90px;
  top: 30px;
  height: 240px;
  width: 240px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.28), transparent 70%);
  animation-delay: -3s;
}

.hero-panel {
  position: relative;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.72));
  padding: 1.5rem;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(18px);
}

.dashboard-panel {
  border-radius: 28px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.88);
  padding: 1.5rem;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(20px);
}

.metric-card {
  position: relative;
  overflow: hidden;
  min-height: 150px;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.74));
  padding: 1.125rem;
}

.metric-card::after {
  content: '';
  position: absolute;
  inset: auto -18% -46% 42%;
  height: 110px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.08), transparent 72%);
  pointer-events: none;
}

.metric-icon {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.95rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.78);
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(71 85 105);
}

.status-dot {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 9999px;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
}

.progress-track {
  height: 10px;
  overflow: hidden;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.18);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #14b8a6 0%, #22c55e 56%, #f59e0b 100%);
  transition: width 0.35s ease;
}

.hero-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.88);
  padding: 0.95rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(15 23 42);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.hero-action:hover {
  transform: translateY(-2px);
  border-color: rgba(148, 163, 184, 0.7);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.hero-action-primary {
  border-color: transparent;
  background: linear-gradient(135deg, #0f172a, #134e4a);
  color: white;
}

.quick-card {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  border-radius: 26px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(249, 250, 251, 0.88));
  padding: 1.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.quick-card::after {
  content: '';
  position: absolute;
  inset: auto -16% -52% 46%;
  height: 120px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.08), transparent 70%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.quick-card:hover {
  transform: translateY(-4px);
  border-color: rgba(148, 163, 184, 0.45);
  box-shadow: 0 22px 45px rgba(15, 23, 42, 0.1);
}

.quick-card:hover::after {
  opacity: 1;
}

.quick-card-icon {
  display: inline-flex;
  height: 3rem;
  width: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 1.2rem;
}

.quick-tag {
  border-radius: 9999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.admin-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 247, 237, 0.94));
}

.admin-card {
  min-height: 210px;
  border-radius: 24px;
  border: 1px solid rgba(254, 215, 170, 0.88);
  background: rgba(255, 255, 255, 0.84);
  padding: 1.2rem;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.admin-card:hover {
  transform: translateY(-3px);
  border-color: rgba(251, 146, 60, 0.4);
  box-shadow: 0 20px 40px rgba(251, 146, 60, 0.12);
}

.announcement-icon {
  display: inline-flex;
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.mini-action {
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.78);
  padding: 0.55rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(51 65 85);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.mini-action:hover {
  transform: translateY(-1px);
  border-color: rgba(148, 163, 184, 0.6);
}

.mini-action-amber {
  border-color: rgba(245, 158, 11, 0.22);
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.empty-panel {
  border-radius: 26px;
  border: 1px dashed rgba(203, 213, 225, 0.95);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.74), rgba(255, 255, 255, 0.9));
  padding: 2rem 1.35rem;
  text-align: center;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  border-radius: 22px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.7));
  padding: 1rem;
}

.insight-icon {
  display: inline-flex;
  height: 2.4rem;
  width: 2.4rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.95rem;
  background: rgba(15, 23, 42, 0.06);
  color: rgb(15 23 42);
}

.section-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(100, 116, 139, 0.86);
}

@keyframes float-orb {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(0, 14px, 0) scale(1.05);
  }
}

.workspace-shell.is-dark {
  background:
    radial-gradient(circle at left top, rgba(45, 212, 191, 0.1), transparent 28%),
    radial-gradient(circle at 86% 14%, rgba(56, 189, 248, 0.1), transparent 20%),
    linear-gradient(180deg, #0f172a 0%, #111827 30%, #0f172a 100%);
}

.workspace-shell.is-dark .workbench-hero::before {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  opacity: 0.32;
}

.workspace-shell.is-dark .hero-panel {
  border-color: rgba(71, 85, 105, 0.72);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.86), rgba(30, 41, 59, 0.7));
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.32);
}

.workspace-shell.is-dark .dashboard-panel {
  border-color: rgba(71, 85, 105, 0.76);
  background: rgba(30, 41, 59, 0.76);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
}

.workspace-shell.is-dark .metric-card {
  border-color: rgba(71, 85, 105, 0.78);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(51, 65, 85, 0.68));
}

.workspace-shell.is-dark .status-pill {
  border-color: rgba(71, 85, 105, 0.78);
  background: rgba(30, 41, 59, 0.78);
  color: rgb(226 232 240);
}

.workspace-shell.is-dark .hero-action {
  border-color: rgba(71, 85, 105, 0.78);
  background: rgba(30, 41, 59, 0.76);
  color: rgb(241 245 249);
}

.workspace-shell.is-dark .quick-card {
  border-color: rgba(71, 85, 105, 0.8);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(51, 65, 85, 0.7));
}

.workspace-shell.is-dark .admin-panel {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.72));
}

.workspace-shell.is-dark .admin-card {
  border-color: rgba(120, 113, 108, 0.55);
  background: rgba(30, 41, 59, 0.74);
}

.workspace-shell.is-dark .announcement-icon {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.workspace-shell.is-dark .mini-action {
  border-color: rgba(71, 85, 105, 0.78);
  background: rgba(30, 41, 59, 0.76);
  color: rgb(226 232 240);
}

.workspace-shell.is-dark .mini-action-amber {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}

.workspace-shell.is-dark .empty-panel {
  border-color: rgba(100, 116, 139, 0.76);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(51, 65, 85, 0.82));
}

.workspace-shell.is-dark .insight-item {
  border-color: rgba(71, 85, 105, 0.78);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.76), rgba(51, 65, 85, 0.68));
}

.workspace-shell.is-dark .insight-icon {
  background: rgba(148, 163, 184, 0.12);
  color: rgb(241 245 249);
}

@media (max-width: 640px) {
  .hero-panel,
  .dashboard-panel {
    border-radius: 24px;
    padding: 1.2rem;
  }

  .quick-card {
    min-height: 200px;
  }

  .admin-card {
    min-height: 180px;
  }
}
</style>
