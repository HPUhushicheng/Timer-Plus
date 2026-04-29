<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { AnalysisChartCard } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getTimeApi } from '#/api';

defineOptions({ name: 'TodayTime' });

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const loading = ref(true);
const empty = ref(false);
const errorMsg = ref('');

onMounted(async () => {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const records = (await getTimeApi('', dateStr)) ?? [];
    if (records.length === 0) {
      empty.value = true;
      return;
    }
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const data = hours.map((_h, i) => {
      const match = records.find((r: any) => r.daytime === i);
      return match ? Math.round(match.hourtime / 60) : 0;
    });
    renderEcharts({
      grid: { bottom: 0, containLabel: true, left: '1%', right: '1%', top: '5%' },
      series: [
        {
          areaStyle: {
            color: {
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(79,105,253,0.25)' },
                { offset: 1, color: 'rgba(79,105,253,0.02)' },
              ],
            },
          },
          data,
          itemStyle: { color: '#4f69fd', borderRadius: [4, 4, 0, 0] },
          smooth: true,
          type: 'line',
        },
      ],
      tooltip: {
        axisPointer: { lineStyle: { width: 1 } },
        trigger: 'axis',
      },
      xAxis: {
        axisLabel: { fontSize: 11 },
        data: hours,
        type: 'category',
      },
      yAxis: {
        name: '分钟',
        splitNumber: 4,
        type: 'value',
      },
    });
  } catch (e: any) {
    errorMsg.value = e?.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-5">
    <AnalysisChartCard title="今日在线时长分布">
      <EchartsUI v-if="!loading && !empty && !errorMsg" ref="chartRef" />
      <div v-else-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
        加载中...
      </div>
      <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mb-2 size-12" data-icon="lucide:alert-circle" style="color: #f87171"></span>
        <p class="text-red-400">{{ errorMsg }}</p>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mb-2 size-12" data-icon="lucide:inbox"></span>
        <p>暂无今日数据</p>
      </div>
    </AnalysisChartCard>
  </div>
</template>
