<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import {Link,Service,ChatSquare, Monitor,House,ChatDotRound,User,Reading,SwitchButton,Operation, Timer, TrendCharts, Bell, UserFilled } from '@element-plus/icons-vue';
import { onUnmounted } from 'vue';

const router = useRouter();
const isCollapse = ref(false);

console.log('ZhuYe 组件加载成功');

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
function update(){
  window.open('http://111.170.163.14:1111/share/lvtyuw67','dynamicWindow', 'width=400,height=630,left=600,top=100')
}
function zy(){
  router.push({path:'/zy'})
}

let targetWindow = null;

function NoteEditor(){
  targetWindow = window.open('https://blinko.koyeb.app/', '_self');
  
  // 监听来自目标窗口的消息
  window.addEventListener('message', handleMessage);
}

function handleMessage(event) {
  if (event.data === 'return') {
    window.location.reload();
  }
}

// 添加全局快捷键监听
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === '1') {
    // 向目标窗口发送返回消息
    targetWindow?.postMessage('return', '*');
  }
});

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
  targetWindow?.close();
});
</script>

<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <el-menu
      class="sidebar"
      :collapse="isCollapse"
      :default-active="'10'"
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

    <!-- 主内容区域 -->
    <div class="main-content" :class="{ 'content-expanded': !isCollapse }">
      <el-row :gutter="40" class="dashboard-row">
        <el-col :span="12">
          <el-card class="dashboard-card1" @click="todaytime">
            <div class="card-content">
              <el-icon class="card-icon"><Timer /></el-icon>
              <div class="card-title">今日工作时长</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="dashboard-card2" @click="sitechart">
            <div class="card-content">
              <el-icon class="card-icon"><User /></el-icon>
              <div class="card-title">座次表</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="40" class="dashboard-row">
        <el-col :span="12">
          <el-card class="dashboard-card3" @click="weektime">
            <div class="card-content">
              <el-icon class="card-icon"><TrendCharts /></el-icon>
              <div class="card-title">时长数据</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="dashboard-card4" @click="update">
            <div class="card-content">
              <el-icon class="card-icon"><Monitor /></el-icon>
              <div class="card-title">检查更新</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

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


.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 64px;
  transition: margin-left 0.3s;
  position:relative;
  top:50px;
  height:400px;

}

.content-expanded {
  margin-left: 200px;
}

.dashboard-row {
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
}

.dashboard-card1, .dashboard-card2, .dashboard-card3, .dashboard-card4 {
  width: 300px;
  height: 200px;
  border-radius: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
}

.dashboard-card1 { background-image: url('../assets/001.png'); }
.dashboard-card2 { background-image: url('../assets/002.png'); }
.dashboard-card3 { background-image: url('../assets/003.png'); }
.dashboard-card4 { background-image: url('../assets/004.png'); }

.card-content {
  text-align: center;
  color: white;
  z-index: 2;
  position: relative;
  padding: 20px;
  width: 80%;
  transition: all 0.3s ease;
}

.card-icon {
  font-size: 40px;
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #608eea;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 卡片悬停效果优化 */
.dashboard-card1:hover,
.dashboard-card2:hover,
.dashboard-card3:hover,
.dashboard-card4:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 30px rgba(0,0,0,0.12);
}

.dashboard-card1:hover .card-content,
.dashboard-card2:hover .card-content,
.dashboard-card3:hover .card-content,
.dashboard-card4:hover .card-content {
  transform: scale(1.05);
}

.dashboard-card1:hover .card-icon,
.dashboard-card2:hover .card-icon,
.dashboard-card3:hover .card-icon,
.dashboard-card4:hover .card-icon {
  transform: rotate(360deg);
}

/* 确保卡片在小屏幕上也能正常显示 */
@media (max-width: 1200px) {
  .dashboard-card1,
  .dashboard-card2,
  .dashboard-card3,
  .dashboard-card4 {
    width: 250px;
    height: 180px;
    border-radius: 20px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 64px;
  }
  
  .content-expanded {
    margin-left: 64px;
  }
  
  .dashboard-row {
    flex-direction: column;
    align-items: center;
  }
  
  .el-col {
    margin-bottom: 20px;
  }

  .sidebar {
    border-radius: 0 16px 16px 0;
  }

  .dashboard-card1,
  .dashboard-card2,
  .dashboard-card3,
  .dashboard-card4 {
    border-radius: 16px;
  }
}

</style>


<!-- 
 绿色渐变色背景 background-image: linear-gradient(to right, #a6e2b9 0%, #eceab7 100%);
 蓝色渐变色背景 background-image: linear-gradient(to right,#EBEAFF, #B6D4FF,#CAEFF6);
 
 -->