<template>
    <div class="fullscreen">
        <div class="container">
            <div class="first">
                <div class="title">{{displayedDesc}}</div>
                <div class="desc"><span >致力于高校实验室平台管理</span></div>
            </div>
            <div class="second">
                <input v-model="studentid" placeholder="请输入你的学号" pattern="\d+" class="studentid" name="studentid" type="text">
                <input v-model="password" placeholder="请输入你的密码" pattern="\d+" class="password" name="password" type="password">

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
import { ref, onMounted  } from 'vue';
import { useRouter } from 'vue-router';
import { useOnlineDurationStore } from '../stores/useOnlineDurationStore';
import { useUserStore } from '../stores/useUserStore';

const store = useOnlineDurationStore();
const router = useRouter();
const id = ref('');
const name = ref('');
const studentid = ref('312201030222');
const password = ref('12345678910Hsc');
const onlineDurationStore = useOnlineDurationStore();
const userStore = useUserStore();
const displayedDesc = ref('');
const fullDesc = '拾光';

// 打字机效果函数
const typeWriter = (text, delay) => {
    let index = 0;
    displayedDesc.value = ''; // 清空当前文本

    const type = () => {
        if (index < text.length) {
            displayedDesc.value += text.charAt(index); // 添加下一个字
            index++;
            setTimeout(type, delay); // 设置延迟
        } else {
            displayedDesc.value = text; // 完成后显示完整文本
        }
    };

    type(); // 开始打字机效果
};

onMounted(() => {
    typeWriter(fullDesc, 400); // 调用打字机效果，设置每个字符的延迟
});

const login = async () => {
  try {
    const response = await fetch('http://47.120.68.44:666/list/all');

    if (!response.ok) {
      throw new Error('网络错误');
    }

    const users = await response.json();

    const user = users.find(
      (user: any) => user.studentid === studentid.value && user.password === password.value
    );

    if (user) {
      console.log('登录成功, 用户:', user);

      // 设置全局的 studentId
      onlineDurationStore.setStudentId(user.studentid);

      // 保存 studentId 到本地存储
      localStorage.setItem('studentId', user.studentid);

      onlineDurationStore.startTimer(); // 开始计时器
      console.log('准备跳转到 /zy');
      router.push('/zy'); // 确保这里被正确调用
    } else {
      alert('学号或密码错误');
      studentid.value = '';
      password.value = '';
    }
  } catch (error) {
    console.error('登录失败,请联系管理员:', error);
    studentid.value = '';
    password.value = '';
  }
};

const register = () => {
  router.push('/register');
};
</script>

<style scoped>
.fullscreen {
    position: fixed;
    /* 固定定位，覆盖整个视口 */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(254, 254, 254, 0.1);
    /* 半透明背景 */
    backdrop-filter: blur(500px);
    /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(10px);
    /* 兼容性 */
    z-index: 999;
    /* 确保在最上层 */
}

.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 0px 0px;
    grid-auto-flow: row;
    grid-template-areas:
        "first second";
    height: 100%;
    /* 使容器高度为100% */
    align-items: center;
    /* 垂直居中 */
    justify-items: center;
    /* 水平居中 */
}

.gradient-box {
    background: linear-gradient(135deg, rgba(255, 0, 150, 0.5), rgba(0, 204, 255, 0.5)); /* 渐变背景 */
    backdrop-filter: blur(10px); /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(10px); /* 兼容性 */
    border-radius: 16px; /* 圆角 */
    padding: 20px; /* 内边距 */
    text-align: center; /* 文本居中 */
    clip-path: polygon(20% 0%, 100% 0%, 100% 80%, 80% 100%, 0% 100%, 0% 20%); /* 不规则形状 */
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
    background: linear-gradient(to right, rgba(255, 0, 150, 1), rgba(0, 204, 255, 1),rgba(65, 20, 159, 0.8)); /* 渐变背景 */
    filter: blur(3em); /* 模糊效果 */
    transition: all 0.5s;
    z-index: 1; /* 确保在背景 */

}

.title {
    position: relative; /* 确保文本在伪元素之上 */
    z-index: 2; /* 确保文本在伪元素之上 */
    font-size: 40px;
    font-weight: bold;
    color: var(--login-text-color);
}
.desc {
    position: relative; /* 确保文本在伪元素之上 */
    z-index: 2; /* 确保文本在伪元素之上 */
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


/* From www.lingdaima.com */
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
 from {
  transform: translateY(0.1em);
 }

 to {
  transform: translateY(-0.1em);
 }
}




/* From Uiverse.io by Creatlydev */
.studentid {
    width: 220px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    box-shadow: 2px 2px 7px 0 rgb(0, 0, 0, 0.2);
    outline: none;
    color: dimgray;
    margin-bottom: 20px;
    /* 增加底部外边距来调整距离 */
}

.studentid:invalid {
    animation: justshake 0.3s forwards;
    color: rgb(89, 102, 80);
}

.password {
    width: 220px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    box-shadow: 2px 2px 7px 0 rgb(0, 0, 0, 0.2);
    outline: none;
    color: dimgray;
    margin-bottom: 30px;
}

.password:invalid {
    animation: justshake 0.3s forwards;
    color: rgb(89, 102, 80);
}

@keyframes justshake {
    25% {
        transform: rotate(5deg);
    }

    50% {
        transform: rotate(-5deg);
    }

    75% {
        transform: rotate(5deg);
    }
}

input {
  outline: none; /* 确保没有样式影响输入框 */
  border: 1px solid #ccc; /* 默认边框式 */
  padding: 8px; /* 内边距 */
  border-radius: 4px; /* 圆角 */
  margin-bottom: 10px; /* 底部外边距 */
}

input:focus {
  border-color: #66afe9; /* 聚焦时的边框颜色 */
  box-shadow: 0 0 5px rgba(102, 175, 233, 0.6); /* 聚焦时的阴影效果 */
}
</style>  














