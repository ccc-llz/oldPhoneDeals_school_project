<template>
  <div class="review-management">
    <el-card class="main-card">
      <div class="card-header">
        <div class="header-left">
          <div class="search-controls">
            <el-select
              v-model="searchListing"
              placeholder="Select listing"
              class="listing-select"
              clearable
              filterable
              @change="handleSearch"
            >
              <el-option
                v-for="listing in listings"
                :key="listing._id"
                :label="listing.title"
                :value="listing._id"
              />
            </el-select>
            
            <el-select
              v-model="statusFilter"
              placeholder="Status filter"
              class="status-select"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            
            <el-input
              v-model="searchText"
              placeholder="Search reviews by content"
              class="search-input"
              clearable
              @clear="loadReviews"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-input
              v-model="searchUser"
              placeholder="Search by reviewer"
              class="search-input"
              clearable
              @clear="loadReviews"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
            
            <el-button 
              type="primary" 
              @click="handleSearch"
            >
              <el-icon><Search /></el-icon>
              Search
            </el-button>
          </div>
        </div>
        <div class="header-right">
        </div>
      </div>

      <el-table
        :data="reviews"
        style="width: 100%; margin-top: 20px; height:100%;"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column label="Listing" min-width="180" sortable="custom" prop="listingTitle">
          <template #default="{ row }">
            {{ getListingTitle(row.listingId) }}
          </template>
        </el-table-column>
        <el-table-column prop="reviewer" label="Reviewer" width="180" />
        <el-table-column prop="rating" label="Rating" width="170" sortable="custom">
          <template #default="{ row }">
            <el-rate
              v-model="row.rating"
              disabled
              show-score
              text-color="#ff9900"
            />
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="Comment" min-width="250" />
        <el-table-column prop="hidden" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.hidden !== undefined ? 'danger' : 'success'">
              {{ row.hidden !== undefined ? 'Hidden' : 'Visible' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              :type="row.hidden !== undefined ? 'success' : 'warning'"
              size="small"
              :disabled="row._processing"
              :loading="row._processing"
              @click="handleToggleVisibility(row)"
            >
              {{ row.hidden !== undefined ? 'Show' : 'Hide' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalReviews"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as adminApi from '@/api/admin/review';
import { getAllListings } from '@/api/admin/listing';

const reviews = ref([]);
const listings = ref([]);
const loading = ref(false);
const searchText = ref('');
const searchUser = ref('');
const searchListing = ref('');
const statusFilter = ref('');
const statusOptions = [
  { value: 'visible', label: 'Visible Only' },
  { value: 'hidden', label: 'Hidden Only' }
];
const currentPage = ref(1);
const pageSize = ref(20);
const totalReviews = ref(0);
const sortParams = ref('');

// Get all phone listings for filtering
const loadListings = async () => {
  try {
    const data = await getAllListings();
    listings.value = data;
  } catch (error) {
    if (error.__handled) return;
    ElMessage.error('Failed to load listings');
  }
};

// Get reviews data
const loadReviews = async (forceRefresh = false) => {
  try {
    loading.value = true;
    
    // Add a random parameter to force refresh
    const refreshParam = forceRefresh ? { refresh: Date.now() } : {};
    
    const data = await adminApi.getAllReviews({
      page: currentPage.value,
      limit: pageSize.value,
      text: searchText.value,
      user: searchUser.value,
      listingId: searchListing.value,
      status: statusFilter.value,
      sort: sortParams.value,
      ...refreshParam
    });
    
    // Ensure we get new data
    reviews.value = [];  // First clear the array
    setTimeout(() => {   // Use setTimeout to ensure DOM updates
      reviews.value = data.reviews; // Then set new data
      totalReviews.value = data.total;
    }, 0);
    
  } catch (error) {
    if (error.__handled) return;
    console.error('Error loading reviews:', error);
    ElMessage.error(error.message || 'Failed to load reviews');
  } finally {
    loading.value = false;
  }
};

// Search handler
const handleSearch = () => {
  currentPage.value = 1; // Reset to first page
  loadReviews(true); // Force refresh
};

// Toggle review visibility handler
const handleToggleVisibility = async (review) => {
  try {
    console.log('Toggling visibility for review:', review);
    console.log('Review ID type:', typeof review._id, 'Value:', review._id);
    
    loading.value = true;
    
    // Disable button to prevent duplicate clicks
    const reviewIndex = reviews.value.findIndex(r => r._id === review._id);
    if (reviewIndex !== -1) {
      reviews.value[reviewIndex]._processing = true;
    }
    
    const response = await adminApi.toggleReviewVisibility(review._id);
    console.log('Toggle response received:', response);
    
    if (response.success) {
      // Update local status instead of reloading all data
      if (reviewIndex !== -1) {
        // If the response indicates the current is hidden
        if (response.currentlyHidden) {
          reviews.value[reviewIndex].hidden = "";
          console.log(`Review ${review._id} is now hidden`);
        } else {
          delete reviews.value[reviewIndex].hidden;
          console.log(`Review ${review._id} is now visible`);
        }
        
        // Remove processing flag
        delete reviews.value[reviewIndex]._processing;
      }
      
      ElMessage.success(response.currentlyHidden ? 
        'Review hidden successfully' : 
        'Review shown successfully');
    } else {
      console.error('API reported failure:', response);
      ElMessage.error('Failed to toggle review visibility');
      // Reload data when failed
      await loadReviews(true);
    }
    
  } catch (error) {
    if (error.__handled) return;
    console.error('Error toggling review visibility:', error);
    ElMessage.error(error.message || 'Failed to toggle review visibility');
    // Reload data when error occurs
    await loadReviews(true);
  } finally {
    loading.value = false;
  }
};

// Get product title by ID
const getListingTitle = (listingId) => {
  const listing = listings.value.find(l => l._id === listingId);
  return listing ? listing.title : 'Unknown Listing';
};

// Pagination handler
const handleSizeChange = (val) => {
  pageSize.value = val;
  loadReviews();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadReviews();
};

// Add sort handler function
const handleSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    sortParams.value = '';
  } else {
    // Convert Element Plus sort params to backend format
    const direction = order === 'ascending' ? 'asc' : 'desc';
    sortParams.value = `${prop}:${direction}`;
  }
  loadReviews();
};

// Initial load
onMounted(() => {
  loadListings();
  loadReviews();
});
</script>

<style scoped>
.review-management {
  padding: 0;
  height: calc(100vh - 60px);
}

.main-card {
  border-radius: 0;
  border-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
}

.search-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 250px;
}

.listing-select {
  width: 200px;
}

.status-select {
  width: 150px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

h2 {
  margin: 0;
  color: #3a8ee6;
  font-size: 1.5rem;
  font-weight: bold;
}

.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}
</style> 