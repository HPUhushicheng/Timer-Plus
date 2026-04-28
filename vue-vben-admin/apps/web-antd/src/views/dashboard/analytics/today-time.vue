<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { AnalysisChartCard } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useUserStore } from '@vben/stores';

import { getTimeApi } from '#/api';
import { useTimerStore } from '#/store';

defineOptions({ name: 'TodayTime' });

const timerStore = useTimerStore();
const userStore = useUserStore();
const today = new Date();
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const loading = ref(false);
const hasError = ref(false);

const fetchOnlineDuration = async (id: string) => {
  try {
    const data = await getTimeApi(id, date);
    return data || [];
  } catch {
    hasError.value = true;
    return [];
  }
};

const renderChart = (data: Array<{ daytime: number; hourtime: number }>) => {
  const daytime = data.map((item) => item.daytime);
  const hourtimeInMinutes = data.map((item) => Number((item.hourtime / 60).toFixed(1)));

  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        lineStyle: { color: '#409EFF', width: 1 },
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: daytime.map((d) => `${d}:00`),
      axisLabel: { interval: 0, rotate: 45, fontSize: 11 },
      axisTick: { show: false },
      splitLine: {
        lineStyle: { type: 'solid', width: 1 },
        show: true,
      },
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      splitNumber: 4,
      splitArea: { show: true },
    },
    series: [
      {
        name: '在线时长',
        type: 'line',
        smooth: true,
        data: hourtimeInMinutes,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64,158,255,0.3)' },
              { offset: 1, color: 'rgba(64,158,255,0.05)' },
            ],
          },
        },
        itemStyle: { color: '#409EFF' },
        symbolSize: 6,
      },
    ],
  });
};

const updateChart = async () => {
  loading.value = true;
  hasError.value = false;
  const id = timerStore.dbId || userStore.userInfo?.userId || '';
  if (!id) {
    hasError.value = true;
    loading.value = false;
    return;
  }
  const onlineDurationData = await fetchOnlineDuration(id);
  if (!hasError.value && onlineDurationData.length > 0) {
    renderChart(onlineDurationData);
  }
  loading.value = false;
};

onMounted(() => {
  updateChart();
});

watch(
  () => timerStore.dbId,
  async (newId, oldId) => {
    if (newId !== oldId) await updateChart();
  },
);
</script>

<template>
  <div class="p-5">
    <div class="mb-6">
      <h2 class="text-2xl font-bold">今日在线时长</h2>
      <p class="text-muted-foreground mt-1 text-sm">{{ date }}</p>
    </div>

    <AnalysisChartCard :loading="loading" title="在线时长趋势">
      <div v-if="hasError" class="flex h-[400px] items-center justify-center">
        <a-empty description="暂无数据" />
      </div>
      <EchartsUI v-else ref="chartRef" />
    </AnalysisChartCard>
  </div>
</template>
