<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card } from 'ant-design-vue';

import { getAllUsersApi } from '#/api';

defineOptions({ name: 'SiteChart' });

interface Student {
  id: string;
  name: string;
  major: string;
  online: boolean;
}

const students = ref<Student[]>([]);
const loading = ref(true);
const errorMsg = ref('');

onMounted(async () => {
  try {
    const userList = (await getAllUsersApi()) ?? [];
    students.value = userList.map((u: any) => ({
      id: u.studentid || u.id,
      name: u.name || '未知',
      major: u.major || '',
      online: u.online === true || u.online === 1,
    }));
  } catch (e: any) {
    errorMsg.value = e?.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-5">
    <Card title="座次表" :bordered="false" class="vben-card">
      <div v-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
        加载中...
      </div>
      <div v-else-if="errorMsg" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mb-2 size-12" data-icon="lucide:alert-circle" style="color: #f87171"></span>
        <p class="text-red-400">{{ errorMsg }}</p>
      </div>
      <div v-else-if="students.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mb-2 size-12" data-icon="lucide:users"></span>
        <p>暂无学生数据</p>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <div
          v-for="student in students"
          :key="student.id"
          class="card-box flex items-center gap-3 px-4 py-3 transition-all hover:shadow-md"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground"
          >
            {{ student.name.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ student.name }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ student.major || student.id }}</p>
          </div>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="student.online
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-muted text-muted-foreground'"
          >
            <span
              v-if="student.online"
              class="mr-1 inline-flex h-1.5 w-1.5 rounded-full bg-green-500"
            ></span>
            {{ student.online ? '在线' : '离线' }}
          </span>
        </div>
      </div>
    </Card>
  </div>
</template>
