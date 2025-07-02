<template>
  <div class="admin-layout">
    <el-container class="layout-container">
        <!-- Left-side menu -->
        <el-aside width="250px">
            <div class="logo">OldPhoneDeals Admin</div>
            <el-menu router>
                <el-menu-item index="/admin/users" :class="{ active: activeMenu === '/admin/users'}">
                    <el-icon><User /></el-icon>
                    <span>Users</span>
                </el-menu-item>

                <el-menu-item index="/admin/listings" :class="{ active: activeMenu === '/admin/listings'}">
                    <el-icon><Box /></el-icon>
                    <span>Listings</span>
                </el-menu-item>

                <el-menu-item index="/admin/reviews" :class="{ active: activeMenu === '/admin/reviews'}">
                    <el-icon><ChatDotRound /></el-icon>
                    <span>Reviews</span>
                </el-menu-item>

                <el-menu-item index="/admin/sales" :class="{ active: activeMenu === '/admin/sales'}">
                    <el-icon><Money /></el-icon>
                    <span>Sales</span>
                </el-menu-item>

                <el-menu-item index="/admin/operations" :class="{ active: activeMenu === '/admin/operations'}">
                    <el-icon><Document /></el-icon>
                    <span>Operations</span>
                </el-menu-item>
            </el-menu>
        </el-aside>
        <!-- Right-side menu -->
        <el-container>
            <!-- Header area -->
            <el-header>
                <div class="page-title">{{ pageTitle }}</div>
                <div class="auth-buttons">
                  <el-button plain @click="goToHome">Log out</el-button>
                </div>
            </el-header>
            <!-- Main content area -->
            <el-main>
              <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </el-main>
        </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { removeToken } from '@/utils/auth';
import { ElMessage, ElNotification } from 'element-plus';
import { User, Box, ChatDotRound, Money, Document } from '@element-plus/icons-vue';
import { io } from 'socket.io-client';

let socket;
const router = useRouter();
const route = useRoute();

const activeMenu = computed(() => route.path);
const pageTitle = computed(() => {
  if (route.path.includes('/admin/users')) return 'Users'
  if (route.path.includes('/admin/listings')) return 'Phone Listings'
  if (route.path.includes('/admin/reviews')) return 'Customer Reviews'
  if (route.path.includes('/admin/sales')) return 'Sales & Transactions'
  if (route.path.includes('/admin/operations')) return 'Actions Log'
  return ''
})

const goToHome = () => {
  removeToken();
  ElMessage.success('Log out success');
  router.push('/admin/login');
};

onMounted(() => {
	socket = io('http://localhost:3000');

	socket.on('new-order', (data) => {
		ElNotification({
			title: 'New order',
			message: `order from ${data.buyerName}!`,
			type: 'success',
			duration: 3000
		});
	});
});

onBeforeUnmount(() => {
	if (socket) socket.disconnect();
});
</script>

<style>
/* Global styles for admin pages */
.admin-layout .el-button {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.admin-layout .el-button:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #f5faff;
}

.admin-layout .el-button.is-plain {
  background-color: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.admin-layout .el-button.is-plain:hover {
  background-color: #f5faff;
  border-color: #c6e2ff;
  color: #409EFF;
}

/* Button types - override Element Plus default to match desired style */
.admin-layout .el-button--primary {
  background-color: #f0f7ff;
  border-color: #c6e2ff;
  color: #409EFF;
}

.admin-layout .el-button--primary:hover {
  background-color: #ecf5ff;
  border-color: #a0cfff;
  color: #409EFF;
}

.admin-layout .el-button--success {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67c23a;
}

.admin-layout .el-button--success:hover {
  background-color: #e1f3d8;
  border-color: #b3e19d;
  color: #67c23a;
}

.admin-layout .el-button--warning {
  background-color: #fdf6ec;
  border-color: #faecd8;
  color: #e6a23c;
}

.admin-layout .el-button--warning:hover {
  background-color: #faecd8;
  border-color: #f5dab1;
  color: #e6a23c;
}

.admin-layout .el-button--danger {
  background-color: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}

.admin-layout .el-button--danger:hover {
  background-color: #fde2e2;
  border-color: #fab6b6;
  color: #f56c6c;
}

.admin-layout .el-button--info {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

.admin-layout .el-button--info:hover {
  background-color: #e9e9eb;
  border-color: #d3d4d6;
  color: #909399;
}

/* Ensure table action buttons have consistent sizing */
.admin-layout .el-table .el-button {
  margin: 2px;
  padding: 6px 12px;
  min-height: 32px;
  border-width: 1px;
  border-style: solid;
}

/* Make sure table buttons are visible with good contrast */
.admin-layout .el-table .el-button--primary {
  background-color: #ecf5ff;
  border-color: #a0cfff;
  color: #409EFF;
}

.admin-layout .el-table .el-button--success {
  background-color: #f0f9eb;
  border-color: #c2e7b0;
  color: #67c23a;
}

.admin-layout .el-table .el-button--warning {
  background-color: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}

.admin-layout .el-table .el-button--danger {
  background-color: #fef0f0;
  border-color: #fab6b6;
  color: #f56c6c;
}

.admin-layout .el-table .el-button--info {
  background-color: #f4f4f5;
  border-color: #d3d4d6;
  color: #909399;
}

/* Edit button specific override to match the screenshot */
.admin-layout .el-table .cell .el-button {
  min-width: 60px;
  background-color: rgba(64, 158, 255, 0.1) !important;
  color: #409EFF !important;
  border-color: transparent !important;
  border-radius: 4px;
  transition: all 0.3s;
}

.admin-layout .el-table .cell .el-button:hover {
  background-color: rgba(64, 158, 255, 0.2) !important;
}

/* Type-specific styles for other table buttons */
.admin-layout .el-table .cell .el-button--success {
  background-color: rgba(103, 194, 58, 0.1) !important;
  color: #67c23a !important;
}

.admin-layout .el-table .cell .el-button--success:hover {
  background-color: rgba(103, 194, 58, 0.2) !important;
}

.admin-layout .el-table .cell .el-button--warning {
  background-color: rgba(230, 162, 60, 0.1) !important;
  color: #e6a23c !important;
}

.admin-layout .el-table .cell .el-button--warning:hover {
  background-color: rgba(230, 162, 60, 0.2) !important;
}

.admin-layout .el-table .cell .el-button--danger {
  background-color: rgba(245, 108, 108, 0.1) !important;
  color: #f56c6c !important;
}

.admin-layout .el-table .cell .el-button--danger:hover {
  background-color: rgba(245, 108, 108, 0.2) !important;
}

.admin-layout .el-table .cell .el-button--info {
  background-color: rgba(144, 147, 153, 0.1) !important;
  color: #909399 !important;
}

.admin-layout .el-table .cell .el-button--info:hover {
  background-color: rgba(144, 147, 153, 0.2) !important;
}

/* Fix button-group styles */
.admin-layout .el-button-group .el-button {
  margin: 0;
  border-left-color: rgba(255, 255, 255, 0.5);
}

.admin-layout .el-button-group .el-button:first-child {
  border-left-color: inherit;
}

/* Override Element Plus focus styles that might conflict */
.admin-layout .el-button:focus,
.admin-layout .el-button:active {
  color: inherit;
  border-color: inherit;
  background-color: inherit;
  outline: none;
}

.admin-layout .el-button--primary:focus,
.admin-layout .el-button--primary:active {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #f0f7ff;
}
</style>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  background: rgba(172, 183, 221, 0.395);
  align-items: center;
  font-style: italic;
  font-size: large;
  font-weight: 900;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.737)
}

.auth-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.auth-buttons .el-button {
  background-color: #fff;
  border-color: #dcdfe6;
  color: #606266;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.auth-buttons .el-button:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #f5faff;
}

.el-aside {
  background-color: #f3f4f6;
  color: #4b5563;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  align-items: center;
  position: fixed;
  height: 100vh;
  z-index: 1000;
}

.el-menu {
  --el-menu-bg-color: #f3f4f6;
  --el-menu-text-color: #4b5563;
  --el-menu-hover-text-color: #6366f1;
  --el-menu-hover-bg-color: #e0e7ff;
  --el-menu-active-color: #4085E7;
  border-right: none;
  background-color: #f3f4f6;
}

.el-menu-item {
  font-size: 16px;
  padding: 16px;
  transition: background-color 0.3s;
}

.el-header {
  text-align: right;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
}

.el-container {
  background-color: rgb(235, 235, 235);
}

.layout-container {
  min-height: 100vh;
}

.layout-container > .el-container {
  margin-left: 250px; /* Same as el-aside width */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.737);
  font-size: 1.5rem;
  font-weight: bold;
}

.header-actions .el-button {
  margin-left: 16px;
}

.el-main {
  background-color: rgba(255, 255, 255, 0.6);
  padding: 0px;
}

.el-menu-item.active span,
.el-menu-item.active .el-icon {
  font-weight: bold;
  color: rgb(64, 133, 231);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 