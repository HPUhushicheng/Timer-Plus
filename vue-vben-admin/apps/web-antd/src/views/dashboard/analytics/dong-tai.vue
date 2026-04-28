<script lang="ts" setup>
defineOptions({ name: 'DongTai' });

const updates = [
  {
    version: 'v2.0.0',
    date: '2024-12-01',
    title: '全新 UI 重构',
    items: [
      '基于 Vue Vben Admin 重构前端界面',
      '全新的现代化 UI 设计',
      '支持暗黑模式',
      '响应式布局适配',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2024-06-15',
    title: '功能增强',
    items: [
      '新增座次表功能',
      '优化在线时长统计',
      '修复已知问题',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2024-03-01',
    title: '数据可视化',
    items: [
      '新增 ECharts 图表展示',
      '今日在线时长趋势图',
      '一周数据排行榜',
    ],
  },
  {
    version: 'v1.1.0',
    date: '2024-01-10',
    title: '基础功能完善',
    items: [
      '新增用户注册功能',
      '新增在线时长记录',
      '新增 AI 对话功能',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2023-12-01',
    title: '初始版本发布',
    items: [
      '基础考勤打卡功能',
      '用户登录认证',
      '在线时长统计',
    ],
  },
];
</script>

<template>
  <div class="p-5">
    <div class="mb-6 text-center">
      <h2 class="text-2xl font-bold">更新动态</h2>
      <p class="text-muted-foreground mt-1 text-sm">查看最新版本更新日志</p>
    </div>

    <div class="mx-auto max-w-3xl">
      <a-timeline>
        <a-timeline-item
          v-for="update in updates"
          :key="update.version"
          color="#409EFF"
        >
          <template #dot>
            <span
              class="inline-block h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style="background: #409eff; box-shadow: 0 0 0 2px #409eff"
            ></span>
          </template>
          <div class="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div class="mb-2 flex items-center gap-3">
              <span
                class="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold"
                style="color: #409eff; background: rgba(64, 158, 255, 0.1)"
              >
                {{ update.version }}
              </span>
              <span class="text-xs text-muted-foreground">{{ update.date }}</span>
            </div>
            <h3 class="mb-2 text-base font-semibold">{{ update.title }}</h3>
            <ul class="m-0 list-disc pl-5">
              <li
                v-for="(item, index) in update.items"
                :key="index"
                class="text-sm leading-relaxed text-muted-foreground"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>
  </div>
</template>
