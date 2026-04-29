<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { AnalysisChartCard } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getAllTimeApi } from '#/api';

defineOptions({ name: 'WeekTime' });

const ringRef = ref<EchartsUIType>();
const barRef = ref<EchartsUIType>();
const { renderEcharts: renderRing } = useEcharts(ringRef);
const { renderEcharts: renderBar } = useEcharts(barRef);
const loading = ref(true);

const COLORS = [
  '#4f69fd', '#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9',
  '#f5994e', '#c23531', '#61a0a8', '#d48265', '#91c7ae',
];

onMounted(async () => {
  try {
    const records: any[] = (await getAllTimeApi(1, 100)) ?? [];
    const userMap = new Map<string, number>();
    for (const r of records) {
      const name = String(r.id || '未知');
      userMap.set(name, (userMap.get(name) || 0) + (r.hourtime || 0));
    }
    const sorted = [...userMap.entries()]
      .map(([name, duration]) => ({ name, duration: Math.round(duration / 60) }))
      .sort((a, b) => b.duration - a.duration);
    const top10 = sorted.slice(0, 10);

    if (top10.length > 0) {
      // 环形图
      renderRing({
        series: [
          {
            animationDelay() { return Math.random() * 400; },
            animationEasing: 'exponentialInOut',
            animationType: 'scale',
            center: ['50%', '50%'],
            color: COLORS,
            data: top10.map((d) => ({ name: d.name, value: d.duration })),
            name: '在线时长分布',
            radius: ['45%', '70%'],
            type: 'pie',
          },
        ],
        tooltip: { trigger: 'item' },
      });

      // 柱状图
      renderBar({
        grid: { bottom: 0, containLabel: true, left: '1%', right: '1%', top: '5%' },
        series: [
          {
            barMaxWidth: 40,
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
          },
        ],
        tooltip: { axisPointer: { lineStyle: { width: 1 } }, trigger: 'axis' },
        xAxis: {
          axisLabel: { fontSize: 11, rotate: 20 },
          data: top10.map((d) => d.name),
          type: 'category',
        },
        yAxis: { name: '分钟', splitNumber: 4, type: 'value' },
      });
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-5">
    <div v-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
      <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
      加载中...
    </div>
    <div v-else class="w-full md:flex">
      <AnalysisChartCard class="md:mr-4 md:w-1/2" title="在线时长分布">
        <EchartsUI ref="ringRef" />
      </AnalysisChartCard>
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/2" title="时长排行 TOP10">
        <EchartsUI ref="barRef" />
      </AnalysisChartCard>
    </div>
  </div>
</template>
