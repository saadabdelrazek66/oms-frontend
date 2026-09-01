import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ManagerDashboard from '../views/ManagerDashboard.vue'
import EmployeeDashboard from '../views/EmployeeDashboard.vue'
import UsersManagement from '../views/UsersManagement.vue'
import ContentPlansManager from '../views/ContentPlansManager.vue'
import EmployeeContentPlans from '../views/EmployeeContentPlans.vue'
import ClientsManager from '../views/ClientsManager.vue'
import DepartmentsManager from '../views/DepartmentsManager.vue'
import ContentPlans from '../views/ContentPlans.vue'
import ClientVault from '../views/ClientVault.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/app',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/manager/dashboard',
          name: 'manager-dashboard',
          component: ManagerDashboard,
          meta: { role: 'manager' },
        },
        {
          path: '/manager/departments',
          name: 'manager-departments',
          component: DepartmentsManager,
          meta: { role: 'manager' },
        },
        {
          path: '/manager/users',
          name: 'manager-users',
          component: UsersManagement,
          meta: { role: 'manager' },
        },
        {
          path: '/employee/dashboard',
          name: 'employee-dashboard',
          component: EmployeeDashboard,
          meta: { role: 'employee' },
        },
        {
          path: '/manager/clients',
          name: 'manager-clients',
          component: ClientsManager,
          meta: { role: 'manager' },
        },
        {
          path: '/content-plans',
          name: 'content-plans',
          component: ContentPlans,
        },
        {
          path: '/app/client-vault',
          name: 'ClientVault',
          component: ClientVault,
          meta: { requiresAuth: true, role: 'manager' },
        },
      ],
    },
  ],
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  // التحقق إذا كان المسار أو أي من آبائه يحتاج تسجيل دخول
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      return next('/') // طرده لصفحة الدخول
    }

    // التحقق من الصلاحيات بناءً على الدور
    if (to.meta.role && to.meta.role !== role) {
      // توجيهه للوحة المناسبة لدوره
      return role === 'manager' ? next('/manager/dashboard') : next('/employee/dashboard')
    }
  } else {
    // لو رايح لصفحة تسجيل الدخول وهو مسجل دخول بالفعل
    if (token && to.path === '/') {
      return role === 'manager' ? next('/manager/dashboard') : next('/employee/dashboard')
    }
  }

  next()
})

export default router
