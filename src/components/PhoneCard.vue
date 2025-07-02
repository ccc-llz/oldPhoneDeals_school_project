<template>
  <div class="phone-card" @click="$emit('click')">
    <div class="card-inner">
      <img :src="getFullImageUrl(listing.image)" alt="phone image" class="phone-image" />
      <div class="phone-info">
        <p class="phone-title">{{ listing.title }}</p>
        <p class="phone-price">${{ listing.price }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  listing: {
    type: Object,
    required: true,
  }
})

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

.phone-card {
  cursor: pointer;
  /* overflow: hidden; */
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2 20px rgba(0, 0, 0, 0.702);
}

.card-inner {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.phone-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.phone-image {
  width: 100%;
  height: 180px;
  object-fit: contain;
  border-radius: 15px;
  margin-bottom: 10px;
}

.phone-info {
  margin-top: auto;
  text-align: center;
  padding: 10px 0;
}

.phone-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 16px;
  color: #303133;
}

.phone-price {
  color: #8b91eb;
  font-size: 18px;
  font-weight: bold;
}

@media (prefers-color-scheme: dark) {
  .card-inner {
    background-color: rgba(14, 11, 40, 0.85);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  
  .phone-title {
    color: #f0f0f0;
  }
  
  .phone-price {
    color: #cba3e7;
  }

  .phone-card {
    box-shadow: 0 2px 20px rgba(64, 70, 134, 0.271);
  }
}
</style>