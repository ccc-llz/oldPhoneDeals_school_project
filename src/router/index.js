import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth';
import { ElMessage } from 'element-plus';
import UserLayout from '../views/Userlayout.vue'
import MainPage from '../views/MainPage.vue'
import Auth from '../views/Auth.vue'
import Checkout from '../views/Checkout.vue'
import AuthResetPassword from '../views/Auth-ResetPassword.vue'
import UserProfile from '../views/UserProfile.vue'
// import Item from '../views/ItemPage.vue'
import AdminLogin from '@/views/admin/AdminLogin.vue'
import AdminLayout from '@/views/admin/AdminLayout.vue'
import UserManagement from '@/views/admin/UserManagement.vue'
import ListingManagement from '@/views/admin/ListingManagement.vue'
import ReviewManagement from '@/views/admin/ReviewManagement.vue'
import SalesActivity from '@/views/admin/SalesActivity.vue'
import OperationsLog from '@/views/admin/OperationsLog.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: UserLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: MainPage
        },
        {
          path: 'auth',
          component: Auth
        },
        {
          path: 'auth/reset-password/:token',
          component: AuthResetPassword,
        },
        {
          path: '/userprofile',
          component: UserProfile
        },
        {
          path: '/checkout',
          component: Checkout
        }
      ]
    },
    {
      path: '/admin/login',
      name: 'adminLogin',
      component: AdminLogin,
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAdmin: true, transition: false },
      children: [
        {
          path: '',
          redirect: '/admin/users'
        },
        {
          path: 'users',
          component: UserManagement
        },
        {
          path: 'listings',
          component: ListingManagement
        },
        {
          path: 'reviews',
          component: ReviewManagement
        },
        {
          path: 'sales',
          component: SalesActivity
        },
        {
          path: 'operations',
          component: OperationsLog
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = getToken();
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!token) {
      ElMessage.error('Not logged, please log in first')
      localStorage.setItem('redirectAfterLogin', to.fullPath);
      return next('/admin/login');
    }
  }

  next();
});

export default router
