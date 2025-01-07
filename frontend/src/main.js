import { createApp } from 'vue'
import './assets/global.less';
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'; // 引入路由
import { createPinia } from 'pinia';
import 'highlight.js/styles/github-dark.css'  // 或者选择其他主题

const app = createApp(App)
const pinia = createPinia();
app.use(pinia);
app.use(ElementPlus)
app.use(router)
app.mount('#app')