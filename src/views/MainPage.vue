<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { findAll } from '../api/phone.js';
import PhoneCard from '@/components/PhoneCard.vue'
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router';
import service from '../utils/request';

// Page states: home, search, item
const currentState = ref('home');

const router = useRouter()
const route = useRoute()
const searchResults = ref([])
const soldOutSoon = ref([])
const bestSellers = ref([])

// User state
const currentUser = ref(null);
const isAuthenticated = ref(false);

// Item state variables
const selectedItem = ref(null)
const displayedReviews = ref([])
const reviewIndex = ref(0)
const expanded = ref([])
const showAddToCartDialog = ref(false)
const newCommentText = ref('')
const newRating = ref(0)
const currentCartQuantity = ref(0)
const cartQuantity = ref(1)
const newCommentHidden = ref(false);

// Search variables
const searchQuery = ref('');
const brands = ref([])
const maxPrice = ref(0);
const brandFilter = ref('');
const loading = ref(false);
const noResults = ref(false);

const isLoggedIn = computed(() => !!currentUser.value);

/* watch(() => route.query.state, (newState) => {
  if (newState) {
    currentState.value = newState;
  }
}, { immediate: true }); */

watch(() => route.query.itemId, async (itemId) => {
    if (itemId && itemId !== 'undefined' && itemId !== 'null') {
        currentState.value = 'item';
        await loadItemDetails(itemId);
    } else if (route.query.state === 'item') {
        // If state is 'item' but the ID is invalid, go back to home
        ElMessage.warning('Invalid item ID');
        goToHome();
    }
}, { immediate: true });

async function loadItemDetails(itemId) {
    // Ensure itemId is valid
    if (!itemId || itemId === 'undefined' || itemId === 'null') {
        console.error('Invalid item ID:', itemId);
        ElMessage.error('Invalid item ID');
        goToHome(); // If ID is invalid, return to home page
        return;
    }

    loading.value = true;
    try {
        // console.log('Loading item with ID:', itemId);
        const res = await axios.get(`http://localhost:3000/api/phones/${itemId}`, {
            withCredentials: true
        });
        selectedItem.value = res.data;

        console.log(selectedItem.value);

        displayedReviews.value = [];
        reviewIndex.value = 0;
        loadMoreReviews();

        if (currentUser.value) {
            getCurrentCartQuantity(itemId);
        }
    } catch (err) {
        console.error("Failed to load item:", err);
        ElMessage.error('Failed to load item details');
        goToHome();
    } finally {
        loading.value = false;
    }
}

const handleSearch = async () => {
    currentState.value = 'search';
    loading.value = true;
    noResults.value = false;

    /*   router.push({ 
        query: { 
          state: 'search' 
        }
      }); */

    try {
        const res = await axios.get('http://localhost:3000/api/phones', {
            params: {
                title: searchQuery.value,
                brand: brandFilter.value,
                maxPrice: maxPrice.value
            }
        });
        searchResults.value = res.data;
        if (searchResults.value.length === 0) {
            noResults.value = true;
        }
        console.log(searchResults.value);
    } catch (error) {
        console.error('Failed to search phones:', error);
        ElMessage.error('Failed to search phones. Please try again.');
    } finally {
        loading.value = false;
    }
}

const selectPhone = (phone) => {
    if (!phone || !phone._id) {
        console.error('Invalid phone object:', phone);
        ElMessage.error('Cannot view details: Invalid item');
        return;
    }

    // console.log('Selected phone:', phone);

    router.push({
        query: {
            state: 'item',
            itemId: phone._id
        }
    });
}

function goToHome() {
    if (currentState.value == 'item') loadMainPageData();
    router.push({ path: '/' }).then(currentState.value = 'home');
}

function goToAuth() {
    // ElMessage.info('Redirect to login');
    router.push('/auth');
}

function goToProfile() {
    // ElMessage.info('Redirect to profile');
    router.push('/userprofile');
}

function logout() {

    ElMessageBox.confirm(
        'Are you sure you want to sign out?',
        'Confirmation',
        {
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            type: 'warning'
        }
    ).then(async () => {
        try {

            await axios.post('http://localhost:3000/api/auth/logout', {}, {
                withCredentials: true
            });
            isAuthenticated.value = false;
            currentUser.value = null;
            ElMessage.success('Successfully signed out');
            if(currentState.value == 'item'){
                router.go(0);
                return;
            }
            router.push({ path: '/', query: { state: 'home' } });
        } catch (error) {
            console.error('Logout failed:', error);
            ElMessage.error('Failed to sign out. Please try again.');
        }
    }).catch(() => {

    });
}

async function goToCheckout() {
    try {
        const authStatus = await axios.get('http://localhost:3000/api/auth/status', {
            withCredentials: true
        });
        if (authStatus.data && authStatus.data.user) {
            router.push('/checkout');
        } else {
            ElMessage.warning('Please log in to proceed to checkout');
            localStorage.setItem('redirectAfterLogin', '/checkout');
            router.push('/auth');
        }
    } catch (error) {
        console.error('Failed to check auth status:', error);
        ElMessage.error('Failed to proceed to checkout. Please try again.');
    }
}

const addToCart = async () => {
    try {
        const response = await axios.post('http://localhost:3000/api/user/cart', {
            phoneId: selectedItem.value._id,
            quantity: cartQuantity.value
        }, {
            withCredentials: true
        });


        getCurrentCartQuantity(selectedItem.value._id);

        showAddToCartDialog.value = false;
        cartQuantity.value = 1;

        ElMessage.success('Added to cart!');
    } catch (error) {
        console.error('Failed to add to cart:', error);
        ElMessage.error(error.response?.data?.message || 'Failed to add to cart');
    }
}

const handleAddToCart = () => {
    if (isLoggedIn.value) {
        showAddToCartDialog.value = true;
    } else {
        ElMessage.warning('Plwase log in to add items to your cart');
        localStorage.setItem('redirectAfterLogin', route.fullPath);
        router.push('/auth');
    }
}

const handleAddToWishlist = () => {
    if (isLoggedIn.value) {
        addToWishlist();
    } else {
        ElMessage.warning('Please log in to add items to your wishlist');
        localStorage.setItem('redirectAfterLogin', route.fullPath);
        router.push('/auth');
    }
}

const getCurrentCartQuantity = async (itemId) => {
    if (!currentUser.value || !itemId) {
        currentCartQuantity.value = 0;
        return;
    }

    try {
        const response = await axios.get('http://localhost:3000/api/user/cart', {
            withCredentials: true
        });

        if (!response.data || !response.data.cart) {
            currentCartQuantity.value = 0;
            return;
        }

        const cartItem = response.data.cart.find(item =>
            item.phoneId && (
                item.phoneId._id === itemId ||
                item.phoneId === itemId
            )
        );

        currentCartQuantity.value = cartItem ? cartItem.quantity : 0;
    } catch (error) {
        console.error('Failed to get cart:', error);
        currentCartQuantity.value = 0;
    }
}


const addToWishlist = async () => {
    try {
        await axios.post('http://localhost:3000/api/user/wishlist', {
            phoneId: selectedItem.value._id,
        }, {
            withCredentials: true
        });
        ElMessage.success('Added to wishlist!');
    } catch (error) {
        console.error('Failed to add to wishlist:', error);
        ElMessage.error('Failed to add to wishlist.');
    }
}

const submitComment = async () => {
    try {

        const reviewData = {
            comment: newCommentText.value,
            rating: newRating.value,
        };

        // console.log("Review data being sent:", reviewData);
        if (newCommentHidden.value) {
            reviewData.hidden = true; // The value doesn't matter, just existence
        }

        await axios.post(`http://localhost:3000/api/phones/${selectedItem.value._id}/review`,
            reviewData,
            { withCredentials: true }
        );

        ElMessage.success('Comment submitted!');

        newCommentText.value = '';
        newRating.value = 0;
        newCommentHidden.value = false;

        const res = await axios.get(`http://localhost:3000/api/phones/${selectedItem.value._id}`, {
            withCredentials: true
        });
        selectedItem.value = res.data;
        displayedReviews.value = [];
        reviewIndex.value = 0;
        loadMoreReviews();

    } catch (error) {
        console.error('Failed to submit comment:', error);
        ElMessage.error('Failed to submit comment.');
    }
}

const loadMoreReviews = () => {
    if (selectedItem.value && Array.isArray(selectedItem.value.reviews)) {
        const next = selectedItem.value.reviews.slice(reviewIndex.value, reviewIndex.value + 3);

        displayedReviews.value.push(...next);
        reviewIndex.value += 3;
        expanded.value.push(...Array(next.length).fill(false));
    }
}

const isCurrentUserSeller = computed(() => {
    if (!currentUser.value || !selectedItem.value || !selectedItem.value.seller) {
        return false;
    }

    const currentUserId = currentUser.value._id || currentUser.value.id;


    if (typeof selectedItem.value.seller === 'object') {
        return selectedItem.value.seller._id === currentUserId;
    } else {
        return selectedItem.value.seller === currentUserId;
    }
});

const toggleComment = (index) => {
    expanded.value[index] = !expanded.value[index];
}


const toggleVisibility = async (index) => {
    try {
        const review = displayedReviews.value[index];
        if(review.toDisplay !== undefined) review.toDisplay = !review.toDisplay;

        ElMessage.success(review.toDisplay ? 'Review shown' : 'Review hidden');
    } catch (error) {
        console.error('Failed to toggle review visibility:', error);
        ElMessage.error('Failed to toggle review visibility.');
    }
};

const canControlReview = (review) => {
    if (!currentUser.value) {
        console.log("No current user found");
        return false;
    }

    if(review.hidden === undefined) {
        return false;
    }

    const currentUserId = currentUser.value._id || currentUser.value.id;

    let reviewerId;
    if (review.reviewer && typeof review.reviewer === 'object') {
        reviewerId = review.reviewer._id || review.reviewer.id;
    } else {
        reviewerId = review.reviewer;
    }

    let sellerId;
    if (selectedItem.value.seller && typeof selectedItem.value.seller === 'object') {
        sellerId = selectedItem.value.seller._id;
    } else {
        sellerId = selectedItem.value.seller;
    }

    return (
        reviewerId === currentUserId ||
        sellerId === currentUserId
    );
};


async function getCurrentUser() {
    try {
        const response = await axios.get('http://localhost:3000/api/auth/status', {
            withCredentials: true
        });

        if (response.data && response.data.user) {
            currentUser.value = response.data.user;
            isAuthenticated.value = true;
        } else {
            currentUser.value = null;
            isAuthenticated.value = false;
        }
    } catch (error) {
        console.error('Failed to get user status:', error);
        currentUser.value = null;
        isAuthenticated.value = false;
    }
}

// Initialization on component mount
onMounted(async () => {
    loading.value = true;

    try {
        // Get user authentication status
        await getCurrentUser();

        // Handle route based on current query params
        const { state, itemId } = route.query;

        if (state === 'item' && itemId && itemId !== 'undefined' && itemId !== 'null') {
            // Item details will be handled by the watch function
            currentState.value = 'item';
        } else {
            // Set proper state based on query param or default to home
            if (state) {
                currentState.value = state;
            } else {
                currentState.value = 'home';
            }

            if (currentState.value !== 'home') return;

            loadMainPageData();
        }
    } catch (error) {
        console.error('Failed to load initial data:', error);
        ElMessage.error('Failed to load data. Please refresh the page.');
    } finally {
        loading.value = false;
    }
});

const loadMainPageData = async () => {
    const almostSoldOutRes = await axios.get('api/phones/almostSoldOut');
    soldOutSoon.value = almostSoldOutRes.data;

    const bestSellersRes = await axios.get('api/phones/bestSellers');
    bestSellers.value = bestSellersRes.data;

    // Get all available brands for filter
    const brandRes = await axios.get('http://localhost:3000/api/brands');
    brands.value = brandRes.data;
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

<template>
    <div class="main-page">
        <!-- Top Navigation Bar -->
        <el-header class="top-bar">
            <div class="logo" @click="goToHome">OldPhoneDeals</div>

            <div class="search-container">
                <el-input v-model="searchQuery" placeholder="Search phones by title..." clearable
                    @keyup.enter="handleSearch" class="search-input">
                    <template #prefix>
                        <el-icon><i class="el-icon-search"></i></el-icon>
                    </template>
                    <template #append>
                        <el-button @click="handleSearch" type="primary">Search</el-button>
                    </template>
                </el-input>

                <!-- Filters (shown only in search state) -->
                <div v-if="currentState === 'search'" class="filters">
                    <div class="filter-section">
                        <label>Brand:</label>
                        <el-select v-model="brandFilter" placeholder="Select Brand" clearable @change="handleSearch"
                            class="brand-filter">
                            <el-option v-for="brand in brands" :key="brand" :label="brand" :value="brand" />
                        </el-select>
                    </div>

                    <div class="filter-section">
                        <label>Max Price: ${{ maxPrice }}</label>
                        <el-slider v-model="maxPrice" :min="0" :max="1000" :step="10" @change="handleSearch"
                            class="price-slider" />
                    </div>
                </div>
            </div>

            <div class="auth-buttons">
                <el-button v-if="!isAuthenticated" @click="goToAuth" type="primary" plain>
                    Sign In
                </el-button>
                <template v-else>
                    <el-button @click="goToProfile" type="info" plain>
                        Profile
                    </el-button>
                    <el-button @click="logout" type="danger" plain>
                        Sign Out
                    </el-button>
                </template>
                <el-button @click="goToCheckout" type="success">
                    <i class="el-icon-shopping-cart-2"></i> Checkout
                </el-button>
            </div>
        </el-header>

        <!-- Content Area -->
        <el-main v-loading="loading">
            <Transition name="fade" mode="out-in">
                <!-- Home State -->
                <div v-if="currentState === 'home'" class="home-content">
                    <div class="section">
                        <h2 class="section-title">Sold Out Soon</h2>
                        <p class="section-description">Limited stock! Get these popular phones before they're gone.</p>
                        <el-row :gutter="20">
                            <el-col v-for="phone in soldOutSoon" class="phone-col" :key="phone._id" :xs="24" :sm="12"
                                :md="8" :lg="6" :xl="4">
                                <PhoneCard :listing="phone" @click="selectPhone(phone)" class="phone-card" />
                            </el-col>
                        </el-row>
                    </div>

                    <div class="section">
                        <h2 class="section-title">Best Sellers</h2>
                        <p class="section-description">Our top-rated phones with the highest customer satisfaction.</p>
                        <el-row :gutter="20">
                            <el-col v-for="phone in bestSellers" class="phone-col" :key="phone._id" :xs="24" :sm="12"
                                :md="8" :lg="6" :xl="4">
                                <PhoneCard :listing="phone" @click="selectPhone(phone)" class="phone-card" />
                            </el-col>
                        </el-row>
                    </div>
                </div>

                <!-- Search State -->
                <div v-else-if="currentState === 'search'" class="search-content">
                    <h2 class="section-title">Search Results</h2>
                    <p v-if="noResults" class="no-results">No phones found matching your search criteria. Try different
                        keywords
                        or
                        filters.</p>
                    <el-row :gutter="20">
                        <el-col v-for="phone in searchResults" class="phone-col" :key="phone._id" :xs="24" :sm="12"
                            :md="8" :lg="6" :xl="4">
                            <PhoneCard :listing="phone" @click="selectPhone(phone)" class="phone-card" />
                        </el-col>
                    </el-row>
                </div>

                <!-- Item State -->
                <div v-else-if="currentState === 'item'" class="item-content">
                    <div class="item-navigation">
                        <el-button @click="goToHome" link>
                            <i class="el-icon-back"></i> Back to Home
                        </el-button>
                    </div>

                    <div v-if="selectedItem" class="item-details">
                        <!-- Item details -->
                        <h2>{{ selectedItem.title }}</h2>
                        <div class="item-main-info">
                            <div class="item-image">
                                <img :src="getFullImageUrl(selectedItem.image)" :alt="selectedItem.title" />
                            </div>
                            <div class="item-info">
                                <p><strong>Brand:</strong> {{ selectedItem.brand }}</p>
                                <p><strong>Stock:</strong> {{ selectedItem.stock }}</p>
                                <p v-if="selectedItem.seller"><strong>Seller:</strong> {{ selectedItem.seller.firstname
                                    }} {{
                                        selectedItem.seller.lastname }}</p>
                                <p><strong>Price:</strong> ${{ selectedItem.price }}</p>

                                <!-- Cart and wishlist buttons -->
                                <div class="item-actions">
                                    <el-button @click="handleAddToCart" type="primary">
                                        Add to Cart
                                    </el-button>

                                    <el-button @click="handleAddToWishlist" type="info">
                                        Add to Wishlist
                                    </el-button>

                                    <p v-if="currentCartQuantity >= 0" class="cart-quantity">
                                        In Cart: {{ currentCartQuantity }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Add to Cart Dialog -->
                        <el-dialog title="Add to Cart" v-model="showAddToCartDialog" width="30%">
                            <span>How many would you like to add?</span>
                            <div style="margin: 20px 0;">
                                <el-input-number v-model="cartQuantity" :min="1" :max="selectedItem.stock"
                                    controls-position="right">
                                </el-input-number>
                            </div>

                            <template #footer>
                                <span class="dialog-footer">
                                    <el-button @click="showAddToCartDialog = false">Cancel</el-button>
                                    <el-button type="primary" @click="addToCart">Add to Cart</el-button>
                                </span>
                            </template>
                        </el-dialog>

                        <!-- Comment form -->
                        <div v-if="isLoggedIn && !isCurrentUserSeller" class="comment-box">
                            <h3>Add Your Review</h3>
                            <el-rate v-model="newRating" />
                            <el-input type="textarea" v-model="newCommentText" placeholder="Write your comment here..."
                                :rows="4" />
                            <el-checkbox v-model="newCommentHidden">
                                Hide this comment
                            </el-checkbox>
                            <el-button type="primary" @click="submitComment" :disabled="!newCommentText || !newRating">
                                Post Comment
                            </el-button>
                        </div>

                        <!-- Reviews section -->
                        <div v-if="displayedReviews.length > 0" class="reviews-section">
                            <h3>Reviews:</h3>
                            <el-divider />
                            <ul class="review-list">
                                <li v-for="(review, index) in displayedReviews" :key="index" class="review-item"
                                    :class="{ 'review-hidden': review.toDisplay !== undefined && review.toDisplay === false }">
                                    <div class="review-header">
                                        <strong>
                                            {{
                                                review.reviewer && review.reviewer.firstname && review.reviewer.lastname
                                                    ? `${review.reviewer.firstname} ${review.reviewer.lastname}`
                                                    : 'Unknown'
                                            }}
                                        </strong>
                                        <el-rate v-if="review.toDisplay !== undefined && review.toDisplay === true" v-model="review.rating" disabled show-score />
                                    </div>
                                    <div class="review-content">
                                        <p v-if="review.hidden === undefined || (review.hidden !== undefined && review.toDisplay === true)">
                                            {{ expanded[index] || review.comment.length <= 200 ? review.comment :
                                                review.comment.slice(0, 200) + '...' }}
                                                <el-button size="small" link
                                                v-if="review.comment.length > 200" 
                                                @click="toggleComment(index)">
                                                {{ expanded[index] ? 'Show less' : 'Show more' }}
                                                </el-button>
                                        </p>
                                        <p v-if="review.hidden !== undefined && review.toDisplay === false">
                                            This is a hidden comment. 
                                        </p>
                                    </div>

                                    <div class="review-controls" v-if="canControlReview(review)">
                                        <el-button size="small" :type="review.hidden !== null ? 'warning' : 'info'"
                                            @click="toggleVisibility(index)">
                                            <i :class="review.hidden !== null ? 'el-icon-view' : 'el-icon-hide'"></i>
                                            {{ review.hidden !== null ? 'Show Review' : 'Hide Review' }}
                                        </el-button>
                                    </div>
                                </li>
                            </ul>

                            <el-button
                                v-if="selectedItem.reviews && selectedItem.reviews.length > displayedReviews.length"
                                @click="loadMoreReviews" class="load-more custom-plain-button">
                                Show more reviews
                            </el-button>
                        </div>
                        <div v-else-if="selectedItem.reviews && selectedItem.reviews.length === 0" class="no-reviews">
                            <p>No reviews yet. Be the first to leave a review!</p>
                        </div>
                    </div>
                    <div v-else class="item-loading">
                        <p>Loading item details...</p>
                    </div>
                </div>
            </Transition>
        </el-main>

        <!-- Footer -->
        <el-footer class="footer">
            <p>© 2025 OldPhoneDeals - Find the best deals on pre-owned phones</p>
        </el-footer>
    </div>
</template>

<style scoped>
* {
    transition: 200ms;
}

.main-page {
    height: 100%;
    background: linear-gradient(135deg, #e1e0fb 0%, #dafffd 100%);
    transition: none;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

/* Header & Navigation */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: rgba(255, 255, 255, 0.395);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    position: sticky;
    top: 0;
    z-index: 100;
    height: auto;
}

.logo {
    font-size: 24px;
    font-weight: 900;
    font-style: italic;
    color: inherit;
    cursor: pointer;
}

/* Search Area */
.search-container {
    flex: 1;
    max-width: 800px;
    margin: 0 20px;
}

.search-input {
    width: 100%;
}

.search-input :deep(.el-input__wrapper) {
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.365);
    box-shadow: 0 0 0 1px #7777ff;
    padding: 0 10px;
    transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #8b91eb;
}

.search-input :deep(.el-input__inner) {
    font-size: 14px;
    height: 36px;
}

.search-input :deep(.el-input-group__append) {
    background-color: transparent;
    border: none;
    margin-left: 10px;
    box-shadow: none;
}

.search-input :deep(.el-input-group__append .el-button) {
    border-radius: 20px;
    background-color: #8b91eb;
    border-color: #8b91eb;
    color: white;
    height: 36px;
    padding: 0 15px;
}

.search-input :deep(.el-input-group__append .el-button:hover) {
    background-color: #a8ace9;
    border-color: #a8ace9;
}

.search-input :deep(.el-input-group__append .el-button:active) {
    background-color: #323ab0;
    border-color: #323ab0;
}

/* Filters */
.filters {
    margin-top: 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 15px;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.filter-section {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.filter-section label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
}

.brand-filter {
    width: 200px;
}

.brand-filter :deep(.el-input__wrapper) {
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 0 1px #7777ff;
}

.price-slider {
    width: 300px;
    margin-top: 5px;
}

.price-slider :deep(.el-slider__runway) {
    margin: 10px 0;
}

.price-slider :deep(.el-slider__bar) {
    background-color: #8b91eb;
}

.price-slider :deep(.el-slider__button) {
    border-color: #8b91eb;
    background-color: white;
}

/* Auth Buttons */
.auth-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
}

.auth-buttons .el-button {
    border-radius: 20px;
    border-style: none;
    width: 90px;
    height: 30px;
    font-size: small;
    font-weight: 200;
    background-color: #d2e7f0e3;
    color: rgb(0, 0, 0);
    box-shadow: none;
}

.auth-buttons .el-button:hover {
    background-color: #ffffff;
    box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
}

.auth-buttons .el-button:active {
    background-color: #f5f5f5;
    box-shadow: inset 0 3px 5px rgb(0, 0, 0, 0.1);
    width: 90px;
    height: 30px;
}

.auth-buttons .el-button--primary {
    background-color: #8b91eb;
    color: white;
}

.auth-buttons .el-button--primary:hover {
    background-color: #a8ace9;
}

.auth-buttons .el-button--primary:active {
    background-color: #6b74d6;
}

/* Main Content */
.el-main {
    padding: 30px;
    background-color: transparent;
}

/* Sections */
.section {
    margin-bottom: 40px;
    background-color: rgba(255, 255, 255, 0.879);
    border-radius: 48px;
    padding: 48px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.section-title {
    font-size: 24px;
    color: #303133;
    margin-bottom: 5px;
    font-weight: 600;
}

.section-description {
    color: #606266;
    margin-bottom: 20px;
}

.phone-col {
    margin-bottom: 20px;
}

.phone-card {
    margin-bottom: 20px;
}

.no-results {
    text-align: center;
    padding: 30px;
    color: #909399;
    font-size: 16px;
}

/* Item State */
.item-content {
    background-color: rgba(255, 255, 255, 0.879);
    border-radius: 48px;
    padding: 48px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.search-content {
    background-color: rgba(255, 255, 255, 0.879);
    border-radius: 48px;
    padding: 48px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.item-navigation {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(235, 238, 245, 0.5);
}

.item-details {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.item-main-info {
    display: flex;
    gap: 30px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.item-image {
    flex: 0 0 300px;
}

.item-image img {
    max-width: 100%;
    border-radius: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.item-info {
    flex: 1;
    min-width: 250px;
}

.item-info p {
    margin-bottom: 15px;
    font-size: 16px;
}

.item-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0;
    align-items: center;
}

.cart-quantity {
    margin-left: 15px;
    font-weight: bold;
    color: #409EFF;
}

/* Comment & Review Styles */
.comment-box {
    margin: 30px 0;
    padding: 20px;
    background: rgba(249, 249, 249, 0.5);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: 48px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.comment-box .el-textarea__inner {
    background-color: rgba(255, 255, 255, 0.9) !important;
    color: #333 !important;
    border-color: #7777ff;
    border-radius: 20px;
}

.comment-box .el-rate {
    margin-bottom: 5px;
}

.reviews-section {
    margin-top: 30px;
}

.review-list {
    padding: 0;
    list-style: none;
}

.review-item {
    padding: 24px;
    /* border-bottom: 1px solid rgba(238, 238, 238, 0.5); */
    border: black;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.083);
    margin-top: 15px;
    border-radius: 24px;
}

.review-hidden {
    color: #909399;
    font-style: italic;
    background-color: rgba(195, 195, 195, 0.5);
    padding: 24px;
    border-radius: 20px;
}

.review-none {
    display: none;
}

.review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.review-content {
    line-height: 1.6;
}

.review-controls {
    margin-top: 10px;
    text-align: right;
}

.load-more {
    margin-top: 20px;
}

.no-reviews {
    padding: 20px;
    text-align: center;
    color: #909399;
}

/* Button styling */
.el-button {
    border-radius: 20px;
}

.el-button--primary {
    background-color: #8b91eb;
    border-color: #8b91eb;
}

.el-button--primary:hover {
    background-color: #a8ace9;
    border-color: #a8ace9;
}

.el-button--primary:active {
    background-color: #323ab0;
    border-color: #323ab0;
}

.el-button--info {
    background-color: #cba3e7;
    border: unset;
}

.el-button--info:hover {
    background-color: #bd89e2;
}

.el-button--info:active {
    background-color: #9560bb;
}

.el-button--primary:disabled {
    border: unset;
    background-color: #71717a;
}

.el-button--primary:disabled:hover {
    background-color: #71717a;
}

.el-button--primary:disabled:active {
    background-color: #71717a;
}

.custom-plain-button {
    background-color: #8b91eb;
    color: white;
    border-color: #8b91eb;
}

/* Footer */
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

/* Dark Mode */
@media (prefers-color-scheme: dark) {
    .main-page {
        background: linear-gradient(135deg, #132262 0%, #764ba2 100%);
    }

    .top-bar {
        background-color: rgba(0, 0, 0, 0.414);
        border-color: rgb(86, 70, 146);
    }

    .section,
    .item-content,
    .search-content {
        background-color: rgba(14, 11, 40, 0.868);
        color: white;
    }

    .search-input :deep(.el-input__wrapper) {
        background-color: #10173ba6;
        box-shadow: 0 0 0 1px #324497;
    }

    .search-input :deep(.el-input__wrapper.is-focus) {
        box-shadow: 0 0 0 1px #4b60b3;
    }

    .search-input :deep(.el-input__inner) {
        color: white;
    }

    .search-input :deep(.el-input-group__append .el-button) {
        background-color: #cba3e7;
        border-color: #cba3e7;
        color: #1d0728;
    }

    .search-input :deep(.el-input-group__append .el-button:hover) {
        background-color: #bd89e2;
        border-color: #bd89e2;
    }

    .search-input :deep(.el-input-group__append .el-button:active) {
        background-color: #9560bb;
        border-color: #9560bb;
        color: #e3c7f2;
    }

    .filters {
        background: rgba(20, 20, 40, 0.4);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .filter-section label {
        color: #e5e5e5;
    }

    .brand-filter :deep(.el-input__wrapper) {
        background-color: #10173ba6;
        box-shadow: 0 0 0 1px #324497;
    }

    .price-slider :deep(.el-slider__bar) {
        background-color: #cba3e7;
    }

    .price-slider :deep(.el-slider__button) {
        border-color: #cba3e7;
        background-color: #111111;
    }

    .auth-buttons .el-button {
        background-color: #6b45aee3;
        color: rgba(255, 255, 255, 0.696);
    }

    .auth-buttons .el-button:hover {
        background-color: #7c57bbe3;
        box-shadow: 0 3px 5px rgb(0, 0, 0, 0.1);
    }

    .auth-buttons .el-button:active {
        background-color: rgba(74, 40, 132, 0.89);
        box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.765);
    }

    .auth-buttons .el-button--primary {
        background-color: #cba3e7;
        color: #1d0728;
    }

    .auth-buttons .el-button--primary:hover {
        background-color: #bd89e2;
    }

    .auth-buttons .el-button--primary:active {
        background-color: #9560bb;
        color: #e3c7f2;
    }

    .custom-plain-button {
        background-color: #cba3e7;
        color: white;
        border-color: #cba3e7;
    }

    .custom-plain-button:hover {
        background-color: #bd89e2;
        border-color: #bd89e2;
        color: white;
    }

    .custom-plain-button:active {
        background-color: #9560bb;
        color: white;
        border-color: #9560bb;
    }

    .section-title,
    .item-content h2 {
        color: #f0f0f0;
    }

    .section-description {
        color: #d0d0d0;
    }

    .comment-box {
        background: rgba(30, 30, 60, 0.5);
    }

    .comment-box .el-textarea__inner {
        background-color: rgba(255, 255, 255, 0.9) !important;
        color: #333 !important;
        border-color: #324497;
    }

    .comment-box h3,
    .comment-box label {
        color: #ffffff;
    }

    .comment-box .el-checkbox__label {
        color: #e0e0e0;
    }

    .review-hidden {
        background-color: rgba(16, 23, 59, 0.3);
        border-left-color: #324497;
    }

    .no-reviews {
        color: #c0c0c0;
    }

    .el-button--text {
        color: #cba3e7;
    }

    .footer {
        background: rgba(0, 0, 0, 0.414);
        border-color: rgb(86, 70, 146);
    }

    .review-item {
        box-shadow: 0 2px 10px rgb(98, 105, 175, 0.16);
        background-color: rgb(32, 39, 76);
    }

    .el-button--primary:disabled {
        border: unset;
        background-color: #71717a;
    }

    .el-button--primary:disabled:hover {
        background-color: #71717a;
    }

    .el-button--primary:disabled:active {
        background-color: #71717a;
    }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .top-bar {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
    }

    .search-container {
        margin: 15px 0;
    }

    .filters {
        flex-direction: column;
    }

    .price-slider {
        width: 100%;
    }

    .auth-buttons {
        justify-content: center;
    }

    .item-main-info {
        flex-direction: column;
    }
}
</style>