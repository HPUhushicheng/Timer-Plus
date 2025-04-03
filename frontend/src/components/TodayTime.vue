<template>
<div class="layout-container">
 <!--侧边栏-->
 <el-menu
      class="sidebar"
      :collapse="isCollapse"
      :default-active="'1'"
      background-color="#FFFFFF"
      text-color="#666"
      active-text-color="#409EFF"
    >
      <div class="toggle-button" @click="isCollapse = !isCollapse">
        <el-icon><Operation /></el-icon>
      </div>
     
      <el-menu-item index="10" @click="zy" class="tubiao-item">
        <el-icon><House /></el-icon>
        <template #title>主页</template>
      </el-menu-item>

      <el-menu-item index="1" @click="todaytime" class="tubiao-item">
        <el-icon><Timer /></el-icon>
        <template #title>今日时长</template>
      </el-menu-item>

      <el-menu-item index="2" @click="weektime" class="tubiao-item">
        <el-icon><TrendCharts /></el-icon>
        <template #title>时长数据</template>
      </el-menu-item>

      <el-menu-item index="3" @click="sitechart" class="tubiao-item">
        <el-icon><User /></el-icon>
        <template #title>座次表</template>
      </el-menu-item>

      <el-menu-item index="8" @click="blinko" class="tubiao-item">
        <el-icon><Reading /></el-icon>
        <template #title>闪念笔记</template>
      </el-menu-item>

      <el-menu-item index="4" @click="dongtai" class="tubiao-item">
        <el-icon><Monitor /></el-icon>
        <template #title>电开社区</template>
      </el-menu-item>

      <el-menu-item index="5" @click="qq" class="tubiao-item">
        <el-icon><Service /></el-icon>
        <template #title>QQ群</template>
      </el-menu-item>

      <el-menu-item index="7" @click="chat" class="tubiao-item">
        <el-icon><ChatDotRound /></el-icon>
        <template #title>摸鱼</template>
      </el-menu-item>




      <el-menu-item index="9" @click="Login" class="logout-item">
        <el-icon><SwitchButton /></el-icon>
        <template #title>退出</template>
      </el-menu-item>
    </el-menu>

  <div>
    <el-card class="dashboard-card">
      <h3>今日在线时长</h3>
      <div ref="chartRef" style="height: 300px; width: 600px;"></div>
    </el-card>
    <button @click="goToHome" class="back-btn">返回主页</button>
  </div>
</div>

</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore';
import { useRouter } from 'vue-router';
import {Link,Service,ChatSquare, Reading,House,ChatDotRound,User,SwitchButton,Operation, Timer, TrendCharts, Monitor } from '@element-plus/icons-vue';



const store = useOnlineDurationStore();
const router = useRouter();


//侧边栏跳转
function todaytime(){
    router.push({path:'/todaytime'})
};
function weektime(){
  router.push({path:'/weektime'})
}
function dongtai(){
  window.open('http://blog.hpuedd.com', 'dynamicWindow', 'width=800,height=600,left=600,top=100')
}
function sitechart(){
  router.push({path:'/sitechart'})
}
function Login(){
  router.push({path:'/'})
}
function qq(){
  window.open('https://qm.qq.com/cgi-bin/qm/qr?k=xQrIgsi9NU-BhFlAN5rZ-qjMZ96lqX67&jump_from=webapi&authKey=oy66bHvHOBUilQ3N9oEoJhPwYfRQ/f086TAPZFKYBZrv56tTZDJxhvegerE2zJ6h','dynamicWindow', 'width=400,height=600,left=600,top=100')
}
function theme(){
  router.push({path:'/theme'})
}
function chat(){
  router.push({path:'/chat'})
}
function blinko(){
  window.open('http://111.170.163.14:1111/', 'dynamicWindow', 'width=400,height=700,left=600,top=100')
}
function zy(){
  router.push({path:'/zy'})
}

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
/* 基础布局 - 确保无滚动条 */
.layout-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

.sidebar {
  height: 800px;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: all 0.3s;
  border-right: 1px solid #e6e6e6;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
  border-radius: 0 24px 24px 0;
  overflow: hidden;
}

.sidebar:not(.el-menu--collapse) {
  width: 120px;
}

.toggle-button {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  color: #666;
  width: 100%;
  transition: all 0.3s;
}

.toggle-button:hover {
  background-color: #f6f6f6;
  color: #409EFF;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  transition: all 0.3s ease;
  margin: 4px 0;
}

:deep(.el-menu-item:hover) {
  background-color: #e6f7ff !important;
  transform: translateX(4px);
}

:deep(.el-menu-item.is-active) {
  background-color: #e6f7ff;
  border-right: 3px solid #ffffff;
}

:deep(.el-menu-item.is-active::after) {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: #ffffff;
  border-radius: 2px;
}

.logout-item {
  position: absolute;
  bottom: 210px;
  width: calc(100% - 24px);
  margin: 0 12px;
  border-top: 1px solid rgba(238,238,238,0.5);
  border-radius: 12px;
  transform: translateX(-16px); /* 向左移动12px */
}
.tubiao-item{
  width: calc(100% - 24px);
  margin: 0 12px;
  border-top: 1px solid rgba(238,238,238,0.5);
  border-radius: 12px;
  transform: translateX(-16px); /* 向左移动12px */ 
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 5px;
  transition: all 0.3s;
}
:deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin: 0;
  font-size: 20px;
}

.dashboard-card {
  position: relative;
  left:180px;
  top:100px;
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