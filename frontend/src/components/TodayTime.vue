<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore'
import { authFetch } from '../config/index'

const store = useOnlineDurationStore()
const today = new Date()
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const chartRef = ref(null)
const loading = ref(false)
const hasError = ref(false)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const fetchOnlineDuration = async (id: string) => {
  try {
    const res = await authFetch(`/api/time/get?id=${id}&date=${date}`)
    const data = await res.json()
    return data.status === 200 ? data.data : []
  } catch {
    hasError.value = true
    return []
  }
}

const renderChart = (data: Array<{ daytime: number; hourtime: number }>) => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const daytime = data.map(item => item.daytime)
  const hourtimeInMinutes = data.map(item => item.hourtime / 60)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: daytime.map(d => `${d}:00`) },
    yAxis: { type: 'value', name: '在线时长（分钟）' },
    series: [{ name: '在线时长', type: 'line', smooth: true, data: hourtimeInMinutes, areaStyle: { color: 'rgba(64,158,255,0.1)' }, itemStyle: { color: '#409EFF' } }]
  })
}

const updateChart = async () => {
  loading.value = true
  hasError.value = false
  const onlineDurationData = await fetchOnlineDuration(store.dbId)
  if (!hasError.value) {
    renderChart(onlineDurationData)
  }
  loading.value = false
}

onMounted(() => {
  updateChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartRef.value)
  }
})

watch(() => store.dbId, async (newId, oldId) => {
  if (newId !== oldId) await updateChart()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div class="today-time-page">
    <div class="page-header">
      <h2>今日在线时长</h2>
      <p class="date-info">{{ date }}</p>
    </div>
    <el-card class="chart-card" v-loading="loading">
      <div v-if="hasError" class="empty-state">
        <el-empty description="获取数据失败，请稍后重试" />
      </div>
      <div v-else ref="chartRef" style="height: 400px; width: 100%;"></div>
    </el-card>
  </div>
</template>

<style scoped>
.today-time-page {
  max-width: 1000px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.date-info {
  font-size: 14px;
  color: var(--color-text-placeholder);
}

.chart-card {
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}
</style>
