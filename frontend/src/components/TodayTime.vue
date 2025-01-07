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
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore';
import { useRouter } from 'vue-router';

const store = useOnlineDurationStore();
const router = useRouter();

// 获取今天的日期
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const date = `${year}-${month}-${day}`;

const chartRef = ref(null);

const fetchOnlineDuration = async (id: string) => {
  const url = `http://47.120.68.44:666/api/time/get?id=${id}&date=${date}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取在线时长失败:', error);
    return [];
  }
};

const renderChart = (data: Array<{ daytime: number; hourtime: number }>) => {
  const daytime = data.map(item => item.daytime);
  const hourtimeInMinutes = data.map(item => item.hourtime / 60); // 将秒转换为分钟

  const chart = echarts.init(chartRef.value);
  const option = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: daytime.map(d => `${d}:00`), // 将时间段格式化为字符串
    },
    yAxis: {
      type: 'value',
      name: '在线时长（分钟）',
    },
    series: [
      {
        name: '在线时长',
        type: 'line',
        data: hourtimeInMinutes,
      },
    ],
  };

  chart.setOption(option);
};

const updateChart = async () => {
  const onlineDurationData = await fetchOnlineDuration(store.studentId);
  renderChart(onlineDurationData);
};

const goToHome = () => {
  router.push('/zy');
};

onMounted(() => {
  updateChart();
});

// 监听 store 中 studentId 的变化
watch(
  () => store.studentId,
  async (newId, oldId) => {
    if (newId !== oldId) {
      await updateChart();
    }
  }
);
</script>

<style scoped>
.dashboard-card {
  width: 100%;
  margin: 20px 0;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.back-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: #409EFF;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #66b1ff;
  transform: translateY(-2px);
}
</style>