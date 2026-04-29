<script lang="ts" setup>
import { Button, Card } from 'ant-design-vue';

defineOptions({ name: 'QQGroup' });

function joinGroup() {
  window.open(
    'https://qm.qq.com/cgi-bin/qm/qr?k=xQrIgsi9NU-BhFlAN5rZ-qjMZ96lqX67&jump_from=webapi&authKey=oy66bHvHOBUilQ3N9oEoJhPwYfRQ/f086TAPZFKYBZrv56tTZDJxhvegerE2zJ6h',
  );
}
</script>

<template>
  <div class="flex items-center justify-center p-5">
    <Card :bordered="false" class="vben-card w-full max-w-lg text-center">
      <template #title>
        <span class="text-lg font-semibold">问题反馈</span>
      </template>

      <div class="space-y-6 py-4">
        <div>
          <img
            src="/qq.png"
            alt="QQ群二维码"
            class="mx-auto h-48 w-48 rounded-lg border object-cover"
          />
        </div>
        <div class="space-y-3 text-muted-foreground">
          <p>打开手机QQ扫一扫，或搜索群号加入</p>
          <p class="text-base font-semibold text-primary">
            QQ群号：<strong class="text-lg">569177014</strong>
          </p>
          <Button type="primary" size="large" @click="joinGroup">
            点击加入QQ群
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>
