<template>
  <div class="listing-management">
    <el-card class="main-card">
      <div class="card-header">
        <div class="header-left">
          <div class="search-controls">
            <el-input
              v-model="searchTitle"
              placeholder="Search by title"
              class="search-input"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
            <el-select
              v-model="searchBrand"
              placeholder="Select brand"
              class="brand-select"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="brand in brands"
                :key="brand"
                :label="brand"
                :value="brand"
              />
            </el-select>
            
            <el-button 
              type="primary" 
              @click="handleSearch"
            >
              <el-icon><Search /></el-icon>
              Search
            </el-button>
          </div>
        </div>
      </div>

      <el-table
        :data="listings"
        style="width: 100%; margin-top: 20px;"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column label="Image" width="100">
          <template #default="{ row }">
            <div class="phone-image">
              <el-image 
                :src="row.image || getBrandImage(row.brand)" 
                fit="contain"
                :preview-src-list="[]">
              </el-image>
            </div>
          </template>
        </el-table-column>
        <el-table-column 
          prop="title" 
          label="Title" 
          min-width="200" 
          sortable="custom" 
        />
        <el-table-column 
          prop="brand" 
          label="Brand" 
          width="120" 
          sortable="custom" 
        />
        <el-table-column 
          prop="price" 
          label="Price" 
          width="100" 
          sortable="custom"
        >
          <template #default="{ row }">
            ${{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="Stock" width="80" sortable="custom">
          <template #default="{ row }">
            <div class="stock-cell">{{ row.stock }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="seller" label="Seller" width="150">
          <template #default="{ row }">
            <el-button
              type="text"
              @click="handleViewUser(row)"
              class="seller-link"
            >
              {{ row.seller }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="disabled" label="Status" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.disabled !== undefined ? 'danger' : 'success'"
              class="status-tag"
            >
              {{ row.disabled !== undefined ? 'Disabled' : 'Active' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                class="action-btn edit-btn"
                @click="handleEdit(row)"
              >
                Edit
              </el-button>
              <el-button
                :type="row.disabled !== undefined ? 'success' : 'warning'"
                size="small"
                class="action-btn disable-btn"
                @click="handleToggleStatus(row)"
              >
                {{ row.disabled !== undefined ? 'Enable' : 'Disable' }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                class="action-btn delete-btn"
                @click="handleDelete(row)"
              >
                Delete
              </el-button>
              <el-button
                type="info"
                size="small"
                class="action-btn reviews-btn"
                @click="handleViewReviews(row)"
              >
                Reviews
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalListings"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="Edit Listing"
      width="500px"
    >
      <div class="edit-image-preview" v-if="editingListing.image || editingListing.brand">
        <el-image 
          :src="editingListing.image || getBrandImage(editingListing.brand)" 
          fit="contain"
          style="max-height: 120px; max-width: 120px;">
        </el-image>
      </div>
      <el-form
        ref="editForm"
        :model="editingListing"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="Title" prop="title">
          <el-input v-model="editingListing.title" />
        </el-form-item>
        <el-form-item label="Brand" prop="brand">
          <el-select v-model="editingListing.brand" style="width: 100%">
            <el-option
              v-for="brand in brands"
              :key="brand"
              :label="brand"
              :value="brand"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Price" prop="price">
          <el-input-number
            v-model="editingListing.price"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Stock" prop="stock">
          <el-input-number
            v-model="editingListing.stock"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Image URL" prop="image">
          <el-input v-model="editingListing.image" placeholder="Optional - leave empty to use brand default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleSave">Save</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Reviews Dialog -->
    <el-dialog
      v-model="reviewsDialogVisible"
      :title="`Reviews - ${selectedListing ? selectedListing.title : ''}`"
      width="800px"
    >
      <div v-if="selectedListing && selectedListing.reviews && selectedListing.reviews.length > 0">
        <el-table :data="selectedListing.reviews" style="width: 100%">
          <el-table-column prop="reviewer" label="Reviewer" width="180">
            <template #default="{ row }">
              <span>{{ row.reviewer || 'Anonymous' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="rating" label="Rating" width="150">
            <template #default="{ row }">
              <el-rate
                v-model="row.rating"
                disabled
                text-color="#ff9900"
                score-template=""
                class="review-rating"
              />
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="Comment" min-width="250" />
          <el-table-column prop="hidden" label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.hidden ? 'danger' : 'success'">
                {{ row.hidden ? 'Hidden' : 'Visible' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="no-reviews">
        <el-empty description="No reviews for this product" />
      </div>
    </el-dialog>
    
    <!-- User Details Dialog -->
    <el-dialog
      v-model="userDialogVisible"
      :title="selectedUser ? `User Details - ${selectedUser.fullName}` : 'User Details'"
      width="500px"
    >
      <div v-if="loadingUser" class="dialog-loading">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else-if="selectedUser" class="user-details">
        <div class="user-info-item">
          <strong>ID:</strong> {{ selectedUser._id }}
        </div>
        <div class="user-info-item">
          <strong>Name:</strong> {{ selectedUser.fullName }}
        </div>
        <div class="user-info-item">
          <strong>Email:</strong> {{ selectedUser.email }}
        </div>
        <div class="user-info-item">
          <strong>Created:</strong> {{ new Date(selectedUser.createdAt).toLocaleString() }}
        </div>
        <div class="user-info-item">
          <strong>Last Login:</strong> {{ selectedUser.lastLoginFormatted }}
        </div>
        <div class="user-info-item">
          <strong>Status:</strong> 
          <el-tag :type="selectedUser.disabled ? 'danger' : 'success'" size="small">
            {{ selectedUser.disabled ? 'Disabled' : 'Active' }}
          </el-tag>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-value">{{ selectedUser.listingsCount }}</div>
            <div class="stat-label">Listings</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ selectedUser.reviewsCount }}</div>
            <div class="stat-label">Reviews</div>
          </div>
        </div>
      </div>
      <div v-else class="no-user">
        <el-empty description="User not found" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as adminApi from '@/api/admin/listing';
import * as userApi from '@/api/admin/user';

const listings = ref([]);
const loading = ref(false);
const searchTitle = ref('');
const searchBrand = ref('');
const editDialogVisible = ref(false);
const reviewsDialogVisible = ref(false);
const editingListing = ref({});
const selectedListing = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const totalListings = ref(0);
const sortParams = ref('');
const brands = [
  'Samsung', 'Apple', 'HTC', 'Huawei', 'Nokia',
  'LG', 'Motorola', 'Sony', 'BlackBerry'
];

const rules = {
  title: [{ required: true, message: 'Please input title', trigger: 'blur' }],
  brand: [{ required: true, message: 'Please select brand', trigger: 'change' }],
  price: [{ required: true, message: 'Please input price', trigger: 'blur' }],
  stock: [{ required: true, message: 'Please input stock', trigger: 'blur' }]
};

// Get brand images
const getBrandImage = (brand) => {
  try {
    return `/images/PhoneImages/${brand}.jpeg`;
  } catch (error) {
    console.error(`Error loading image for brand ${brand}:`, error);
    return ''; 
  }
};

// Load listings data
const loadListings = async () => {
  try {
    loading.value = true;
    console.log('Loading listings with params:', {
      page: currentPage.value,
      limit: pageSize.value,
      title: searchTitle.value,
      brand: searchBrand.value,
      sort: sortParams.value
    });
    
    const data = await adminApi.getPagedListings({
      page: currentPage.value,
      limit: pageSize.value,
      title: searchTitle.value,
      brand: searchBrand.value,
      sort: sortParams.value
    });
    
    listings.value = data.listings || [];
    totalListings.value = data.total || 0;
  } catch (error) {
    console.error('Error loading listings:', error);
    if (error.__handled) return;
    ElMessage.error(error.message || 'Failed to load listings');
  } finally {
    loading.value = false;
  }
};

// Search handler
const handleSearch = async () => {
  try {
    console.log('Search triggered with:', {
      title: searchTitle.value,
      brand: searchBrand.value
    });
    
    currentPage.value = 1; // Reset to first page
    await loadListings();
  } catch (error) {
    console.error('Error in handleSearch:', error);
    ElMessage.error('Failed to search listings');
  }
};

// Pagination handler
const handleSizeChange = (val) => {
  pageSize.value = val;
  loadListings();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadListings();
};

// Edit handler
const handleEdit = (row) => {
  editingListing.value = { ...row };
  editDialogVisible.value = true;
};

// Save edited listing
const handleSave = async () => {
  try {
    // Validate fields
    if (!editingListing.value.title || !editingListing.value.brand || 
        editingListing.value.price === undefined || editingListing.value.stock === undefined) {
      return ElMessage.error('Please fill in all required fields');
    }
    
    // Update existing listing
    await adminApi.updateListing(editingListing.value._id, editingListing.value);
    ElMessage.success('Listing updated successfully');
    
    editDialogVisible.value = false;
    
    // Check if there are search conditions
    if (searchTitle.value || searchBrand.value) {
      // If there are search conditions, re-execute search instead of loading all data
      await handleSearch();
    } else {
      // If there are no search conditions, reload all data
      await loadListings();
    }
  } catch (error) {
    if (error.__handled) return;
    ElMessage.error(error.message || 'Failed to save listing');
  }
};

//  Toggle status handler
const handleToggleStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to disable/enable this listing?',
      'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );

    console.log('Before toggle, disabled status:', row.disabled);
    
    const response = await adminApi.toggleListingStatus(row._id);
    
    console.log('API response:', response);
    
    // Update current row data directly, avoiding reloading the entire list
    const index = listings.value.findIndex(item => item._id === row._id);
    if (index !== -1) {
      // Use the object from the response to update local data
      listings.value[index] = response;
      console.log('Updated row disabled status:', listings.value[index].disabled);
    }
    
    // Display success message based on the previous state
    ElMessage.success(`Listing ${row.disabled !== undefined ? 'enabled' : 'disabled'} successfully`);
    
    // Check if there are search conditions
    if (searchTitle.value || searchBrand.value) {
      // If there are search conditions, re-execute search instead of loading all data
      await handleSearch();
    } else {
      // If there are no search conditions, reload all data
      await loadListings();
    }
  } catch (error) {
    console.error('Error toggling status:', error);
    if (error.__handled) return;
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Failed to toggle listing status');
    }
  }
};

// Delete handler
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this listing?',
      'Warning',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    
    await adminApi.deleteListing(row._id);
    ElMessage.success('Listing deleted successfully');
    
    // Check if there are search conditions
    if (searchTitle.value || searchBrand.value) {
      // If there are search conditions, re-execute search instead of loading all data
      await handleSearch();
    } else {
      // If there are no search conditions, reload all data
      await loadListings();
    }
  } catch (error) {
    if (error.__handled) return;
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Failed to delete listing');
    }
  }
};

// View reviews handler
const handleViewReviews = async (row) => {
  try {
    loading.value = true;
    // get full listing details including reviews
    const detailedListing = await adminApi.getListingDetails(row._id);
    selectedListing.value = detailedListing;
    reviewsDialogVisible.value = true;
  } catch (error) {
    if (error.__handled) return;
    console.error("Error fetching listing details:", error);
    ElMessage.error(error.message || 'Failed to load reviews');
  } finally {
    loading.value = false;
  }
};

// Add sort handler function
const handleSortChange = ({ prop, order }) => {
  console.log('Sort change triggered:', prop, order);
  
  try {
    if (!prop || !order) {
      sortParams.value = '';
    } else {
      // Convert Element Plus sort params to backend format
      const direction = order === 'ascending' ? 'asc' : 'desc';
      sortParams.value = `${prop}:${direction}`;
      console.log('Setting sort params:', sortParams.value);
    }
    
    loadListings();
  } catch (error) {
    console.error('Error in handleSortChange:', error);
    ElMessage.error('Failed to sort listings');
  }
};

// User dialog state
const userDialogVisible = ref(false);
const loadingUser = ref(false);
const selectedUser = ref(null);

// View user details handler
const handleViewUser = async (row) => {
  try {
    // Check multiple possible locations for seller ID
    let sellerId = null;
    
    if (row.sellerId) {
      sellerId = row.sellerId;
      console.log('Using row.sellerId:', sellerId);
    } else if (row.seller && typeof row.seller === 'object' && row.seller._id) {
      sellerId = row.seller._id;
      console.log('Using row.seller._id:', sellerId);
    } else if (row.seller && typeof row.seller === 'string' && row.seller.match(/^[0-9a-fA-F]{24}$/)) {
      // This is likely a MongoDB ObjectId string
      sellerId = row.seller;
      console.log('Using row.seller as ID:', sellerId);
    }
    
    if (!sellerId) {
      console.error('No valid seller ID found in:', row);
      return ElMessage.error('Seller ID not found');
    }
    
    loadingUser.value = true;
    const userDetails = await userApi.getUserDetails(sellerId);
    selectedUser.value = userDetails;
    userDialogVisible.value = true;
  } catch (error) {
    if (error.__handled) return;
    console.error("Error fetching user details:", error);
    ElMessage.error(error.message || 'Failed to load user details');
  } finally {
    loadingUser.value = false;
  }
};

// Initial load
onMounted(() => {
  loadListings();
});
</script>

<style scoped>
.listing-management {
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

.brand-select {
  width: 150px;
}

h2 {
  margin: 0;
  color: rgba(0, 0, 0, 0.737);
  font-size: 1.5rem;
  font-weight: bold;
}

.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.no-reviews {
  text-align: center;
  padding: 20px;
}

.phone-image {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60px;
}

.phone-image .el-image {
  max-height: 60px;
  max-width: 80px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.phone-image .el-image:hover {
  transform: scale(1.05);
}

.edit-image-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  background-color: #f7f7f7;
  padding: 15px;
  border-radius: 4px;
}

.edit-image-preview .el-image {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  width: 100%;
  max-width: 170px;
}

.action-btn {
  width: 100%;
  min-width: 0;
  padding: 4px 0;
  font-size: 12px;
  margin: 0;
  border-radius: 4px;
  height: 24px;
  line-height: 1;
  border: none;
  font-weight: normal;
}

.edit-btn {
  background-color: #ecf5ff;
  color: #409eff;
}

.disable-btn {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.delete-btn {
  background-color: #fef0f0;
  color: #f56c6c;
}

.reviews-btn {
  background-color: #f4f4f5;
  color: #909399;
}

.status-tag {
  padding: 3px 8px;
  height: 24px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border: none;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.review-rating {
  display: flex;
  align-items: center;
}

.review-rating .el-rate__icon {
  margin-right: 2px;
  font-size: 16px;
}

.seller-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 0.9em;
  color: #409EFF;
  cursor: pointer;
  outline: inherit;
  opacity: 0.8;
  transition: all 0.3s;
}

.seller-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.user-details {
  padding: 20px;
}

.user-info-item {
  margin-bottom: 10px;
}

.user-stats {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}

.dialog-loading {
  padding: 20px;
  text-align: center;
}

.no-user {
  text-align: center;
  padding: 20px;
}

/* fix the problem of the sort icon */
:deep(.el-table__column-sorters) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-table__header th) {
  background-color: #f5f7fa;
}

:deep(.el-table__header-wrapper .el-table__header .cell) {
  display: flex !important;
  align-items: center !important;
}

:deep(.el-table__column-sorter) {
  margin-left: 6px !important;
}

:deep(.cell .caret-wrapper) {
  height: 16px;
}

/* set the style of the stock column */
.stock-cell {
  padding-left: 5px;
}

  /* remove all possible conflicting styles */
:deep(.el-table th.is-sortable .cell) {
  cursor: pointer;
  position: relative;
}

:deep(.el-table .ascending .sort-caret.ascending) {
  border-bottom-color: #409EFF;
}

:deep(.el-table .descending .sort-caret.descending) {
  border-top-color: #409EFF;
}

/* add extra styles to the sort button */
:deep(.el-table__column-sorter-inner) {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* force all sortable column titles to use flex layout and left align */
:deep(.el-table__header .is-sortable .cell) {
  justify-content: flex-start !important;
  padding-right: 24px !important;
}

:deep(.el-table__column-sorter) {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
}
</style> 