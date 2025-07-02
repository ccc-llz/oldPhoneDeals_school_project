<template>
    <div v-if="isVisible" class="dialog-overlay">
        <div class="dialog-box">
            <h2>{{ title }}</h2>
            <div class="dialog-content">
                <p>{{ message }}</p>
                <div class="password-input">
                    <label for="password">Password:</label>
                    <input type="password" id="password" v-model="password" @keyup.enter="confirm"
                        placeholder="Please enter your password" ref="passwordInput" />
                </div>
                <div v-if="error" class="error-message">{{ error }}</div>
            </div>
        </div>
        <div class="dialog-actions">
            <button @click="cancel" class="cancel-btn">Cancel</button>
            <button @click="submit" class="submit-btn">Submit</button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const properties = defineProps({
    isVisible: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'Password Required'
    },
    message: {
        type: String,
        default: 'Your password is required to authenticate before editing your profile. '
    }
});

const emit = defineEmits(['submit', 'cancel', 'update:isVisible']);

const password = ref('');
const error = ref('');
const passwordInput = ref(null);

watch(() => properties.isVisible, (newVal) => {
    if (newVal) {
        password.value = '';
        error.value = '';
        setTimeout(() => {
            passwordInput.value?.focus();
        }, 50);
    }
});

const submit = () => {
    if (!password.value) {
        error.value = "Password is required. ";
        return;
    }

    emit('submit', password.value);

    emit('update:isVisible', false);
}

const cancel = () => {
    emit('cancel');
    emit('update:isVisible', false);
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

.dialog-box {
    box-shadow: 0 5px 25px rgb(0, 0, 0, 0.1);
    background-color: rgb(244, 247, 250);
    border-color: grey;
    border-radius: 48px;
    color: black;
    padding: 48px;
    min-width: 300px;
}

.dialog-content {
    margin: 16px 0
}

.password-input {
    margin: 12px 0px 8px 0px;
}

.password-input input {
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

.password-input label {
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

@media (prefers-color-scheme: dark) {
    .dialog-overlay {
        background-color: rgba(11, 9, 26, 0.739);
    }

    .dialog-box {
        box-shadow: 0 5px 25px rgba(255, 255, 255, 0.013);
        background-color: rgb(20, 18, 37);
        color: white;
    }

    .password-input input {
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
}
</style>