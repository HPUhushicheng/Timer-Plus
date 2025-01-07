<template>
  <div class="container">
    <div class="section">
      <h2>问题反馈</h2>
      <div class="qr-code">
        <img src="../assets/qq.png" alt="QQ群二维码">
      </div>
      <div class="instructions">
        <p>① 打开手机QQ扫一扫</p>
        <p>② 打开QQ点击右上角 <img src="../assets/qq.png" class="icon"> 后,扫描此二维码加入QQ群</p>
        <p>③ QQ群号:569177014</p>
        <el-button type="primary" @click="joinGroup">点击加入QQ群</el-button>
        <el-button @click="goToHome" class="back-btn">返回主页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
const goToHome = () => {
  router.push('/zy');
};
const joinGroup = () => {
  window.open('https://qm.qq.com/cgi-bin/qm/qr?k=xQrIgsi9NU-BhFlAN5rZ-qjMZ96lqX67&jump_from=webapi&authKey=oy66bHvHOBUilQ3N9oEoJhPwYfRQ/f086TAPZFKYBZrv56tTZDJxhvegerE2zJ6h');
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.qr-code {
  text-align: center;
  margin: 20px 0;
}

.qr-code img {
  width: 200px;
  height: 200px;
}

.instructions {
  color: #666;
  line-height: 1.8;
}

.icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

.pc-join {
  text-align: center;
}

.pc-join p {
  margin-bottom: 15px;
  font-size: 16px;
}
</style>
