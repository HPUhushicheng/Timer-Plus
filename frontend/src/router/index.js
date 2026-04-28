import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/useUserStore'
import Login from '../components/Login.vue'
import ZhuYe from '../components/ZhuYe.vue'
import Register from '../components/Register.vue'
import TodayTime from '../components/TodayTime.vue'
import WeekTime from '../components/WeekTime.vue'
import DongTai from '../components/DongTai.vue'
import SiteChart from '../components/SiteChart.vue'
import QQ from '../components/qq.vue'
import Site from '../components/site.vue'
import Chat from '../components/Chat.vue'

const routes = [
  { path: '/', component: Login, meta: { guest: true } },
  { path: '/register', component: Register, meta: { guest: true } },
  { path: '/zy', component: ZhuYe, meta: { requiresAuth: true } },
  { path: '/todaytime', component: TodayTime, meta: { requiresAuth: true } },
  { path: '/weektime', component: WeekTime, meta: { requiresAuth: true } },
  { path: '/dongtai', component: DongTai, meta: { requiresAuth: true } },
  { path: '/sitechart', component: SiteChart, meta: { requiresAuth: true } },
  { path: '/qq', component: QQ, meta: { requiresAuth: true } },
  { path: '/site', component: Site, meta: { requiresAuth: true } },
  { path: '/chat', component: Chat, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/')
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next('/zy')
  } else {
    next()
  }
})

export default router
