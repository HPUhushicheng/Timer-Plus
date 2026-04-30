<script lang="ts" setup>
import type { TimerApi } from '#/api';

import { h, onMounted, reactive, ref } from 'vue';

import { Button, Card, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'ant-design-vue';

import {
  getAllUsersApi,
  updateProfileApi,
  deleteUserApi,
} from '#/api';

defineOptions({ name: 'UserManage' });

interface UserRow extends TimerApi.UserInfo {
  studentid: string;
  online: boolean;
  seatRoom?: string;
  seatNumber?: string;
}

const loading = ref(true);
const dataSource = ref<UserRow[]>([]);

// Edit modal
const editVisible = ref(false);
const editUser = reactive<{ id: number; name: string; major: string; tel: string; qq: string; role: string }>({
  id: 0, name: '', major: '', tel: '', qq: '', role: 'user',
});
const editSaving = ref(false);

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '学号', dataIndex: 'studentid', key: 'studentid', width: 130 },
  { title: '专业', dataIndex: 'major', key: 'major', ellipsis: true },
  { title: '电话', dataIndex: 'tel', key: 'tel', width: 120 },
  { title: 'QQ', dataIndex: 'qq', key: 'qq', width: 120 },
  {
    title: '角色', dataIndex: 'role', key: 'role', width: 90,
    customRender: ({ text }: { text: string }) =>
      h(Tag, { color: text === 'admin' ? 'red' : 'blue' }, { default: () => text === 'admin' ? '管理员' : '用户' }),
  },
  {
    title: '状态', dataIndex: 'online', key: 'online', width: 80,
    customRender: ({ text }: { text: boolean }) =>
      h(Tag, { color: text ? 'green' : 'default' }, { default: () => text ? '在线' : '离线' }),
  },
  {
    title: '座次', key: 'seat', width: 130,
    customRender: ({ record }: { record: UserRow }) => {
      const s = [record.seatRoom, record.seatNumber].filter(Boolean).join(' ');
      return s || '未分配';
    },
  },
  {
    title: '操作', key: 'action', width: 200,
    customRender: ({ record }: { record: UserRow }) => {
      const isAdmin = record.role === 'admin';
      return h(Space, { size: 'small' }, {
        default: () => [
          h(Button, { size: 'small', onClick: () => openEdit(record) }, { default: () => '编辑' }),
          h(Button, {
            size: 'small',
            danger: !isAdmin,
            onClick: () => toggleRole(record),
          }, { default: () => isAdmin ? '取消管理员' : '设为管理员' }),
          h(Popconfirm, {
            title: `确定删除用户「${record.name}」吗？`,
            onConfirm: () => handleDelete(record.id),
          }, {
            default: () => h(Button, { size: 'small', danger: true }, { default: () => '删除' }),
          }),
        ],
      });
    },
  },
];

function openEdit(record: UserRow) {
  editUser.id = record.id;
  editUser.name = record.name;
  editUser.major = record.major;
  editUser.tel = record.tel || '';
  editUser.qq = record.qq || '';
  editUser.role = record.role;
  editVisible.value = true;
}

async function handleEditSave() {
  editSaving.value = true;
  try {
    await updateProfileApi({
      id: editUser.id,
      name: editUser.name,
      major: editUser.major,
      tel: editUser.tel,
      qq: editUser.qq,
    });
    message.success('更新成功');
    editVisible.value = false;
    await loadUsers();
  } catch (e: any) {
    message.error(e?.message || '更新失败');
  } finally {
    editSaving.value = false;
  }
}

async function toggleRole(record: UserRow) {
  const newRole = record.role === 'admin' ? 'user' : 'admin';
  try {
    await updateProfileApi({ id: record.id, role: newRole });
    message.success(newRole === 'admin' ? '已设为管理员' : '已取消管理员');
    record.role = newRole;
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteUserApi(id);
    message.success('已删除');
    dataSource.value = dataSource.value.filter((u) => u.id !== id);
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

async function loadUsers() {
  loading.value = true;
  try {
    const users = ((await getAllUsersApi()) ?? []) as any[];
    dataSource.value = users.map((u: any) => ({
      ...u,
      online: !!u.online,
      seatRoom: u.seatRoom || '',
      seatNumber: u.seatNumber || '',
    }));
  } catch (e: any) {
    message.error(e?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadUsers);
</script>

<template>
  <div class="p-5">
    <Card title="用户管理" :bordered="false">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{ pageSize: 20, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 人` }"
        row-key="id"
        size="middle"
        :scroll="{ x: 900 }"
      />
    </Card>

    <!-- Edit Modal -->
    <Modal
      v-model:open="editVisible"
      title="编辑用户"
      :confirm-loading="editSaving"
      @ok="handleEditSave"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm">姓名</label>
          <input v-model="editUser.name" class="w-full rounded border px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm">专业</label>
          <input v-model="editUser.major" class="w-full rounded border px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm">电话</label>
          <input v-model="editUser.tel" class="w-full rounded border px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label class="mb-1 block text-sm">QQ</label>
          <input v-model="editUser.qq" class="w-full rounded border px-3 py-1.5 text-sm" />
        </div>
      </div>
    </Modal>
  </div>
</template>
