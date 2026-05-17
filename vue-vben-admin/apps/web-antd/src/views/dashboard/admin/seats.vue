<script lang="ts" setup>
import { h, onMounted, ref } from 'vue';

import { Button, Card, Input, message, Space, Table } from 'ant-design-vue';

import { getAllUsersApi, assignSeatApi, toggleVisibilityApi } from '#/api';

defineOptions({ name: 'SeatManage' });

interface SeatRow {
  id: number;
  name: string;
  studentid: string;
  seatRoom: string;
  seatNumber: string;
  visible: boolean;
}

const loading = ref(true);
const dataSource = ref<SeatRow[]>([]);
const editId = ref<number | null>(null);
const editRoom = ref('');
const editNumber = ref('');

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '学号', dataIndex: 'studentid', key: 'studentid', width: 130 },
  {
    title: '座次', key: 'seat', width: 200,
    customRender: ({ record }: { record: SeatRow }) => {
      if (editId.value === record.id) {
        return h(Space, { size: 'small' }, {
          default: () => [
            h(Input, {
              value: editRoom.value,
              placeholder: '房间',
              size: 'small',
              style: { width: '80px' },
              'onUpdate:value': (v: string) => { editRoom.value = v; },
            }),
            h(Input, {
              value: editNumber.value,
              placeholder: '座位号',
              size: 'small',
              style: { width: '80px' },
              'onUpdate:value': (v: string) => { editNumber.value = v; },
            }),
          ],
        });
      }
      const s = [record.seatRoom, record.seatNumber].filter(Boolean).join(' ');
      return s || '未分配';
    },
  },
  {
    title: '展示', key: 'visible', width: 60, align: 'center',
    customRender: ({ record }: { record: SeatRow }) => {
      return h(Button, {
        type: record.visible ? 'primary' : 'default',
        size: 'small',
        onClick: () => toggleVisible(record),
      }, {
        default: () => record.visible ? '可见' : '已隐藏',
      });
    },
  },
  {
    title: '操作', key: 'action', width: 150,
    customRender: ({ record }: { record: SeatRow }) => {
      if (editId.value === record.id) {
        return h(Space, { size: 'small' }, {
          default: () => [
            h(Button, { size: 'small', type: 'primary', onClick: () => saveSeat(record.id) }, { default: () => '保存' }),
            h(Button, { size: 'small', onClick: cancelEdit }, { default: () => '取消' }),
          ],
        });
      }
      return h(Space, { size: 'small' }, {
        default: () => [
          h(Button, { size: 'small', onClick: () => startEdit(record) }, { default: () => '编辑' }),
          record.seatRoom || record.seatNumber
            ? h(Button, { size: 'small', danger: true, onClick: () => clearSeat(record.id) }, { default: () => '清除' })
            : null,
        ],
      });
    },
  },
];

function startEdit(record: SeatRow) {
  editId.value = record.id;
  editRoom.value = record.seatRoom || '';
  editNumber.value = record.seatNumber || '';
}

function cancelEdit() {
  editId.value = null;
  editRoom.value = '';
  editNumber.value = '';
}

async function saveSeat(id: number) {
  try {
    await assignSeatApi({ id, seatRoom: editRoom.value, seatNumber: editNumber.value });
    message.success('座次已更新');
    const row = dataSource.value.find((u) => u.id === id);
    if (row) {
      row.seatRoom = editRoom.value;
      row.seatNumber = editNumber.value;
    }
    cancelEdit();
  } catch (e: any) {
    message.error(e?.message || '更新失败');
  }
}

async function toggleVisible(record: SeatRow) {
  try {
    const newVal = !record.visible;
    await toggleVisibilityApi(record.id, newVal);
    record.visible = newVal;
    message.success(newVal ? '已设为可见' : '已隐藏');
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  }
}

async function clearSeat(id: number) {
  try {
    await assignSeatApi({ id, seatRoom: '', seatNumber: '' });
    message.success('座次已清除');
    const row = dataSource.value.find((u) => u.id === id);
    if (row) {
      row.seatRoom = '';
      row.seatNumber = '';
    }
  } catch (e: any) {
    message.error(e?.message || '清除失败');
  }
}

async function loadUsers() {
  loading.value = true;
  try {
    const users = ((await getAllUsersApi()) ?? []) as any[];
    dataSource.value = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      studentid: u.studentid,
      visible: u.visible !== 0,
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
    <Card title="座次管理" :bordered="false">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{ pageSize: 50, showTotal: (t: number) => `共 ${t} 人` }"
        row-key="id"
        size="middle"
      />
    </Card>
  </div>
</template>
