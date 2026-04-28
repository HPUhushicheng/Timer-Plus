<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { Document, Delete, Position, Loading, UserFilled, Service } from '@element-plus/icons-vue'
import { getApiBaseUrl } from '../config/index'

const messages = ref<Array<{ type: string; content: string; thinking?: boolean; error?: boolean }>>([])
const inputMessage = ref('')
const messagesContainer = ref(null)
const isProcessing = ref(false)
const codeBlocksMap = ref(new Map())

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang }).value
        const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        codeBlocksMap.value.set(codeId, str)
        return `
          <div class="code-block-wrapper">
            <div class="code-block-header">
              <span class="code-lang">${lang}</span>
              <el-button class="copy-code-btn" size="small" type="primary" text data-code-id="${codeId}">
                <el-icon><Document /></el-icon>
                复制代码
              </el-button>
            </div>
            <pre><code class="hljs ${lang}">${highlighted}</code></pre>
          </div>`
      } catch { return '' }
    }
    return ''
  }
})

const formatMessage = (content: string) => {
  try {
    if (content.includes('```')) return md.render(content)
    return content.replace(/\n/g, '<br>')
  } catch {
    return content
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isProcessing.value) return
  isProcessing.value = true
  messages.value.push({ type: 'user', content: inputMessage.value })
  messages.value.push({ type: 'ai', content: '', thinking: true })
  scrollToBottom()

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/chat/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: inputMessage.value })
    })
    const data = await response.json()
    if (data.status === 200 && data.data?.choices?.[0]?.message?.content) {
      messages.value[messages.value.length - 1] = {
        type: 'ai', content: data.data.choices[0].message.content
      }
    } else {
      messages.value[messages.value.length - 1] = {
        type: 'ai', content: 'AI 服务暂时不可用，请稍后重试', error: true
      }
    }
  } catch {
    messages.value[messages.value.length - 1] = {
      type: 'ai', content: '网络连接失败，请检查网络后重试', error: true
    }
  }

  inputMessage.value = ''
  isProcessing.value = false
  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    (messagesContainer.value as HTMLElement).scrollTop = (messagesContainer.value as HTMLElement).scrollHeight
  }
}

const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}

const copyFullContent = (content: string) => copyToClipboard(content)

const onCopyCodeClick = async (e: Event) => {
  const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement | null
  if (target) {
    const codeId = target.dataset.codeId
    const code = codeBlocksMap.value.get(codeId)
    if (code) await copyToClipboard(code)
  }
}

const clearMessages = () => {
  messages.value = messages.value.slice(0, 1)
  ElMessage.success('已清空对话')
}

onMounted(() => {
  const welcomeMsg = '欢迎来到AI教务对话。我是拾光AI助手,我可以为你提供绩点排名查询、今日课程查询、空闲教室查询、四六级查询、考试查询等14+对接教务系统的功能！\n你可以这样说：\n2023-2024第二学期绩点排名查询\n今天的课程是什么\n...'
  messages.value.push({ type: 'ai', content: welcomeMsg })
  document.addEventListener('click', onCopyCodeClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onCopyCodeClick)
})
</script>

<template>
  <div class="chat-container">
    <div class="chat-interface">
      <div class="chat-messages" ref="messagesContainer">
        <transition-group name="message-fade">
          <div v-for="(message, index) in messages" :key="index"
               :class="['message', message.type, { 'message-error': message.error }]">
            <div class="avatar" :class="message.type">
              <el-avatar :size="48">
                <el-icon :size="24" v-if="message.type === 'user'"><UserFilled /></el-icon>
                <el-icon :size="24" v-else><Service /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div v-if="!message.thinking" class="content-wrapper">
                <div v-html="formatMessage(message.content)"></div>
                <div class="copy-buttons">
                  <el-button class="copy-btn" size="small" @click="copyFullContent(message.content)" type="primary" text>
                    <el-icon><Document /></el-icon>
                    复制
                  </el-button>
                </div>
              </div>
              <div v-else class="thinking-animation">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
      <div class="chat-input">
        <el-input v-model="inputMessage" placeholder="输入您的消息..." @keyup.enter="sendMessage">
          <template #append>
            <el-button type="danger" text @click="clearMessages" :disabled="messages.length <= 1" class="clear-btn">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
            <div class="divider"></div>
            <el-button type="primary" @click="sendMessage" :disabled="!inputMessage.trim() || isProcessing" class="send-btn">
              <el-icon v-if="isProcessing"><Loading /></el-icon>
              <el-icon v-else><Position /></el-icon>
              <span>{{ isProcessing ? '处理中' : '发送' }}</span>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  height: calc(100vh - 48px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  margin: -24px;
}

.chat-interface {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-card);
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.message.ai {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 10px;
  flex-shrink: 0;
}

.avatar.user :deep(.el-avatar) {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.avatar.ai :deep(.el-avatar) {
  background: linear-gradient(135deg, #67C23A, #409EFF);
}

.message-content {
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 12px;
  background: #f4f4f5;
  box-shadow: 0 2px 4px rgba(0,0,0,.06);
  transition: all 0.3s ease;
  text-align: left;
}

.message-content p {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
}

.user .message-content {
  background: #ecf5ff;
  border-top-right-radius: 4px;
}

.ai .message-content {
  background: #f0f9eb;
  border-top-left-radius: 4px;
}

.message-error .message-content {
  background: #fef0f0;
}

.chat-input {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.chat-input :deep(.el-input__wrapper) {
  background: #fff;
  border-radius: 12px 0 0 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.1);
  overflow: hidden;
}

.chat-input :deep(.el-input__inner) {
  color: var(--color-text);
  width: 100%;
  height: 48px;
  line-height: 48px;
}

.chat-input :deep(.el-input-group__append) {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0;
  background: transparent;
}

.chat-input :deep(.clear-btn) {
  width: 100px;
  height: 48px;
  padding: 0 16px;
  font-size: 14px;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chat-input :deep(.divider) {
  width: 1px;
  height: 24px;
  background: #dcdfe6;
  margin: 0;
}

.send-btn {
  height: 48px;
  padding: 0 20px;
  border-radius: 0 12px 12px 0;
  font-size: 14px;
  font-weight: 500;
  margin: -1px;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.thinking-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 24px;
}

.thinking-animation span {
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #409EFF;
  border-radius: 50%;
  display: inline-block;
  animation: thinking 1.4s infinite ease-in-out both;
}

.thinking-animation span:nth-child(1) { animation-delay: -0.32s; }
.thinking-animation span:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-leave-to,
.message-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.chat-messages::-webkit-scrollbar { width: 6px; }
.chat-messages::-webkit-scrollbar-track { background: #f5f7fa; }
.chat-messages::-webkit-scrollbar-thumb { background: #e4e7ed; border-radius: 3px; }
.chat-messages::-webkit-scrollbar-thumb:hover { background: #409EFF; }

.message-content :deep(pre) {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
  text-align: left;
}

.message-content :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.message-content :deep(code:not(pre code)) {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 4px;
  color: #d63384;
}

.message-content :deep(p) { margin: 8px 0; text-align: left; line-height: 1.6; }
.message-content :deep(ul), .message-content :deep(ol) { padding-left: 20px; margin: 8px 0; text-align: left; }
.message-content :deep(a) { color: #409EFF; text-decoration: none; }
.message-content :deep(a:hover) { text-decoration: underline; }

.content-wrapper { position: relative; }

.copy-buttons {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.message-content:hover .copy-buttons { opacity: 1; }

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(4px);
  border-radius: 4px;
  font-size: 12px;
}

.message-content :deep(.code-block-wrapper) {
  position: relative;
  margin: 8px 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #2d2d2d;
  background: #1e1e1e;
}

.message-content :deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #2d2d2d;
  color: #fff;
  font-size: 11px;
  border-bottom: 1px solid #3d3d3d;
  height: 20px;
}

.message-content :deep(.code-lang) { color: #888; font-size: 10px; text-transform: uppercase; opacity: .8; }

.message-content :deep(.copy-code-btn) {
  padding: 2px 6px;
  font-size: 10px;
  opacity: .6;
  transition: all 0.2s ease;
  height: 20px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.message-content :deep(.copy-code-btn .el-icon) { font-size: 12px; }
.message-content :deep(.copy-code-btn:hover) { opacity: 1; color: #409EFF; }

.message-content :deep(pre) { margin: 0; padding: 6px 8px; background: #1e1e1e; font-size: 12px; line-height: 1.4; }
.message-content :deep(pre code) { font-family: 'Fira Code',Consolas,Monaco,monospace; font-size: 12px; padding: 0; background: transparent; }
.message-content :deep(pre)::-webkit-scrollbar { height: 4px; }
.message-content :deep(pre)::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 2px; }
.message-content :deep(pre)::-webkit-scrollbar-track { background: #2d2d2d; }

@media (max-width: 768px) {
  .chat-container { height: 100vh; }
  .message-content { max-width: 85%; }
  .chat-input { padding: 10px; }
}
</style>
