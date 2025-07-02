<template>
    <div class="comment-panel">
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%;">
            <div class="title" style="width: calc(100% - 112px); display: flex; align-items: center; justify-self: start; gap:16px">
                <img class="thumbnail" :src="getFullImageUrl(phoneThumbnailUrl)" :alt="phoneName">
                <label class="phone-name">{{phoneName}}</label>
            </div>
            <h3 style="text-align: right; margin-left:8px">Comments({{ phoneComments.length }})</h3>
        </div>
        
        <div style="width: 100%; margin-top: 8px;">
            <PhoneComments v-for="comment in phoneComments" :key="comment.id" :comment="comment"/>
        </div>
        
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import PhoneComments from './PhoneComments.vue';
const thumbnail = ref('')

const properties = defineProps({
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
    phoneComments: {
        type: Array,
        default:()=>[],
        required: true
    }
});

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

.comment-panel {
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

@media (prefers-color-scheme: dark) {
    .comment-panel {
        background-color: rgba(215, 214, 229, 0.132);
        color: white;
    }
}
</style>