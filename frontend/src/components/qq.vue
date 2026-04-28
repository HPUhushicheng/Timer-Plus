<script setup lang="ts">
const joinGroup = () => {
  window.open('https://qm.qq.com/cgi-bin/qm/qr?k=xQrIgsi9NU-BhFlAN5rZ-qjMZ96lqX67&jump_from=webapi&authKey=oy66bHvHOBUilQ3N9oEoJhPwYfRQ/f086TAPZFKYBZrv56tTZDJxhvegerE2zJ6h')
}
</script>

<template>
  <div class="qq-page">
    <div class="page-header">
      <h2>问题反馈</h2>
    </div>
    <el-card class="qq-card">
      <div class="qr-section">
        <img src="../assets/qq.png" alt="QQ群二维码" class="qr-image">
      </div>
      <div class="instructions">
        <p>打开手机QQ扫一扫，或搜索群号加入</p>
        <p class="group-number">QQ群号：<strong>569177014</strong></p>
        <el-button type="primary" size="large" @click="joinGroup">
          点击加入QQ群
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.qq-page {
  max-width: 600px;
}

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.qq-card {
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  text-align: center;
  padding: 20px;
}

.qr-section {
  margin-bottom: 20px;
}

.qr-image {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.instructions {
  color: var(--color-text-secondary);
  line-height: 2;
}

.group-number {
  margin: 8px 0 16px;
}

.group-number strong {
  color: var(--color-primary);
  font-size: 16px;
}
</style>
