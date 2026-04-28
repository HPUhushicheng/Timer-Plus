<template>
    <div class="container">
      <button @click="goToHome" class="back-btn">返回主页</button>
      <div class="site-container">
        <div class="site-group" v-for="(group, groupName) in websiteGroups" :key="groupName">
          <h2 class="group-title">{{ groupName }}</h2>
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
    </div>
  </template>

  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { getStaticBaseUrl } from '../config/index';

  const router = useRouter();
  const goToHome = () => {
    router.push('/zy');
  };

  const websiteGroups = ref({
    '常用网址': [
      { id: 1, name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico' },
      { id: 2, name: '哔哩哔哩', url: 'https://bilibili.com', icon: 'https://bilibili.com/favicon.ico' },
      { id: 3, name: '学习导航', url: 'https://www.zjnav.cc/xuexi', icon: 'https://www.zjnav.cc/iconsy/ico.png' },
      { id: 4, name: '电开社区', url: 'http://blog.hpuedd.com', icon: `${getStaticBaseUrl()}/files/d314acca-60cf-4bae-89d5-3513a8fd1b86` },
      { id: 5, name: '立创商城', url: 'https://www.szlcsc.com/', icon: 'https://www.szlcsc.com/favicon.ico' },
      { id: 6, name: 'HPU-API开发者文档', url: 'https://hpu-api-docs.pages.dev', icon: 'https://hpu-api-docs.pages.dev/favicon.ico' },
      { id: 7, name: 'deepseek', url: 'https://cdn.deepseek.com/chat/', icon: 'https://cdn.deepseek.com/chat/icon.png' },
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
  });

  const visitWebsite = (url) => {
    window.open(url, '_blank');
  };
  </script>

  <style scoped>
  .site-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .site-group {
    margin-bottom: 30px;
  }

  .group-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
  }

  .site-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  .site-card {
    cursor: pointer;
    text-align: center;
    padding: 15px;
    transition: transform 0.2s;
  }

  .site-card:hover {
    transform: translateY(-5px);
  }

  .site-icon {
    margin-bottom: 8px;
  }

  .site-icon img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }

  .site-name {
    font-size: 14px;
    color: #333;
  }

  .back-btn {
    display: block;
    margin: 20px auto;
    padding: 8px 20px;
    border: none;
    border-radius: 20px;
    background: #409EFF;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    background: #66b1ff;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .site-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  </style>
