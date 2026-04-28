<template>
  <div>
    <el-card class="dashboard-card">
      <h3>一周内在线用户时长分布</h3>
      <div class="ringChartRef" ref="ringChartRef" style="height: 400px;"></div>
    </el-card>
    <el-card class="dashboard-card">
      <h3>在线时长排行榜</h3>
      <div class="barChartRef" ref="barChartRef" style="height: 400px;"></div>
    </el-card>
    <button @click="goToHome">返回主页</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { authFetch } from '../config/index'

const router = useRouter()
const ringChartRef = ref(null)
const barChartRef = ref(null)
let ringChart = null
let barChart = null

const goToHome = () => router.push('/zy')

const handleResize = () => {
  ringChart?.resize()
  barChart?.resize()
}

const fetchData = async () => {
  try {
    const [usersRes, timeRes] = await Promise.all([
      authFetch('/list/all'),
      authFetch('/api/time/getall')
    ])
    const [usersData, timeData] = await Promise.all([usersRes.json(), timeRes.json()])
    const users = usersData.status === 200 ? usersData.data : []
    const timeRecords = timeData.status === 200 ? timeData.data : []

    const userTimeStats = {}
    timeRecords.forEach(record => {
      const key = `${record.id}_${record.date}_${record.daytime}`
      userTimeStats[key] = (userTimeStats[key] || 0) + Number(record.hourtime) / 60
    })

    const userTotalTime = {}
    Object.entries(userTimeStats).forEach(([key, minutes]) => {
      const [id] = key.split('_')
      userTotalTime[id] = (userTotalTime[id] || 0) + minutes
    })

    const combinedData = users.map(user => ({
      name: user.name,
      totalTime: Number(userTotalTime[user.id] || 0).toFixed(1)
    })).sort((a, b) => b.totalTime - a.totalTime).slice(0, 100)

    updateCharts(combinedData)
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const updateCharts = (userData) => {
  if (ringChartRef.value) {
    ringChart = echarts.init(ringChartRef.value)
    ringChart.setOption({
      tooltip: { trigger: 'item', formatter: '{a}<br/>{b}: {c}分钟 ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center' },
      series: [{
        name: '用户时长', type: 'pie', radius: ['50%', '70%'],
        label: { show: true, formatter: '{b}: {c}min' },
        data: userData.map(u => ({ name: u.name, value: u.totalTime })),
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }
      }]
    })
  }
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}分钟' },
      xAxis: { type: 'value', name: '时长(分钟)' },
      yAxis: { type: 'category', data: userData.map(u => u.name) },
      series: [{
        name: '在线时长', type: 'bar', data: userData.map(u => u.totalTime),
        itemStyle: { borderRadius: [0, 4, 4, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#83bff6' }, { offset: 1, color: '#188df0' }]) }
      }]
    })
  }
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ringChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.dashboard-card { width: 800px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
.dashboard-card h3 { text-align: center; margin-bottom: 20px; color: #333; }
.dashboard-card:hover { transform: scale(0.98); }
button { display: block; margin: 20px auto; padding: 10px 20px; border: none; border-radius: 5px; background-color: #409EFF; color: white; cursor: pointer; transition: background-color 0.3s; }
button:hover { background-color: #66b1ff; }
</style>
