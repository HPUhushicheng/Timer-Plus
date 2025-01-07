<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentTheme = ref(0);
const themes = ref([]);

// 初始化主题列表
onMounted(async () => {
  // 定义路径和对应的背景图片映射
  const pathMapping = [
    { path: '/zy' },
    { path: '/todaytime' },
    { path: '/weektime' },
    { path: '/dongtai' }
  ];

  try {
    // 动态获取 assets 目录下的图片
    const imageModules = import.meta.glob('../../dist/assets/*.png');
    const imageFiles = Object.keys(imageModules)
      .filter(path => path.match(/\/\d{3}-[a-f0-9]+\.png$/))
      .sort();

    // 将图片和路径组合
    themes.value = imageFiles.map((imgPath, index) => ({
      path: pathMapping[index].path,
      background: `url(${imgPath.replace('/public', '')})`
    }));
  } catch (error) {
    console.error('加载背景图片失败:', error);
  }
});

function changeTheme() {
  if (themes.value.length === 0) return;
  
  currentTheme.value = (currentTheme.value + 1) % themes.value.length;
  const theme = themes.value[currentTheme.value];
  
  // 设置背景
  document.body.style.backgroundImage = theme.background;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundPosition = 'center';
  document.body.style.minHeight = '100vh';
  
  // 跳转到对应页面
  router.push(theme.path);
}
</script>

<template>
  <div class="theme-container">
    <el-button type="primary" @click="changeTheme" class="theme-btn">
      切换主题和页面
    </el-button>
  </div>
</template>

<style scoped>
.theme-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.theme-btn {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>
