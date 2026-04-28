<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { authFetch } from '../config/index'

const ringChartRef = ref(null)
const barChartRef = ref(null)
const loading = ref(false)
let ringChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const fetchData = async () => {
  try {
    const [usersRes, timeRes] = await Promise.all([
      authFetch('/list/all'),
      authFetch('/api/time/getall')
    ])
    const [usersData, timeData] = await Promise.all([usersRes.json(), timeRes.json()])
    const users = usersData.status === 200 ? usersData.data : []
    const timeRecords = timeData.status === 200 ? timeData.data : []

    const userTimeStats: Record<string, number> = {}
    timeRecords.forEach((record: any) => {
      const key = `${record.id}_${record.date}_${record.daytime}`
      userTimeStats[key] = (userTimeStats[key] || 0) + Number(record.hourtime) / 60
    })

    const userTotalTime: Record<string, number> = {}
    Object.entries(userTimeStats).forEach(([key, minutes]) => {
      const [id] = key.split('_')
      userTotalTime[id] = (userTotalTime[id] || 0) + minutes
    })

    const combinedData = users
      .map((user: any) => ({
        name: user.name,
        totalTime: Number(userTotalTime[user.id] || 0).toFixed(1)
      }))
      .sort((a: any, b: any) => b.totalTime - a.totalTime)

    updateCharts(combinedData)
  } catch {
    console.error('获取数据失败')
  }
}

const updateCharts = (userData: any[]) => {
  if (ringChartRef.value) {
    ringChart = echarts.init(ringChartRef.value)
    ringChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}分钟 ({d}%)' },
      series: [{
        type: 'pie', radius: ['50%', '75%'],
        data: userData.slice(0, 10).map((u: any) => ({ name: u.name, value: u.totalTime })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 }
      }]
    })
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
    const top20 = userData.slice(0, 20).reverse()
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}分钟' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', name: '时长（分钟）' },
      yAxis: { type: 'category', data: top20.map((u: any) => u.name), axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar', data: top20.map((u: any) => u.totalTime),
        itemStyle: { color: '#409EFF', borderRadius: [0, 4, 4, 0] }
      }]
    })
  }
}

onMounted(() => {
  loading.value = true
  fetchData().finally(() => { loading.value = false })
  const container = ringChartRef.value?.parentElement
  if (container) {
    resizeObserver = new ResizeObserver(() => {
      ringChart?.resize()
      barChart?.resize()
    })
    resizeObserver.observe(container)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  ringChart?.dispose()
  barChart?.dispose()
})
</script>

<template>
  <div class="week-time-page">
    <div class="page-header">
      <h2>一周数据统计</h2>
    </div>
    <div class="charts-grid" v-loading="loading">
      <el-card class="stat-card">
        <template #header><span>一周在线用户时长分布</span></template>
        <div ref="ringChartRef" style="height: 400px; width: 100%;"></div>
      </el-card>
      <el-card class="stat-card">
        <template #header><span>在线时长排行榜 TOP 20</span></template>
        <div ref="barChartRef" style="height: 460px; width: 100%;"></div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.week-time-page {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.stat-card {
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.stat-card :deep(.el-card__header) {
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid #ebeef5;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
