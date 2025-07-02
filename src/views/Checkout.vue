<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import service from '../utils/request'
import Logo from '@/components/Logo.vue'

const router = useRouter()
const cartItems = ref([])
const loading = ref(false)
const processingOrder = ref(false)



onMounted(async () => {
  loading.value = true;
  
  try {
    console.log("Requesting cart data...");
    const response = await axios.get('http://localhost:3000/api/user/cart', {
      withCredentials: true
    });
    
    console.log("Raw response:", response);
    
    if (response && response.data && response.data.cart) {
      const cartData = response.data.cart;
      console.log("Cart data:", cartData);
      
      if (Array.isArray(cartData)) {
        cartItems.value = cartData.map(item => {
          const phone = item.phoneId;
          
          return {
            _id: phone._id,
            title: phone.title,
            price: phone.price,
            quantity: item.quantity || 1,
            phoneId: phone._id
          };
        });
      } else {
        console.error("Cart data is not an array:", cartData);
        ElMessage.error('Invalid cart data format');
      }
    } else {
      console.error("No cart data in response:", response.data);
      ElMessage.error('No cart data available');
    }
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    
    if (!error.response || error.response.status !== 401) {
      ElMessage.error('Failed to load cart data');
    }
  } finally {
    loading.value = false;
  }
});

function goBack() {
  router.back()
}

async function updateCart(row) {
  try {
    if (row.quantity === 0) {
      await removeItem(row)
    } else {
      await axios.post('http://localhost:3000/api/user/cart/update', {
        phoneId: row.phoneId,
        quantity: row.quantity
      }, {
        withCredentials: true
      })
      ElMessage.success('Cart updated')
    }
  } catch (error) {
    console.error('Failed to update cart:', error)
    ElMessage.error('Failed to update quantity')
  }
}

async function removeItem(row) {
  try {
    await axios.post('http://localhost:3000/api/user/cart/remove', {
      phoneId: row.phoneId
    }, {
      withCredentials: true
    })
    cartItems.value = cartItems.value.filter(item => item._id !== row._id)
    ElMessage.success('Item removed')
  } catch (error) {
    console.error('Failed to remove item:', error)
    ElMessage.error('Failed to remove item')
  }
}

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
})

async function confirmTransaction() {
  if (cartItems.value.length === 0) {
    ElMessage.warning('Your cart is empty')
    return
  }
  
  processingOrder.value = true
  
  try {
    // Validate cart data before sending
    const validCartItems = cartItems.value.filter(item => {
      return item && item.phoneId && item.quantity > 0
    })
    
    if (validCartItems.length !== cartItems.value.length) {
      console.warn('Some items were filtered out due to invalid data')
    }
    
    if (validCartItems.length === 0) {
      ElMessage.warning('No valid items in cart')
      processingOrder.value = false
      return
    }
    
    console.log("Sending checkout request with cart:", validCartItems);
    
    const response = await axios.post('http://localhost:3000/api/checkout', {
      cart: validCartItems
    }, {
      withCredentials: true
    });
    
    console.log("Checkout response:", response);
    
    const orderId = response.data.orderId || 'Unknown';
    
    ElMessage.success('Transaction complete!')
    ElNotification({
      title: 'Order Delivered!',
      message: `Your order #${orderId} has been successfully delivered.`,
      type: 'success',
      duration: 5000
    })

    setTimeout(() => {
      cartItems.value = []
      router.push('/')
    }, 2000)
  } catch (err) {
    console.error("Failed to confirm transaction", err)
    
    // Enhanced error handling
    let errorMessage = 'Checkout failed!'
    if (err.response) {
      console.error("Error response:", err.response.data)
      errorMessage = err.response.data.error || 'Server error during checkout'
    } else if (err.request) {
      console.error("No response received", err.request)
      errorMessage = 'No response from server. Please try again later.'
    } else {
      console.error("Request error", err.message)
      errorMessage = 'Request setup error: ' + err.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    processingOrder.value = false
  }
}



</script>

<template>
  <div class="checkout-page">
    <header class="header">
      <div class="header-content">
        <Logo />
        <el-button @click="goBack" class="back-button">Back</el-button>
      </div>
    </header>
    
    <div class="main-content">
      <div class="panel">
        <h2>Your Cart</h2>
        
        <el-table v-loading="loading" :data="cartItems" style="width: 100%" class="cart-table">
          <el-table-column prop="title" label="Title" />
          <el-table-column prop="price" label="Price" />
          <el-table-column label="Quantity">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="0" @change="updateCart(row)" />
            </template>
          </el-table-column>
          <el-table-column label="Subtotal">
            <template #default="{ row }">
              ${{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions">
            <template #default="{ row }">
              <el-button @click="removeItem(row)">Remove</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-if="cartItems.length === 0 && !loading" class="empty-cart">
          <p>Your cart is empty</p>
          <el-button @click="goBack">Continue Shopping</el-button>
        </div>
        
        <div v-if="cartItems.length > 0" class="checkout-summary">
          <p>Total: ${{ totalPrice }}</p>
          <el-button 
            type="primary" 
            @click="confirmTransaction" 
            :loading="processingOrder"
            :disabled="processingOrder">
            {{ processingOrder ? 'Processing Order...' : 'Confirm Purchase' }}
          </el-button>
        </div>
        
        <transition name="fade">
          <div v-if="loading || processingOrder" class="panel-loading-overlay"></div>
        </transition>
      </div>
    </div>
    
    <footer class="footer">
      <p>© 2025 OldPhoneDeals - Find the best deals on pre-owned phones</p>
    </footer>
  </div>
</template>

<style scoped>
* {
  transition: 200ms;
}

.checkout-page {
  height: 100%;
  background: linear-gradient(135deg, #e1e0fb 0%, #dafffd 100%);
  transition: none;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  width: 100%;
}

.logo {
  font-size: 24px;
  font-weight: 900;
  font-style: italic;
}

.back-button {
  border-radius: 20px;
  background-color: #d2e7f0e3;
  border-style: none;
  width: 90px;
  height: 30px;
  font-size: small;
  font-weight: 200;
  color: rgb(0, 0, 0);
}

.back-button:hover {
  background-color: #ffffff;
  box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
}

.back-button:active {
  background-color: #f5f5f5;
  box-shadow: inset 0 3px 5px rgb(0, 0, 0, 0.1);
}

.main-content {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: none;
  margin-top: 70px;
  padding-bottom: 20px;
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
  padding: 2rem;
  margin: 0 20px;
  width: 90%;
  max-width: 1200px;
  position: relative;
}

.panel h2 {
  font-size: 24px;
  margin-bottom: 20px;
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

.cart-table {
  margin-bottom: 20px;
}

.cart-table :deep(.el-table__header) {
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.cart-table :deep(.el-input-number) {
  width: 120px;
}

.cart-table :deep(.el-button) {
  border-radius: 20px;
}

.empty-cart {
  text-align: center;
  padding: 30px;
  margin: 20px 0;
}

.checkout-summary {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.checkout-summary p {
  font-size: 1.2em;
  font-weight: bold;
}

.el-button {
  border-radius: 20px;
}

.el-button--primary {
  background-color: #8b91eb;
  border-color: #8b91eb;
  border-style: none;
  height: 40px;
  box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
  color: rgb(250, 249, 255);
}

.el-button--primary:hover {
  background-color: #a8ace9;
  color: #ffffff;
}

.el-button--primary:active {
  background-color: #323ab0;
  color: rgb(250, 249, 255);
}

.footer {
  background: rgba(84, 92, 100, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #eee;
  text-align: center;
  padding: 20px;
  margin-top: auto;
}

/* Transitions */
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

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .checkout-page {
    background: linear-gradient(135deg, #132262 0%, #764ba2 100%);
  }
  
  .header {
    background-color: rgba(0, 0, 0, 0.414);
    border-color: rgb(86, 70, 146);
  }
  
  .back-button {
    background-color: #6b45aee3;
    color: rgba(255, 255, 255, 0.696);
  }

  .back-button:hover {
    background-color: #7c57bbe3;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
  }

  .back-button:active {
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
  
  .el-button--primary {
    background-color: #cba3e7;
    color: #1d0728;
  }
  
  .el-button--primary:hover {
    background-color: #bd89e2;
    color: #1d0728;
  }
  
  .el-button--primary:active {
    background-color: #9560bb;
    color: #e3c7f2;
  }
  
  .footer {
    background: rgba(0, 0, 0, 0.414);
    border-color: rgb(86, 70, 146);
  }
}
</style>