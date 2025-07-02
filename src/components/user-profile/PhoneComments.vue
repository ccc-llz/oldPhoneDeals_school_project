<template>
    <div class="comment-item">
        <hr class="comment-hr">
        <div class="comment-title">
            <div style="display: flex; align-items: baseline; gap:4px">
                <h1 class="comment-h1">{{ comment.reviewer }}</h1>
                <label v-if="comment.isHidden">(Private Comment)</label>
            </div>
            
            <label v-if="showComment || !comment.isHidden" class="rating">{{ getStars(parseInt(comment.rating)) }}</label>
            
        </div>
        
        <div class="comment-content">
            {{  showComment || !comment.isHidden ? comment.comment : 'This comment is hidden. ' }}
            <div class="comment-status" v-if="comment.isHidden">
                <button :class="'comment-button'" @click="toggleVisibility" :title="comment.isHidden ? 'Show Comment' : 'Hide Comment'">{{ showComment ? 'Hide' : 'Show' }}</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    comment:{
        type: Object,
        required: true
    }
});

const showComment = ref(false);

const toggleVisibility = ()=>{
    showComment.value = !showComment.value;
}

const getStars = (rating) =>{
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

</script>

<style scoped>

    * {
        transition: 200ms;
    }

    .comment-hr {
        opacity: 30%;
        margin: 16px 0 8px 0;
    }

    .comment-item {
        width: 100%;
    }

    .comment-h1 {
        font-size: 16pt;
        margin-bottom: 8px;
    }

    .comment-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .comment-status {
        position: relative;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap:8px
    }

    .comment-button {
        border-radius: 20px;
        background-color: #d2e7f0e3;
        border-style: none;
        width: 60px;
        height: 24px;
        font-size: 10pt;
        font-weight: 200;
        color: rgb(0, 0, 0);
    }

    .comment-button:hover {
        background-color: #ffffff;
        box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    }

    .comment-button:active {
        background-color: #f5f5f5;
        box-shadow: inset 0 3px 5px rgb(0, 0, 0, 0.1);
    }

    .comment-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .rating {
        color: rgb(255, 196, 0)
    }

@media (prefers-color-scheme: dark) {
    .comment-button {
        background-color: #6b45aee3;
        color: rgba(255, 255, 255, 0.696);
    }

    .comment-button:hover {
        background-color: #7c57bbe3;
        box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    }

    .comment-button:active {
        background-color: rgba(74, 40, 132, 0.89);
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.765);
    }

    .rating {
        color: yellow;
    }
}

</style>