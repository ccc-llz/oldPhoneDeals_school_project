<template>
  <div class="sales-activity">
    <el-card class="main-card">
      <div class="card-header">
        <div class="header-left">
          <div class="search-controls">
            <el-input
              v-model="searchText"
              placeholder="Search by buyer or product"
              class="search-input"
              clearable
              @clear="loadTransactions"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            
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
          <el-dropdown @command="handleExport" trigger="click">
            <el-button 
              type="primary" 
              plain
              class="export-button"
            >
              <span>Export Data</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="csv">Export as CSV</el-dropdown-item>
                <el-dropdown-item command="json">Export as JSON</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-table
        :data="transactions"
        style="width: 100%; margin-top: 20px;"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column label="Date" width="180" sortable="custom" prop="timestamp">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="buyer" label="Buyer" width="200" />
        
        <el-table-column label="Items" min-width="300">
          <template #default="{ row }">
            <div v-for="(item, index) in row.items" :key="index" class="item-row">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-quantity">x{{ item.quantity }}</span>
              <span class="item-price">${{ item.price }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Total" width="120" sortable="custom" prop="totalAmount">
          <template #default="{ row }">
            ${{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetails(row)"
            >
              Details
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
          :total="totalTransactions"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- Transaction details dialog -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="Transaction Details"
      width="70%"
    >
      <div v-if="selectedTransaction" class="transaction-details">
        <div class="detail-row">
          <div class="detail-label">Transaction ID:</div>
          <div class="detail-value">{{ selectedTransaction._id }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date:</div>
          <div class="detail-value">{{ formatDate(selectedTransaction.timestamp) }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Buyer:</div>
          <div class="detail-value">{{ selectedTransaction.buyer }}</div>
        </div>
        
        <div class="items-table">
          <el-table :data="selectedTransaction.items" border>
            <el-table-column prop="title" label="Product" />
            <el-table-column prop="quantity" label="Quantity" width="100" />
            <el-table-column label="Unit Price" width="120">
              <template #default="{ row }">
                ${{ row.price.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="Subtotal" width="120">
              <template #default="{ row }">
                ${{ (row.price * row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="total-section">
          <div class="total-row">
            <div class="total-label">Total Items:</div>
            <div class="total-value">{{ getTotalItems(selectedTransaction) }}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Total Amount:</div>
            <div class="total-value">${{ selectedTransaction.totalAmount.toFixed(2) }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailsDialogVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, Download, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as adminApi from '@/api/admin/sale';

const transactions = ref([]);
const loading = ref(false);
const searchText = ref('');
const dateRange = ref(null);
const currentPage = ref(1);
const pageSize = ref(20);
const totalTransactions = ref(0);
const sortParams = ref('');

// Details dialog
const detailsDialogVisible = ref(false);
const selectedTransaction = ref(null);

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Get label type based on status
const getStatusType = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'info';
  }
};

// Calculate total items in the order
const getTotalItems = (transaction) => {
  return transaction.items.reduce((total, item) => total + item.quantity, 0);
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
  loadTransactions();
};

// Load transactions
const loadTransactions = async (forceRefresh = false) => {
  try {
    loading.value = true;
    
    // Prepare query parameters
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };
    
    // Add search text
    if (searchText.value) {
      params.search = searchText.value;
    }
    
    // Add date range
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    // Add sort parameter
    if (sortParams.value) {
      params.sort = sortParams.value;
    }
    
    // Add force refresh parameter
    if (forceRefresh) {
      params.refresh = Date.now();
    }
    
    const data = await adminApi.getAllTransactions(params);
    
    transactions.value = data.transactions;
    totalTransactions.value = data.total;
  } catch (error) {
    if (error.__handled) return;
    console.error('Error loading transactions:', error);
    ElMessage.error(error.message || 'Failed to load transactions');
  } finally {
    loading.value = false;
  }
};

// Search handler
const handleSearch = () => {
  currentPage.value = 1; // Reset to first page
  loadTransactions(true); // Force refresh
};

// View details handler
const handleViewDetails = (transaction) => {
  selectedTransaction.value = transaction;
  detailsDialogVisible.value = true;
};

// Export handler
const handleExport = async (format) => {
  try {
    // Prepare export parameters
    const exportParams = {
      format: format
    };
    
    // Add date range
    if (dateRange.value && dateRange.value.length === 2) {
      exportParams.startDate = dateRange.value[0];
      exportParams.endDate = dateRange.value[1];
    }
    
    // Show loading message
    loading.value = true;
    ElMessage.info(`Preparing ${format.toUpperCase()} export...`);
    
    // Use API request instead of direct URL to ensure auth token is included
    const response = await adminApi.exportTransactions(exportParams);
    
    // Create a blob from the response
    const blob = new Blob([format === 'json' ? JSON.stringify(response, null, 2) : response], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    
    // Create URL for download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_${Date.now()}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success(`Exported sales data as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    ElMessage.error(error.message || 'Failed to export transactions');
  } finally {
    loading.value = false;
  }
};

// Pagination handler
const handleSizeChange = (val) => {
  pageSize.value = val;
  loadTransactions();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  loadTransactions();
};

// Initial load
onMounted(() => {
  loadTransactions();
});
</script>

<style scoped>
.sales-activity {
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.item-row {
  margin-bottom: 5px;
  display: flex;
  gap: 10px;
}

.item-title {
  flex: 1;
}

.item-quantity, .item-price {
  font-weight: 500;
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

/* Transaction detail styles */
.transaction-details {
  padding: 10px;
}

.detail-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.detail-label {
  font-weight: bold;
  width: 150px;
}

.items-table {
  margin: 20px 0;
}

.total-section {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-bottom: 5px;
}

.total-label {
  font-weight: bold;
}

.total-value {
  font-size: 16px;
}

.export-button {
  font-size: 16px;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  background-color: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.2);
  color: #409EFF;
}

.export-button:hover {
  background-color: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.3);
}
</style> 