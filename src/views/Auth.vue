<template>
    <div class="auth">
        <header class="header">
            <div class="header-content">
                <logo-component/>
            </div>
        </header>
        <div class="main-content">
            <div class="panel" ref="panel">
                <!-- <transition name="slide-left" mode="out-in" @before-leave="setHeight" @enter="animateHeight" @after-enter="resetHeight"> -->
                <transition :name= "!isLogin ? 'slide-left' : 'slide-right'" mode="out-in">
                    <!-- From for Login -->
                    <div v-if="isLogin" key="login" class="form-section login-form">
                        <h1>Sign In</h1>
                        <div class="auth-input-container">
                            <input type="text" placeholder="Email" v-model="email" @keyup.enter="handleLogin">
                            <input type="password" placeholder="Password" v-model="password" @keyup.enter="handleLogin">
                            <button @click="handleLogin">Login</button>
                        </div>
                        <div class="auth-links">
                            Forget Password? <a href="#" @click="resetPassword">Reset Password</a>
                        </div>
                        <div class="auth-links">
                            Don't Have Account Yet? <a href="#" @click="goRegister">Sign Up</a>
                        </div>
                    </div>
                    <!-- Form for Register -->
                    <div v-else-if="!isLogin && !registerValidationEmailSent" key="register" class="form-section register-form">
                        <h1>Sign Up</h1>
                        <div class="auth-input-container">
                            <input v-model="email" placeholder="Email">
                        <div class="personal-info">
                            <input v-model="registerFirstName" placeholder="First Name">
                            <input v-model="registerLastName" placeholder="Last Name">
                        </div>
                        <input v-model="registerPassword" placeholder="Password" type="password">
                        <button @click="handleRegister">Register</button>
                        </div>
                        <div class="auth-links">
                            Already have an account? <a href="#" @click="goLogin">Sign In</a>
                        </div>
                    </div>
                    <!-- Form for Email Validation OTP -->
                     <div v-else-if="!isLogin && registerValidationEmailSent" key="validation" class="form-section validation-form">
                        <h1>Email Validation</h1>
                        <h3>To keep your account well maintained, we need to make sure your email address is accessible. Please check your inbox mails and tell us your validation code. </h3>
                        <div class="auth-input-container">
                            <input v-model="registerValidationOTP" placeholder="Email Validation Code">
                            <button @click="handleValidation">Validate</button>
                        </div>
                        <div class="auth-links">
                            Didn't receive it? <a href="#" @click="resendValidationCode">Resend Code</a>
                        </div>
                        <div class="auth-links">
                            Typo in email address? <a href="#" @click="abortRegistration">Abort Signing Up</a>
                        </div>
                     </div>
                </transition>
                <transition name="fade">
                    <div v-if="isLoading" class="panel-loading-overlay">
                    </div>
                </transition>
            </div>
        </div>
    </div>

</template>

<script setup>
import { onMounted, ref } from 'vue';
import { toast } from 'vue3-toastify';
import { useRouter } from 'vue-router';
import LogoComponent from '@/components/Logo.vue';
import AuthService from '@/services/authService';
import { validateEmail, validateRequired } from '@/utils/emailValidator'

const router = useRouter();

const toastConfiguration = { autoClose: 3000, theme: "auto" };

const isLogin = ref(true);
const email = ref('');
const password = ref('');
const registerPassword = ref('');
const registerFirstName = ref('');
const registerLastName = ref('');
const registerValidationEmailSent = ref(false);
const registerValidationOTP = ref('');
const isLoading = ref(false);

const checkAuthStatus = async()=>{
    isLoading.value = true;
    try{
        const result = await AuthService.checkAuthStatus();
        if(result.user){
            email.value = result.user.email;
            const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
            localStorage.removeItem('redirectAfterLogin');
            
            router.push(redirectPath);
        }
        if(result.step){
            switchViews(result.step);
        }
    } catch (error) {
        toast.error(`Failed to get authentication status`, toastConfiguration);
        switchViews("login");
    }
    isLoading.value = false;
}

onMounted(checkAuthStatus);

const handleLogin = async() => {
    if (!validateRequired(email.value) || !validateRequired(password.value)) {
        toast.error("Please enter your email address and password. ", toastConfiguration);
        return;
    }
    if (!validateEmail(email.value)) {
        toast.error("Please enter a valid email address. ", toastConfiguration);
        return;
    }
    isLoading.value = true;
    try {
        await AuthService.login(email.value, password.value);
        const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin'); 
        
        router.push(redirectPath);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to sign in. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

const resetPassword = async() => {
    if (!validateRequired(email.value)) {
        toast.error("Please enter your email address to reset your password. ", toastConfiguration);
        return;
    }
    if (!validateEmail(email.value)) {
        toast.error("This is not a valid email address. Please check again. ", toastConfiguration);
        return;
    }
    try {
        isLoading.value = true;
        const result = await AuthService.forgotPassword(email.value);
        toast.success(result.message, toastConfiguration);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to request password resetting. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

const handleRegister = async() => {
    if (!validateRequired(email.value)) {
        toast.error("Please enter your email address to register an account. ", toastConfiguration);
        return;
    }
    if (!validateEmail(email.value)){
        toast.error("Please enter an valid email address. ", toastConfiguration);
        return;
    }
    if(!validateRequired(registerFirstName.value) || !validateRequired(registerLastName.value)){
        toast.error("Your name information cannot be empty. ", toastConfiguration);
        return;
    }
    if(!validateRequired(registerPassword.value)){
        toast.error("Please assign your password to register your account. ", toastConfiguration);
        return;
    }
    isLoading.value = true;
    try {
        const result = await AuthService.register({
            email: email.value,
            password: registerPassword.value,
            firstname: registerFirstName.value,
            lastname: registerLastName.value
        });
        toast.success(result.message, toastConfiguration);
        if(result.step) switchViews(result.step);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to register. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

const handleValidation= async()=>{
    isLoading.value = true;
    try {
        const result = await AuthService.verifyEmail(registerValidationOTP.value);
        toast.success(result.message, toastConfiguration);
        if(result.step) switchViews(result.step);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to validate your registration. ', toastConfiguration);
        if(error.response?.data?.step) switchViews(error.response.data.step);
    } finally {
        isLoading.value = false;
    }
}

const resendValidationCode = async()=>{
    isLoading.value = true;
    try{
        const result = await AuthService.resendValidationCode();
        toast.success(result.message, toastConfiguration);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to request resending validation code. ', toastConfiguration);
        if(error.response?.data?.step) switchViews(error.response.data.step);
    } finally {
        isLoading.value = false;
    }
}

const abortRegistration = async()=>{
    isLoading.value = true;
    try{
        const result = await AuthService.abortRegistration();
        toast.success(result.message, toastConfiguration);
        switchViews(result.step);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to abort signing up. ', toastConfiguration);
        if(error.response?.data?.step) switchViews(error.response.data.step);
    } finally {
        isLoading.value = false;
    }
}

const goRegister = () => {
    isLogin.value = false;
    clearRegisterInfo();
}

const goLogin = () => {
    isLogin.value = true;
    clearRegisterInfo();
}

const clearRegisterInfo = ()=>{
    registerFirstName.value = "";
    registerLastName.value = "";
    registerPassword.value = "";
}

const switchViews = (status)=>{
    switch(status){
        case "login":
            goLogin();
            break;
        case "register":
            registerValidationEmailSent.value = false;
            goRegister();
            break;
        case "verification":
            registerValidationEmailSent.value = true;
            goRegister();
            break;
        default:
            goLogin();
            break;
    }
}

</script>

<style scoped>
* {
    transition: 200ms;
}

.auth {
    height: 100%;
    background: linear-gradient(135deg, #cac9ef 0%, #bff6f3 100%);
    transition: none;
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
    height: 50px;
    align-items: center;
    display: flex;
}

.header-content {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: large;
    font-weight: 900;
    font-style: italic;
}

.main-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2em 10em;
    min-height: 800px;
    transition: none;
}

.panel {
    margin-top: 0;
    padding: 4em;
    box-shadow: 0 5px 25px rgb(0, 0, 0, 0.1);
    background-color: rgba(255, 255, 255, 0.879);
    /* width: 300px; */
    /* height: 200px; */
    border-color: grey;
    border-radius: 48px;
    color: black;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
    transition: width 0.5s, height 0.5s;
    display: flex;
    align-items: center;
    flex-direction: column;
    min-width: 350px;
}

.panel-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.239);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
}

.form-section {
    align-content: center;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-between;
    width: 300px;
    height: 350px;
}

.panel h1 {
    font-size: xx-large;
    font-weight: 500;
}

.panel h3 {
    font-size:medium;
    font-weight: 300;
    text-align: justify;
}

.auth-input-container {
    margin: 2rem;
    display: flex;
    align-items: center;
    flex-direction: column;
    width: 80%;
    gap: 1rem;
}

.panel button {
    border-radius: 20px;
    background-color: #8b91eb;
    border-style: none;
    width: 50%;
    height: 40px;
    font-size: small;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    color: rgb(250, 249, 255);
}

.panel button:hover {
    background-color: #a8ace9;
    color: #ffffff
}

.panel button:active {
    background-color: #323ab0;
    color: rgb(250, 249, 255);
    width: 55%;
    height: 42px;
    border-radius: 21px;
}

.panel input {
    height: 30px;
    width: 100%;
    border-radius: 20px;
    border-style: none;
    padding: 1rem;
    border-style: solid;
    border-width: 1px;
    border-color: #7777ff;
    font-size: small;
    background-color: rgba(255, 255, 255, 0.365);
}

.personal-info{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.personal-info input{
    width:50%
}

.validation-form input{
    text-align: center;
}

a {
    color: #3c5cfc;
    padding: 5px 8px;
    border-radius: 8px;
}

a:hover {
    background-color: #667fff3e;
}

.auth-links {
    margin: 0rem;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease, backdrop-filter 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
}

@media (prefers-color-scheme: dark) {
    .header {
        background-color: rgba(0, 0, 0, 0.414);
        border-color: rgb(86, 70, 146);
    }

    .panel {
        background-color: rgba(14, 11, 40, 0.868);
        color: white;
    }

    .panel-loading-overlay {
        background-color: rgba(0, 0, 0, 0.294);
    } 

    .panel button {
        background-color: #cba3e7;
        color: #1d0728;
    }

    .panel button:hover {
        background-color: #bd89e2;
        color: #1d0728
    }

    .panel button:active {
        background-color: #9560bb;
        color: #e3c7f2;
    }

    .panel input {
        background-color: #10173ba6;
        border-color: #324497;
        color: white
    }

    .auth {
        background: linear-gradient(135deg, #132262 0%, #764ba2 100%);
    }

    a:hover {
        background-color: rgba(60, 92, 252, 0.32);
    }

}
</style>