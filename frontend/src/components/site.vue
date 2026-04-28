<script setup lang="ts">
import { ref } from 'vue'
import { getStaticBaseUrl } from '../config/index'

const websiteGroups = ref({
  '常用网址': [
    { id: 1, name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico' },
    { id: 2, name: '哔哩哔哩', url: 'https://bilibili.com', icon: 'https://bilibili.com/favicon.ico' },
    { id: 3, name: '学习导航', url: 'https://www.zjnav.cc/xuexi', icon: 'https://www.zjnav.cc/iconsy/ico.png' },
    { id: 4, name: '电开社区', url: 'http://blog.hpuedd.com', icon: `${getStaticBaseUrl()}/files/d314acca-60cf-4bae-89d5-3513a8fd1b86` },
    { id: 5, name: '立创商城', url: 'https://www.szlcsc.com/', icon: 'https://www.szlcsc.com/favicon.ico' },
    { id: 6, name: 'HPU-API', url: 'https://hpu-api-docs.pages.dev', icon: 'https://hpu-api-docs.pages.dev/favicon.ico' },
    { id: 7, name: 'DeepSeek', url: 'https://cdn.deepseek.com/chat/', icon: 'https://cdn.deepseek.com/chat/icon.png' },
  ],
  '实用工具': [
    { id: 11, name: '有道翻译', url: 'https://fanyi.youdao.com/', icon: 'https://ydlunacommon-cdn.nosdn.127.net/31cf4b56e6c0b3af668aa079de1a898c.png' },
    { id: 12, name: '百度地图', url: 'https://map.baidu.com', icon: 'https://map.baidu.com/favicon.ico' },
    { id: 13, name: '天气预报', url: 'https://tianqi.com', icon: 'https://tianqi.com/favicon.ico' },
    { id: 14, name: '12306', url: 'https://www.12306.cn', icon: 'https://www.12306.cn/index/images/favicon.ico' }
  ],
  '学习教育': [
    { id: 15, name: 'CSDN', url: 'https://www.csdn.net/', icon: 'https://www.csdn.net/favicon.ico' },
    { id: 16, name: '菜鸟教程', url: 'https://www.runoob.com', icon: 'https://www.runoob.com/favicon.ico' },
    { id: 17, name: '慕课网', url: 'https://www.imooc.com/', icon: 'https://www.imooc.com/favicon.ico' },
    { id: 18, name: '掘金', url: 'https://juejin.cn', icon: 'https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/apple-touch-icon.png' }
  ]
})

const visitWebsite = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="site-page">
    <div class="page-header">
      <h2>网站导航</h2>
    </div>
    <div class="site-group" v-for="(group, groupName) in websiteGroups" :key="groupName">
      <h3 class="group-title">{{ groupName }}</h3>
      <div class="site-grid">
        <el-card
          v-for="site in group"
          :key="site.id"
          class="site-card"
          shadow="hover"
          @click="visitWebsite(site.url)"
        >
          <div class="site-icon">
            <img :src="site.icon" :alt="site.name">
          </div>
          <div class="site-name">{{ site.name }}</div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.site-page {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.site-group {
  margin-bottom: 32px;
}

.group-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid var(--color-primary);
}

.site-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.site-card {
  cursor: pointer;
  text-align: center;
  padding: 20px 12px;
  border-radius: var(--radius);
  transition: var(--transition);
}

.site-card:hover {
  transform: translateY(-4px);
}

.site-icon {
  margin-bottom: 10px;
}

.site-icon img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.site-name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

@media (max-width: 768px) {
  .site-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
