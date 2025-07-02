<template>
    <div class="listing-panel">
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%;">
            <div class="title" style="width: calc(100% - 112px); display: flex; align-items: center; justify-self: start; gap:16px">
                <img class="thumbnail" :src="getFullImageUrl(phoneThumbnailUrl)" :alt="phoneName">
                <div style="display: flex; flex-direction: column;">
                    <label class="phone-name">{{ phoneName }}</label>
                    <label class="phone-brand">{{ phoneBrand }}</label>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <h3 style="text-align: right; margin-left:8px">{{ '$' + phonePrice }}</h3>
                <h3 style="opacity: 75%;">{{ phoneStock }} in Stock</h3>
            </div>
            
        </div>
        <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
            <button class="listing-button" :class="phoneDisabled ? 'disabled' : 'enabled'" @click="toggleDisabled">{{ phoneDisabled? 'Disabled':'Enabled' }}</button>
            <button class="listing-button delete" @click="deleteListing">Delete</button>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import UserProfileService from '@/services/profileService';

const emit = defineEmits(['update-disabled', 'refreshList']);
const toastConfiguration = { autoClose: 3000, theme: "auto" };


const properties = defineProps({
    phoneId: {
        type: String,
        default: '',
        required: true
    },
    phoneName: {
        type: String,
        default:'',
        required: true
    }, 
    phoneThumbnailUrl: {
        type: String,
        default:'',
        required: true
    },
    phoneBrand: {
        type: String,
        default: '',
        required: true
    },
    phonePrice: {
        type: Number,
        default: '',
        required: true
    },
    phoneStock: {
        type: Number,
        default: '0',
        required: true
    },
    phoneDisabled: {
        type: Boolean,
        default: false,
        required: true
    }
});
const toggleDisabled = async()=>{
    try {
        const response = await UserProfileService.toggleListingDisabled(properties.phoneId, !properties.phoneDisabled);
        emit('update-disabled', response);
    } catch(error) {
        toast.error('Failed to change the status. ', toastConfiguration);
        console.error(error);
    }
}

const deleteListing = async()=>{
    try{
        const response = await UserProfileService.deleteListing(properties.phoneId);
        toast.success(response.message);
        emit('refreshList');
    } catch(error) {
        toast.error('Failed to delete the listing. ', toastConfiguration);
        console.error(error);
    }
}

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}${imagePath}`;
};

</script>

<style scoped>

* {
    transition: 200ms;
}

.listing-panel {
    box-shadow: 0 2px 10px rgb(0, 0, 0, 0.1);
    background-color: rgba(248, 245, 255, 0);
    border-color: rgb(255, 255, 255);
    border-radius: 36px;
    color: black;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    overflow: hidden;
    transition: width 0.5s, height 0.5s;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    padding: 32px;
    height: fit-content;
    box-sizing: border-box;
    margin: 8px 0 8px 0;
}

.title {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
    flex: 0 0 auto;
}

.phone-name {
    font-size: 16pt;
    white-space: normal;
}

.thumbnail {
    height: 50px;
}

.phone-brand {
    opacity: 75%;

}

.listing-button {
    border-radius: 20px;
    background-color: #d2e7f0e3;
    border-style: none;
    width: 70px;
    height: 24px;
    font-size: 10pt;
    font-weight: 200;
    color: rgb(0, 0, 0);
}

.listing-button:hover {
    background-color: #ffffff;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
}

.listing-button:active {
    background-color: #f5f5f5;
    box-shadow: inset 0 3px 5px rgb(0, 0, 0, 0.1);
}

.listing-button.enabled {
    background-color: rgb(217, 250, 167);
}

.listing-button.enabled:hover {
    background-color: rgb(231, 255, 196);
}

.listing-button.enabled:active {
    background-color: rgb(194, 243, 120);
}

.listing-button.disabled {
    background-color: rgb(255, 190, 61);
}

.listing-button.disabled:hover {
    background-color: rgb(255, 207, 97);
}

.listing-button.disabled:active {
    background-color: rgb(240, 131, 63);
}

.listing-button.delete {
    background-color: rgb(251, 74, 74);
    color: white
}

.listing-button.delete:hover {
    background-color: rgb(247, 116, 99);
}

.listing-button.delete:active {
    background-color: rgb(197, 51, 38);
}

@media (prefers-color-scheme: dark) {
    .listing-panel {
        background-color: rgba(215, 214, 229, 0.132);
        color: white;
    }

    .listing-button {
        background-color: #6b45aee3;
        color: rgba(255, 255, 255, 0.696);
    }

    .listing-button:hover {
        background-color: #7c57bbe3;
        box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    }

    .listing-button:active {
        background-color: rgba(74, 40, 132, 0.89);
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.765);
    }

    .listing-button.disabled {
        background-color: rgb(236, 117, 43);
    }

    .listing-button.disabled:hover {
        background-color: rgb(253, 143, 75);
    }

    .listing-button.disabled:active {
        background-color: rgb(240, 131, 63);
    }

    .listing-button.enabled {
        background-color: rgb(79, 173, 44);
    }

    .listing-button.enabled:hover {
        background-color: rgb(64, 202, 33);
    }

    .listing-button.enabled:active {
        background-color: rgb(74, 174, 38);
    }

    .listing-button.delete {
        background-color: rgb(251, 74, 74);
        color: white
    }

    .listing-button.delete:hover {
        background-color: rgb(247, 116, 99);
    }

    .listing-button.delete:active {
        background-color: rgb(197, 51, 38);
    }
}
</style>