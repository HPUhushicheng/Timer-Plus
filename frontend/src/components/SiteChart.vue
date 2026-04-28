<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { authFetch } from '../config/index'

interface Student {
  studentid: string
  name: string
  avatar: string
  isOnline: boolean
  qq: string
  seat_room: string
  seat_number: string
}

const students = ref<Student[]>([])
const loading = ref(true)
const hoverIndex = ref(-1)
const hasError = ref(false)

const fetchStudents = async () => {
  loading.value = true
  hasError.value = false
  try {
    const res = await authFetch('/list/all')
    const data = await res.json()
    const studentData = data.status === 200 ? data.data : []
    students.value = studentData.map((student: any) => ({
      studentid: student.studentid,
      name: student.name,
      avatar: student.qq ? `https://q1.qlogo.cn/g?b=qq&nk=${student.qq}&s=100` : '',
      isOnline: false,
      qq: student.qq,
      seat_room: student['seat-room'] || '未分配',
      seat_number: student['seat-number'] || '-'
    }))
    if (students.value.length === 0) {
      hasError.value = true
    }
  } catch {
    hasError.value = true
    ElMessage.error('获取学生数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchStudents())
</script>

<template>
  <div class="site-chart-page">
    <div class="page-header">
      <h2>座次表</h2>
      <p>遇见每一位独特的灵魂</p>
    </div>

    <div v-if="loading" class="skeleton-grid">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <el-skeleton animated>
          <template #template>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px;">
              <el-skeleton-item variant="circle" style="width: 80px; height: 80px;" />
              <el-skeleton-item variant="text" style="width: 60%;" />
              <el-skeleton-item variant="text" style="width: 80%;" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <div v-else-if="hasError && students.length === 0" class="empty-state">
      <el-empty description="暂无学生数据" />
    </div>

    <div v-else class="grid-container">
      <div
        v-for="(student, index) in students"
        :key="student.studentid"
        class="avatar-card"
        :class="{ 'is-online': student.isOnline }"
        :style="hoverIndex === index ? { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } : {}"
        @mouseenter="hoverIndex = index"
        @mouseleave="hoverIndex = -1"
      >
        <div class="avatar-wrapper">
          <el-avatar :size="72" :src="student.avatar" class="avatar" :class="{ 'pulse': student.isOnline }">
            {{ student.name.charAt(0) }}
          </el-avatar>
          <div class="status-dot" :class="{ 'online': student.isOnline }"></div>
        </div>
        <div class="student-info">
          <h3>{{ student.name }}</h3>
          <p class="student-id">学号: {{ student.studentid }}</p>
          <p class="seat-number">座位: {{ student.seat_room }} {{ student.seat_number }}</p>
          <p class="student-status">{{ student.isOnline ? '在线学习中' : '离线' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.site-chart-page {
  max-width: 1200px;
}

.page-header {
  text-align: center;
  margin-bottom: 36px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.page-header p {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 20px;
}

.skeleton-card {
  background: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 20px;
}

.avatar-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24px 16px;
  text-align: center;
  transition: var(--transition);
  box-shadow: var(--shadow);
  cursor: default;
}

.avatar-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.avatar {
  border: 3px solid #ebeef5;
  transition: var(--transition);
}

.status-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #c0c4cc;
  border: 2px solid #fff;
}

.status-dot.online { background: var(--color-success); }

.student-info { margin-top: 8px; }

.student-info h3 {
  font-size: 16px;
  color: var(--color-text);
  margin-bottom: 4px;
}

.student-id, .seat-number {
  font-size: 13px;
  color: var(--color-text-placeholder);
  margin-bottom: 2px;
}

.seat-number { color: var(--color-primary); }

.student-status {
  font-size: 13px;
  color: var(--color-text-placeholder);
  margin-top: 4px;
}

.is-online .avatar { border-color: var(--color-success); }
.is-online .student-status { color: var(--color-success); }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(103,194,58,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(103,194,58,0); }
  100% { box-shadow: 0 0 0 0 rgba(103,194,58,0); }
}
.pulse { animation: pulse 2s infinite; }
.empty-state { display: flex; justify-content: center; padding: 60px 0; }

@media (max-width: 1200px) {
  .grid-container, .skeleton-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .grid-container, .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .grid-container, .skeleton-grid { grid-template-columns: 1fr; }
}
</style>
