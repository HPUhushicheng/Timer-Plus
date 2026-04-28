<template>
  <div>
    <el-card class="dashboard-card">
      <h3>今日在线时长</h3>
      <div ref="chartRef" style="height: 300px; width: 600px;"></div>
    </el-card>
    <button @click="goToHome" class="back-btn">返回主页</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore'
import { useRouter } from 'vue-router'
import { authFetch } from '../config/index'

const store = useOnlineDurationStore()
const router = useRouter()
const today = new Date()
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const chartRef = ref(null)
let chart = null

const fetchOnlineDuration = async (id: string) => {
  try {
    const res = await authFetch(`/api/time/get?id=${id}&date=${date}`)
    const data = await res.json()
    return data.status === 200 ? data.data : []
  } catch (error) {
    console.error('获取在线时长失败:', error)
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
    series: [{ name: '在线时长', type: 'line', data: hourtimeInMinutes }]
  })
}

const updateChart = async () => {
  const onlineDurationData = await fetchOnlineDuration(store.dbId)
  renderChart(onlineDurationData)
}

const goToHome = () => router.push('/zy')

onMounted(() => updateChart())

watch(() => store.dbId, async (newId, oldId) => {
  if (newId !== oldId) await updateChart()
})

onUnmounted(() => {
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.dashboard-card { width: 100%; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.back-btn { padding: 8px 20px; border: none; border-radius: 20px; background: #409EFF; color: white; cursor: pointer; transition: all 0.3s ease; }
.back-btn:hover { background: #66b1ff; transform: translateY(-2px); }
</style>
