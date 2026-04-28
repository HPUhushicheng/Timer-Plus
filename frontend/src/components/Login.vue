<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore'
import { useUserStore } from '../stores/useUserStore'

const router = useRouter()
const studentid = ref('')
const password = ref('')
const loading = ref(false)
const onlineDurationStore = useOnlineDurationStore()
const userStore = useUserStore()
const displayedDesc = ref('')
const fullDesc = '拾光'

const typeWriter = (text: string, delay: number) => {
  let index = 0
  displayedDesc.value = ''
  const type = () => {
    if (index < text.length) {
      displayedDesc.value += text.charAt(index)
      index++
      setTimeout(type, delay)
    }
  }
  type()
}

onMounted(() => {
  typeWriter(fullDesc, 400)
})

const login = async () => {
  if (!studentid.value || !password.value) {
    ElMessage.warning('请输入学号和密码')
    return
  }
  loading.value = true
  try {
    const result = await userStore.login(studentid.value, password.value)
    if (result.status === 200) {
      onlineDurationStore.setStudentId(userStore.dbId)
      onlineDurationStore.startTimer()
      router.push({ name: 'home' })
    } else {
      ElMessage.error(result.message || '学号或密码错误')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const register = () => {
  router.push({ name: 'register' })
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="brand-section">
        <div class="brand-title">{{ displayedDesc }}</div>
        <div class="brand-desc">致力于高校实验室平台管理</div>
      </div>
      <div class="form-section">
        <div class="form-card">
          <el-input
            v-model="studentid"
            placeholder="请输入你的学号"
            size="large"
            class="form-input"
            clearable
          />
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入你的密码"
            size="large"
            class="form-input"
            show-password
            @keyup.enter="login"
          />
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="login"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
          <p class="register-link">
            还没有账号？
            <a href="#" @click.prevent="register">去注册</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f5ff 50%, #f5f7fa 100%);
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -30%;
  left: -10%;
  width: 50vw;
  height: 80vh;
  background: linear-gradient(to right, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05), rgba(64, 158, 255, 0.1));
  filter: blur(4em);
  border-radius: 50%;
}

.login-container {
  display: flex;
  align-items: center;
  gap: 80px;
  position: relative;
  z-index: 1;
}

.brand-section {
  text-align: left;
}

.brand-title {
  font-size: 56px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 2px;
  margin-bottom: 12px;
  min-height: 72px;
}

.brand-desc {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.form-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-card {
  background: var(--color-card);
  padding: 40px 32px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.login-btn {
  width: 100%;
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
}

.register-link {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.register-link a {
  color: var(--color-primary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    gap: 40px;
    padding: 20px;
  }
  .brand-title {
    font-size: 40px;
    text-align: center;
    min-height: auto;
  }
  .brand-desc {
    text-align: center;
  }
  .form-card {
    width: 100%;
    max-width: 340px;
  }
}
</style>
