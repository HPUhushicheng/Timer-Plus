<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Button, Card, Input, message, Modal, Popconfirm, Tag } from 'ant-design-vue';

import {
  createAnnouncementApi,
  getAnnouncementsApi,
  deleteAnnouncementApi,
  type Announcement,
} from '#/api';

defineOptions({ name: 'AnnounceManage' });

const loading = ref(true);
const dataSource = ref<Announcement[]>([]);

// Create modal
const createVisible = ref(false);
const createTitle = ref('');
const createContent = ref('');
const createSaving = ref(false);

// View modal
const viewVisible = ref(false);
const viewAnnouncement = ref<Announcement | null>(null);

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return d.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
}

function openCreate() {
  createTitle.value = '';
  createContent.value = '';
  createVisible.value = true;
}

async function handleCreate() {
  if (!createTitle.value.trim()) {
    message.warning('请输入公告标题');
    return;
  }
  if (!createContent.value.trim()) {
    message.warning('请输入公告内容');
    return;
  }
  createSaving.value = true;
  try {
    await createAnnouncementApi({
      title: createTitle.value.trim(),
      content: createContent.value.trim(),
    });
    message.success('公告已发布');
    createVisible.value = false;
    await loadAnnouncements();
  } catch (e: any) {
    message.error(e?.message || '发布失败');
  } finally {
    createSaving.value = false;
  }
}

function openView(record: Announcement) {
  viewAnnouncement.value = record;
  viewVisible.value = true;
}

async function handleDelete(id: number) {
  try {
    await deleteAnnouncementApi(id);
    message.success('已删除');
    dataSource.value = dataSource.value.filter((a) => a.id !== id);
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

async function loadAnnouncements() {
  loading.value = true;
  try {
    const list = (await getAnnouncementsApi()) ?? [];
    dataSource.value = list as Announcement[];
  } catch (e: any) {
    message.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadAnnouncements);
</script>

<template>
  <div class="p-5">
    <Card :bordered="false">
      <template #title>
        <div class="flex items-center gap-2">
          <span class="iconify size-5 text-primary" data-icon="lucide:megaphone"></span>
          <span>公告管理</span>
          <Tag v-if="dataSource.length > 0" color="blue">{{ dataSource.length }} 条</Tag>
        </div>
      </template>
      <template #extra>
        <Button type="primary" @click="openCreate">
          <span class="iconify mr-1" data-icon="lucide:plus"></span>
          发布公告
        </Button>
      </template>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mr-2 animate-spin" data-icon="lucide:loader-2"></span>
        加载中...
      </div>

      <!-- Empty -->
      <div v-else-if="dataSource.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span class="iconify mb-3 size-12" data-icon="lucide:megaphone-off"></span>
        <p class="text-sm">暂无公告</p>
      </div>

      <!-- Announcement Cards -->
      <div v-else class="space-y-4">
        <div
          v-for="item in dataSource"
          :key="item.id"
          class="card-box group relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent px-5 py-4 transition-all hover:shadow-md dark:from-blue-950/30 dark:to-transparent"
        >
          <div class="flex items-start gap-4">
            <span class="iconify mt-0.5 size-5 shrink-0 text-blue-500" data-icon="lucide:megaphone"></span>
            <div class="min-w-0 flex-1">
              <h3 class="mb-1.5 text-base font-semibold text-foreground">{{ item.title }}</h3>
              <p class="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {{ item.content }}
              </p>
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span class="flex items-center gap-1">
                  <span class="iconify size-3" data-icon="lucide:user"></span>
                  {{ item.created_by }}
                </span>
                <span>{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="small" type="text" @click="openView(item)">查看</Button>
              <Popconfirm
                title="确定删除这条公告吗？"
                @confirm="handleDelete(item.id)"
              >
                <Button size="small" type="text" danger>删除</Button>
              </Popconfirm>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Create Modal -->
    <Modal
      v-model:open="createVisible"
      title="发布新公告"
      :confirm-loading="createSaving"
      @ok="handleCreate"
      ok-text="发布"
      cancel-text="取消"
    >
      <div class="space-y-5">
        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">公告标题</label>
          <Input v-model:value="createTitle" placeholder="请输入标题，最多 50 字" :maxlength="50" show-count />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">公告内容</label>
          <Input.TextArea
            v-model:value="createContent"
            placeholder="请输入公告内容，支持换行"
            :rows="6"
            :maxlength="2000"
            show-count
          />
        </div>
      </div>
    </Modal>

    <!-- View Modal -->
    <Modal
      v-model:open="viewVisible"
      :title="viewAnnouncement?.title"
      :footer="null"
      width="560px"
    >
      <template v-if="viewAnnouncement">
        <div class="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span class="flex items-center gap-1">
            <span class="iconify size-3.5" data-icon="lucide:user"></span>
            {{ viewAnnouncement.created_by }}
          </span>
          <span>·</span>
          <span>{{ new Date(viewAnnouncement.created_at).toLocaleString('zh-CN') }}</span>
        </div>
        <div class="whitespace-pre-wrap rounded-lg bg-gray-50 p-5 text-sm leading-relaxed dark:bg-gray-800/50">
          {{ viewAnnouncement.content }}
        </div>
      </template>
    </Modal>
  </div>
</template>
