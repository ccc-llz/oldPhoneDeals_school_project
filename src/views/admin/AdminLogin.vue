<template>
    <div class="auth">
        <header class="header">
            <div class="logo">OldPhoneDeals Admin</div>
        </header>
        <div class="login-page">
            <el-card class="login-card">
                <h2>Admin Login</h2>
                <el-form :model="form" @submit.prevent>
                    <el-form-item>
                    <el-input v-model="form.email" placeholder="Email" />
                    </el-form-item>
                    <el-form-item>
                    <el-input v-model="form.password" type="password" placeholder="Password" show-password />
                    </el-form-item>
                    <el-form-item>
                    <el-button type="primary" @click="handleLogin">Login</el-button>
                    </el-form-item>
                </el-form>
            </el-card>
        </div>
    </div>

</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '@/api/admin/auth';
import { setToken } from '@/utils/auth';
import { validateEmail, validateRequired } from '@/utils/emailValidator'

const router = useRouter();

const form = reactive({
  email: '',
  password: ''
});

const handleLogin = async () => {
  try {
    if (!validateRequired(form.email) || !validateRequired(form.password)) {
        ElMessage.error("Please enter your email address and password. ");
        return;
    }
    if (!validateEmail(form.email)) {
        ElMessage.error("Please enter a valid email address. ", toastConfiguration);
        return;
    }
    
    const res = await login({
      email: form.email,
      password: form.password
    });

    if (res.token) {
      setToken(res.token);

      const redirect = localStorage.getItem('redirectAfterLogin') || '/admin';
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirect);
    } else {
      ElMessage.error(res.message || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    ElMessage.error('Login error, please try again');
  }
};
</script>

<style scoped>
.auth {
  height: 100vh;
  background: linear-gradient(135deg, #cac9ef 0%, #bff6f3 100%);
  transition: none;
  display: flex;
  flex-direction: column;
}

.login-page {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.395);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    height: 60px;
    /* align-items: center; */
    display: flex;
}

.logo {
  padding: 15px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-style: italic;
  font-size: large;
  font-weight: 900;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.737)
}

.login-card {
  width: 400px;
  padding: 40px 32px;
  background-color: white;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.login-card h2 {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 32px;
  color: #111;
}

.el-form {
  width: 100%;
}

.el-form-item {
  margin-bottom: 24px;
}

.el-input__inner {
  border-radius: 20px !important;
  padding: 12px 16px;
}

.el-button {
  border-radius: 24px;
  width: 100%;
  padding: 12px 0;
  font-weight: bold;
  background-color: #8da5f2;
  border: none;
  box-shadow: 0 4px 14px rgba(141, 165, 242, 0.3);
}

</style>
