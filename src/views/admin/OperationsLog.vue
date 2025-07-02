<template>
  <div class="operations-log">
    <el-card class="main-card">
      <div class="card-header">
        <div class="header-left">
          <div class="search-controls">
            <el-select
              v-model="searchTarget"
              placeholder="Select target"
              class="target-select"
              clearable
              @clear="handleSearch"
              @change="handleSearch"
              style="width: 150px;"
            >
              <el-option
                v-for="target in targets"
                :key="target"
                :label="target"
                :value="target"
              />
            </el-select>

            <el-select
              v-model="searchAction"
              placeholder="Select action"
              class="action-select"
              clearable
              @clear="handleSearch"
              @change="handleSearch"
              style="width: 150px;"
            >
              <el-option
                v-for="action in actions"
                :key="action"
                :label="action"
                :value="action"
              />
            </el-select>

            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
            />

            <el-button type="primary">
              <el-icon>
                  <Search />
              </el-icon>
              Search
            </el-button>
          </div>
        </div>
      </div>

      <el-table 
          :data="operations" 
          style="width: 100%"
          v-loading="loading"
          @sort-change="handleSortChange"
      >
          <el-table-column prop="timestamp" label="Time" min-width="180" sortable="custom">
            <template #default="{ row }">
              {{ formatDateTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="adminName" label="Admin" min-width="120" />
          <el-table-column prop="action" label="Action" min-width="150">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.action)" class="status-tag">
                {{ row.action }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="targetType" label="Target Type" min-width="120" />
          <el-table-column prop="targetId" label="Target ID" min-width="180" />
          <el-table-column label="Details" min-width="120">
            <template #default="{ row }">
              <el-button size="small" @click="openDetailDialog(row.details)">View</el-button>
            </template>
          </el-table-column>
      </el-table>

      <el-dialog v-model="dialogVisible" title="Details">
        <el-descriptions :column="1" border v-if="dialogDetails">
          <el-descriptions-item
            v-for="(value, key) in dialogDetails"
            :key="key"
            :label="key"
          >
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
      </el-dialog>

      <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="totalOperations" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getAllOperations } from '@/api/admin/operation';

const operations = ref([]);
const loading = ref(false);
const totalOperations = ref(0)
const currentPage = ref(1);
const pageSize = ref(20);
const searchTarget = ref('');
const searchAction = ref('');
const dateRange = ref(null);
const dialogVisible = ref(false);
const dialogDetails = ref(null);
const sortParams = ref('');

const targets = ['listing', 'review', 'transaction', 'user', 'system']
const actions = ['create', 'update', 'delete', 'disable', 'enable', 'hide', 'show', 'export', 'login', 'logout', 'other']

const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};
const getStatusType = (status) => {
  switch (status) {
    case 'create': return 'success';
    case 'update': return 'success';
    case 'delete': return 'danger';
    case 'disable': return 'warning';
    case 'enable': return 'success';
    case 'hide': return 'warning';
    case 'show': return 'success';
    case 'export': return 'success';
    case 'login': return 'success';
    case 'logout': return 'danger';
    case 'other': return 'danger';
    default: return 'info';
  }
};

const openDetailDialog = (details) => {
  dialogDetails.value = details;
  dialogVisible.value = true;
};

// Handle sort change
const handleSortChange = ({ prop, order }) => {
  if (!prop || !order) {
    sortParams.value = '';
  } else {
    // Convert Element Plus sort params to backend format
    const direction = order === 'ascending' ? 'asc' : 'desc';
    sortParams.value = `${prop}:${direction}`;
  }
  loadOperations();
};

// load operations
const loadOperations = async (forceRefresh = false) => {
  try {
    loading.value = true;
    
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    if (searchTarget.value) {
      params.target = searchTarget.value;
    }
    if (searchAction.value) {
      params.action = searchAction.value;
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    if (sortParams.value) {
      params.sort = sortParams.value;
    }
    if (forceRefresh) {
      params.refresh = Date.now();
    }
    
    const data = await getAllOperations(params);
    
    operations.value = data.operations;
    totalOperations.value = data.total;
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
  loadOperations();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadOperations();
};
const handleSearch = () => {
  currentPage.value = 1; // return to page 1
  loadOperations(true); // refresh
};

// init
onMounted(() => {
  loadOperations();
});
</script>

<style scoped>
.operations-log {
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

.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>