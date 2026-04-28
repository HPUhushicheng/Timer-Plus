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
  <div class="dong-tai-page">
    <div class="page-header">
      <h2>更新动态</h2>
      <p>查看最新版本更新日志</p>
    </div>

    <a-timeline>
      <a-timeline-item v-for="update in updates" :key="update.version" color="#409EFF">
        <template #dot>
          <span
            style="
              display: inline-block;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #409eff;
              border: 2px solid #fff;
              box-shadow: 0 0 0 2px #409eff;
            "
          ></span>
        </template>
        <a-card class="update-card">
          <div class="update-header">
            <span class="version-tag">{{ update.version }}</span>
            <span class="update-date">{{ update.date }}</span>
          </div>
          <h3>{{ update.title }}</h3>
          <ul class="update-items">
            <li v-for="(item, index) in update.items" :key="index">
              {{ item }}
            </li>
          </ul>
        </a-card>
      </a-timeline-item>
    </a-timeline>
  </div>
</template>

<style scoped>
.dong-tai-page {
  max-width: 800px;
  margin: 0 auto;
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

.update-card {
  margin-bottom: 8px;
}

.update-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.version-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e6f7ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.update-date {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.update-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.update-items {
  padding-left: 20px;
  margin: 0;
}

.update-items li {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.8;
}
</style>
