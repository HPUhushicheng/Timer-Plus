import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import ZhuYe from '../components/ZhuYe.vue';
import Register from '../components/Register.vue';
import TodayTime from '../components/TodayTime.vue';
import WeekTime from '../components/WeekTime.vue';
import DongTai from '../components/DongTai.vue';
import SiteChart from '../components/SiteChart.vue';
import QQ from '../components/qq.vue';
import Site from '../components/site.vue';
import Chat from '../components/Chat.vue';

// 定义路由
const routes = [
  { path: '/', component: Login },
  { path: '/zy', component: ZhuYe },
  {path:'/register', component: Register},
  {path:'/todaytime',component:TodayTime},
  {path:'/weektime',component:WeekTime},
  {path:'/dongtai',component:DongTai},
  {path:'/sitechart',component:SiteChart},
  {path:'/qq',component:QQ},
  {path:'/site',component:Site},
  {path:'/chat',component:Chat}

];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
