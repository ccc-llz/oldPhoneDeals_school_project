<template>
    <div class="logo">
        <a href='#' @click="goMainPage">OldPhoneDeals</a>
    </div>
</template>

<script setup>

import { useRouter } from 'vue-router';
const router = useRouter();

const goMainPage = ()=>{
router.push('/');
}

</script>

<style scoped>
.logo a {
    font-size: large;
    font-weight: 900;
    font-style: italic;
    text-decoration: none;
    color: rgba(0, 0, 0, 0.737)
}

.logo a:hover {
    background-color: transparent;
}

@media (prefers-color-scheme: dark) {
    .logo a {
        color: white
    }
}
</style>