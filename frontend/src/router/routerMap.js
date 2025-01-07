/**
 * 基础路由
 * @type { *[] }
 */

const constantRouterMap = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/components/Login.vue'),
    children: [
      {
        path: '/register',
        name: 'register',
        component: () => import('@/components/Register.vue')
      },
      {
        path: '/zy',
        name: 'ZhuYe',
        component: () => import('@/components/ZhuYe.vue')
      },
      {
        path: '/todaytime',
        name: 'TodayTime' ,
        component: () => import('@/components/TodayTime.vue')
      },
      {
        path: '/weektime',
        name: 'WeekTime' ,
        component: () => import('@/components/WeekTime.vue')
      },
    ]
  },
]

export default constantRouterMap