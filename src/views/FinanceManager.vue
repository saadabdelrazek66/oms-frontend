<template>
  <section class="finance-page" dir="rtl">
    <!-- رأس الصفحة والأزرار السريعة -->
    <div class="page-topline">
      <div>
        <span class="eyebrow">نظام الرقابة المالية والحسابات</span>
        <h2>الخزينة والحسابات المركزية</h2>
        <p>إدارة التدفقات المالية، المقبوضات، المصروفات، مسير الرواتب، وكشوف حسابات العملاء بدقة محاسبية فائقة.</p>
      </div>

      <div class="topline-actions">
        <button
          v-if="can('finance.create')"
          class="primary-btn btn-income"
          type="button"
          @click="openTransactionModal('income')"
        >
          <span>＋</span> تسجيل إيراد / قبض
        </button>

        <button
          v-if="can('finance.create')"
          class="primary-btn btn-expense"
          type="button"
          @click="openTransactionModal('expense')"
        >
          <span>－</span> تسجيل مصروف / سداد
        </button>

        <button
          v-if="can('finance.create')"
          class="secondary-btn btn-quick-expense"
          type="button"
          @click="openQuickPettyCashModal"
        >
          <span>⚡</span> نثريات سريعة
        </button>
      </div>
    </div>

    <!-- شريط التبويبات الرئيسي -->
    <div class="finance-tabs-nav">
      <button
        class="tab-nav-btn"
        :class="{ active: activeTab === 'transactions' }"
        @click="switchTab('transactions')"
      >
        <span class="tab-icon">📋</span>
        <span>المعاملات وسجل القيود</span>
      </button>

      <button
        v-if="can('finance.salaries')"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'salaries' }"
        @click="switchTab('salaries')"
      >
        <span class="tab-icon">👥</span>
        <span>الرواتب والمستحقات</span>
      </button>

      <button
        class="tab-nav-btn"
        :class="{ active: activeTab === 'clients' }"
        @click="switchTab('clients')"
      >
        <span class="tab-icon">🏢</span>
        <span>حسابات العملاء (LTV)</span>
      </button>

      <button
        class="tab-nav-btn"
        :class="{ active: activeTab === 'accounts' }"
        @click="switchTab('accounts')"
      >
        <span class="tab-icon">🏦</span>
        <span>الخزائن والمحافظ</span>
      </button>

      <button
        v-if="can('finance.reports')"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'reports' }"
        @click="switchTab('reports')"
      >
        <span class="tab-icon">📊</span>
        <span>الأرباح والتقارير المالية</span>
      </button>

      <button
        v-if="can('finance.categories')"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'categories' }"
        @click="switchTab('categories')"
      >
        <span class="tab-icon">🏷️</span>
        <span>الأقسام والتصنيفات</span>
      </button>
    </div>

    <!-- ================= 1. تبويب المعاملات وسجل القيود ================= -->
    <TransactionsTab
      v-if="activeTab === 'transactions'"
      ref="transactionsTabRef"
      :accounts="accounts"
      :categories="categories"
      :total-available-liquidity="totalAvailableLiquidity"
      @open-excel-export="({ startDate, endDate }) => openExcelExportModal(startDate, endDate)"
      @open-payslip="(trxId) => openPayslipModal(trxId)"
      @open-receipt="(trxId) => openClientReceiptModal(trxId)"
      @open-edit="(trx) => openEditTransaction(trx)"
      @open-void="(trx) => openVoidModal(trx)"
      @open-attachment="(trx) => openAttachmentPreview(trx)"
    />

    <!-- ================= 2. تبويب الرواتب والمستحقات ================= -->
    <SalariesTab
      v-else-if="activeTab === 'salaries'"
      ref="salariesTabRef"
      :initial-sub-tab="compensationSubTab"
      @update:subtab="(sub) => switchCompensationSubTab(sub)"
      @open-salary-modal="(emp) => openSalaryModalForUser(emp)"
      @open-payslip="({ trxId, userId, month }) => openPayslipModal(trxId, userId, month)"
      @open-task-settlement="(fl) => openTaskSettlementModal(fl)"
      @open-commission-payout="(comm) => openCommissionPayoutModal(comm)"
      @open-commission-voucher="(commId) => openCommissionVoucherModal(commId)"
      @open-payroll-excel="({ month, summary }) => openPayrollExcelModal(month, summary)"
    />

    <!-- ================= 3. تبويب حسابات العملاء والقيمة الكلية (LTV) ================= -->
    <ClientsTab
      v-else-if="activeTab === 'clients'"
      ref="clientsTabRef"
      @open-income-modal="openIncomeModalForClient"
      @open-statement="openClientStatement"
      @open-receipt="(trxId) => openClientReceiptModal(trxId)"
    />

    <!-- ================= 4. تبويب الخزائن والمحافظ البنكية ================= -->
    <AccountsTab
      v-else-if="activeTab === 'accounts'"
      :accounts="accounts"
      @add-account="openAddAccountModal"
      @edit-account="openEditAccountModal"
    />

    <!-- ================= 5. تبويب الأرباح والتقارير المالية ================= -->
    <ReportsTab
      v-else-if="activeTab === 'reports'"
      ref="reportsTabRef"
      @open-excel-export="({ startDate, endDate }) => openExcelExportModal(startDate, endDate)"
    />

    <!-- ================= 6. تبويب الأقسام والتصنيفات ================= -->
    <CategoriesTab
      v-else-if="activeTab === 'categories'"
      :categories="categories"
      @add-category="openAddCategoryModal"
      @edit-category="openEditCategoryModal"
      @delete-category="deleteCategory"
    />

    <!-- ================= المودالات والنوافذ المنبثقة ================= -->
    <TransactionModal
      :show="showTransactionModal"
      :transaction="selectedTransaction"
      :default-type="transactionDefaultType"
      :accounts="accounts"
      :categories="categories"
      :users="users"
      :clients="clients"
      :prefilled-user="prefilledUser"
      :prefilled-client="prefilledClient"
      :prefilled-category="prefilledCategory"
      :prefilled-account="prefilledAccount"
      :prefilled-month="prefilledSalaryMonth"
      @close="closeTransactionModal"
      @saved="onTransactionSaved"
    />

    <VoidModal
      :show="showVoidModal"
      :transaction="selectedTransaction"
      @close="showVoidModal = false"
      @voided="onTransactionVoided"
    />

    <ClientStatementModal
      :show="showStatementModal"
      :client-id="selectedClientId"
      @close="showStatementModal = false"
    />

    <AccountModal
      :show="showAccountModal"
      :account="selectedAccount"
      @close="showAccountModal = false"
      @saved="onAccountSaved"
    />

    <CategoryModal
      :show="showCategoryModal"
      :category="selectedCategory"
      :default-type="categoryModalDefaultType"
      @close="showCategoryModal = false"
      @saved="onCategorySaved"
    />

    <!-- مودال سند وفاتورة صرف الراتب المعتمدة (PDF + واتساب) -->
    <SalaryPayslipModal
      :show="showPayslipModal"
      :transaction-id="selectedPayslipTrxId"
      :user-id="selectedPayslipUserId"
      :month="selectedPayslipMonth"
      @close="closePayslipModal"
    />

    <!-- مودال تسوية وصرف مستحقات المهام (بالتاسك) والسند المعتمد -->
    <TaskSettlementModal
      :show="showTaskSettlementModal"
      :user="selectedFreelancerForSettlement"
      :accounts="accounts"
      :view-transaction-id="selectedTaskVoucherTrxId"
      @close="showTaskSettlementModal = false; selectedTaskVoucherTrxId = null"
      @settled="onTasksSettled"
    />

    <!-- مودال صرف عمولات المبيعات والسند المعتمد -->
    <CommissionPayoutModal
      :show="showCommissionModal"
      :commission="selectedCommissionForPayout"
      :accounts="accounts"
      :view-commission-id="selectedCommissionVoucherId"
      @close="showCommissionModal = false; selectedCommissionVoucherId = null"
      @paid="onCommissionPaid"
    />

    <!-- مودال سند قبض إيراد العميل المعتمد (PDF + واتساب) -->
    <ClientReceiptModal
      :show="showClientReceiptModal"
      :transaction-id="selectedReceiptTrxId"
      @close="closeClientReceiptModal"
    />

    <!-- نافذة منبثقة لمعاينة المرفق وسكرين شوت التحويل باحترافية -->
    <AttachmentPreviewModal
      :show="showAttachmentModal"
      :transaction="selectedAttachmentTrx"
      @close="closeAttachmentPreview"
    />

    <!-- مودال تصدير ملف الإكسل المالي والأرباح للشركاء -->
    <ExportFinancialExcelModal
      :show="showExcelExportModal"
      :initial-start-date="exportModalStartDate"
      :initial-end-date="exportModalEndDate"
      @close="closeExcelExportModal"
    />

    <!-- مودال تصدير مسير الرواتب والمستحقات إلى Excel (المسددين فقط أو الكل) -->
    <ExportPayrollExcelModal
      :show="showPayrollExcelModal"
      :month="payrollExportMonth"
      :summary="payrollExportSummary"
      @close="showPayrollExcelModal = false"
    />
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/axios'
import { can } from '@/utils/permissions'
import alertService from '@/services/alertService'

import TransactionModal from '@/components/finance/TransactionModal.vue'
import VoidModal from '@/components/finance/VoidModal.vue'
import ClientStatementModal from '@/components/finance/ClientStatementModal.vue'
import AccountModal from '@/components/finance/AccountModal.vue'
import CategoryModal from '@/components/finance/CategoryModal.vue'
import SalaryPayslipModal from '@/components/finance/SalaryPayslipModal.vue'
import TaskSettlementModal from '@/components/finance/TaskSettlementModal.vue'
import CommissionPayoutModal from '@/components/finance/CommissionPayoutModal.vue'
import ClientReceiptModal from '@/components/finance/ClientReceiptModal.vue'
import AttachmentPreviewModal from '@/components/finance/AttachmentPreviewModal.vue'
import ExportFinancialExcelModal from '@/components/finance/ExportFinancialExcelModal.vue'
import ExportPayrollExcelModal from '@/components/finance/ExportPayrollExcelModal.vue'

// Lazy Loading للتبويبات المنفصلة لتسريع فتح الصفحة
const TransactionsTab = defineAsyncComponent(() => import('@/views/finance/tabs/TransactionsTab.vue'))
const SalariesTab = defineAsyncComponent(() => import('@/views/finance/tabs/SalariesTab.vue'))
const ClientsTab = defineAsyncComponent(() => import('@/views/finance/tabs/ClientsTab.vue'))
const AccountsTab = defineAsyncComponent(() => import('@/views/finance/tabs/AccountsTab.vue'))
const CategoriesTab = defineAsyncComponent(() => import('@/views/finance/tabs/CategoriesTab.vue'))
const ReportsTab = defineAsyncComponent(() => import('@/views/finance/tabs/ReportsTab.vue'))

const transactionsTabRef = ref(null)
const salariesTabRef = ref(null)
const clientsTabRef = ref(null)

const refreshTransactions = () => {
  if (transactionsTabRef.value?.fetchTransactions) {
    transactionsTabRef.value.fetchTransactions(1)
  }
}

const refreshSalaries = () => {
  if (salariesTabRef.value) {
    if (compensationSubTab.value === 'salaries') {
      salariesTabRef.value.fetchPayrollSheet?.()
    } else if (compensationSubTab.value === 'tasks') {
      salariesTabRef.value.fetchFreelancersSheet?.()
    } else if (compensationSubTab.value === 'commissions') {
      salariesTabRef.value.fetchCommissionsSheet?.()
    }
  }
}

const refreshClients = () => {
  if (clientsTabRef.value?.fetchClientsSummary) {
    clientsTabRef.value.fetchClientsSummary()
  }
}

const route = useRoute()
const router = useRouter()

// الثوابت وصلاحيات التبويبات
const VALID_TABS = ['transactions', 'salaries', 'clients', 'accounts', 'reports', 'categories']
const VALID_SUB_TABS = ['salaries', 'tasks', 'commissions']

const isTabAllowed = (tab) => {
  if (!VALID_TABS.includes(tab)) return false
  if (tab === 'salaries' && !can('finance.salaries')) return false
  if (tab === 'reports' && !can('finance.reports')) return false
  if (tab === 'categories' && !can('finance.categories')) return false
  return true
}

// استنتاج التبويب والفرع الأولي مع أولوية للرابط URL ثم التخزين المحلي
const resolveInitialTab = () => {
  const queryTab = route.query?.tab
  if (queryTab && isTabAllowed(queryTab)) {
    return queryTab
  }
  try {
    const savedTab = localStorage.getItem('oms_finance_active_tab')
    if (savedTab && isTabAllowed(savedTab)) {
      return savedTab
    }
  } catch (e) {
    console.error('Storage access error:', e)
  }
  return 'transactions'
}

const resolveInitialSubTab = () => {
  const querySubTab = route.query?.subtab
  if (querySubTab && VALID_SUB_TABS.includes(querySubTab)) {
    return querySubTab
  }
  try {
    const savedSubTab = localStorage.getItem('oms_finance_compensation_subtab')
    if (savedSubTab && VALID_SUB_TABS.includes(savedSubTab)) {
      return savedSubTab
    }
  } catch (e) {
    console.error('Storage access error:', e)
  }
  return 'salaries'
}

// التبويب النشط
const activeTab = ref(resolveInitialTab())

// بيانات المنظومة المشتركة
const accounts = ref([])
const categories = ref([])
const users = ref([])
const clients = ref([])
const prefilledClient = ref(null)

// نوع القسم الافتراضي لمودال إضافة قسم
const categoryModalDefaultType = ref('expense')

// دوال مساعدة لتواريخ محلية دقيقة وتجنب مشاكل الـ Timezone في toISOString()
const formatLocalDate = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDisplayDate = (d) => {
  if (!d) return '—'
  if (typeof d === 'string') {
    return d.split('T')[0]
  }
  if (d instanceof Date) {
    return formatLocalDate(d)
  }
  return String(d)
}

const formatLocalMonth = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const totalAvailableLiquidity = computed(() => {
  let total = 0
  accounts.value.forEach(acc => {
    if (acc.is_active !== false) {
      total += Number(acc.current_balance || acc.balance || 0)
    }
  })
  return total
})

// مسير الرواتب والمستحقات
const compensationSubTab = ref(resolveInitialSubTab()) // 'salaries' | 'tasks' | 'commissions'
const prefilledSalaryMonth = computed(() => salariesTabRef.value?.payrollMonth || formatLocalMonth())

// بيانات الفريلانسرز ومستحقات المهام
const showTaskSettlementModal = ref(false)
const selectedFreelancerForSettlement = ref(null)
const selectedTaskVoucherTrxId = ref(null)

// بيانات العمولات ومسؤولي المبيعات
const showCommissionModal = ref(false)
const selectedCommissionForPayout = ref(null)
const selectedCommissionVoucherId = ref(null)

// ريفرنس تبويب التقارير
const reportsTabRef = ref(null)

// النوافذ المنبثقة
const showTransactionModal = ref(false)
const transactionDefaultType = ref('expense')
const selectedTransaction = ref(null)
const prefilledUser = ref(null)
const prefilledCategory = ref(null)
const prefilledAccount = ref(null)

const showVoidModal = ref(false)
const showStatementModal = ref(false)
const selectedClientId = ref(null)

const showAccountModal = ref(false)
const selectedAccount = ref(null)

const showCategoryModal = ref(false)
const selectedCategory = ref(null)

// نافذة سند صرف الراتب الرسمي والفاتورة
const showPayslipModal = ref(false)
const selectedPayslipTrxId = ref(null)
const selectedPayslipUserId = ref(null)
const selectedPayslipMonth = ref(null)

const openPayslipModal = (trxId, userId = null, month = null) => {
  selectedPayslipTrxId.value = trxId
  selectedPayslipUserId.value = userId
  selectedPayslipMonth.value = month
  showPayslipModal.value = true
}

const closePayslipModal = () => {
  showPayslipModal.value = false
  selectedPayslipTrxId.value = null
  selectedPayslipUserId.value = null
  selectedPayslipMonth.value = null
}

// نافذة سند قبض إيراد العميل المعتمد (PDF + واتساب)
const showClientReceiptModal = ref(false)
const selectedReceiptTrxId = ref(null)

const openClientReceiptModal = (trxId) => {
  selectedReceiptTrxId.value = trxId
  showClientReceiptModal.value = true
}

const closeClientReceiptModal = () => {
  showClientReceiptModal.value = false
  selectedReceiptTrxId.value = null
}

// نافذة معاينة المرفقات وسكرين شوت التحويل باحترافية
const showAttachmentModal = ref(false)
const selectedAttachmentTrx = ref(null)

const openAttachmentPreview = (trx) => {
  selectedAttachmentTrx.value = trx
  showAttachmentModal.value = true
}

const closeAttachmentPreview = () => {
  showAttachmentModal.value = false
  selectedAttachmentTrx.value = null
}

// نافذة تصدير تقرير الأرباح والمصروفات والشركاء (Excel)
const showExcelExportModal = ref(false)
const exportModalStartDate = ref('')
const exportModalEndDate = ref('')

const openExcelExportModal = (startDate = null, endDate = null) => {
  exportModalStartDate.value = startDate || ''
  exportModalEndDate.value = endDate || ''
  showExcelExportModal.value = true
}

const closeExcelExportModal = () => {
  showExcelExportModal.value = false
  exportModalStartDate.value = ''
  exportModalEndDate.value = ''
}

// نافذة تصدير مسير الرواتب والمستحقات إلى Excel (المسددين أو الكل)
const showPayrollExcelModal = ref(false)
const payrollExportMonth = ref(formatLocalMonth())
const payrollExportSummary = ref({})

const openPayrollExcelModal = (month, summary) => {
  payrollExportMonth.value = month || salariesTabRef.value?.payrollMonth || formatLocalMonth()
  payrollExportSummary.value = summary || salariesTabRef.value?.payrollSheet?.summary || {}
  showPayrollExcelModal.value = true
}

// 1. جلب الحسابات والأقسام المشتركة
const fetchAccounts = async () => {
  try {
    const res = await api.get('/finance/accounts')
    accounts.value = res.data?.data?.accounts || []
  } catch (err) {
    console.error('Error fetching accounts:', err)
  }
}

// 3. جلب الأقسام
const fetchCategories = async () => {
  try {
    const res = await api.get('/finance/categories')
    categories.value = res.data?.data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

// 4. جلب العملاء والمستخدمين عند الحاجة فقط (Lazy Loading لتسريع تحميل الصفحة)
let usersClientsPromise = null
const fetchUsersAndClients = async () => {
  if (users.value.length > 0 && clients.value.length > 0) return
  if (usersClientsPromise) return usersClientsPromise

  usersClientsPromise = (async () => {
    try {
      const [usersRes, clientsRes] = await Promise.allSettled([
        api.get('/users', { params: { per_page: 150 } }),
        api.get('/clients', { params: { per_page: 150 } }),
      ])
      if (usersRes.status === 'fulfilled') {
        users.value = usersRes.value.data?.data || usersRes.value.data || []
      }
      if (clientsRes.status === 'fulfilled') {
        clients.value = clientsRes.value.data?.data || clientsRes.value.data || []
      }
    } catch (err) {
      console.error('Error fetching users/clients:', err)
    } finally {
      usersClientsPromise = null
    }
  })()

  return usersClientsPromise
}

const openTaskSettlementModal = (fl) => {
  selectedFreelancerForSettlement.value = fl
  selectedTaskVoucherTrxId.value = null
  showTaskSettlementModal.value = true
}

const openTaskVoucherModal = (trxId) => {
  selectedFreelancerForSettlement.value = null
  selectedTaskVoucherTrxId.value = trxId
  showTaskSettlementModal.value = true
}

const onTasksSettled = () => {
  salariesTabRef.value?.fetchFreelancersSheet?.()
  fetchAccounts()
  refreshTransactions()
  refreshReports()
  refreshClients()
}

const openCommissionPayoutModal = (comm) => {
  selectedCommissionForPayout.value = comm
  selectedCommissionVoucherId.value = null
  showCommissionModal.value = true
}

const openCommissionVoucherModal = (commId) => {
  selectedCommissionForPayout.value = null
  selectedCommissionVoucherId.value = commId
  showCommissionModal.value = true
}

const onCommissionPaid = () => {
  salariesTabRef.value?.fetchCommissionsSheet?.()
  fetchAccounts()
  refreshTransactions()
  refreshReports()
  refreshClients()
}

// تحديث بيانات تقرير الأرباح والخسائر
const refreshReports = () => {
  if (reportsTabRef.value?.fetchProfitAndLoss) {
    reportsTabRef.value.fetchProfitAndLoss()
  }
}

// مزامنة حالة التبويب مع رابط الصفحة والتخزين المحلي
const syncTabStateToUrl = () => {
  try {
    localStorage.setItem('oms_finance_active_tab', activeTab.value)
    if (activeTab.value === 'salaries') {
      localStorage.setItem('oms_finance_compensation_subtab', compensationSubTab.value)
    }

    const currentQuery = { ...route.query }
    const newQuery = { ...currentQuery, tab: activeTab.value }

    if (activeTab.value === 'salaries') {
      newQuery.subtab = compensationSubTab.value
    } else {
      delete newQuery.subtab
    }

    if (currentQuery.tab !== newQuery.tab || currentQuery.subtab !== newQuery.subtab) {
      router.replace({ query: newQuery }).catch(() => {})
    }
  } catch (e) {
    console.error('Failed to sync tab state to URL:', e)
  }
}

// آلية جلب ذكية حسب التبويب النشط فقط مع كاش محلي فوري (Lazy Loading & Smart Caching)
const loadActiveTabData = (force = false) => {
  if (activeTab.value === 'transactions') {
    if (force) refreshTransactions()
  } else if (activeTab.value === 'salaries') {
    if (force) refreshSalaries()
  } else if (activeTab.value === 'clients') {
    if (force) refreshClients()
  } else if (activeTab.value === 'reports') {
    if (force) refreshReports()
  } else if (activeTab.value === 'accounts') {
    if (force || accounts.value.length === 0) fetchAccounts()
  } else if (activeTab.value === 'categories') {
    if (force || categories.value.length === 0) fetchCategories()
  }
}

// التنقل فائق السرعة بين التبويبات الرئيسية دون إبطاء
let isInternalTabSwitch = false

const switchTab = (tab) => {
  if (!isTabAllowed(tab)) return
  if (activeTab.value === tab) return

  activeTab.value = tab
  isInternalTabSwitch = true
  syncTabStateToUrl()

  loadActiveTabData(false)

  setTimeout(() => {
    isInternalTabSwitch = false
  }, 120)
}

// التنقل بين التبويبات الفرعية للرواتب والمستحقات
const switchCompensationSubTab = (subTab) => {
  if (!VALID_SUB_TABS.includes(subTab)) return
  if (compensationSubTab.value === subTab) return

  compensationSubTab.value = subTab
  isInternalTabSwitch = true
  syncTabStateToUrl()

  if (salariesTabRef.value) {
    if (subTab === 'salaries') salariesTabRef.value.fetchPayrollSheet?.()
    else if (subTab === 'tasks') salariesTabRef.value.fetchFreelancersSheet?.()
    else if (subTab === 'commissions') salariesTabRef.value.fetchCommissionsSheet?.()
  }

  setTimeout(() => {
    isInternalTabSwitch = false
  }, 120)
}

// فتح وإغلاق المودالات
const closeTransactionModal = () => {
  showTransactionModal.value = false
  prefilledUser.value = null
  prefilledClient.value = null
  prefilledCategory.value = null
  prefilledAccount.value = null
}

const openTransactionModal = (type = 'expense') => {
  fetchUsersAndClients()
  selectedTransaction.value = null
  transactionDefaultType.value = type
  prefilledUser.value = null
  prefilledClient.value = null
  prefilledCategory.value = null
  prefilledAccount.value = null
  showTransactionModal.value = true
}

const openQuickPettyCashModal = () => {
  selectedTransaction.value = null
  transactionDefaultType.value = 'expense'
  prefilledUser.value = null
  prefilledClient.value = null
  prefilledCategory.value = null
  prefilledAccount.value = null
  showTransactionModal.value = true
}

const openIncomeModalForClient = (client) => {
  fetchUsersAndClients()
  selectedTransaction.value = null
  transactionDefaultType.value = 'income'
  prefilledUser.value = null

  // تحديد تصنيف إيرادات العقود الشهرية المستمرة افتراضياً عند قبض دفعة العميل
  const retainerCat = categories.value.find(c =>
    c.type === 'income' &&
    (c.slug === 'client_monthly_retainers' || (c.name || '').includes('عقود') || (c.name || '').toLowerCase().includes('retainer'))
  )
  prefilledCategory.value = retainerCat ? retainerCat.id : null
  prefilledAccount.value = null
  prefilledClient.value = { id: client.client_id, name: client.client_name }
  showTransactionModal.value = true
}

const openEditTransaction = (trx) => {
  fetchUsersAndClients()
  prefilledUser.value = null
  prefilledClient.value = null
  prefilledCategory.value = null
  prefilledAccount.value = null
  selectedTransaction.value = trx
  showTransactionModal.value = true
}

const openVoidModal = (trx) => {
  selectedTransaction.value = trx
  showVoidModal.value = true
}

const openSalaryModalForUser = (emp) => {
  const currentMonth = salariesTabRef.value?.payrollMonth || formatLocalMonth()
  if (emp.is_paid) {
    alertService.toast(`⚠️ تم بالفعل صرف راتب شهر (${currentMonth}) للموظف (${emp.user_name || emp.name}) مسبقاً!`, 'warning')
    return
  }
  fetchUsersAndClients()
  selectedTransaction.value = null
  transactionDefaultType.value = 'expense'
  prefilledUser.value = { id: emp.user_id, name: emp.user_name || emp.name, salary: emp.base_salary }
  prefilledClient.value = null

  // 1. تحديد قسم الرواتب والأجور بصورة افتراضية
  const salCat = categories.value.find(c =>
    c.slug === 'salaries' || (c.name || '').includes('رواتب') || (c.name || '').includes('أجور')
  )
  prefilledCategory.value = salCat || null

  // 2. تحديد الحساب البنكي بصورة افتراضية
  const bankAcc = accounts.value.find(a =>
    a.is_active !== false &&
    ((a.type?.value || a.type) === 'bank' || (a.name || '').includes('بنك') || (a.name || '').toLowerCase().includes('bank'))
  )
  prefilledAccount.value = bankAcc || null

  showTransactionModal.value = true
}

const openClientStatement = (clientId) => {
  selectedClientId.value = clientId
  showStatementModal.value = true
}

const openAddAccountModal = () => {
  selectedAccount.value = null
  showAccountModal.value = true
}

const openEditAccountModal = (acc) => {
  selectedAccount.value = acc
  showAccountModal.value = true
}

const openAddCategoryModal = (type = 'expense') => {
  selectedCategory.value = null
  categoryModalDefaultType.value = type === 'income' ? 'income' : 'expense'
  showCategoryModal.value = true
}

const openEditCategoryModal = (cat) => {
  selectedCategory.value = cat
  showCategoryModal.value = true
}

const deleteCategory = async (cat) => {
  if (cat.is_system) {
    alertService.toast('⚠️ لا يمكن حذف الأقسام الأساسية للنظام', 'warning')
    return
  }

  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف القسم',
    message: `هل أنت متأكد من حذف قسم "${cat.name}"؟`,
    type: 'danger',
    confirmText: 'نعم، احذف',
  })

  if (!confirmed) return

  try {
    await api.delete(`/finance/categories/${cat.id}`)
    alertService.toast('✅ تم حذف القسم بنجاح', 'success')
    fetchCategories()
  } catch (err) {
    const msg = err.response?.data?.message || 'حدث خطأ أثناء حذف القسم'
    alertService.toast(`❌ ${msg}`, 'error')
  }
}

// معالجات الحفظ
const onTransactionSaved = (savedTrx) => {
  refreshTransactions()
  fetchAccounts()
  refreshReports()
  refreshClients()
  if (activeTab.value === 'salaries') {
    refreshSalaries()
  } else {
    salariesTabRef.value?.fetchFreelancersSheet?.()
    salariesTabRef.value?.fetchCommissionsSheet?.()
  }

  // 1. إذا كانت المعاملة المحفوظة خاصة بمصروف راتب موظف (وليس إيراد عميل)
  if (savedTrx && savedTrx.type === 'expense' && (savedTrx.salary_month || savedTrx.category?.slug === 'salaries')) {
    setTimeout(async () => {
      const wantPayslip = await alertService.confirm({
        title: 'تم تسجيل وصرف الراتب بنجاح! 💵✨',
        message: `تم قيد عملية الصرف بالدفاتر برقم سند [${savedTrx.transaction_number || ''}].\nهل ترغب في فتح الفاتورة الرسمية وسند الصرف المعتمد (PDF) الآن؟`,
        confirmText: 'عرض سند الصرف والفاتورة 🧾',
        cancelText: 'إغلاق',
        type: 'success',
      })
      if (wantPayslip) {
        openPayslipModal(savedTrx.id)
      }
    }, 350)
  } else if (savedTrx && savedTrx.type === 'income') {
    // 2. إذا كانت المعاملة المحفوظة خاصة بقبض إيراد (عميل / دفعة)
    setTimeout(async () => {
      const clientName = savedTrx.beneficiary_name || savedTrx.entity?.name || 'العميل'
      const wantReceipt = await alertService.confirm({
        title: 'تم تسجيل وقبض الإيراد بنجاح! 📥✨',
        message: `تم قيد عملية القبض بحساب [${clientName}] بالدفاتر برقم سند [${savedTrx.transaction_number || ''}].\nهل ترغب في فتح سند وإيصال القبض المعتمد للعميل (PDF) الآن؟`,
        confirmText: 'عرض سند القبض المعتمد 🧾',
        cancelText: 'إغلاق',
        type: 'success',
      })
      if (wantReceipt) {
        openClientReceiptModal(savedTrx.id)
      }
    }, 350)
  }
}

const onTransactionVoided = () => {
  refreshTransactions()
  fetchAccounts()
  refreshReports()
  refreshClients()
  if (activeTab.value === 'salaries') {
    refreshSalaries()
  }
  salariesTabRef.value?.fetchFreelancersSheet?.()
  salariesTabRef.value?.fetchCommissionsSheet?.()
}

const onAccountSaved = () => {
  fetchAccounts()
}

const onCategorySaved = () => {
  fetchCategories()
}

onMounted(() => {
  // 1. مزامنة الرابط لضمان بقاء المستخدم في نفس التبويب عند الريفريش
  syncTabStateToUrl()

  // 2. جلب الحسابات والأقسام بشكل فوري كبيانات أساسية مشتركة وخفيفة جداً
  fetchAccounts()
  fetchCategories()

  // 3. جلب بيانات التبويب النشط فقط دون إغراق المتصفح بطلبات متوازية غير مطلوبة
  loadActiveTabData(true)
})

// مراقبة التنقل عبر أزرار المتصفح (رجوع / تقدم) دون تكرار للطلبات
watch(
  () => [route.query?.tab, route.query?.subtab],
  ([newTab, newSubTab]) => {
    if (isInternalTabSwitch) return

    if (newTab && isTabAllowed(newTab) && newTab !== activeTab.value) {
      activeTab.value = newTab
      try { localStorage.setItem('oms_finance_active_tab', newTab) } catch (e) {}

      if (newTab === 'salaries') {
        if (newSubTab && VALID_SUB_TABS.includes(newSubTab)) {
          compensationSubTab.value = newSubTab
          try { localStorage.setItem('oms_finance_compensation_subtab', newSubTab) } catch (e) {}
        }
      }
      loadActiveTabData(false)
    } else if (activeTab.value === 'salaries' && newSubTab && VALID_SUB_TABS.includes(newSubTab) && newSubTab !== compensationSubTab.value) {
      compensationSubTab.value = newSubTab
      try { localStorage.setItem('oms_finance_compensation_subtab', newSubTab) } catch (e) {}
      loadActiveTabData(false)
    }
  }
)
</script>

<style scoped>
.finance-page {
  padding: 24px;
  max-width: 1500px;
  margin: 0 auto;
  color: #f1f5f9;
}

.page-topline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.page-topline h2 {
  font-size: 26px;
  font-weight: 800;
  margin: 4px 0 6px;
  color: #ffffff;
}

.page-topline p {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
  max-width: 650px;
}

.topline-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.primary-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-income {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-expense {
  background: linear-gradient(135deg, #f43f5e, #e11d48);
  box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3);
}

.btn-quick-expense {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fbbf24;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.finance-tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.15);
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.tab-nav-btn {
  padding: 10px 18px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-nav-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.04);
}

.tab-nav-btn.active {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-weight: 800;
}



@media (max-width: 640px) {
  .finance-page {
    padding: 14px 10px;
  }
  .page-topline {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }
  .page-topline h2 {
    font-size: 20px;
  }
  .topline-actions {
    flex-direction: column;
    width: 100%;
  }
  .topline-actions .primary-btn,
  .topline-actions .secondary-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
