import { createApp } from 'vue'
import './assets/global.less';
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router';
import { createPinia } from 'pinia';
import 'highlight.js/styles/github-dark.css'
import { fetchRemoteConfig, cacheConfig } from './config/remote'

async function initApp() {
  // 启动时拉取远程配置，成功后缓存到 localStorage
  // 后续所有组件的 getApiBaseUrl() / getStaticBaseUrl() 会优先读取缓存
  const remoteConfig = await fetchRemoteConfig()
  if (remoteConfig) {
    cacheConfig(remoteConfig)
  }

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(ElementPlus)
  app.use(router)
  app.mount('#app')
}

initApp()
