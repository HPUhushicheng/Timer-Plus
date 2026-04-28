<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/useUserStore'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const formData = ref({
  name: '',
  major: '',
  studentid: '',
  tel: '',
  password: '',
  qq: ''
})

const register = async () => {
  if (!formData.value.name || !formData.value.studentid || !formData.value.password
    || !formData.value.major || !formData.value.tel) {
    ElMessage.warning('请填写所有必填项')
    return
  }
  if (formData.value.password.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  loading.value = true
  try {
    const result = await userStore.register(formData.value)
    if (result.status === 200) {
      ElMessage.success('注册成功，即将跳转登录')
      setTimeout(() => router.push({ name: 'login' }), 1000)
    } else {
      ElMessage.error(result.message || '注册失败，请检查信息')
    }
  } catch (error) {
    console.error('注册错误:', error)
    ElMessage.error('注册时发生错误，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <h2 class="register-title">创建账号</h2>
      <p class="register-subtitle">加入拾光，记录你的学习时光</p>

      <el-form label-position="top" @submit.prevent="register">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业">
              <el-input v-model="formData.major" placeholder="请输入专业" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input v-model="formData.studentid" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话">
              <el-input v-model="formData.tel" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="密码">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="密码至少6位"
            show-password
          />
        </el-form-item>

        <el-form-item label="QQ（选填）">
          <el-input v-model="formData.qq" placeholder="选填" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-btn"
            @click="register"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-link">
        已有账号？
        <a href="#" @click.prevent="goToLogin">去登录</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f5ff 50%, #f5f7fa 100%);
  padding: 24px;
}

.register-card {
  background: var(--color-card);
  padding: 40px 36px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 520px;
}

.register-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: 8px;
}

.register-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 32px;
}

.register-btn {
  width: 100%;
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
}

.login-link {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-top: -8px;
}

.login-link a {
  color: var(--color-primary);
  font-weight: 500;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--color-text);
}

@media (max-width: 480px) {
  .register-card {
    padding: 24px 20px;
  }
}
</style>
