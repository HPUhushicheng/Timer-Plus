<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { ChatDotRound,User,SwitchButton,Operation, Timer, TrendCharts, Bell } from '@element-plus/icons-vue';

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
  router.push({path:'/dongtai'})
}
function sitechart(){
  router.push({path:'/sitechart'})
}
function Login(){
  router.push({path:'/'})
}
function qq(){
  router.push({path:'/qq'})
}
</script>

<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
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
      
      <el-menu-item index="1" @click="todaytime">
        <el-icon><Timer /></el-icon>
        <template #title>今日时长</template>
      </el-menu-item>

      <el-menu-item index="2" @click="weektime">
        <el-icon><TrendCharts /></el-icon>
        <template #title>一周数据</template>
      </el-menu-item>

      <el-menu-item index="3" @click="sitechart">
        <el-icon><User /></el-icon>
        <template #title>座次表</template>
      </el-menu-item>

      <el-menu-item index="3" @click="dongtai">
        <el-icon><Bell /></el-icon>
        <template #title>更新动态</template>
      </el-menu-item>
      <el-menu-item index="3" @click="qq">
        <el-icon><ChatDotRound /></el-icon>
        <template #title>QQ群</template>
      </el-menu-item>

      <el-menu-item index="4" @click="Login" class="logout-item">
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
              <div class="card-title">今天的工作时长细则</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="dashboard-card2" @click="sitechart">
            <div class="card-content">
              <el-icon class="card-icon"><Operation /></el-icon>
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
              <div class="card-title">一周工作时间折线图</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="dashboard-card4" @click="dongtai">
            <div class="card-content">
              <el-icon class="card-icon"><Bell /></el-icon>
              <div class="card-title">更新动态</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 800px;


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
  transition: all 0.3s;
}

.toggle-button:hover {
  background-color: #f6f6f6;
  color: #409EFF;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 0;
}

:deep(.el-menu-item:hover) {
  background-color: #e6f7ff !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #e6f7ff;
  border-right: 3px solid #409EFF;
}

.logout-item {
  position: absolute;
  bottom: 210px;
  width: 100%;
  border-top: 1px solid #eee;
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
  border-radius: 15px;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.card-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: rgb(66, 127, 232);
}

/* 卡片悬停效果 */
.dashboard-card1:hover,
.dashboard-card2:hover,
.dashboard-card3:hover,
.dashboard-card4:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

/* 确保卡片在小屏幕上也能正常显示 */
@media (max-width: 1200px) {
  .dashboard-card1,
  .dashboard-card2,
  .dashboard-card3,
  .dashboard-card4 {
    width: 250px;
    height: 180px;
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
}

</style>


<!-- 
 绿色渐变色背景 background-image: linear-gradient(to right, #a6e2b9 0%, #eceab7 100%);
 蓝色渐变色背景 background-image: linear-gradient(to right,#EBEAFF, #B6D4FF,#CAEFF6);
 
 -->