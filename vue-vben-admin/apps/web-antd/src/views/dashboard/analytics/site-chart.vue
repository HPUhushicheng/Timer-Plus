<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';

import { AnalysisChartCard } from '@vben/common-ui';

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
  <div class="p-5">
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-bold">座次表</h2>
      <p class="text-muted-foreground mt-1 text-sm">遇见每一位独特的灵魂</p>
    </div>

    <a-spin :spinning="loading">
      <div v-if="!loading && hasError && students.length === 0" class="flex justify-center py-16">
        <a-empty description="暂无学生数据" />
      </div>

      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="student in students"
          :key="student.studentid"
          class="group cursor-default rounded-lg border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div class="relative mx-auto mb-3 inline-block">
            <a-avatar :size="72" :src="student.avatar">
              {{ student.name.charAt(0) }}
            </a-avatar>
            <div
              class="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white"
              :class="student.isOnline ? 'bg-green-500' : 'bg-gray-300'"
            ></div>
          </div>
          <h3 class="mb-1 text-base font-semibold">{{ student.name }}</h3>
          <p class="mb-0.5 text-xs text-muted-foreground">学号: {{ student.studentid }}</p>
          <p class="mb-0.5 text-xs" style="color: #409eff">
            座位: {{ student.seat_room }} {{ student.seat_number }}
          </p>
          <p
            class="mt-1 text-xs"
            :class="student.isOnline ? 'text-green-500' : 'text-muted-foreground'"
          >
            {{ student.isOnline ? '在线学习中' : '离线' }}
          </p>
        </div>
      </div>
    </a-spin>
  </div>
</template>
