<template>
    <div v-if="isVisible" class="dialog-overlay">
        <div class="dialog-box">
            <h2>Add Listing</h2>
            <div class="dialog-content">
                <div class="image-upload">
                    <label for="image-upload" class="upload-area">
                        <img v-if="imagePreview" :src="imagePreview" alt="Preview" />
                        <div v-else class="upload-placeholder">
                            <span>Upload Image</span>
                        </div>
                    </label>
                    <input id="image-upload" type="file" accept="image/*" @change="handleImageUpload"
                        style="display: none" />
                </div>
                <div>
                    <div class="input-area">
                        <label>Name</label>
                        <input placeholder="Phone Name" v-model="phoneName" />
                    </div>
                    <div class="input-area">
                        <label>Brand</label>
                        <input placeholder="Phone Brand" v-model="phoneBrand" />
                    </div>
                    <div class="input-area">
                        <label>Stock</label>
                        <input placeholder="Number of Stock" type="number" min="0" v-model="phoneStock" />
                    </div>
                    <div class="input-area">
                        <label>Price</label>
                        <input placeholder="Phone Price" type="number" min="0.01" v-model="phonePrice" />
                    </div>
                </div>
            </div>
            <div v-if="error" class="error-message">{{ error }}</div>
        </div>
        <div class="dialog-actions">
            <button @click="cancel" class="cancel-btn">Cancel</button>
            <button @click="submit" class="submit-btn">Submit</button>
        </div>
        <transition name="fade">
            <div v-if="isLoading" class="panel-loading-overlay">
            </div>
        </transition>
    </div>

</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import axios from 'axios';
import UserProfileService from '@/services/profileService';

const toastConfiguration = { autoClose: 3000, theme: "auto" };

const properties = defineProps({
    isVisible: {
        type: Boolean,
        default: false
    }
});

const imagePreview = ref('');

const emit = defineEmits(['submit', 'cancel', 'update:isVisible']);

const error = ref('');
const phoneName = ref('');
const phoneBrand = ref('');
const phonePrice = ref(0);
const phoneStock = ref(0);
const phoneImage = ref(null);

const isLoading = ref(false);

watch(() => properties.isVisible, (newVal) => {
    if (newVal) {
        phoneName.value = '';
        phoneBrand.value = '';
        phonePrice.value = 0;
        phoneStock.value = 0;
        imagePreview.value = '';
        isLoading.value = false;
    }
});

const submit = async () => {
    const result = await addListing();
    if(result){
        emit('submit');
        emit('update:isVisible', false);
    }
}

const cancel = () => {
    emit('cancel');
    emit('update:isVisible', false);
}

const handleImageUpload = (event) => {
    phoneImage.value = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target.result;
    }
    reader.readAsDataURL(phoneImage.value);
}

const addListing = async () => {
    if(phoneName.value === ''){
        error.value = 'Phone name field cannot be blank. ';
        return;
    }
    if(phoneBrand.value === ''){
        error.value = 'Phone brand field cannot be blank. ';
        return;
    }
    if(phoneStock.value === ''){
        error.value = 'Phone stock field cannot be blank. ';
        return;
    }
    if(phonePrice.value === ''){
        error.value = 'Phone price field cannot be blank. ';
        return;
    }
    if(phoneImage.value === null){
        error.value = 'Phone image cannot be empty. ';
        return;
    }
    isLoading.value = true;
    try {
        await UserProfileService.addListing({
            title: phoneName.value,
            brand: phoneBrand.value,
            stock: phoneStock.value,
            price: phonePrice.value,
            image: phoneImage.value
        });
        toast.success("Successfully added!", toastConfiguration);
        return true;
    } catch (error) {
        error.value = error.toString();
        console.log(error);
        return false;
    } finally {
        isLoading.value = false;
    }
}

</script>

<style scoped>
* {
    transition: 0.2s ease;
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(170, 170, 170, 0.134);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 999;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.upload-area {
    display: block;
    width: 200px;
    height: 200px;
    border: 2px dashed #ccc;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-area:hover {
    border: 2px dashed #bda0fc;
}

.upload-area img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
}

.dialog-box {
    box-shadow: 0 5px 25px rgb(0, 0, 0, 0.1);
    background-color: rgb(244, 247, 250);
    border-color: grey;
    border-radius: 48px;
    color: black;
    padding: 48px;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.dialog-content {
    margin: 16px 0;
    display: flex;
    gap: 16px;
}

.input-area {
    margin: 8px;
}

input {
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

label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.error-message {
    color: #ff4d4f;
    font-size: 14px;
    margin-top: 8px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
}

button {
    border-radius: 20px;
    background-color: #8b91eb;
    border-style: none;
    width: 100px;
    height: 40px;
    font-size: small;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    color: rgb(250, 249, 255);
    padding: 8px 16px;
    margin: 8px;
}

button:hover {
    background-color: #9aa0f2;
    color: #ffffff;
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.328);
}

button:active {
    background-color: #4e56c9;
    box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.328);
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

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.35s ease, backdrop-filter 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (prefers-color-scheme: dark) {
    .dialog-overlay {
        background-color: rgba(11, 9, 26, 0.739);
    }

    .dialog-box {
        box-shadow: 0 5px 25px rgba(255, 255, 255, 0.013);
        background-color: rgb(20, 18, 37);
        color: white;
    }

    input {
        border-color: #324497;
        background-color: #10173ba6;
        color: white;
    }

    .error-message {
        color: #bb3335;
    }

    button {
        background-color: #cba3e7;
        color: #1d0728;
    }

    button:hover {
        background-color: #bd89e2;
        color: #1d0728;
        box-shadow: 0 0px 10px rgba(255, 255, 255, 0.219);
    }

    button:active {
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.328);
        background-color: #9560bb;
        color: #e3c7f2;
    }

    .upload-area {
        border: 2px dashed #ccc;
    }

    .upload-area:hover {
        border: 2px dashed #616096;
    }

    .panel-loading-overlay {
        background-color: rgba(0, 0, 0, 0.294);
    }
}
</style>