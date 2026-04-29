<script lang="ts" setup>
import { Card } from 'ant-design-vue';
import { LinkOutlined } from '@ant-design/icons-vue';

defineOptions({ name: 'SiteNav' });

interface SiteItem {
  id: number;
  name: string;
  url: string;
  icon: string;
  desc?: string;
}

interface SiteGroup {
  name: string;
  sites: SiteItem[];
}

const siteGroups: SiteGroup[] = [
  {
    name: '常用网址',
    sites: [
      { id: 1, name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico', desc: '全球搜索' },
      { id: 2, name: '哔哩哔哩', url: 'https://bilibili.com', icon: 'https://bilibili.com/favicon.ico', desc: '视频社区' },
      { id: 3, name: '学习导航', url: 'https://www.zjnav.cc/xuexi', icon: 'https://www.zjnav.cc/iconsy/ico.png', desc: '资源导航' },
      { id: 4, name: '电开社区', url: 'http://blog.hpuedd.com', icon: 'https://blog.hpuedd.com/favicon.ico', desc: 'HPU电开' },
      { id: 5, name: '立创商城', url: 'https://www.szlcsc.com/', icon: 'https://www.szlcsc.com/favicon.ico', desc: '元器件采购' },
      { id: 6, name: 'HPU-API', url: 'https://hpu-api-docs.pages.dev', icon: 'https://hpu-api-docs.pages.dev/favicon.ico', desc: '校园API' },
      { id: 7, name: 'DeepSeek', url: 'https://cdn.deepseek.com/chat/', icon: 'https://cdn.deepseek.com/chat/icon.png', desc: 'AI助手' },
    ],
  },
  {
    name: '实用工具',
    sites: [
      { id: 11, name: '有道翻译', url: 'https://fanyi.youdao.com/', icon: 'https://ydlunacommon-cdn.nosdn.127.net/31cf4b56e6c0b3af668aa079de1a898c.png', desc: '在线翻译' },
      { id: 12, name: '百度地图', url: 'https://map.baidu.com', icon: 'https://map.baidu.com/favicon.ico', desc: '地图导航' },
      { id: 13, name: '天气预报', url: 'https://tianqi.com', icon: 'https://tianqi.com/favicon.ico', desc: '天气查询' },
      { id: 14, name: '12306', url: 'https://www.12306.cn', icon: 'https://www.12306.cn/index/images/favicon.ico', desc: '火车票' },
    ],
  },
  {
    name: '学习教育',
    sites: [
      { id: 15, name: 'CSDN', url: 'https://www.csdn.net/', icon: 'https://www.csdn.net/favicon.ico', desc: '技术社区' },
      { id: 16, name: '菜鸟教程', url: 'https://www.runoob.com', icon: 'https://www.runoob.com/favicon.ico', desc: '编程教程' },
      { id: 17, name: '慕课网', url: 'https://www.imooc.com/', icon: 'https://www.imooc.com/favicon.ico', desc: '在线课程' },
      { id: 18, name: '掘金', url: 'https://juejin.cn', icon: 'https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/apple-touch-icon.png', desc: '开发者社区' },
    ],
  },
];

function visitSite(url: string) {
  window.open(url, '_blank');
}

function onImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  const placeholder = target.nextElementSibling as HTMLElement;
  if (placeholder) placeholder.style.display = 'flex';
}
</script>

<template>
  <div class="p-5">
    <div v-for="group in siteGroups" :key="group.name" class="mb-8">
      <h3 class="mb-4 border-l-4 border-primary pl-3 text-lg font-semibold">
        {{ group.name }}
      </h3>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="site in group.sites"
          :key="site.id"
          class="card-box flex cursor-pointer flex-col items-center gap-3 p-5 transition-all hover:-translate-y-1 hover:shadow-md"
          @click="visitSite(site.url)"
        >
          <img
            :src="site.icon"
            :alt="site.name"
            class="h-10 w-10 rounded-lg object-cover"
            @error="onImgError"
          />
          <!-- 图标加载失败时的占位 -->
          <div
            class="hidden h-10 w-10 items-center justify-center rounded-lg bg-muted"
          >
            <LinkOutlined class="text-muted-foreground" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium">{{ site.name }}</p>
            <p v-if="site.desc" class="text-xs text-muted-foreground">
              {{ site.desc }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
