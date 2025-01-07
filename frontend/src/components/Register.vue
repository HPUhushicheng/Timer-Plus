<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
export default {
  setup() {
    const router = useRouter();
    const formData = ref({
      id: '',
      name: '',
      major: '',
      studentid: '',
      tel: '',
      password: '',
      qq: ''
    });

    const register = async () => {
      try {
        //将studentid赋值给id
        formData.value.id = formData.value.studentid
        console.log('Submitting form data:', formData.value);
        const queryString = new URLSearchParams(formData.value).toString();
        const response = await fetch(`http://47.120.68.44:666/list/add?${queryString}`, {
          method: 'GET',    
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        if (result.status === 200) {
          alert('伙伴,欢迎你注册成功');
        } else {
          alert('很遗憾,你注册失败了,请检查信息是否全部填写,或者是联系拾光团队!');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('注册时发生错误');
      }
    };

    const goToLogin = () => {
      router.push('/');
    };

    return {
      formData,
      register,
      goToLogin
    };
  }
};
</script>

<template>
  <div id="form-ui">
    <form id="form" @submit.prevent="register">
      <div id="form-body">
        <div id="welcome-lines">

          <div id="welcome-line-2"></div>
        </div>
        <div id="input-area">
          <div class="form-inp">
            <input v-model="formData.name" placeholder="姓名" type="text">
          </div>
          <div class="form-inp">
            <input v-model="formData.major" placeholder="专业" type="text">
          </div>
          <div class="form-inp">
            <input v-model="formData.studentid" placeholder="学号" type="text">
          </div>
          <div class="form-inp">
            <input v-model="formData.tel" placeholder="电话" type="tel">
          </div>
          <div class="form-inp">
            <input v-model="formData.password" placeholder="密码" type="password">
          </div>
          <div class="form-inp">
            <input v-model="formData.qq" placeholder="QQ" type="text">
          </div>
        </div>

        <div id="submit-button-cvr">
          <button id="submit-button" type="submit">注册</button>
          <button id="login-button" @click="goToLogin">返回登录</button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* From Uiverse.io by AnthonyPreite */
#form {
  display: grid;
  place-items: center;
  width: 300px;
  height: 500px;
  padding: 30px;
  background-image: linear-gradient(to right, #ffffff, #ffffff, #ffffff);
  box-shadow: 0px 15px 60px #00FF7F;
  outline: 1px solid #2b9962;
  border-radius: 10px;
}

#form-body {
  position: relative;
  top: 0;
  right: 0;
  left: 0;
  width: 100%;
  max-width: 250px;
  margin: 0 auto;
  padding: 20px 0;
}

#welcome-lines {
  text-align: center;
  line-height: 1;
}

#welcome-line-1 {
  color: #00FF7F;
  font-weight: 600;
  font-size: 40px;
}

#welcome-line-2 {
  color: #ffffff;
  font-size: 18px;
  margin-top: 17px;
}

#input-area {
  margin-top: 20px;
  margin-bottom: 20px;
}

.form-inp {
  padding: 12px 20px;
  background: transparent;
  border: 1px solid #e3e3e3;
  line-height: 1;
  border-radius: 8px;
  margin-bottom: 15px;
}

.form-inp:focus {
  border: 1px solid #d3c23f;
}

.form-inp:first-child {
  margin-bottom: 15px;
}

.form-inp input {
  width: 100%;
  background: none;
  font-size: 13.4px;
  color: #00140a;
  border: none;
  padding: 0;
  margin: 0;
}

.form-inp input:focus {
  outline: none;
}

#submit-button-cvr {
  margin-top: 25px;
}

#submit-button {
  display: block;
  width: 100%;
  color: #00FF7F;
  background-color: transparent;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
  padding: 14px 13px 12px 13px;
  border: 0;
  outline: 1px solid #00FF7F;
  border-radius: 8px;
  line-height: 1;
  cursor: pointer;
  transition: all ease-in-out .3s;
}

#submit-button:hover {
  transition: all ease-in-out .3s;
  background-color: #00FF7F;
  color: #161616;
  cursor: pointer;
}

#login-button {
  display: block;
  width: 100%;
  color: #00FF7F;
  background-color: transparent;
  font-weight: 600;
  font-size: 14px;
  margin-top: 15px;
  padding: 14px 13px 12px 13px;
  border: 0;
  outline: 1px solid #00FF7F;
  border-radius: 8px;
  line-height: 1;
  cursor: pointer;
  transition: all ease-in-out .3s;
}

#login-button:hover {
  transition: all ease-in-out .3s;
  background-color: #00FF7F;
  color: #161616;
  cursor: pointer;
}




#forgot-pass {
  text-align: center;
  margin-top: 10px;
}

#forgot-pass a {
  color: #868686;
  font-size: 12px;
  text-decoration: none;
}

#bar {
  position: absolute;
  left: 50%;
  bottom: -50px;
  width: 28px;
  height: 8px;
  margin-left: -33px;
  background-color: #00FF7F;
  border-radius: 10px;
}

#bar:before,
#bar:after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #ececec;
  border-radius: 50%;
}

#bar:before {
  right: -20px;
}

#bar:after {
  right: -38px;
}
</style>
