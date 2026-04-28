<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';

import { getAllUsersApi } from '#/api';

defineOptions({ name: 'SiteChart' });

interface Student {
  studentid: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  qq: string;
  seat_room: string;
  seat_number: string;
}

const students = ref<Student[]>([]);
const loading = ref(true);
const hoverIndex = ref(-1);
const hasError = ref(false);

const fetchStudents = async () => {
  loading.value = true;
  hasError.value = false;
  try {
    const data = await getAllUsersApi();
    const studentData = data || [];
    students.value = studentData.map((student: any) => ({
      studentid: student.studentid,
      name: student.name,
      avatar: student.qq
        ? `https://q1.qlogo.cn/g?b=qq&nk=${student.qq}&s=100`
        : '',
      isOnline: false,
      qq: student.qq,
      seat_room: student['seat-room'] || '未分配',
      seat_number: student['seat-number'] || '-',
    }));
    if (students.value.length === 0) {
      hasError.value = true;
    }
  } catch {
    hasError.value = true;
    message.error('获取学生数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchStudents());
</script>

<template>
  <div class="site-chart-page">
    <div class="page-header">
      <h2>座次表</h2>
      <p>遇见每一位独特的灵魂</p>
    </div>

    <a-spin :spinning="loading">
      <div v-if="!loading && hasError && students.length === 0" class="empty-state">
        <a-empty description="暂无学生数据" />
      </div>

      <div v-else class="grid-container">
        <div
          v-for="(student, index) in students"
          :key="student.studentid"
          class="avatar-card"
          :class="{ 'is-online': student.isOnline }"
          :style="
            hoverIndex === index
              ? {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }
              : {}
          "
          @mouseenter="hoverIndex = index"
          @mouseleave="hoverIndex = -1"
        >
          <div class="avatar-wrapper">
            <a-avatar :size="72" :src="student.avatar">
              {{ student.name.charAt(0) }}
            </a-avatar>
            <div
              class="status-dot"
              :class="{ online: student.isOnline }"
            ></div>
          </div>
          <div class="student-info">
            <h3>{{ student.name }}</h3>
            <p class="student-id">学号: {{ student.studentid }}</p>
            <p class="seat-number">
              座位: {{ student.seat_room }} {{ student.seat_number }}
            </p>
            <p class="student-status">
              {{ student.isOnline ? '在线学习中' : '离线' }}
            </p>
          </div>
        </div>
      </div>
    </a-spin>
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
  margin-bottom: 8px;
}

.page-header p {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 20px;
}

.avatar-card {
  background: var(--vben-card-background, #fff);
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  cursor: default;
}

.avatar-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
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

.status-dot.online {
  background: #52c41a;
}

.student-info {
  margin-top: 8px;
}

.student-info h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.student-id,
.seat-number {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 2px;
}

.seat-number {
  color: #409eff;
}

.student-status {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

.is-online .student-status {
  color: #52c41a;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
