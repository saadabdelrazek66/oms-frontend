import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ManagerDashboard from '../views/ManagerDashboard.vue'
import EmployeeDashboard from '../views/EmployeeDashboard.vue'
import UsersManagement from '../views/UsersManagement.vue'
import ClientsManager from '../views/ClientsManager.vue'
import DepartmentsManager from '../views/DepartmentsManager.vue'
import ContentPlans from '../views/ContentPlans.vue'
import ClientVault from '../views/ClientVault.vue'
import PlanBoardsList from '../views/PlanBoardsList.vue'
import SpreadsheetBoard from '../views/SpreadsheetBoard.vue'
import SystemLogs from '../views/SystemLogs.vue'
import { canManageAccounts, canManagePlans } from '../utils/permissions'

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
          alias: '/clients',
          name: 'manager-clients',
          component: ClientsManager,
          meta: { canManageAccounts: true },
        },
        {
          path: '/content-plans',
          name: 'content-plans',
          component: ContentPlans,
          meta: { canManagePlans: true },
        },
        {
          path: '/app/client-vault',
          name: 'ClientVault',
          component: ClientVault,
          meta: { requiresAuth: true, role: 'manager' },
        },
        {
          path: '/plan-contents',
          name: 'PlanContents',
          component: PlanBoardsList,
        },
        {
          path: '/plan-board/:id',
          name: 'PlanBoard',
          component: SpreadsheetBoard,
        },
        {
          path: '/my-tasks',
          name: 'EmployeeTasks',
          component: () => import('@/views/EmployeeTasks.vue'),
          meta: { title: 'مهامي / مساحة العمل' },
        },
        {
          path: '/projects',
          name: 'Projects',
          component: () => import('@/views/Projects.vue'),
          meta: { title: 'المشاريع' },
        },
        {
          path: '/projects/:id',
          name: 'ProjectDetails',
          component: () => import('../views/ProjectDetails.vue'),
          props: true,
        },
        {
          path: '/system-logs',
          name: 'SystemLogs',
          component: SystemLogs,
          meta: {
            requiresAuth: true,
            role: 'manager',
          },
        },
      ],
    },
  ],
})

// Navigation Guard
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  let user = null
  try {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user = JSON.parse(storedUser)
    }
  } catch (e) {
    console.error('Error parsing stored user in router:', e)
  }
  if (!user && role) {
    user = { role }
  }

  // التحقق إذا كان المسار أو أي من آبائه يحتاج تسجيل دخول
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      return '/' // طرده لصفحة الدخول
    }

    // فحص مسار العملاء: السماح للمدير أو Account Manager أو Sales
    if (to.matched.some((record) => record.meta.canManageAccounts) || to.path === '/manager/clients' || to.path === '/clients') {
      const allowed = canManageAccounts(user) || (user && (user.role === 'manager' || user.job_title === 'Account Manager' || user.job_title === 'Sales'))
      if (allowed) {
        return
      } else {
        return role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'
      }
    }

    // فحص مسار الخطط: السماح فقط للمدير أو Account Manager
    if (to.matched.some((record) => record.meta.canManagePlans) || to.path === '/content-plans') {
      const allowed = canManagePlans(user) || (user && (user.role === 'manager' || user.job_title === 'Account Manager'))
      if (allowed) {
        return
      } else {
        return role === 'manager' ? '/manager/dashboard' : '/my-tasks'
      }
    }

    // التحقق من الصلاحيات بناءً على الدور
    if (to.meta.role && to.meta.role !== role) {
      // توجيهه للوحة المناسبة لدوره
      return role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'
    }
  } else {
    // لو رايح لصفحة تسجيل الدخول وهو مسجل دخول بالفعل
    if (token && to.path === '/') {
      return role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'
    }
  }
})

export default router
