import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: '拾光',
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Workspace',
        path: '/dashboard/workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:home',
          title: '工作台',
        },
      },
      {
        name: 'TodayTime',
        path: '/dashboard/today-time',
        component: () => import('#/views/dashboard/analytics/today-time.vue'),
        meta: {
          icon: 'lucide:clock',
          title: '今日时长',
        },
      },
      {
        name: 'WeekTime',
        path: '/dashboard/week-time',
        component: () => import('#/views/dashboard/analytics/week-time.vue'),
        meta: {
          icon: 'lucide:trending-up',
          title: '一周数据',
        },
      },
      {
        name: 'SiteChart',
        path: '/dashboard/site-chart',
        component: () => import('#/views/dashboard/analytics/site-chart.vue'),
        meta: {
          icon: 'lucide:users',
          title: '座次表',
        },
      },
      {
        name: 'DongTai',
        path: '/dashboard/dong-tai',
        component: () => import('#/views/dashboard/analytics/dong-tai.vue'),
        meta: {
          icon: 'lucide:bell',
          title: '更新动态',
        },
      },
      {
        name: 'QQGroup',
        path: '/dashboard/qq-group',
        component: () => import('#/views/dashboard/analytics/qq-group.vue'),
        meta: {
          icon: 'lucide:message-circle',
          title: '问题反馈',
        },
      },
    ],
  },
  {
    meta: {
      authority: ['admin'],
      icon: 'lucide:settings',
      order: 100,
      title: '管理',
    },
    name: 'Admin',
    path: '/admin',
    children: [
      {
        name: 'UserManage',
        path: '/admin/users',
        component: () => import('#/views/dashboard/admin/users.vue'),
        meta: {
          authority: ['admin'],
          icon: 'lucide:user-cog',
          title: '用户管理',
        },
      },
      {
        name: 'SeatManage',
        path: '/admin/seats',
        component: () => import('#/views/dashboard/admin/seats.vue'),
        meta: {
          authority: ['admin'],
          icon: 'lucide:layout-grid',
          title: '座次管理',
        },
      },
      {
        name: 'AdminStats',
        path: '/admin/stats',
        component: () => import('#/views/dashboard/admin/stats.vue'),
        meta: {
          authority: ['admin'],
          icon: 'lucide:bar-chart-3',
          title: '数据统计',
        },
      },
    ],
  },
];

export default routes;
