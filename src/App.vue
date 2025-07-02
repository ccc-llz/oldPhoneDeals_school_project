<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div id="app" data-v-inspector="src/App.vue:7:3">
    <!-- <RouterView v-slot="{ Component, route }" data-v-inspector="src/App.vue:8:5">
      <component
        v-if= "!route.meta.transition"
        :is="Component"
        :key="route.fullPath"
      />
      <transition v-else :name="route.meta.transition" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </RouterView> -->
    <RouterView></RouterView>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>