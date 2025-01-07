<template>
    <div class="container">
      <!-- 顶部横幅 -->
      <button @click="goToHome" class="back-btn">返回主页</button>
      <!-- 修改热门网站展示区域 -->
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
  import { ref, computed } from 'vue';
  import { Search, Star, Grid, List, Link } from '@element-plus/icons-vue';
  import { useRouter } from 'vue-router';
  const router = useRouter();
const goToHome = () => {
  router.push('/zy');
};

  // 视图模式
  const viewMode = ref('grid');
  
  // 分页相关
  const currentPage = ref(1);
  const pageSize = ref(12);
  const totalItems = ref(100);
  
  // 分类数据
  const categories = ref([
    { id: 'all', name: '全部', icon: 'Menu' },
    { id: 'news', name: '新闻资讯', icon: 'News' },
    { id: 'social', name: '社交媒体', icon: 'ChatDotRound' },
    { id: 'tools', name: '实用工具', icon: 'Tools' },
    { id: 'study', name: '学习教育', icon: 'Reading' },
    { id: 'entertainment', name: '娱乐休闲', icon: 'VideoPlay' }
  ]);
  
  // 搜索相关
  const searchQuery = ref('');
  const activeCategory = ref('all');
  
  // 网站分组数据
  const websiteGroups = ref({
    '常用网址': [
      { id: 1, name: '必应', url: 'https://www.bing.com', icon: 'https://www.bing.com/favicon.ico' },
      { id: 2, name: '哔哩哔哩', url: 'https://bilibili.com', icon: 'https://bilibili.com/favicon.ico' },
      { id: 3, name: '学习导航', url: 'https://www.zjnav.cc/xuexi', icon: 'https://www.zjnav.cc/iconsy/ico.png' },
      { id: 4, name: '电开社区', url: 'http://blog.hpuedd.com', icon: 'http://111.170.163.14/files/d314acca-60cf-4bae-89d5-3513a8fd1b86' },
      { id: 5, name: '立创商城', url: 'https://www.szlcsc.com/', icon: 'https://www.szlcsc.com/favicon.ico' },
      { id:6,  name:'HPU-API开发者文档',url:'https://hpu-api-docs.pages.dev',icon:'https://hpu-api-docs.pages.dev/favicon.ico'},
      { id:7,  name:'deepseek',url:'https://cdn.deepseek.com/chat/',icon:'https://cdn.deepseek.com/chat/icon.png'},
    ],
    '实用工具': [
      { id: 11, name: '有道翻译', url: 'https://fanyi.youdao.com/', icon: 'https://ydlunacommon-cdn.nosdn.127.net/31cf4b56e6c0b3af668aa079de1a898c.png' },
      { id: 12, name: '百度地图', url: 'https://map.baidu.com', icon: 'https://map.baidu.com/favicon.ico' },
      { id: 13, name: '天气预报', url: 'https://tianqi.com', icon: 'https://tianqi.com/favicon.ico' },
      { id: 14, name: '12306', url: 'https://www.12306.cn', icon: 'https://www.12306.cn/index/images/favicon.ico' }
    ],
    '学习教育': [
      { id: 15, name: 'csdn', url: 'https://appcenter.ms/', icon: 'https://www.csdn.net/favicon.ico' },
      { id: 16, name: '菜鸟教程', url: 'https://www.runoob.com', icon: 'https://www.runoob.com/favicon.ico' },
      { id: 17, name: '慕课网', url: 'https://www.imooc.com/', icon: 'https://www.imooc.com/favicon.ico' },
      { id: 18, name: '掘金', url: 'https://juejin.cn', icon: 'https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/apple-touch-icon.png' }
    ]
  });
  
  // 过滤网站列表
  const filteredWebsites = computed(() => {
    let result = websites.value;
    if (activeCategory.value !== 'all') {
      result = result.filter(site => site.category === activeCategory.value);
    }
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(site =>
        site.name.toLowerCase().includes(query) ||
        site.description.toLowerCase().includes(query) ||
        site.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return result;
  });
  
  // 处理分类切换
  const handleCategoryChange = (tab) => {
    activeCategory.value = tab.props.name;
  };
  
  // 搜索
  const handleSearch = () => {};
  
  // 访问网站
  const visitWebsite = (url) => {
    window.open(url, '_blank');
  };
  
  // 收藏功能
  const toggleFavorite = (site) => {
    site.isFavorite = !site.isFavorite;
  };
  
  // 分页处理
  const handleSizeChange = (val) => {
    pageSize.value = val;
  };
  
  const handleCurrentChange = (val) => {
    currentPage.value = val;
  };
  </script>
  
  <style scoped>
  /* Banner 背景与文字样式 */
  .banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
    border-radius: 12px;
    margin-bottom: 40px;
    color: white;
    text-align: center;
  }
  
  .banner h1 {
    margin-bottom: 20px;
    font-size: 3em;
    font-weight: bold;
  }
  
  /* 搜索框 */
  .search-input {
    max-width: 600px;
    margin: 0 auto;
    border-radius: 30px;
  }
  
  /* 热门网站 */
  .hot-sites {
    margin-bottom: 50px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  .hot-sites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
  }
  
  .hot-site-card {
    cursor: pointer;
    text-align: center;
    padding: 20px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease-in-out;
  }
  
  .hot-site-card:hover {
    transform: translateY(-5px);
  }
  
  .hot-site-icon img {
    width: 50px;
    height: 50px;
    margin-bottom: 12px;
  }
  
  .hot-site-name {
    font-size: 14px;
    color: #333;
    font-weight: 600;
  }
  
  /* 分类导航 */
  .category-header {
    margin-bottom: 30px;
  }
  
  .category-header h3 {
    font-size: 20px;
    font-weight: bold;
  }
  
  .view-options {
    text-align: right;
  }
  
  .websites-wrapper.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
  }
  
  .website-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .website-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }
  
  .website-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .website-info h3 {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  
  .website-info p {
    font-size: 14px;
    color: #666;
    margin-top: 8px;
  }
  
  .website-tags {
    margin-top: 12px;
  }
  
  .website-actions {
    margin-top: 15px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  /* Pagination 样式 */
  .pagination {
    margin-top: 30px;
    text-align: center;
  }
  
  /* 响应式优化 */
  @media (max-width: 768px) {
    .hot-sites-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  
    .websites-wrapper.grid {
      grid-template-columns: 1fr;
    }
  
    .website-actions {
      flex-direction: column;
    }
  }
  
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
  
  /* 响应式布局 */
  @media (max-width: 768px) {
    .site-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  </style>
  