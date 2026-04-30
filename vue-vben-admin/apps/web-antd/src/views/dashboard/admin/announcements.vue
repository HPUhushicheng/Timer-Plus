<script lang="ts" setup>
import { h, onMounted, ref } from 'vue';

import { Button, Card, Input, message, Modal, Popconfirm, Space, Table } from 'ant-design-vue';

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

const columns = [
  { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '发布者', dataIndex: 'created_by', key: 'created_by', width: 120 },
  {
    title: '发布时间', dataIndex: 'created_at', key: 'created_at', width: 180,
    customRender: ({ text }: { text: string }) => {
      try {
        const d = new Date(text);
        return d.toLocaleString('zh-CN');
      } catch {
        return text;
      }
    },
  },
  {
    title: '操作', key: 'action', width: 180,
    customRender: ({ record }: { record: Announcement }) => {
      return h(Space, { size: 'small' }, {
        default: () => [
          h(Button, { size: 'small', onClick: () => openView(record) }, { default: () => '查看' }),
          h(Popconfirm, {
            title: '确定删除这条公告吗？',
            onConfirm: () => handleDelete(record.id),
          }, {
            default: () => h(Button, { size: 'small', danger: true }, { default: () => '删除' }),
          }),
        ],
      });
    },
  },
];

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
    <Card title="公告管理" :bordered="false">
      <template #extra>
        <Button type="primary" @click="openCreate">发布公告</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }"
        row-key="id"
        size="middle"
      />
    </Card>

    <!-- Create Modal -->
    <Modal
      v-model:open="createVisible"
      title="发布新公告"
      :confirm-loading="createSaving"
      @ok="handleCreate"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">公告标题</label>
          <Input v-model:value="createTitle" placeholder="请输入标题" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">公告内容</label>
          <Input.TextArea
            v-model:value="createContent"
            placeholder="请输入公告内容，支持换行"
            :rows="5"
          />
        </div>
      </div>
    </Modal>

    <!-- View Modal -->
    <Modal
      v-model:open="viewVisible"
      :title="viewAnnouncement?.title"
      :footer="null"
    >
      <template v-if="viewAnnouncement">
        <div class="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{ viewAnnouncement.created_by }}</span>
          <span>·</span>
          <span>{{ new Date(viewAnnouncement.created_at).toLocaleString('zh-CN') }}</span>
        </div>
        <div class="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-relaxed dark:bg-gray-800">
          {{ viewAnnouncement.content }}
        </div>
      </template>
    </Modal>
  </div>
</template>
