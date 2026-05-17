<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { Card, Table, Tag, Tooltip } from 'ant-design-vue';

import {
  getActivitySummaryApi,
  getAllTimeApi,
  getTimeApi,
} from '#/api';
import { useTimerStore } from '#/store';

defineOptions({ name: 'MyStats' });

const loading = ref(true);
const todayRawMinutes = ref(0);
const todayEffectiveMinutes = ref(0);
const monthMinutes = ref(0);
const avgActivityScore = ref<number | null>(null);
const discountRate = ref(0);
const hourlyData = ref<any[]>([]);
const suspiciousFlags = ref<string[]>([]);
const recentDays = ref<any[]>([]);

// 人类可读的可疑标记说明
const FLAG_LABELS: Record<string, string> = {
  no_mouse_activity: '鼠标无活动',
  script_like_mouse_trajectory: '鼠标轨迹疑似脚本',
  noise_like_mouse_trajectory: '鼠标轨迹疑似噪声',
  suspiciously_smooth_acceleration: '鼠标加速度过于平滑',
  no_keystroke_activity: '键盘无输入',
  script_like_keystroke_timing: '击键节奏疑似脚本',
  window_never_focused: '窗口从未获得焦点',
  suspiciously_stable_background: '窗口长时间后台运行',
  too_regular_activity_rhythm: '活动节律过于规律',
  prolonged_system_idle: '系统长时间空闲',
  mouse_only_automation: '仅有鼠标活动疑似自动化',
  no_activity_proof: '缺少活性证据',
  request_too_frequent: '上报过于频繁',
  report_gap_too_large: '上报间隔过长',
  no_sampler_available: '无法采集行为数据',
};

function flagLabel(flag: string): string {
  return FLAG_LABELS[flag] || flag;
}

function flagColor(flag: string): string {
  if (flag.includes('script') || flag.includes('automation') || flag.includes('noise')) return 'red';
  if (flag.includes('no_') || flag.includes('never') || flag.includes('too_regular')) return 'orange';
  return 'blue';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}

function parseFlags(flags: any): string[] {
  if (!flags) return [];
  if (Array.isArray(flags)) return flags;
  try {
    const parsed = typeof flags === 'string' ? JSON.parse(flags) : flags;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 行为维度说明
const DIMENSIONS = [
  { key: 'mouse', label: '鼠标操作', desc: '基于鼠标轨迹分形维度和速度熵值判断操作自然度' },
  { key: 'keystroke', label: '键盘输入', desc: '基于击键间隔变异系数判断是否为真人打字' },
  { key: 'focus', label: '窗口焦点', desc: '基于窗口切换频率和前台停留时间评估活跃程度' },
  { key: 'rhythm', label: '活动节律', desc: '基于操作爆发-暂停模式判断是否为规律性脚本' },
  { key: 'system', label: '系统状态', desc: '基于系统空闲时间和锁屏状态判断是否在电脑前' },
];

const columns = [
  { title: '时段', dataIndex: 'daytime', key: 'daytime', width: 60 },
  { title: '原始时长', dataIndex: 'raw', key: 'raw', width: 100 },
  { title: '有效时长', dataIndex: 'effective', key: 'effective', width: 100 },
  { title: '折扣率', dataIndex: 'discount', key: 'discount', width: 80 },
  { title: '活性评分', dataIndex: 'score', key: 'score', width: 90 },
  { title: '可疑标记', dataIndex: 'flags', key: 'flags' },
];

// 格式化成表格需要的行
interface HourlyRow {
  key: string;
  daytime: string;
  raw: string;
  effective: string;
  discount: string;
  score: string;
  flags: any;
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
    const [todayRecords, monthRecords, summaryResp] = await Promise.all([
      getTimeApi(userId, today),
      getAllTimeApi(1, 10000, monthStart, today, userId),
      getActivitySummaryApi(userId, today),
    ]);

    const summary = summaryResp as any;

    // ── 今日活性摘要 ──
    if (summary) {
      todayRawMinutes.value = Math.round((summary.totalRawSeconds || 0) / 60);
      todayEffectiveMinutes.value = Math.round((summary.totalEffectiveSeconds || 0) / 60);
      avgActivityScore.value = summary.avgActivityScore;
      discountRate.value = summary.discountRate !== undefined
        ? Math.round((1 - Number(summary.discountRate)) * 100)
        : 0;
    }

    // ── 今日每时段明细 ──
    const rows = ((todayRecords ?? []) as any[]).map((r: any) => {
      const raw = r.hourtime || 0;
      const eff = r.effective_seconds || raw;
      const score = r.activity_score;
      const flags = parseFlags(r.suspicious_flags);

      if (flags.length > 0) {
        for (const f of flags) {
          if (!suspiciousFlags.value.includes(f)) {
            suspiciousFlags.value.push(f);
          }
        }
      }

      return {
        key: `h-${r.daytime}`,
        daytime: `${r.daytime}:00`,
        raw: fmtTime(raw),
        effective: fmtTime(eff),
        discount: raw > 0 ? `${Math.round((1 - eff / raw) * 100)}%` : '-',
        score: score !== null && score !== undefined ? `${score}/100` : '-',
        flags: flags,
      } as HourlyRow;
    });

    hourlyData.value = rows;

    // ── 月统计（使用 effective_seconds） ──
    monthMinutes.value = Math.round(
      ((monthRecords ?? []) as any[]).reduce(
        (sum: number, r: any) => sum + (Number(r.effective_seconds ?? r.hourtime) || 0),
        0,
      ) / 60,
    );

    // ── 近 7 天趋势（用一次 getAllTimeApi 替代 7 次串行调用） ──
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = `${weekStart.getFullYear()}-${pad(weekStart.getMonth() + 1)}-${pad(weekStart.getDate())}`;

    try {
      const weekRecords = (await getAllTimeApi(1, 10000, weekStartStr, today, userId)) ?? [];

      // 按日期分组聚合
      const byDate = new Map<string, { raw: number; eff: number; scores: number[] }>();
      for (const r of weekRecords as any[]) {
        const d = String(r.date).slice(5); // MM-DD
        if (!byDate.has(d)) byDate.set(d, { raw: 0, eff: 0, scores: [] });
        const acc = byDate.get(d)!;
        acc.raw += Number(r.hourtime) || 0;
        acc.eff += Number(r.effective_seconds ?? r.hourtime) || 0;
        if (r.activity_score !== null && r.activity_score !== undefined) {
          acc.scores.push(Number(r.activity_score));
        }
      }

      // 填充 7 天
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const data = byDate.get(key);
        recentDays.value.push({
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          raw: data ? Math.round(data.raw / 60) : 0,
          effective: data ? Math.round(data.eff / 60) : 0,
          score: data && data.scores.length > 0
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
            : null,
        });
      }
    } catch {
      // 趋势加载失败时静默留空
    }
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-4 px-4 py-4">
    <div v-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
      <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
      加载中...
    </div>
    <template v-else>
      <!-- ── 顶部概览卡片 ── -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card :bordered="false" class="text-center">
          <p class="mb-1 text-xs text-muted-foreground">今日原始时长</p>
          <p class="text-2xl font-bold text-primary">{{ todayRawMinutes }}</p>
          <p class="text-xs text-muted-foreground">分钟</p>
        </Card>
        <Card :bordered="false" class="text-center">
          <p class="mb-1 text-xs text-muted-foreground">今日有效时长</p>
          <p class="text-2xl font-bold text-success">{{ todayEffectiveMinutes }}</p>
          <p class="text-xs text-muted-foreground">分钟</p>
        </Card>
        <Card :bordered="false" class="text-center">
          <p class="mb-1 text-xs text-muted-foreground">活性评分</p>
          <p class="text-2xl font-bold" :class="(avgActivityScore ?? 0) >= 70 ? 'text-success' : 'text-warning'">
            {{ avgActivityScore ?? '-' }}
          </p>
          <p class="text-xs text-muted-foreground">/ 100</p>
        </Card>
        <Card :bordered="false" class="text-center">
          <p class="mb-1 text-xs text-muted-foreground">综合折扣率</p>
          <p class="text-2xl font-bold" :class="discountRate <= 20 ? 'text-success' : 'text-warning'">
            {{ discountRate }}%
          </p>
          <p class="text-xs text-muted-foreground">越低越好</p>
        </Card>
      </div>

      <!-- ── 近 7 天趋势 ── -->
      <Card title="近 7 天趋势" :bordered="false">
        <div class="flex items-end gap-3 overflow-x-auto pb-2">
          <div v-for="day in recentDays" :key="day.date" class="flex flex-col items-center gap-1">
            <div class="flex flex-col items-center gap-0.5">
              <Tooltip :title="`有效 ${day.effective} 分钟`">
                <div
                  class="w-8 rounded-t"
                  :style="{ height: Math.max(4, (day.effective || 0) / 2) + 'px', background: 'var(--color-success)' }"
                ></div>
              </Tooltip>
              <Tooltip :title="`原始 ${day.raw} 分钟`">
                <div
                  class="w-8 rounded-t"
                  :style="{ height: Math.max(4, (day.raw || 0) / 2) + 'px', background: 'var(--color-primary)' }"
                ></div>
              </Tooltip>
            </div>
            <span class="text-xs text-muted-foreground">{{ day.date }}</span>
            <span v-if="day.score !== null" class="text-[10px]" :class="day.score >= 70 ? 'text-success' : 'text-warning'">
              {{ day.score }}
            </span>
          </div>
        </div>
      </Card>

      <!-- ── 可疑标记汇总 ── -->
      <Card v-if="suspiciousFlags.length > 0" title="检测到的行为标记" :bordered="false">
        <div class="flex flex-wrap gap-2">
          <Tag v-for="flag in suspiciousFlags" :key="flag" :color="flagColor(flag)">
            {{ flagLabel(flag) }}
          </Tag>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          行为标记用于评估当前时段的活跃程度，多条标记会叠加影响时长折扣。
          保持鼠标移动和键盘输入可以减少标记产生。
        </p>
      </Card>

      <!-- ── 行为维度说明 ── -->
      <Card title="行为评分维度" :bordered="false">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="dim in DIMENSIONS" :key="dim.key" class="rounded-lg border border-border p-3">
            <p class="mb-1 text-sm font-medium">{{ dim.label }}</p>
            <p class="text-xs text-muted-foreground">{{ dim.desc }}</p>
          </div>
        </div>
      </Card>

      <!-- ── 今日每时段明细表 ── -->
      <Card title="今日每时段明细" :bordered="false">
        <Table
          v-if="hourlyData.length > 0"
          :data-source="hourlyData"
          :columns="columns"
          :pagination="false"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'flags'">
              <Tag v-if="record.flags.length === 0" color="green">正常</Tag>
              <Tag
                v-for="flag in record.flags"
                :key="flag"
                :color="flagColor(flag)"
                class="mb-0.5"
              >
                {{ flagLabel(flag) }}
              </Tag>
            </template>
          </template>
        </Table>
        <p v-else class="py-4 text-center text-sm text-muted-foreground">
          今日暂无学习时长记录
        </p>
      </Card>

      <!-- ── 月统计 ── -->
      <Card :bordered="false" class="text-center">
        <p class="mb-1 text-sm text-muted-foreground">本月累计时长</p>
        <p class="text-3xl font-bold text-primary">{{ monthMinutes }}</p>
        <p class="text-xs text-muted-foreground">分钟</p>
      </Card>
    </template>
  </div>
</template>
