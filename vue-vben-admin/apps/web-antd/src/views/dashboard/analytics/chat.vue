<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { Button, Card, Input, Typography } from 'ant-design-vue';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons-vue';

import { requestClient } from '#/api/request';

defineOptions({ name: 'ChatAi' });

interface Message {
  type: 'user' | 'ai';
  content: string;
  thinking?: boolean;
  error?: boolean;
}

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const messagesContainer = ref<HTMLElement>();
const isProcessing = ref(false);

const WELCOME_MSG = '欢迎来到AI教务对话。我是拾光AI助手，我可以为你提供绩点排名查询、今日课程查询、空闲教室查询、四六级查询、考试查询等14+对接教务系统的功能！\n你可以这样说：\n2023-2024第二学期绩点排名查询\n今天的课程是什么\n...';

async function sendMessage() {
  if (!inputMessage.value.trim() || isProcessing.value) return;
  isProcessing.value = true;
  messages.value.push({ type: 'user', content: inputMessage.value });
  messages.value.push({ type: 'ai', content: '', thinking: true });
  scrollToBottom();

  try {
    const res = await requestClient.post('/api/chat/proxy', {
      userMessage: inputMessage.value,
    });
    const aiContent = res?.choices?.[0]?.message?.content;
    if (aiContent) {
      messages.value[messages.value.length - 1] = {
        type: 'ai',
        content: aiContent,
      };
    } else {
      messages.value[messages.value.length - 1] = {
        type: 'ai',
        content: 'AI 服务暂时不可用，请稍后重试',
        error: true,
      };
    }
  } catch {
    messages.value[messages.value.length - 1] = {
      type: 'ai',
      content: '网络连接失败，请检查网络后重试',
      error: true,
    };
  }

  inputMessage.value = '';
  isProcessing.value = false;
  await nextTick();
  scrollToBottom();
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function clearMessages() {
  messages.value = [];
  messages.value.push({ type: 'ai', content: WELCOME_MSG });
}

function formatContent(content: string): string {
  return content.replace(/\n/g, '<br>');
}

onMounted(() => {
  messages.value.push({ type: 'ai', content: WELCOME_MSG });
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-8rem)] flex-col p-5">
    <Card :bordered="false" class="vben-card flex flex-1 flex-col overflow-hidden">
      <template #title>
        <span class="flex items-center gap-2">
          <RobotOutlined class="text-primary" />
          AI 教务助手
        </span>
      </template>

      <!-- 消息列表 -->
      <div
        ref="messagesContainer"
        class="flex-1 space-y-4 overflow-y-auto px-2 py-4"
        style="max-height: calc(100vh - 18rem)"
      >
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="flex"
          :class="msg.type === 'user' ? 'justify-end' : 'justify-start'"
        >
          <!-- AI 头像 -->
          <div v-if="msg.type === 'ai'" class="mr-3 shrink-0">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"
            >
              <RobotOutlined class="text-primary" />
            </div>
          </div>

          <!-- 消息内容 -->
          <div
            class="max-w-[75%] rounded-xl px-4 py-3"
            :class="{
              'bg-primary text-primary-foreground': msg.type === 'user',
              'bg-muted': msg.type === 'ai' && !msg.error,
              'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200': msg.error,
            }"
          >
            <div v-if="msg.thinking" class="flex items-center gap-1 py-1">
              <span class="animate-pulse">●</span>
              <span class="animate-pulse" style="animation-delay: 0.2s">●</span>
              <span class="animate-pulse" style="animation-delay: 0.4s">●</span>
            </div>
            <div v-else class="break-words text-sm leading-relaxed" v-html="formatContent(msg.content)"></div>
          </div>

          <!-- 用户头像 -->
          <div v-if="msg.type === 'user'" class="ml-3 shrink-0">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <UserOutlined />
            </div>
          </div>
        </div>
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RobotOutlined class="mb-2 text-4xl" />
          <p>有什么可以帮你的？</p>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="border-t pt-4">
        <div class="flex items-end gap-3">
          <Input.TextArea
            v-model:value="inputMessage"
            placeholder="输入您的问题，按 Enter 发送，Shift+Enter 换行"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            :disabled="isProcessing"
            class="flex-1"
            @keydown="onKeyDown"
          />
          <div class="flex gap-2">
            <Button
              :disabled="messages.length === 0"
              @click="clearMessages"
            >
              清空
            </Button>
            <Button
              type="primary"
              :disabled="!inputMessage.trim() || isProcessing"
              :loading="isProcessing"
              @click="sendMessage"
            >
              <template #icon>
                <SendOutlined />
              </template>
              发送
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
