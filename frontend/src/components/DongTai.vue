<script setup lang="ts">
import { ref } from 'vue'
import { Star, Tools, CircleCheck } from '@element-plus/icons-vue'

const updates = ref([
  {
    version: 'v2.1.0', date: '2024-12-25', status: '最新发布', type: 'primary', tagType: 'success', isNew: true, size: 'large',
    sections: [
      { title: '新增功能', icon: Star, iconClass: 'icon-new', items: [
        { content: '新增数据分析功能，支持多维度可视化', highlight: true },
        { content: '新增对话复制功能，全文复制与代码复制分离', tag: { type: 'success', text: 'New' } }
      ]},
      { title: '性能优化', icon: Tools, iconClass: 'icon-optimize', items: [
        { content: '优化页面加载速度,提升2-5%左右' },
        { content: '改进mysql数据缓存机制,提升数据读取速度' }
      ]},
      { title: '问题修复', icon: CircleCheck, iconClass: 'icon-fix', items: [
        { content: '修改计时失败bug,补充部分代码，增加程序健壮性' },
        { content: '修复部分页面UI重叠与响应异常' },
        { content: '解决数据同步异常问题,此部分耗时较多' }
      ]}
    ]
  },
  {
    version: 'v2.0.5', date: '2024-12-13', status: '稳定版本', type: 'info', tagType: 'info', isNew: false,
    sections: [
      { title: '性能优化', icon: Tools, iconClass: 'icon-optimize', items: [
        { content: '优化数据库查询性能' },
        { content: '减少内存占用', highlight: true },
        { content: '提升系统响应速度' }
      ]},
      { title: '问题修复', icon: CircleCheck, iconClass: 'icon-fix', items: [
        { content: '修复用户反馈的界面显示问题' },
        { content: '修复一周数据显示异常问题,加载卡顿问题以及部分UI样式失效' }
      ]}
    ]
  },
  {
    version: 'v2.0.0', date: '2024-12-03', status: '较大更新', type: 'warning', tagType: 'warning', isNew: false,
    sections: [
      { title: '架构升级', icon: Star, iconClass: 'icon-new', items: [
        { content: '更新技术架构', highlight: true, tag: { type: 'danger', text: 'Breaking Change' } },
        { content: '重构核心模块，提升稳定性' },
        { content: '优化对话处理流程' }
      ]},
      { title: '新增功能', icon: Star, iconClass: 'icon-new', items: [
        { content: '引入新的数据可视化模块' },
        { content: '支持自定义数据导出格式' },
        { content: '新增AI教务,网址导航,问题反馈板块' }
      ]}
    ]
  },
  {
    version: 'v1.5.0', date: '2024-11-24', status: '功能更新', type: 'success', tagType: 'success', isNew: false,
    sections: [
      { title: '功能优化', icon: Tools, iconClass: 'icon-optimize', items: [
        { content: '改进用户界面交互体验' },
        { content: '新增数据筛选功能', highlight: true },
        { content: '优化数据加载速度' },
        { content: '多用户同时在线并发测试' }
      ]}
    ]
  },
  {
    version: 'v1.0.0', date: '2024-11-12', status: '首次发布', type: 'success', tagType: 'info', isNew: false,
    sections: [
      { title: '初始功能', icon: Star, iconClass: 'icon-new', items: [
        { content: '用户注册与登录认证功能', highlight: true },
        { content: '今日时长统计功能' },
        { content: '基础数据显示与管理功能', highlight: true },
        { content: '前后端API通信' },
        { content: '数据统计报表' },
        { content: '确定侧边栏导航,基础UI样式' }
      ]}
    ]
  }
])
</script>

<template>
  <div class="dongtai-page">
    <div class="page-header">
      <h2>更新动态</h2>
      <p>探索每一次的进步与创新</p>
    </div>

    <div class="timeline-container">
      <el-timeline>
        <el-timeline-item
          v-for="(update, index) in updates"
          :key="index"
          :timestamp="update.date"
          :type="update.type"
          :hollow="update.hollow"
          :size="update.size"
        >
          <el-card class="update-card" :class="{ 'is-new': update.isNew }">
            <template #header>
              <div class="card-header">
                <div class="version-info">
                  <span class="version">{{ update.version }}</span>
                  <el-tag :type="update.tagType" effect="dark" size="small">
                    {{ update.status }}
                  </el-tag>
                </div>
                <span class="release-date">{{ update.date }}</span>
              </div>
            </template>

            <div class="update-content">
              <div v-for="(section, sIdx) in update.sections" :key="sIdx" class="section">
                <h4 class="section-title">
                  <el-icon :class="section.iconClass">
                    <component :is="section.icon"/>
                  </el-icon>
                  {{ section.title }}
                </h4>
                <ul class="update-list">
                  <li v-for="(item, iIdx) in section.items" :key="iIdx"
                      class="update-item"
                      :class="{'highlight': item.highlight}">
                    {{ item.content }}
                    <el-tag v-if="item.tag" size="small" :type="item.tag.type">
                      {{ item.tag.text }}
                    </el-tag>
                  </li>
                </ul>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<style scoped>
.dongtai-page {
  max-width: 800px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.page-header p {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.update-card {
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.update-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.update-card.is-new {
  border-left: 4px solid var(--color-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.release-date {
  color: var(--color-text-placeholder);
  font-size: 14px;
}

.section {
  margin-bottom: 20px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--color-primary);
}

.icon-new { color: var(--color-success); }
.icon-optimize { color: var(--color-primary); }
.icon-fix { color: var(--color-warning); }

.update-list {
  list-style: none;
  padding-left: 28px;
}

.update-item {
  position: relative;
  margin: 8px 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #DCDFE6;
}

.update-item.highlight::before {
  background-color: var(--color-primary);
}
</style>
