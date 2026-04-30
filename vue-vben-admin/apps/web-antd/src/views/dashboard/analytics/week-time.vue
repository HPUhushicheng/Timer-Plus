<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { Radio } from 'ant-design-vue';

import { AnalysisChartCard } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getAllTimeApi, getAllUsersApi } from '#/api';

defineOptions({ name: 'WeekTime' });

const ringRef = ref<EchartsUIType>();
const barRef = ref<EchartsUIType>();
const { renderEcharts: renderRing } = useEcharts(ringRef);
const { renderEcharts: renderBar } = useEcharts(barRef);
const loading = ref(true);
const errorMsg = ref('');
const empty = ref(false);
const totalUsers = ref(0);
const selectedPeriod = ref<'week' | 'month' | 'semester' | 'all'>('month');

const COLORS = [
  '#4f69fd', '#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9',
  '#f5994e', '#c23531', '#61a0a8', '#d48265', '#91c7ae',
  '#e69d87', '#a6c84c', '#40a9ff', '#ff7875', '#95de64',
];

function getDateRange(period: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  switch (period) {
    case 'week': {
      const dayOfWeek = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return { dateFrom: `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`, dateTo: today };
    }
    case 'month':
      return { dateFrom: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, dateTo: today };
    case 'semester': {
      const m = now.getMonth() + 1;
      const start = m >= 2 && m <= 7 ? `${now.getFullYear()}-02-01` : `${now.getFullYear()}-09-01`;
      return { dateFrom: start, dateTo: today };
    }
    default:
      return {};
  }
}

async function loadData() {
  loading.value = true;
  errorMsg.value = '';
  empty.value = false;

  const period = selectedPeriod.value;
  const { dateFrom, dateTo } = getDateRange(period);

  // Deferred chart options (rendered after template shows EchartsUI components)
  let ringOptions: any = null;
  let barOptions: any = null;

  try {
    const [users, records] = await Promise.all([
      getAllUsersApi(),
      getAllTimeApi(1, 10000, dateFrom, dateTo),
    ]);

    const userList = (users ?? []) as any[];
    const timeRecords = (records ?? []) as any[];

    // Build id → name map
    const nameMap = new Map<number, string>();
    for (const u of userList) {
      nameMap.set(u.id, u.name || u.studentid || `用户${u.id}`);
    }

    // Aggregate duration per user
    const userMap = new Map<number, { name: string; duration: number }>();
    for (const r of timeRecords) {
      const total = (userMap.get(r.id)?.duration || 0) + (r.hourtime || 0);
      const name = nameMap.get(r.id) || `用户${r.id}`;
      userMap.set(r.id, { name, duration: total });
    }

    totalUsers.value = userMap.size;

    // Sort by duration descending
    const sorted = [...userMap.values()]
      .map((d) => ({ name: d.name, duration: Math.round(d.duration / 60) }))
      .sort((a, b) => b.duration - a.duration);

    if (sorted.length === 0 || sorted.every((d) => d.duration <= 0)) {
      empty.value = true;
      return;
    }

    // ── Prepare pie chart options: top 8 + 其他 ──
    const MAX_PIE = 8;
    let pieData: { name: string; value: number }[] = sorted.slice(0, MAX_PIE).map((d) => ({
      name: d.name,
      value: d.duration,
    }));
    if (sorted.length > MAX_PIE) {
      const others = sorted.slice(MAX_PIE);
      const otherTotal = others.reduce((s, d) => s + d.duration, 0);
      if (otherTotal > 0) {
        pieData.push({ name: `其他 (${others.length}人)`, value: otherTotal });
      }
    }

    ringOptions = {
      series: [{
        animationDelay() { return Math.random() * 400; },
        animationEasing: 'exponentialInOut',
        animationType: 'scale',
        center: ['50%', '50%'],
        color: COLORS,
        data: pieData,
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.25)', shadowOffsetX: 0 },
        },
        name: '时长（分钟）',
        radius: ['45%', '72%'],
        type: 'pie',
        label: { formatter: '{b}\n{d}%' },
      }],
      tooltip: {
        formatter: '{b}: {c} 分钟 ({d}%)',
        trigger: 'item',
      },
    };

    // ── Prepare bar chart options: top 10 ──
    const top10 = sorted.slice(0, 10);
    barOptions = {
      grid: { bottom: 50, containLabel: true, left: '1%', right: '1%', top: '5%' },
      series: [{
        barMaxWidth: 48,
        data: top10.map((d, i) => ({
          value: d.duration,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: i < 3
              ? { x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f69fd' }, { offset: 1, color: '#7c3aed' }] }
              : { x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#4f69fd' }, { offset: 1, color: '#5ab1ef' }] },
          },
        })),
        type: 'bar',
      }],
      tooltip: {
        axisPointer: { lineStyle: { width: 1 } },
        formatter: '{b}: {c} 分钟',
        trigger: 'axis',
      },
      xAxis: {
        axisLabel: { fontSize: 11, rotate: 30, overflow: 'truncate', width: 60 },
        data: top10.map((d) => d.name),
        type: 'category',
      },
      yAxis: { name: '分钟', splitNumber: 4, type: 'value' },
    };
  } catch (e: any) {
    errorMsg.value = e?.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }

  // Render charts after EchartsUI components are mounted (template updated)
  if (!errorMsg.value && !empty.value) {
    await nextTick();
    if (ringOptions) renderRing(ringOptions);
    if (barOptions) renderBar(barOptions);
  }
}

onMounted(loadData);
watch(selectedPeriod, loadData);
</script>

<template>
  <div class="p-5">
    <!-- Period selector -->
    <div class="mb-4 flex items-center gap-3">
      <span class="text-sm text-muted-foreground">统计范围：</span>
      <Radio.Group v-model:value="selectedPeriod" option-type="button" button-style="solid" size="small">
        <Radio.Button value="week">本周</Radio.Button>
        <Radio.Button value="month">本月</Radio.Button>
        <Radio.Button value="semester">本学期</Radio.Button>
        <Radio.Button value="all">全部历史</Radio.Button>
      </Radio.Group>
      <span v-if="!loading && !errorMsg && !empty" class="text-xs text-muted-foreground">
        共 {{ totalUsers }} 人
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
      <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
      加载中...
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <span class="iconify mb-2 size-12" data-icon="lucide:alert-circle" style="color: #f87171"></span>
      <p class="text-red-400">{{ errorMsg }}</p>
    </div>

    <!-- No data -->
    <div v-else-if="empty" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <span class="iconify mb-2 size-12" data-icon="lucide:inbox"></span>
      <p class="text-sm">该时段暂无在线时长数据</p>
    </div>

    <!-- Charts -->
    <div v-else class="w-full md:flex">
      <AnalysisChartCard class="md:mr-4 md:w-1/2" title="在线时长分布">
        <EchartsUI ref="ringRef" style="height:350px" />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/2" title="时长排行 TOP10">
        <EchartsUI ref="barRef" style="height:350px" />
      </AnalysisChartCard>
    </div>
  </div>
</template>
