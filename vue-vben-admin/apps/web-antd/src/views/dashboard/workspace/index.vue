<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { useTimerStore } from '#/store';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();
const timerStore = useTimerStore();

const today = new Date();
const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const weekDay = `星期${weekDays[today.getDay()]}`;

const greeting = computed(() => {
  const hour = today.getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const onlineDisplay = computed(() => {
  const seconds = timerStore.onlineDuration;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}小时${m}分钟`;
  if (m > 0) return `${m}分钟${s}秒`;
  return `${s}秒`;
});

const cards = [
  {
    name: 'TodayTime',
    label: '今日时长',
    desc: '查看今日在线时长分布',
    icon: 'lucide:clock',
    color: '#409EFF',
  },
  {
    name: 'SiteChart',
    label: '座次表',
    desc: '遇见每一位独特的灵魂',
    icon: 'lucide:users',
    color: '#67C23A',
  },
  {
    name: 'WeekTime',
    label: '一周数据',
    desc: '本周在线时长统计排行',
    icon: 'lucide:trending-up',
    color: '#E6A23C',
  },
  {
    name: 'DongTai',
    label: '更新动态',
    desc: '查看最新版本更新日志',
    icon: 'lucide:bell',
    color: '#909399',
  },
];

const navigate = (name: string) => {
  router.push({ name });
};

onMounted(() => {
  // 启动在线时长计时器
  if (userStore.userInfo?.userId) {
    timerStore.setDbId(userStore.userInfo.userId);
    timerStore.startTimer();
  }
});
</script>

<template>
  <div class="workspace">
    <div class="welcome-section">
      <h1>{{ greeting }}，{{ userStore.userInfo?.realName || '用户' }}</h1>
      <p>{{ dateStr }} {{ weekDay }} · 本次在线 {{ onlineDisplay }}</p>
    </div>

    <div class="card-grid">
      <div
        v-for="card in cards"
        :key="card.name"
        class="feature-card"
        :style="{ '--card-color': card.color }"
        @click="navigate(card.name)"
      >
        <div class="card-icon-wrapper" :style="{ background: card.color }">
          <span class="iconify" :data-icon="card.icon" width="28" height="28" style="color: white"></span>
        </div>
        <div class="card-info">
          <h3>{{ card.label }}</h3>
          <p>{{ card.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace {
  max-width: 1200px;
}

.welcome-section {
  margin-bottom: 40px;
}

.welcome-section h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-section p {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.feature-card {
  background: var(--vben-card-background, #fff);
  border-radius: 8px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--card-color);
  border-radius: 4px 0 0 4px;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-info p {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.35);
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
  .welcome-section h1 {
    font-size: 22px;
  }
}
</style>
