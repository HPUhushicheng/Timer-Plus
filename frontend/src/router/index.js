import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/useUserStore'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import AppLayout from '../components/AppLayout.vue'
import ZhuYe from '../components/ZhuYe.vue'
import TodayTime from '../components/TodayTime.vue'
import WeekTime from '../components/WeekTime.vue'
import DongTai from '../components/DongTai.vue'
import SiteChart from '../components/SiteChart.vue'
import QQ from '../components/qq.vue'
import Site from '../components/site.vue'
import Chat from '../components/Chat.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: { guest: true }
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/zy' },
      { path: 'zy', name: 'home', component: ZhuYe },
      { path: 'todaytime', name: 'todaytime', component: TodayTime },
      { path: 'weektime', name: 'weektime', component: WeekTime },
      { path: 'dongtai', name: 'dongtai', component: DongTai },
      { path: 'sitechart', name: 'sitechart', component: SiteChart },
      { path: 'qq', name: 'qq', component: QQ },
      { path: 'site', name: 'site', component: Site },
      { path: 'chat', name: 'chat', component: Chat },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/zy'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login' })
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
