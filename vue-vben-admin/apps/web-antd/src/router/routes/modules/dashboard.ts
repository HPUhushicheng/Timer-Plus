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
        name: 'ChatAi',
        path: '/dashboard/chat',
        component: () => import('#/views/dashboard/analytics/chat.vue'),
        meta: {
          icon: 'lucide:bot',
          title: 'AI 助手',
        },
      },
      {
        name: 'SiteNav',
        path: '/dashboard/site-nav',
        component: () => import('#/views/dashboard/analytics/site-nav.vue'),
        meta: {
          icon: 'lucide:globe',
          title: '网站导航',
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
];

export default routes;
