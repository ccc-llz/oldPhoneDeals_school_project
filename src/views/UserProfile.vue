<template>
    <div class="auth">
        <header class="header">
            <div class="header-content">
                <logo-component />
                <button @click="Logout">Sign Out</button>
            </div>
        </header>
        <div class="main-content">
            <!-- Change Profile Dialog -->
            <Transition name="fade">
                <PasswordDialog v-model:isVisible="changeProfileRequirePasswordDialogVisible" @submit="handlePasswordSubmit"/>
            </Transition>
            <!-- Change Password Dialog -->
            <Transition name="fade">
                <ConfirmChangePasswordDialog v-model:isVisible="changePasswordRequireConfirmaDialogVisible" @submit="handleChangePasswordConfirmSubmit"/>
            </Transition>
            <!-- Add Listing Dialog -->
            <Transition name="fade">
                <AddListingDialog v-model:isVisible="addListingDialogVisible"
                @submit="getUserListings"/>
            </Transition>
            <div class="panel">
                <div class="segment-controls">
                    <button v-for="(tab, index) in tabs" :key="index"
                        :class="['segment-button', { active: activeTab === index }]"
                        @click="clearPasswords();
                        if(index == 2){
                            userPhoneList.value = [];
                            getUserPhoneComments();
                        }
                        else if(index == 1){
                            userListing.value = [];
                            getUserListings();
                        }
                        activeTab = index;
                        "
                    >
                        {{ tab.title }}
                    </button>
                </div>
                <div class="tab-content-wrapper">
                    <!-- Edit Profile -->
                    <div v-if="activeTab === 0" class="tab-content" key="profile">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h1>Hello, {{ profile_original.firstname }}</h1>
                            <Transition name="fade">
                                <button :class="'panel-button'" style="width: 128px;" v-show="profileHasChanged" @click="checkProfileEditing">Save Changes</button>
                            </Transition>
                        </div>
                        <hr>
                        <h2 style="margin-bottom: 8px;">Information</h2>
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" v-model="profile.firstname" />
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" v-model="profile.lastname" />
                        </div>
                        <hr>
                        <div class="form-group">
                            <h2 style="margin-bottom: 8px;">Email</h2>
                            <!-- <input type="text" v-model="profile.email" /> -->
                            <transition name="fade" mode="out-in">
                                <div v-if="!isToChangeEmailAddress"
                                    style="display: flex; justify-content: space-between; align-items: center;">
                                    <h3>{{ profile.email }}</h3>
                                    <button :class="'panel-button'" style="width: 90px;"
                                        @click="toChangeEmailAddress">Alter</button>
                                </div>
                                <div v-else>
                                    <div class="email-container">
                                        <div class="input-wrapper">
                                            <input type="text" placeholder="Email Address" v-model="profile.email" class="email-input"/>
                                        </div>
                                        <Transition name="fade">
                                            <div v-if="enterEmailChangeValidation" style="width: 200px;">
                                                <label>Email Change Validation</label>
                                                <input type="text" placeholder="Email Validation Code"
                                                    v-model="emailValidationCode" />
                                            </div>
                                        </Transition>
                                        <div class="email-change-buttons-container">
                                            <Transition name="fade" mode="out-in">
                                                <button v-if="emailAddressChanged && !enterEmailChangeValidation" key="modify" :class="'panel-button'"
                                                    style="height: 36px; width: 90px; " @click="requestChangeEmail">
                                                    Alter
                                                </button>
                                                <button v-else-if="emailAddressChanged && enterEmailChangeValidation" key="change" :class="'panel-button'"
                                                    style="height: 36px; width: 90px;" @click="alterUserEmail">
                                                    Confirm
                                                </button>
                                            </Transition>
                                                <button key="cancel" :class="'panel-button'" @click="cancelChangeEmail"
                                                    style="height: 36px; width: 90px;">
                                                    Cancel
                                                </button>
                                        </div>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                    <!-- Manage Listings -->
                    <div v-if="activeTab === 1" class="tab-content" key="listings">
                        <div class="add-listing-header">
                            <button class="add-listing-button" @click="addListingDialogDisplay">Add Listing</button>
                        </div>
                        <div v-if="userListing.length == 0" style="display: flex; justify-content: center; align-items: center; width: 100%; height: calc(100% - 50px);">
                            <h1 style="width: 80%; text-align: center;">You haven't uploaded any listing yet.</h1>
                        </div>
                        <div style="display: flex; gap: 8px; flex-direction: column;">
                            <PhoneListing class="scroll-item" v-for="phone in userListing" :key="phone._id" 
                            :phone-id="phone._id" 
                            :phone-name="phone.title" 
                            :phone-thumbnail-url="phone.image" 
                            :phone-comments="phone.reviews" 
                            :phone-brand="phone.brand" 
                            :phone-price="phone.price" 
                            :phone-stock="phone.stock"
                            :phone-disabled="phone.isDisabled"
                            @update-disabled="(newValue)=>phone.isDisabled = newValue"
                            @refresh-list="getUserListings"
                            />
                        </div>
                    </div>
                    <!-- View Comments -->
                    <div v-if="activeTab === 2" class="tab-content" key="comments">
                        <div v-if="userPhoneList.length == 0" style="display: flex; justify-content: center; align-items: center; width: 100%; height: calc(100% - 50px);">
                            <h1 style="width: 80%; text-align: center;">Your goods havn't receive any comments yet.</h1>
                        </div>
                        <div style="display: flex; gap: 8px; flex-direction: column;">
                            <CommentView class="scroll-item" v-for="phone in userPhoneList" :key="phone._id" 
                            :phone-name="phone.title" 
                            :phone-thumbnail-url="phone.image" 
                            :phone-comments="phone.reviews"
                            />
                        </div>
                    </div>
                    <!-- Change Password -->
                    <div v-if="activeTab === 3" class="tab-content" key="password">
                        <h2 style="margin-bottom: 8px;">Change Password</h2>
                        <div class="form-group">
                            <label>Current Password</label>
                            <input type="password" v-model="originalPassword" />
                        </div>
                        <hr>
                        <div class="form-group">
                            <label>New Password</label>
                            <input type="password" v-model="newPassword" />
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" v-model="confirmNewPassword" />
                        </div>
                        <div style="display: flex; width: 100%; align-items: center; justify-content: center;">
                            <Transition name="fade">
                                <button :class="'panel-button'" v-show="showChangePasswordButton" @click="toChangePassword">Submit</button>
                            </Transition>
                        </div>
                    </div>
                </div>
                <transition name="fade">
                    <div v-if="isLoading" class="panel-loading-overlay">
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { toast } from 'vue3-toastify';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { useRouter } from 'vue-router';
import LogoComponent from '@/components/Logo.vue';
import PasswordDialog from '@/components/user-profile/PasswordDialog.vue'
import ConfirmChangePasswordDialog from '@/components/user-profile/ConfirmChangePasswordDialog.vue';
import CommentView from '@/components/user-profile/CommentView.vue';
import PhoneListing from '@/components/user-profile/PhoneListing.vue';
import AddListingDialog from '@/components/user-profile/AddListingDialog.vue';

import UserProfileService from '@/services/profileService';
import AuthService from '@/services/authService';

const router = useRouter();

const toastConfiguration = { autoClose: 3000, theme: "auto" };
const isLoading = ref(false);

const isToChangeEmailAddress = ref(false);
const enterEmailChangeValidation = ref(false);

const changeProfileRequirePasswordDialogVisible = ref(false);
const changePasswordRequireConfirmaDialogVisible = ref(false);
const addListingDialogVisible = ref(false);

const userPhoneList = ref([]);
const userListing = ref([]);

var uid;
const emailValidationCode = ref('');
const tabs = [
    { title: 'Edit Profile' },
    { title: 'Manage Listings' },
    { title: 'View Comments' },
    { title: 'Change Password' }
];
const activeTab = ref(0);
const profile = reactive({
    email: 'example@mail.com',
    firstname: 'Chimi',
    lastname: 'tan',
});

const profile_original = reactive({
    email: 'example@mail.com',
    firstname: 'Chimi',
    lastname: 'tan',
});

const originalPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const profileHasChanged = computed(() => {
    return (profile.lastname !== profile_original.lastname) || (profile.firstname !== profile_original.firstname);
});

const emailAddressChanged = computed(() => {
    return (profile.email !== profile_original.email);
});

const showChangePasswordButton = computed(()=>{
    return originalPassword.value != '' && 
            newPassword.value != '' && 
            confirmNewPassword.value != '' && 
            confirmNewPassword.value === newPassword.value;
});

const getUserState = async () => {
    isLoading.value = true;
    try {
        const userInfo = await UserProfileService.getUserInfo(uid);

        profile.email = userInfo.email;
        profile.firstname = userInfo.firstname;
        profile.lastname = userInfo.lastname;

        profile_original.email = userInfo.email;
        profile_original.firstname = userInfo.firstname;
        profile_original.lastname = userInfo.lastname;
    } catch (error) {
        console.error('Error fetching user state:', error);
        router.push('/auth');
    }
    isLoading.value = false;
}

onMounted(getUserState);

const Logout = async () => {
    isLoading.value = true;
    try {
        await AuthService.logout();
        router.push('/auth');
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to sign out', toastConfiguration);
    }
}

const toChangeEmailAddress = () => {
    isToChangeEmailAddress.value = true;
}

const cancelChangeEmail = () => {
    isToChangeEmailAddress.value = false;
    enterEmailChangeValidation.value = false;
    profile.email = profile_original.email;
}

const requestChangeEmail = async () => {
    if(profile.email === ''){
        toast.error('Please enter your new email address. ', toastConfiguration);
        return;
    }
    isLoading.value = true;
    try {
        const result = await UserProfileService.requestEmailChange(profile.email);
        toast.success(result.message, toastConfiguration);
        enterEmailChangeValidation.value = true;
    } catch(error) {
        if(error.response?.data?.action && error.response?.data?.action === 'cancelEmailAltering') {
            clearEmailChangingState();
        }
        if(error.response?.data?.fallback) router.push(error.response.data.fallback);
        else toast.error(error.response?.data?.message || 'Request failed', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

const alterUserEmail = async() => {
    if(emailValidationCode.value === ''){
        toast.error('Please enter your validation code. ', toastConfiguration);
        return;
    }
    isLoading.value = true;
    try {
        const result = await UserProfileService.confirmEmailChange(
            profile.email,
            emailValidationCode.value
        );
        toast.success(result.message, toastConfiguration);
        clearEmailChangingState();
    } catch (error) {
        if(error.response?.data?.action && error.response?.data?.action === 'cancelEmailAltering') {
            clearEmailChangingState();
        }
        if(error.response?.data?.fallback) router.push(error.response.data.fallback);
        else toast.error(error.response?.data?.message || 'Failed to modify your binding email address. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

function clearEmailChangingState(){
    enterEmailChangeValidation.value = false;
    isToChangeEmailAddress.value = false;
    emailValidationCode.value = '';
    getUserState();
}

const showPasswordDialog = ()=>{
    changeProfileRequirePasswordDialogVisible.value = true;
}

const checkProfileEditing = ()=>{
    if(profile.firstname === ''){
        toast.error("First name field cannot be blank. ");
        return; 
    }
    if(profile.lastname === ''){
        toast.error("Last name field cannot be blank. ");
        return; 
    }
    showPasswordDialog();
}

const handlePasswordSubmit = async(password) => {
    isLoading.value = true;
    try {
        await UserProfileService.verifyPassword(password);
        const result = await UserProfileService.updateUserInfo({
            firstname: profile.firstname,
            lastname: profile.lastname
        })
        getUserState();
        toast.success(result.message, toastConfiguration);
    } catch(error) {
        if(error.response?.data?.fallback) router.push(error.response.data.fallback);
        else toast.error(error.response?.data?.message || 'Failed to modify your profile. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
};

const toChangePassword = ()=> {
    changePasswordRequireConfirmaDialogVisible.value = true;
}

const handleChangePasswordConfirmSubmit = async()=> {
    if(originalPassword.value === newPassword.value) {
        toast.error("Your new password is the same as the original password. Please check and try again. ", toastConfiguration);
        return;
    }
    isLoading.value = true;
    try {
        const result = await UserProfileService.changePassword(
            originalPassword.value,
            newPassword.value
        );
        toast.success(result.message, toastConfiguration);
        getUserState();
        clearPasswords();
    } catch(error) {
        if(error.response?.data?.fallback) router.push(error.response.data.fallback);
        else toast.error(error.response?.data?.message || 'Failed to change your password. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
};

const getUserPhoneComments = async()=>{
    isLoading.value = true;
    try {
        userPhoneList.value = await UserProfileService.getUserComments();
    } catch(error) {
        if(error.response?.data?.fallback) router.push(error.response.data.fallback);
        else toast.error(error.response?.data?.message || 'Failed to fetch comments. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

const getUserListings = async()=>{
    isLoading.value = true;
    try {
        userListing.value = await UserProfileService.getUserListings();
    } catch(error) {
        if(error.response?.data?.fallback) router.push(error.response.data.fallback);
        else toast.error(error.response?.data?.message || 'Failed to fetch listings. ', toastConfiguration);
    } finally {
        isLoading.value = false;
    }
}

const addListingDialogDisplay = ()=>{
    addListingDialogVisible.value = true;
}

const clearPasswords = () => {
    originalPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
};

</script>

<style scoped>

/* #region basicElements */

* {
    transition: 200ms;
}

.auth {
    height: 100%;
    background: linear-gradient(135deg, #e1e0fb 0%, #dafffd 100%);
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
    flex-direction: row;
    width: 100%;
}

.header-content button {
    border-radius: 20px;
    background-color: #d2e7f0e3;
    border-style: none;
    width: 90px;
    height: 30px;
    font-size: small;
    font-weight: 200;
    color: rgb(0, 0, 0);
}

.header-content button:hover {
    background-color: #ffffff;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
}

.header-content button:active {
    background-color: #f5f5f5;
    box-shadow: inset 0 3px 5px rgb(0, 0, 0, 0.1);
}

.main-content {
    /* height: 100%; */
    display: flex;
    align-items: center;
    justify-content: center;
    /* padding: 2em 10em; */
    /* min-height: 800px; */
    transition: none;
    /* width: 100%; */
}

.add-listing-header {
    position:sticky;
    padding: 8px 8px 8px 8px;
    display: flex;
    justify-content: flex-end;
    backdrop-filter: blur(10px); 
    -webkit-backdrop-filter: blur(10px); 
    background-color: transparent;
    border-radius: 50px;
    z-index: 999;
}

.panel {
    box-shadow: 0 5px 25px rgb(0, 0, 0, 0.1);
    background-color: rgba(255, 255, 255, 0.879);
    border-color: grey;
    border-radius: 48px;
    color: black;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
    transition: width 0.5s, height 0.5s;
    display: flex;
    align-items: stretch;
    flex-direction: column;
    position: absolute;
    top: 70px;
    right: 20px;
    left: 20px;
    bottom: 20px;
    min-width: 350px;
    min-height: 530px;
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

.panel h1 {
    font-size: xx-large;
    font-weight: 600;
}

.panel h2 {
    font-size: 20pt;
}

.panel h3 {
    font-size: 15pt;
    font-weight: 300;
    text-align: justify;
}

.profile-input-container {
    margin: 2rem;
    display: flex;
    align-items: center;
    flex-direction: column;
    width: 80%;
    gap: 1rem;
}

.panel-button {
    border-radius: 20px;
    background-color: #8b91eb;
    border-style: none;
    width: 50%;
    height: 40px;
    font-size: small;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    color: rgb(250, 249, 255);
}

.panel-button:hover {
    background-color: #a8ace9;
    color: #ffffff
}

.panel-button:active {
    background-color: #323ab0;
    color: rgb(250, 249, 255);
    width: 55%;
    height: 42px;
    border-radius: 21px;
}

.segment-controls {
    display: flex;
    border-bottom: 1px solid #ddd;
    width: calc(100% - 64px);
    margin: 0 32px 16px 32px;
    position: sticky;
    top: 0;
    background-color: none;
    z-index: 10;
    justify-content: space-between;
    flex-shrink: 0;
}

.segment-button {
    margin: 25px 0px 15px 0px;
    padding: 8px 16px;
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    transition: all 0.3s;
    text-align: center;
    box-shadow: none;
    border-radius: 50px;
    border-width: 0;
}

.segment-button:hover {
    background-color: white;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    color: #666
}

.segment-button.active {
    color: #246fbf;
    box-shadow: inset 0 5px 3px rgb(0, 0, 0, 0.1);
    background-color: #accef2;
}

.tab-content-wrapper {
    flex: 1;
    margin: 0;
    position: relative;
    overflow: hidden;
}

.tab-content {
    height: 100%;
    width: 100%;
    overflow-y: auto;
    padding: 0 32px 18px 32px;
    box-sizing: border-box;
    scrollbar-width: none;
    scroll-behavior: smooth;
    transform: translateZ(0);
    will-change: scroll-position;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: y proximity;
}

.scroll-item {
    transform: translateZ(0);
    backface-visibility: hidden;
}

.add-listing-button {
    border-radius: 20px;
    background-color: #d2e7f0e3;
    border-style: none;
    width: 90px;
    height: 30px;
    font-size: small;
    font-weight: 200;
    color: rgb(0, 0, 0);
}

.add-listing-button:hover {
    background-color: #ffffff;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
}

.add-listing-button:active {
    background-color: #f5f5f5;
    box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.545);
}

.tab-content.with-form {
    padding-bottom: 106px;
}

.form-section {
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 32px 0;
    border-top: 1px solid #eeeeee27;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
    background-color: inherit;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

/* #endregion */

.email-container {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.email-input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
}

.input-wrapper {
    width: 100%;
    height: 36px;
}

.email-change-buttons-container {
    width: calc(90px * 2 + 1rem);
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 1rem;
    margin-bottom: 8px;
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

.personal-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.personal-info input {
    width: 50%;
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

hr {
    opacity: 50%;
    margin: 16px 0px 16px 0px;
}

/* #region transitions */

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
}

.width-change-enter-active,
.width-change-leave-active {
    transition: all 0.5s ease;
    max-width: 100%;
}

.width-change-enter-from,
.width-change-leave-to {
    max-width: 0;
    opacity: 0;
    padding: 20px 0;
}

/* #endregion */

@media (prefers-color-scheme: dark) {
    .header {
        background-color: rgba(0, 0, 0, 0.414);
        border-color: rgb(86, 70, 146);
    }

    .header-content button {
        background-color: #6b45aee3;
        color: rgba(255, 255, 255, 0.696);
    }

    .header-content button:hover {
        background-color: #7c57bbe3;
        box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    }

    .header-content button:active {
        background-color: rgba(74, 40, 132, 0.89);
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.765);
    }

    .panel {
        background-color: rgba(14, 11, 40, 0.868);
        color: white;
    }

    .panel-loading-overlay {
        background-color: rgba(0, 0, 0, 0.294);
    }

    .panel-button {
        background-color: #cba3e7;
        color: #1d0728;
    }

    .panel-button:hover {
        background-color: #bd89e2;
        color: #1d0728
    }

    .panel-button:active {
        background-color: #9560bb;
        color: #e3c7f2;
    }

    .segment-controls {
        border-bottom: 1px solid #dddddd45;
    }

    .segment-button {
        color: #e8e8e8;
    }

    .segment-button:hover {
        background-color: rgba(255, 255, 255, 0.339);
        box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
        color: #e8e8e8;
    }

    .segment-button.active {
        color: #ffffffad;
        box-shadow: inset 0 5px 3px rgba(0, 0, 0, 0.1);
        background-color: #985db8;
    }

    .panel input {
        background-color: #10173ba6;
        border-color: #324497;
        color: white
    }

    .auth {
        background: linear-gradient(135deg, #111838 0%, #47137c 100%);
    }

    a:hover {
        background-color: rgba(60, 92, 252, 0.32);
    }

    .add-listing-button {
        background-color: #d2e7f0e3;
        color: rgb(0, 0, 0);
    }

    .add-listing-button:hover {
        background-color: #f5fafc;
    }

    .add-listing-button:active {
        background-color: #c8dde0;
    }

}
</style>