<template>
  <div class="layout-container">
    <!--侧边栏-->
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

  <div class="site-chart-container">
    <div class="avatar-grid">
      <div class="grid-container">
        <div v-for="(student, index) in students" 
             :key="student.studentid"
             class="avatar-card"
             :class="{ 'is-online': student.isOnline }"
             @mouseenter="handleHover(index)"
             @mouseleave="handleLeave(index)">
          <div class="avatar-wrapper">
            <el-avatar 
              :size="40"
              :src="student.avatar" 
              class="avatar"
              :class="{ 'pulse': student.isOnline }">
              {{ student.name.charAt(0) }}
            </el-avatar>
            <div class="status-dot" :class="{ 'online': student.isOnline }"></div>
          </div>
          <div class="student-info">
            <h3 class="student-name">{{ student.name }}</h3>
            <p class="student-id">学号: {{ student.studentid }}</p>
            <p class="seat-number">座位号: {{ `${student.seat_room} ${student.seat_number}` }}</p>
            <p class="student-major">专业: {{ student.major }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import {Link,Service,ChatSquare, Reading,House,ChatDotRound,User,SwitchButton,Operation, Timer, TrendCharts, Monitor } from '@element-plus/icons-vue';

function todaytime(){
    router.push({path:'/todaytime'})
};
function weektime(){
  router.push({path:'/weektime'})
}
function dongtai(){
  window.open('http://blog.hpuedd.com', 'dynamicWindow', 'width=400,height=600,left=600,top=100')
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


const router = useRouter()
const students = ref([])

const goToHome = () => {
  router.push('/zy')
}

// 获取学生数据的函数
const fetchStudents = async () => {
  try {
    const response = await axios.get('http://47.120.68.44:666/list/all')
    const studentData = response.data
    
    // 添加数据检查日志
    //console.log('原始数据:', studentData)
    
    // 将获取的数据映射为需要的格式
    students.value = studentData.map(student => {
      //console.log('单个学生数据:', student)  // 检查每个学生的数据
      return {
        studentid: student.studentid,
        name: student.name,
        major: student.major,
        avatar: `https://q1.qlogo.cn/g?b=qq&nk=${student.qq}&s=100`,
        isOnline: false,
        qq: student.qq,
        seat_room: student['seat-room'] || '未分配',
        seat_number: student['seat-number'] || '-'
      }
    })

    //console.log('处理后的数据:', students.value)
  } catch (error) {
    console.error('获取学生数据失败:', error)
    ElMessage.error('获取学生数据失败，请稍后重试')
  }
}

// 组件挂载时获取数据
onMounted(async () => {
  await fetchStudents()
})

const handleHover = (index) => {
  const card = document.querySelectorAll('.avatar-card')[index]
  if (card) {
    card.style.transform = 'scale(1.1)'
    card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
  }
}

const handleLeave = (index) => {
  const card = document.querySelectorAll('.avatar-card')[index]
  if (card) {
    card.style.transform = 'scale(1)'
    card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'
  }
}
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
.site-chart-container {
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 10%;
  right: 0;
  bottom: 0;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  text-align: center;
  margin-bottom: 60px;
}

.title {
  font-size: 36px;
  color: #2c3e50;
  margin-bottom: 12px;
  font-weight: 600;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
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

.avatar-grid {
  width: 100%;
  height: calc(100vh - 200px);
  padding: 20px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.avatar-grid::-webkit-scrollbar {
  display: none;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 每行4个卡片 */
  gap: 30px;
  max-width: 1000px; /* 限制最大宽度 */
  width: 100%;
}

.avatar-card {
  width: 100px;
  height: 150px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 5px;
}

.avatar {
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #909399;
  border: 2px solid #fff;
}



.student-info {
  margin-top: 15px;
}

.student-name {
  font-size: 14px;
  color: #2c3e50;
  margin: 0 0 5px;
}

.student-id {
  font-size: 10px;
  color: #909399;
  margin: 0 0 5px;
}

.student-status {
  font-size: 8px;
  color: #67C23A;
}

.is-online .avatar {
  border-color: #67C23A;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(103, 194, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}

.pulse {
  animation: pulse 2s infinite;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(5, 1fr); /* 中等屏幕每行3个 */
  }
  
  .avatar-card {
    width: 100px;
    height: 140px;
  }
}

@media (max-width: 900px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr); /* 小屏幕每行2个 */
  }
}

@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(1, 1fr); /* 超小屏幕每行1个 */
  }
  
  .avatar-card {
    width: 125px;
    height: 150px;
  }
}

.seat-number {
  font-size: 9px;
  color: #409EFF;
  margin: 5px 0;
  font-weight: 500;
}
.student-major {
  font-size: 9px;
  color: #409EFF;
  margin: 5px 0;
  font-weight: 500;
}
</style>
