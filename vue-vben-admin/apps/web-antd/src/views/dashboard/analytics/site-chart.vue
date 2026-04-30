<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Card, Switch } from 'ant-design-vue';

import { getAllUsersApi } from '#/api';

defineOptions({ name: 'SiteChart' });

interface Student {
  id: string;
  name: string;
  major: string;
  online: boolean;
  visible: boolean;
  seatRoom: string;
  seatNumber: string;
  seatLabel: string | null;
}

interface RoomGroup {
  room: string;
  students: Student[];
}

const allStudents = ref<Student[]>([]);
const loading = ref(true);
const errorMsg = ref('');
const showHidden = ref(false);
const showUnassigned = ref(true);

const unassignedCount = computed(() =>
  allStudents.value.filter((s) => !s.seatRoom && !s.seatNumber).length
);

const hiddenCount = computed(() =>
  allStudents.value.filter((s) => s.visible === false).length
);

/** 过滤后的学生列表 */
const filteredStudents = computed(() => {
  if (showHidden.value) return allStudents.value;
  return allStudents.value.filter((s) => s.visible !== false);
});

function formatSeat(room?: string, number?: string): string | null {
  if (!room && !number) return null;
  return `${room || ''}${number ? ` ${number}号` : ''}`.trim();
}

/** 按房间分组，组内按座位号排序，未分配放最后 */
const roomGroups = computed<RoomGroup[]>(() => {
  const unassigned: Student[] = [];
  const roomMap = new Map<string, Student[]>();

  for (const s of filteredStudents.value) {
    if (!s.seatRoom && !s.seatNumber) {
      if (showUnassigned.value) unassigned.push(s);
      continue;
    }
    const key = s.seatRoom || '未命名房间';
    if (!roomMap.has(key)) roomMap.set(key, []);
    roomMap.get(key)!.push(s);
  }

  // 组内按座位号排序
  const naturalSort = (a: string, b: string) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  };

  const groups: RoomGroup[] = [];
  // 房间按名称排序
  const sortedRooms = [...roomMap.keys()].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { numeric: true }));
  for (const room of sortedRooms) {
    const sorted = roomMap.get(room)!.sort((a, b) => naturalSort(a.seatNumber, b.seatNumber));
    groups.push({ room, students: sorted });
  }

  if (showUnassigned.value && unassigned.length > 0) {
    groups.push({ room: '未分配座次', students: unassigned });
  }

  return groups;
});

onMounted(async () => {
  try {
    const userList = (await getAllUsersApi()) ?? [];
    allStudents.value = userList.map((u: any) => ({
      id: u.studentid || u.id,
      name: u.name || '未知',
      major: u.major || '',
      online: !!u.online,
      visible: u.visible !== 0,
      seatRoom: u.seatRoom || '',
      seatNumber: u.seatNumber || '',
      seatLabel: formatSeat(u.seatRoom, u.seatNumber),
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
      <div v-else-if="filteredStudents.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mb-2 size-12" data-icon="lucide:users"></span>
        <p>暂无学生数据</p>
      </div>
      <template v-else>
        <!-- 已隐藏提醒 -->
        <div
          v-if="hiddenCount > 0"
          class="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/30"
        >
          <span class="iconify size-4 shrink-0 text-gray-400" data-icon="lucide:eye-off"></span>
          <span class="flex-1 text-gray-500 dark:text-gray-400">
            已隐藏 <strong>{{ hiddenCount }}</strong> 位同学
            <template v-if="showHidden">（当前已显示）</template>
          </span>
          <a-switch
            v-model:checked="showHidden"
            checked-children="显示"
            un-checked-children="隐藏"
            size="small"
          />
        </div>

        <!-- 未分配座次提醒 -->
        <div
          v-if="unassignedCount > 0"
          class="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-800 dark:bg-amber-950/30"
        >
          <span class="iconify size-4 shrink-0 text-amber-500" data-icon="lucide:alert-triangle"></span>
          <span class="flex-1 text-amber-700 dark:text-amber-400">
            还有 <strong>{{ unassignedCount }}</strong> 位同学未分配座次
            <template v-if="!showUnassigned">（已隐藏）</template>
          </span>
          <a-switch
            v-model:checked="showUnassigned"
            checked-children="显示"
            un-checked-children="隐藏"
            size="small"
          />
        </div>
        <div v-else class="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <span class="iconify size-4 shrink-0" data-icon="lucide:check-circle"></span>
          所有同学已分配座次
        </div>
        <div class="space-y-6">
        <div v-for="group in roomGroups" :key="group.room">
          <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span
              v-if="group.room !== '未分配座次'"
              class="iconify size-4"
              data-icon="lucide:map-pin"
            ></span>
            {{ group.room }}
            <span class="text-xs font-normal">({{ group.students.length }}人)</span>
          </h3>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <div
              v-for="student in group.students"
              :key="student.id"
              class="card-box flex items-center gap-3 px-4 py-3 transition-all hover:shadow-md"
            >
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground"
              >
                {{ student.name.charAt(0) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">
                  {{ student.name }}
                  <span
                    v-if="student.seatNumber && group.room !== '未分配座次'"
                    class="ml-1 text-xs font-normal text-primary"
                  >{{ student.seatNumber }}号</span>
                </p>
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
        </div>
      </div>
      </template>
    </Card>
  </div>
</template>
