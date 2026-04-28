<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Operation, Timer, TrendCharts, User, Service, ChatDotRound, Link, Bell, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/useUserStore'
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const onlineStore = useOnlineDurationStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.name || '')

const menuItems = [
  { name: 'home', label: '今日时长', icon: Timer, path: '/zy' },
  { name: 'weektime', label: '一周数据', icon: TrendCharts, path: '/weektime' },
  { name: 'sitechart', label: '座次表', icon: User, path: '/sitechart' },
  { name: 'qq', label: 'QQ群', icon: Service, path: '/qq' },
  { name: 'chat', label: 'AI教务', icon: ChatDotRound, path: '/chat' },
  { name: 'site', label: '网站导航', icon: Link, path: '/site' },
  { name: 'dongtai', label: '更新动态', icon: Bell, path: '/dongtai' },
]

const doLogout = () => {
  onlineStore.stopTimer()
  userStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout-container">
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      background-color="#FFFFFF"
      text-color="#606266"
      active-text-color="#409EFF"
      class="sidebar"
    >
      <div class="toggle-button" @click="isCollapse = !isCollapse">
        <el-icon :size="20"><Operation /></el-icon>
      </div>

      <el-menu-item
        v-for="item in menuItems"
        :key="item.name"
        :index="item.name"
        @click="router.push({ name: item.name })"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>{{ item.label }}</template>
      </el-menu-item>

      <div class="sidebar-spacer"></div>

      <el-menu-item index="logout" @click="doLogout" class="logout-item">
        <el-icon><SwitchButton /></el-icon>
        <template #title>退出</template>
      </el-menu-item>
    </el-menu>

    <div class="main-content" :class="{ 'content-collapsed': isCollapse }">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  overflow-y: auto;
}

.sidebar:not(.el-menu--collapse) {
  width: 180px;
}

.sidebar.is-collapse {
  width: 64px;
}

.toggle-button {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  transition: var(--transition);
  flex-shrink: 0;
}

.toggle-button:hover {
  background-color: #f0f5ff;
  color: var(--color-primary);
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 2px 8px;
  border-radius: 8px;
  transition: var(--transition);
}

:deep(.el-menu-item:hover) {
  background-color: #f0f5ff !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: var(--color-primary);
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
}

.sidebar-spacer {
  flex: 1;
}

.logout-item {
  margin-bottom: 8px;
  flex-shrink: 0;
}

.logout-item :deep(.el-icon) {
  color: var(--color-danger);
}
.logout-item:deep(.is-active) {
  color: var(--color-danger) !important;
  background-color: #fef0f0 !important;
}

.main-content {
  flex: 1;
  margin-left: 180px;
  padding: 24px;
  min-height: 100vh;
  transition: margin-left 0.3s;
  width: calc(100% - 180px);
}

.content-collapsed {
  margin-left: 64px;
  width: calc(100% - 64px);
}

@media (max-width: 768px) {
  .sidebar:not(.el-menu--collapse) {
    width: 64px;
  }
  .main-content {
    margin-left: 64px;
    width: calc(100% - 64px);
    padding: 16px;
  }
}
</style>
