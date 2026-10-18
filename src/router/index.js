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
import { canManageAccounts, canManagePlans, can } from '../utils/permissions'

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
          meta: { permission: 'departments.view' },
        },
        {
          path: '/manager/users',
          name: 'manager-users',
          component: UsersManagement,
          meta: { permission: 'users.view' },
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
          meta: { permission: 'clients.view' },
        },
        {
          path: '/content-plans',
          name: 'content-plans',
          component: ContentPlans,
          meta: { permission: 'plans.view' },
        },
        {
          path: '/app/client-vault',
          name: 'ClientVault',
          component: ClientVault,
          meta: { requiresAuth: true, permission: 'vault.view' },
        },
        {
          path: '/plan-contents',
          name: 'PlanContents',
          component: PlanBoardsList,
          meta: { permission: 'posts.view' },
        },
        {
          path: '/plan-board/:id',
          name: 'PlanBoard',
          component: SpreadsheetBoard,
          meta: { permission: 'posts.view' },
        },
        {
          path: '/today-board',
          name: 'TodayBoard',
          component: () => import('@/views/TodayBoard.vue'),
          meta: { title: 'لوحة اليوم / الشريط الزمني', permission: 'workload.view' },
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
          meta: { title: 'المشاريع', permission: 'projects.view' },
        },
        {
          path: '/projects/:id',
          name: 'ProjectDetails',
          component: () => import('../views/ProjectDetails.vue'),
          props: true,
          meta: { permission: 'projects.view' },
        },
        {
          path: '/quick-tasks',
          name: 'QuickTasksBoard',
          component: () => import('../views/QuickTasksBoard.vue'),
          meta: { title: 'المهام السريعة', permission: 'quick_tasks.view' },
        },
        {
          path: '/system-logs',
          name: 'SystemLogs',
          component: SystemLogs,
          meta: {
            requiresAuth: true,
            permission: 'logs.view',
          },
        },
        {
          path: '/settings',
          name: 'Settings',
          component: () => import('@/views/Settings.vue'),
          meta: {
            requiresAuth: true,
            role: 'manager',
            title: 'إعدادات النظام',
          },
        },
        {
          path: '/trash',
          name: 'TrashBin',
          component: () => import('@/views/TrashBin.vue'),
          meta: {
            requiresAuth: true,
            permission: 'trash.view',
            title: 'سلة المهملات',
          },
        },
        {
          path: '/content-plans/:id',
          name: 'ContentPlanRedirect',
          redirect: (to) => {
            const role = localStorage.getItem('role')
            let user = null
            try {
              user = JSON.parse(localStorage.getItem('user') || 'null')
            } catch (e) {}
            const isManagerOrAM = role === 'manager' || user?.role === 'manager' || user?.job_title === 'Account Manager'
            if (isManagerOrAM) {
              return { path: '/content-plans', query: { plan_id: to.params.id } }
            }
            return { path: `/plan-board/${to.params.id}` }
          },
        },
        {
          path: '/plans/:id',
          name: 'PlanLegacyRedirect',
          redirect: (to) => {
            const role = localStorage.getItem('role')
            let user = null
            try {
              user = JSON.parse(localStorage.getItem('user') || 'null')
            } catch (e) {}
            const isManagerOrAM = role === 'manager' || user?.role === 'manager' || user?.job_title === 'Account Manager'
            if (isManagerOrAM) {
              return { path: '/content-plans', query: { plan_id: to.params.id } }
            }
            return { path: `/plan-board/${to.params.id}` }
          },
        },
        {
          path: '/plans',
          redirect: '/content-plans',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: () => {
        const token = localStorage.getItem('token')
        const role = localStorage.getItem('role')
        if (!token) return '/'
        return role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'
      },
    },
  ],
})

// Navigation Guard
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  let role = localStorage.getItem('role')

  let user = null
  try {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      user = JSON.parse(storedUser)
    }
  } catch (e) {
    console.error('Error parsing stored user in router:', e)
  }

  // مزامنة الدور إذا كان موجوداً داخل كائن المستخدم
  if (!role && user?.role) {
    role = user.role
  }
  if (!user && role) {
    user = { role }
  }

  // إذا كان هناك توكن لكن بيانات المستخدم والدور غير صالحة إطلاقاً
  if (token && !role) {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    if (to.path !== '/') return '/'
    return
  }

  const defaultDashboard = role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'

  // التحقق إذا كان المسار أو أي من آبائه يحتاج تسجيل دخول
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      if (to.path !== '/') return '/'
      return
    }

    // فحص مسار العملاء: السماح للمدير أو Account Manager أو Sales
    if (to.matched.some((record) => record.meta.canManageAccounts) || to.path === '/manager/clients' || to.path === '/clients') {
      const allowed = canManageAccounts(user) || (user && (user.role === 'manager' || user.job_title === 'Account Manager' || user.job_title === 'Sales'))
      if (allowed) {
        return
      } else {
        if (to.path !== defaultDashboard) return defaultDashboard
        return
      }
    }

    // فحص مسار الخطط: السماح فقط للمدير أو Account Manager
    if (to.matched.some((record) => record.meta.canManagePlans) || to.path === '/content-plans') {
      const allowed = canManagePlans(user) || (user && (user.role === 'manager' || user.job_title === 'Account Manager'))
      if (allowed) {
        return
      } else {
        const plansFallback = role === 'manager' ? '/manager/dashboard' : '/my-tasks'
        if (to.path !== plansFallback) return plansFallback
        return
      }
    }

    // فحص الصلاحية الدقيقة للمسار (Fine-grained permission check) أولاً
    const requiredPermission = to.meta.permission || to.matched.find((r) => r.meta.permission)?.meta.permission
    if (requiredPermission) {
      if (!can(requiredPermission, user)) {
        if (to.path !== defaultDashboard) return defaultDashboard
        return
      }
    } else if (to.meta.role && to.meta.role !== role) {
      // التحقق من الدور فقط للمسارات العامة التي لم تُحدد لها صلاحية دقيقة
      if (to.path !== defaultDashboard) {
        return defaultDashboard
      }
      return '/'
    }
  } else {
    // لو رايح لصفحة تسجيل الدخول وهو مسجل دخول بالفعل
    if (token && to.path === '/') {
      if (to.path !== defaultDashboard) {
        return defaultDashboard
      }
      return
    }
  }
})

export default router
