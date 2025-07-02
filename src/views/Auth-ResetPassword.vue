<template>
    <div class="auth">
        <header class="header">
            <div class="header-content">
                <logo-component/>
            </div>
        </header>
        <div class="main-content">
            <div class="panel" ref="panel">
                <transition :name="resetDone ? 'slide-left' : 'slide-right'" mode="out-in">
                    <!-- From for Login -->
                    <div v-if="!resetDone" key="reset" class="form-section reset-form">
                        <h1>Reset Password</h1>
                        <div class="description">
                            <h3>Please type in your new password in the following blanks respectively. </h3>
                            <h3>The passwords in these two fields have to be the same. </h3>
                        </div>
                        <div class="auth-input-container">
                            <input type="password" placeholder="New Password" v-model="password">
                            <input type="password" placeholder="Confirm New Password" v-model="confirmPassword">
                            <button @click="submitReset">Reset</button>
                        </div>
                        
                    </div>
                    <!-- Form for Register -->
                    <div v-else-if="resetDone" key="done" class="form-section done-form">
                        <h1>Done!</h1>
                        <h2>Your password has been reset. </h2>
                        <h3>You can sign in with your new password now. Please remember not to share your password with
                            anyone else. </h3>
                        <div class="auth-input-container">

                            <button @click="goLogin">Sign In</button>
                        </div>
                    </div>
                </transition>
                <!-- Loading Overlay -->
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
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import LogoComponent from '@/components/Logo.vue';
import { validateRequired } from '@/utils/emailValidator';
import AuthService from '@/services/authService';

const route = useRoute();
const router = useRouter();
const tokenValid = ref(false);

const token = ref('');

const toastConfiguration = { autoClose: 3000, theme: "auto" };

const resetDone = ref(false);
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const validateToken = async () => {
    token.value = route.params.token;
    isLoading.value = true;
    try {
        await AuthService.validateResetToken(token.value);
        tokenValid.value = true;
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Token is invalid or validation failed. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

onMounted(validateToken);

const submitReset = async()=>{
    if(!validateRequired(password.value)){
        toast.error("Password cannot be empty. ", toastConfiguration);
        return;
    }
    if(!validateRequired(confirmPassword.value)){
        toast.error("Password confirmation cannot be empty. ", toastConfiguration);
        return;
    }
    if(confirmPassword.value !== password.value){
        toast.error("Password and its confirmation should be the same. ", toastConfiguration);
        return;
    }
    isLoading.value = true;
    try {
        const result = await AuthService.resetPassword(token.value, confirmPassword.value);
        toast.success(result.message, toastConfiguration);
        resetDone.value = true;
        setTimeout(()=>{
            router.push('/auth');
        }, 10000);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password. ', toastConfiguration);
        setTimeout(()=>{
            router.push('/auth');
        }, 3000);
    } finally {
        isLoading.value = false;
    }
}

const goLogin = ()=>{
    router.push('/auth');
}
</script>

<style scoped>

/* #region basicElements */

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

.description {
    margin-top: 20px;
    margin-left: 8px;
    margin-right: 8px;
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

.panel h2 {
    font-size: large;
    font-weight: 300;
}

.panel h3 {
    font-size: medium;
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

/* #endregion */

.personal-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.personal-info input {
    width: 50%
}

.validation-form input {
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
        transition: none;
    }

    a:hover {
        background-color: rgba(60, 92, 252, 0.32);
    }

}
</style>