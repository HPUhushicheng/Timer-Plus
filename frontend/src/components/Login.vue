<template>
    <div class="fullscreen">
        <div class="container">
            <div class="first">
                <div class="title">{{displayedDesc}}</div>
                <div class="desc"><span >致力于高校实验室平台管理</span></div>
            </div>
            <div class="second">
                <input v-model="studentid" placeholder="请输入你的学号" class="studentid" name="studentid" type="text">
                <input v-model="password" placeholder="请输入你的密码" class="password" name="password" type="password">
                <button @click="login">
                    <div class="svg-wrapper-1">
                        <div class="svg-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z"></path>
                                <path fill="currentColor"
                                    d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z">
                                </path>
                            </svg>
                        </div>
                    </div>
                    <span>登录</span>
                </button>
                <p>还没有账号？<a href="#" @click.prevent="register">去注册</a></p>
                <p>由于新注册账号无法使用AI教务功能,已为老师们提供正常账号,请使用!</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted  } from 'vue'
import { useRouter } from 'vue-router'
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore'
import { useUserStore } from '../stores/useUserStore'

const router = useRouter()
const studentid = ref('')
const password = ref('')
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
    alert('请输入学号和密码')
    return
  }
  try {
    const result = await userStore.login(studentid.value, password.value)
    if (result.status === 200) {
      onlineDurationStore.setStudentId(studentid.value)
      onlineDurationStore.startTimer()
      router.push('/zy')
    } else {
      alert(result.message || '学号或密码错误')
    }
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请联系管理员')
  }
}

const register = () => {
  router.push('/register')
}
</script>

<style scoped>
.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(254, 254, 254, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 999;
}
.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 0px 0px;
    grid-auto-flow: row;
    grid-template-areas: "first second";
    height: 100%;
    align-items: center;
    justify-items: center;
}
.first {
    grid-area: first;
    margin-left: -120px;
}
.first::before {
    content: '';
    position: absolute;
    top: 35%;
    left: 7%;
    width: 30vw;
    height: 30vh;
    background: linear-gradient(to right, rgba(255, 0, 150, 1), rgba(0, 204, 255, 1),rgba(65, 20, 159, 0.8));
    filter: blur(3em);
    transition: all 0.5s;
    z-index: 1;
}
.title {
    position: relative;
    z-index: 2;
    font-size: 40px;
    font-weight: bold;
    color: var(--login-text-color);
}
.desc {
    position: relative;
    z-index: 2;
    font-size: 19px;
    color: var(--login-about-color);
}
.second {
    grid-area: second;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    margin-left: -100px;
}
button {
 font-family: inherit;
 font-size: 20px;
 background: royalblue;
 color: white;
 padding: 0.7em 3em;
 padding-left: 4em;
 display: flex;
 align-items: center;
 border: none;
 border-radius: 16px;
 overflow: hidden;
 transition: all 0.2s;
}
button span {
 display: block;
 margin-left: 0.1em;
 transition: all 0.3s ease-in-out;
}
button svg {
 display: block;
 transform-origin: center center;
 transition: transform 0.3s ease-in-out;
}
button:hover .svg-wrapper {
 animation: fly-1 0.6s ease-in-out infinite alternate;
}
button:hover svg {
 transform: translateX(1.2em) rotate(45deg) scale(1.1);
}
button:hover span {
 transform: translateX(5em);
}
button:active {
 transform: scale(0.95);
}
@keyframes fly-1 {
 from { transform: translateY(0.1em); }
 to { transform: translateY(-0.1em); }
}
.studentid, .password {
    width: 220px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    box-shadow: 2px 2px 7px 0 rgb(0, 0, 0, 0.2);
    outline: none;
    color: dimgray;
}
.studentid { margin-bottom: 20px; }
.password { margin-bottom: 30px; }
input {
  outline: none;
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
}
input:focus {
  border-color: #66afe9;
  box-shadow: 0 0 5px rgba(102, 175, 233, 0.6);
}
</style>
