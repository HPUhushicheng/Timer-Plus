<template>
  <div class="layout-container">
  <!--侧边栏-->
  <el-menu
      class="sidebar"
      :collapse="isCollapse"
      :default-active="'2'"
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


    <div class="cards-container">
      <el-card class="dashboard-card">
        <h3>当月在线时长统计</h3>
        <div class="monthChartRef" ref="monthChartRef" style="height: 400px;"></div>
      </el-card>

      <el-card class="dashboard-card">
        <h3>在线总时长分布</h3>
        <div class="ringChartRef" ref="ringChartRef" style="height: 400px; min-height: 400px;"></div>

      </el-card>

      <el-card class="dashboard-card">
      <h3>在线总时长排行榜</h3>
      <div class="barChartRef" ref="barChartRef" style="height: 450px;"></div>
    </el-card>

    </div>
  </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import * as echarts from 'echarts';
  import { useRouter } from 'vue-router';
  import axios from 'axios';
  import {Link,Service,ChatSquare,House,Reading, ChatDotRound,User,SwitchButton,Operation, Timer, TrendCharts, Monitor } from '@element-plus/icons-vue';
  
  function todaytime(){
    router.push({path:'/todaytime'})
};
function weektime(){
  router.push({path:'/weektime'})
}
function dongtai(){
  window.open('http://blog.hpuedd.com', 'dynamicWindow', 'width=400,height=630,left=600,top=100')
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
  window.open('http://111.170.163.14:1111/', 'dynamicWindow', 'width=400,height=630,left=600,top=100')
}
function zy(){
  router.push({path:'/zy'})
}


  const router = useRouter();
  const ringChartRef = ref(null);
  const barChartRef = ref(null);
  const monthChartRef = ref(null);

  const goToHome = () => {
  router.push('/zy'); // 跳转到首页
};

  // 获取数据并处理
  const fetchData = async () => {
    try {
      // 获取用户信息和时长数据
      const [usersResponse, timeResponse] = await Promise.all([
        axios.get('http://47.120.68.44:666/list/all'),
        axios.get('http://47.120.68.44:666/api/time/getall')
      ]);

      // 处理数据
      const users = usersResponse.data;
      const timeData = timeResponse.data;

      // 创建用户时长统计
      const userTimeStats = {};
      
      // 这里需要按照 date 和 daytime 分组统计
      timeData.forEach(record => {
        const key = `${record.id}_${record.date}_${record.daytime}`;
        if (!userTimeStats[key]) {
          userTimeStats[key] = 0;
        }
        userTimeStats[key] = Number(record.hourtime) / 60; // 转换为分钟
      });

      // 然后按用户汇总每天每小时的时长
      const userTotalTime = {};
      Object.entries(userTimeStats).forEach(([key, minutes]) => {
        const [id] = key.split('_');
        if (!userTotalTime[id]) {
          userTotalTime[id] = 0;
        }
        userTotalTime[id] += minutes;
      });

      const combinedData = users.map(user => ({
        name: user.name,
        totalTime: Number(userTotalTime[user.id] || 0).toFixed(1)
      }));

      // 按时长排序
      combinedData.sort((a, b) => b.totalTime - a.totalTime);
      
      // 取前100名用户
      const top100Users = combinedData.slice(0, 100);

      // 处理当月数据
      // 当月数据统计（从1号到当前日期）
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      console.log('原始时间数据:', timeData);
      
      const monthData = timeData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === currentYear &&
               recordDate.getMonth() + 1 === currentMonth;
      });
      
      console.log('当月筛选数据:', monthData);

      const monthStats = {};
      monthData.forEach(record => {
        if (!monthStats[record.id]) {
          monthStats[record.id] = 0;
        }
        monthStats[record.id] += Number(record.hourtime) / 60;
      });

      const monthChartData = users.map(user => ({
        name: user.name,
        value: Number(monthStats[user.id] || 0).toFixed(1)
      })).sort((a, b) => b.value - a.value).slice(0, 20);

      // 更新图表
      updateCharts({
        weeklyData: top100Users,
        monthlyData: monthChartData
      });
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };


  // 更新图表
  const updateCharts = ({weeklyData, monthlyData}) => {
    // 环形图
    const ringChart = echarts.init(ringChartRef.value);
    const ringOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} 分钟 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: weeklyData?.map(user => user.name) || []
      },
      series: [{
        name: '用户时长',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          formatter: '{b}: {c}min'
        },
        data: weeklyData.map(user => ({
          name: user.name,
          value: user.totalTime
        })),
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        }
      }]
    };
    ringChart.setOption(ringOption);

    // 柱状图
    const barChart = echarts.init(barChartRef.value);
    const barOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c} 分钟'
      },
      xAxis: {
        type: 'value',
        name: '时长(分钟)'
      },
      yAxis: {
        type: 'category',
        data: weeklyData?.map(user => user.name) || []
      },
      series: [{
        name: '在线时长',
        type: 'bar',
        data: weeklyData?.map(user => user.totalTime) || [],
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }]
    };
    barChart.setOption(barOption);

    // 当月时长图表
    const monthChart = echarts.init(monthChartRef.value);
    const monthOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 分钟'
      },
      xAxis: {
        type: 'category',
        data: monthlyData.map(item => item.name),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '时长(分钟)'
      },
      series: [{
        data: monthlyData.map(item => item.value),
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }]
    };
    monthChart.setOption(monthOption);

    // 添加窗口大小改变时的自适应
    window.addEventListener('resize', () => {
      monthChart?.resize();
    });
  };

  // 组件挂载时获取数据
  onMounted(() => {
    fetchData();
    
    // 添加窗口大小改变时的自适应
    window.addEventListener('resize', () => {
      const ringChart = echarts.getInstanceByDom(ringChartRef.value);
      const barChart = echarts.getInstanceByDom(barChartRef.value);
      ringChart?.resize();
      barChart?.resize();
    });
  });

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
  .cards-container {
    position: relative;
    left: 150px;
    width: 663px;
    height: calc(100vh - 100px);
    overflow-y: auto;
    padding-right: 20px;
  }

  .cards-container::-webkit-scrollbar {
    display: none;
  }

  .dashboard-card {
    position: relative;
    width: 623px;
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
  }

  .dashboard-card h3 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
  }

  .dashboard-card:hover {
    transform: scale(0.98);
  }

  button {
    display: block;
    margin: 20px auto;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background-color: #409EFF;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #66b1ff;
  }
  </style>