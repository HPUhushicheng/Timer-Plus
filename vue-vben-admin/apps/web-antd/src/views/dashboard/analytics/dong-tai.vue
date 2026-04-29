<script lang="ts" setup>
import { Card } from 'ant-design-vue';

defineOptions({ name: 'DongTai' });

interface UpdateItem {
  version: string;
  date: string;
  title: string;
  icon: string;
  gradient: string;
  isLatest?: boolean;
  items: string[];
}

const updates: UpdateItem[] = [
  {
    version: 'v2.0.0',
    date: '2025-12-01',
    title: '全新 UI 重构',
    icon: 'lucide:sparkles',
    gradient: 'from-blue-500 to-cyan-500',
    isLatest: true,
    items: [
      '基于 vue-vben-admin 重构前端界面',
      '新增在线时长统计图表',
      '优化座次表展示效果',
      '新增一周数据排行榜',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2025-10-15',
    title: '功能增强',
    icon: 'lucide:zap',
    gradient: 'from-emerald-500 to-green-500',
    items: [
      '新增 AI 智能问答助手',
      '优化登录注册流程',
      '修复已知 Bug',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2025-08-01',
    title: '数据统计上线',
    icon: 'lucide:bar-chart-3',
    gradient: 'from-orange-500 to-amber-500',
    items: [
      '新增在线时长统计功能',
      '新增周报数据展示',
      '优化数据库查询性能',
    ],
  },
  {
    version: 'v1.1.0',
    date: '2025-06-01',
    title: '基础功能完善',
    icon: 'lucide:git-merge',
    gradient: 'from-purple-500 to-pink-500',
    items: [
      '新增座次表功能',
      '新增实验室动态页面',
      '优化页面加载速度',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025-04-01',
    title: '初始版本发布',
    icon: 'lucide:rocket',
    gradient: 'from-slate-500 to-gray-500',
    items: [
      '拾光考勤系统正式上线',
      '支持学生登录注册',
      '基础考勤打卡功能',
    ],
  },
];
</script>

<template>
  <div class="p-5">
    <Card title="更新动态" :bordered="false" class="vben-card">
      <div class="relative">
        <!-- 中央时间线 -->
        <div class="absolute left-6 top-0 h-full w-px bg-border md:left-1/2 md:-translate-x-px"></div>

        <div class="space-y-8">
          <div
            v-for="(update, index) in updates"
            :key="update.version"
            class="relative"
            :class="index % 2 === 0 ? 'md:pr-[50%]' : 'md:ml-[50%]'"
          >
            <!-- 时间线节点 -->
            <div
              class="absolute left-4 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br md:left-1/2 md:-translate-x-1/2"
              :class="update.gradient"
            >
              <span class="iconify text-white" :data-icon="update.icon" width="10" height="10"></span>
            </div>

            <!-- 卡片 -->
            <div class="ml-12 md:ml-0 md:px-6">
              <div
                class="card-box p-4 transition-all hover:shadow-md"
                :class="index % 2 === 0 ? 'md:mr-4' : 'md:ml-4'"
              >
                <div class="mb-3 flex items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="update.isLatest
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'"
                  >
                    {{ update.version }}
                  </span>
                  <span class="text-xs text-muted-foreground">{{ update.date }}</span>
                  <span
                    v-if="update.isLatest"
                    class="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
                  >
                    最新
                  </span>
                </div>
                <h4 class="mb-2 font-semibold">{{ update.title }}</h4>
                <ul class="space-y-1">
                  <li
                    v-for="item in update.items"
                    :key="item"
                    class="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span class="iconify mt-0.5 size-4 text-primary" data-icon="lucide:check"></span>
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
