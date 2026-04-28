<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { AnalysisChartCard } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getAllTimeApi, getAllUsersApi } from '#/api';

defineOptions({ name: 'WeekTime' });

const ringChartRef = ref<EchartsUIType>();
const barChartRef = ref<EchartsUIType>();
const { renderEcharts: renderRing } = useEcharts(ringChartRef);
const { renderEcharts: renderBar } = useEcharts(barChartRef);
const loading = ref(false);

const fetchData = async () => {
  try {
    const [usersData, timeData] = await Promise.all([
      getAllUsersApi(),
      getAllTimeApi(),
    ]);
    const users = usersData || [];
    const timeRecords = timeData || [];

    // 按用户聚合时长
    const userTotalTime: Record<string, number> = {};
    timeRecords.forEach((record: any) => {
      const minutes = Number(record.hourtime) / 60;
      userTotalTime[record.id] = (userTotalTime[record.id] || 0) + minutes;
    });

    const combinedData = users
      .map((user: any) => ({
        name: user.name,
        totalTime: Number(userTotalTime[user.id] || 0).toFixed(1),
      }))
      .sort((a: any, b: any) => b.totalTime - a.totalTime);

    updateCharts(combinedData);
  } catch {
    console.error('获取数据失败');
  }
};

const updateCharts = (userData: any[]) => {
  // 环形图 - TOP 10
  renderRing({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}分钟 ({d}%)',
    },
    legend: {
      bottom: '2%',
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        color: ['#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9', '#e6a23c', '#f56c6c', '#909399', '#409eff', '#67c23a', '#e6a23c'],
        data: userData.slice(0, 10).map((u: any) => ({
          name: u.name,
          value: u.totalTime,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 11,
        },
      },
    ],
  });

  // 条形图 - TOP 20
  const top20 = userData.slice(0, 20).reverse();
  renderBar({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c}分钟',
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '分钟',
      splitNumber: 4,
    },
    yAxis: {
      type: 'category',
      data: top20.map((u: any) => u.name),
      axisLabel: { fontSize: 11 },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 20,
        data: top20.map((u: any) => ({
          value: u.totalTime,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#409EFF' },
                { offset: 1, color: '#67C23A' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
      },
    ],
  });
};

onMounted(() => {
  loading.value = true;
  fetchData().finally(() => {
    loading.value = false;
  });
});
</script>

<template>
  <div class="p-5">
    <div class="mb-6">
      <h2 class="text-2xl font-bold">一周数据统计</h2>
    </div>

    <div class="w-full md:flex md:gap-5">
      <AnalysisChartCard
        :loading="loading"
        class="mt-5 md:mt-0 md:w-1/2"
        title="在线时长分布 TOP 10"
      >
        <EchartsUI ref="ringChartRef" />
      </AnalysisChartCard>
      <AnalysisChartCard
        :loading="loading"
        class="mt-5 md:mt-0 md:w-1/2"
        title="在线时长排行榜 TOP 20"
      >
        <EchartsUI ref="barChartRef" />
      </AnalysisChartCard>
    </div>
  </div>
</template>
