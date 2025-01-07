<script setup>
import { defineProps } from 'vue'
import TextLoading from './TextLoading.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  avatar: {
    type: String,
    default: "https://example.com/default-avatar.png"
  }
})
</script>

<template>
  <div :class="['message-row', message.role === 'user' ? 'right' : 'left']">
    <div class="row">
      <div class="avatar-wrapper">
        <el-avatar
          :src="message.role === 'user' ? avatar : '/ai-avatar.png'"
          class="avatar"
          shape="square"
        />
      </div>
      <div class="message">
        <div v-if="message.content" class="message-text">
          {{ message.content }}
        </div>
        <TextLoading v-else></TextLoading>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-row {
  display: flex;
  margin-bottom: 20px;

  &.right {
    justify-content: flex-end;

    .row {
      .avatar-wrapper {
        display: flex;
        justify-content: flex-end;
      }

      .message {
        background-color: rgb(231, 248, 255);
      }
    }
  }

  .row {
    .avatar-wrapper {
      .avatar {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 8px;
      }
    }

    .message {
      font-size: 14px;
      padding: 12px;
      max-width: 500px;
      border-radius: 8px;
      background: #f4f4f5;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
}
</style> 