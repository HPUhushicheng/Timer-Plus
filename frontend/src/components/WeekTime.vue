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
    <button @click="goToHome">返回主页</button> <!-- 添加返回按钮 -->
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import * as echarts from 'echarts';
  import { useRouter } from 'vue-router';
  import axios from 'axios';
  
  const router = useRouter();
  const ringChartRef = ref(null);
  const barChartRef = ref(null);

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

      // 更新图表
      updateCharts(top100Users);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };


  // 更新图表
  const updateCharts = (userData) => {
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
        top: 'center'
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
        data: userData.map(user => ({
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
        data: userData.map(user => user.name)
      },
      series: [{
        name: '在线时长',
        type: 'bar',
        data: userData.map(user => user.totalTime),
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
  .dashboard-card {
    width: 800px;
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