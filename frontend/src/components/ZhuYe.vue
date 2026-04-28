<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Timer, User, TrendCharts, Bell } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/useUserStore'
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore'

const router = useRouter()
const userStore = useUserStore()
const onlineStore = useOnlineDurationStore()

const today = new Date()
const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const weekDay = `星期${weekDays[today.getDay()]}`

const greeting = computed(() => {
  const hour = today.getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const onlineDisplay = computed(() => {
  const seconds = onlineStore.onlineDuration
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}小时${m}分钟`
  if (m > 0) return `${m}分钟${s}秒`
  return `${s}秒`
})

const cards = [
  { name: 'todaytime', label: '今日时长', desc: '查看今日在线时长分布', icon: Timer, color: '#409EFF', gradient: 'linear-gradient(135deg, #409EFF, #66b1ff)' },
  { name: 'sitechart', label: '座次表', desc: '遇见每一位独特的灵魂', icon: User, color: '#67C23A', gradient: 'linear-gradient(135deg, #67C23A, #85ce61)' },
  { name: 'weektime', label: '一周数据', desc: '本周在线时长统计排行', icon: TrendCharts, color: '#E6A23C', gradient: 'linear-gradient(135deg, #E6A23C, #ebb563)' },
  { name: 'dongtai', label: '更新动态', desc: '查看最新版本更新日志', icon: Bell, color: '#909399', gradient: 'linear-gradient(135deg, #909399, #b4b4b4)' },
]

const navigate = (name: string) => {
  router.push({ name })
}
</script>

<template>
  <div class="dashboard">
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>{{ greeting }}，{{ userStore.userName }}</h1>
        <p>{{ dateStr }} {{ weekDay }} · 本次在线 {{ onlineDisplay }}</p>
      </div>
    </div>

    <div class="card-grid">
      <div
        v-for="card in cards"
        :key="card.name"
        class="feature-card"
        :style="{ '--card-color': card.color, '--card-gradient': card.gradient }"
        @click="navigate(card.name)"
      >
        <div class="card-icon-wrapper">
          <el-icon :size="32"><component :is="card.icon" /></el-icon>
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
.dashboard {
  max-width: 1200px;
}

.welcome-section {
  margin-bottom: 40px;
}

.welcome-text h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.welcome-text p {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.feature-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 28px;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);
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
  background: var(--card-gradient);
  border-radius: 4px 0 0 4px;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

.card-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--card-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.card-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.card-info p {
  font-size: 14px;
  color: var(--color-text-placeholder);
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
  .welcome-text h1 {
    font-size: 22px;
  }
}
</style>
