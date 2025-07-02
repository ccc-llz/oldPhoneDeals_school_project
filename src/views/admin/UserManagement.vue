<template>
  <div class="user-management">
    <el-card class="main-card">
      <div class="card-header">
        <div class="header-left">
          <div class="search-controls">
            <el-input v-model="searchName" placeholder="Search by name" class="search-input" clearable
              @clear="loadUsers" @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>

            <el-input v-model="searchEmail" placeholder="Search by email" class="search-input" clearable
              @clear="loadUsers" @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>

            <el-button type="primary" @click="handleSearch">
              <el-icon>
                <Search />
              </el-icon>
              Search
            </el-button>
          </div>
        </div>

      </div>

      <el-table :data="users" style="width: 100%; margin-top: 20px;" v-loading="loading" @sort-change="onSortChange">
        <!-- Full Name -->
        <el-table-column prop="fullName" label="Full Name" min-width="100" sortable="custom" />
        <!-- Email -->
        <el-table-column prop="email" label="Email" min-width="130" sortable="custom" />
        <!-- Listing -->
        <el-table-column label="Listings" width="100">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewListings(row)" :disabled="row.listingCount === 0">
              {{ row.listingCount || 0 }}   <el-icon style="margin-left: 15px;"><View /></el-icon>
            </el-link>
          </template>
        </el-table-column>
        <!-- Review -->
        <el-table-column label="Reviews (post/receive)" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewReviews(row)" :disabled="row.postedCount === 0 && row.receivedCount === 0">
              {{ row.postedCount || 0 }} / {{ row.receivedCount || 0 }}   <el-icon style="margin-left: 25px;"><View /></el-icon>
            </el-link>
          </template>
        </el-table-column>
        <!-- Last Login -->
        <el-table-column prop="lastLogin" label="Last Login" width="150" sortable="custom" >
          <template #default="{ row }">
            {{ formatDateTime(row.lastLogin) }}
          </template>
        </el-table-column>
        <!-- Account State -->
        <el-table-column prop="disabled" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" class="status-tag">
              {{ row.disabled ? 'Disabled' : 'Active' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- Operations -->
        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">
                Edit
              </el-button>

              <el-button :type="row.disabled ? 'success' : 'warning'" size="small" @click="handleToggleStatus(row)">
                {{ row.disabled ? 'Enable' : 'Disable' }}
              </el-button>

              <el-button type="danger" size="small" @click="handleDelete(row)">
                Delete
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="totalUsers" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog v-model="editDialogVisible" title='Edit User' width="500px">
      <el-form ref="editForm" :model="editingUser" :rules="rules" label-width="100px">
        <el-form-item label="Firstname" prop="firstname">
          <el-input v-model="editingUser.firstname" />
        </el-form-item>
        <el-form-item label="Lastname" prop="lastname">
          <el-input v-model="editingUser.lastname" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="editingUser.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleSave">Save</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Listings Dialog -->
    <el-dialog v-model="listingsDialogVisible" title="Listings" width="1000px">
      <div v-if="selectedUserListing && selectedUserListing.length > 0">
        <el-table :data="selectedUserListing" style="width: 100%">
          <el-table-column label="Image" width="100">
            <template #default="{ row }">
              <div class="phone-image">
                <el-image :src="getImageUrl(row.image)" fit="contain" :preview-src-list="[]">
                </el-image>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="Title" min-width="250" />
          <el-table-column prop="brand" label="Brand" min-width="100" />
          <el-table-column prop="price" label="Price" width="100">
            <template #default="{ row }">
              ${{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="Stock" width="80" />
          <el-table-column prop="disabled" label="Status" width="100">
            <template #default="{ row }">
              <el-tag :type="row.disabled !== undefined ? 'danger' : 'success'" class="status-tag">
                {{ row.disabled !== undefined ? 'Disabled' : 'Active' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="no-reviews">
        <el-empty description="This user has no listing" />
      </div>
    </el-dialog>

    <!-- Reviews Dialog -->
    <el-dialog v-model="reviewsDialogVisible" width="1200px" :style="{ '--el-dialog-margin-top': '6vh' }">
      <div style="max-height: 80vh; overflow-y: auto;">
        <!-- posted reviews -->
        <h4 style="margin-bottom: 10px;">Posted Reviews</h4>
        <div v-if="postedReviews && postedReviews.length > 0" style="max-height: 35vh; overflow-y: auto;">
          <el-table :data="postedReviews" style="width: 100%">
            <el-table-column label="Image" width="100">
              <template #default="{ row }">
                <div class="phone-image">
                  <el-image :src="getImageUrl(row.image)" fit="contain" :preview-src-list="[]">
                  </el-image>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Listing" min-width="200">
              <template #default="{ row }">
                {{ row.title }}
              </template>
            </el-table-column>
            <el-table-column prop="rating" label="Rating" width="180">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" />
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="Comment" min-width="200" />
            <el-table-column prop="hidden" label="Status" width="100">
              <template #default="{ row }">
                <el-tag :type="row.hidden !== undefined ? 'danger' : 'success'">
                  {{ row.hidden !== undefined ? 'Hidden' : 'Visible' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="no-reviews">
          <el-empty description="No reviews posted by this user" :image-size="80" class="small-empty" />
        </div>
        <!-- received reviews -->
        <h4 style="margin: 20px 0 10px;">Received Reviews</h4>
        <div v-if="receivedReviews && receivedReviews.length > 0" style="max-height: 35vh; overflow-y: auto;">
          <el-table :data="receivedReviews" style="width: 100%">
            <el-table-column label="Image" width="100">
              <template #default="{ row }">
                <div class="phone-image">
                  <el-image :src="getImageUrl(row.image)" fit="contain" :preview-src-list="[]">
                  </el-image>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Listing" min-width="200">
              <template #default="{ row }">
                {{ row.title }}
              </template>
            </el-table-column>
            <el-table-column prop="reviewer" label="Reviewer" width="180" />
            <el-table-column prop="rating" label="Rating" width="180">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" />
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="Comment" min-width="200" />
            <el-table-column prop="hidden" label="Status" width="100">
              <template #default="{ row }">
                <el-tag :type="row.hidden !== undefined ? 'danger' : 'success'">
                  {{ row.hidden !== undefined ? 'Hidden' : 'Visible' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="no-reviews">
          <el-empty description="No reviews received by this user" :image-size="80" class="small-empty" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as adminApi from '@/api/admin/user';

const users = ref([]);
const loading = ref(false);
const searchName = ref('');
const searchEmail = ref('');
const editDialogVisible = ref(false);
const listingsDialogVisible = ref(false);
const reviewsDialogVisible = ref(false);
const editingUser = ref({});
const currentPage = ref(1);
const pageSize = ref(20);
const totalUsers = ref(0);
const selectedUserListing = ref([])
const postedReviews = ref([])
const receivedReviews = ref([])
const sortBy = ref('createdAt');
const sortOrder = ref('desc'); // 'asc' | 'desc'


const rules = {
  title: [{ required: true, message: 'Please input title', trigger: 'blur' }],
  brand: [{ required: true, message: 'Please select brand', trigger: 'change' }],
  price: [{ required: true, message: 'Please input price', trigger: 'blur' }],
  stock: [{ required: true, message: 'Please input stock', trigger: 'blur' }],
  seller: [{ required: true, message: 'Please input seller ID', trigger: 'blur' }]
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};

// load users data
const loadUsers = async (forceRefresh = false) => {
  try {
    loading.value = true;
    const refreshParam = forceRefresh ? { refresh: Date.now() } : {};
    const data = await adminApi.getAllUsers({
      page: currentPage.value,
      limit: pageSize.value,
      name: searchName.value,
      email: searchEmail.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ...refreshParam
    });
    users.value = [];
    setTimeout(() => {
      users.value = data.users;
      totalUsers.value = data.total;
    }, 0);

  } catch (error) {
    if (error.__handled) return;
    ElMessage.error(error.message || 'Failed to load users');
  } finally {
    loading.value = false;
  }
};

// pagenation
const handleSizeChange = (val) => {
  pageSize.value = val;
  loadUsers();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadUsers();
};
const handleSearch = () => {
  currentPage.value = 1; // return to page 1
  loadUsers(true); // refresh
};
const onSortChange = ({ prop, order }) => {
  sortBy.value = order === 'ascending' ? prop : order === 'descending' ? prop : 'createdAt';
  sortOrder.value = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : '';
  handleSearch()
};
// Editing
const handleEdit = (row) => {
  editingUser.value = { ...row };
  editDialogVisible.value = true;
};

// Saving edit
const handleSave = async () => {
  try {
    // validate
    if (!editingUser.value.firstname || !editingUser.value.lastname || !editingUser.value.email) {
      return ElMessage.error('Please fill in all required fields');
    }
    // update new list
    await adminApi.updateUser(editingUser.value._id, editingUser.value);
    ElMessage.success('User updated successfully');

    //page reload logit
    editDialogVisible.value = false;
    if (searchName.value || searchEmail.value) {
      await handleSearch();
    } else {
      await loadUsers();
    }
  } catch (error) {
    if (error.__handled) return;
    ElMessage.error(error.message || 'Failed to save user');
  }
};

// switch account state
const handleToggleStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to disable/enable this user?',
      'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );

    const response = await adminApi.toggleListingStatus(row._id);
    ElMessage.success(`Listing ${row.disabled !== undefined ? 'enabled' : 'disabled'} successfully`);

    //page reload logit
    editDialogVisible.value = false;
    if (searchName.value || searchEmail.value) {
      await handleSearch();
    } else {
      await loadUsers();
    }
  } catch (error) {
    if (error.__handled) return;
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Failed to toggle listing status');
    }
  }
};

// delete account
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

    await adminApi.deleteUser(row._id);
    ElMessage.success('User deleted successfully');

    //page reload logit
    editDialogVisible.value = false;
    if (searchName.value || searchEmail.value) {
      await handleSearch();
    } else {
      await loadUsers();
    }
  } catch (error) {
    if (error.__handled) return;
    if (error !== 'cancel') {
      ElMessage.error(error.message || 'Failed to delete listing');
    }
  }
};

// detail
const handleViewListings = async (row) => {
  selectedUserListing.value = [];
  try {
    const data = await adminApi.getListingsByUserId(row._id);
    selectedUserListing.value = data;
    listingsDialogVisible.value = true;
  } catch (err) {
    ElMessage.error('Failed to load listings');
  }
};
const handleViewReviews = async (row) => {
  postedReviews.value = [];
  receivedReviews.value = [];
  try {
    const data = await adminApi.getReviewsByUserId(row._id);
    postedReviews.value = data.filter(r => r.role === 'authored');
    receivedReviews.value = data.filter(r => r.role === 'received');
    reviewsDialogVisible.value = true;
  } catch (error) {
    if (error.__handled) return;
    console.error('Failed to load reviews:', error);
    ElMessage.error('Failed to load reviews');
  }
};

const getImageUrl = (relativePath) => {
  return `${import.meta.env.VITE_API_BASE_URL}${relativePath}`;
};

// init
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management {
  padding: 0;
  height: calc(100vh - 60px);
}

.main-card {
  margin-bottom: 20px;
  border-radius: 0;
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

h2 {
  margin: 0;
  color: rgba(0, 0, 0, 0.737);
  font-size: 1.5rem;
  font-weight: bold;
}

h4 {
  margin: 0;
  color: rgba(0, 0, 0, 0.737);
  font-size: 1.2rem;
  font-weight: bold;
}

.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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

.status-tag {
  padding: 3px 8px;
  height: 24px;
  line-height: 18px;
  font-size: 12px;
  font-weight: normal;
  border: none;
}

.small-empty {
  padding: 12px 0;
  margin: 0 auto;
}
</style> 