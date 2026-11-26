import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/axios'
import { can } from '@/utils/permissions'
import alertService from '@/services/alertService'
import { formatLocalMonth } from '../utils/financeHelpers'

const VALID_TABS = ['transactions', 'salaries', 'clients', 'accounts', 'reports', 'categories']
const VALID_SUB_TABS = ['salaries', 'tasks', 'commissions']

const readSavedPref = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSavedPref = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore storage quota / private mode
  }
}

/**
 * Central orchestrator composable for FinanceManager view:
 * manages tab/URL/preference sync, shared accounts/categories/entities loading,
 * liquidity calculation, and all modal states + cross-tab refresh handlers.
 */
export function useFinanceManager() {
  const route = useRoute()
  const router = useRouter()

  const transactionsTabRef = ref(null)
  const salariesTabRef = ref(null)
  const clientsTabRef = ref(null)
  const reportsTabRef = ref(null)

  const isTabAllowed = (tab) => {
    if (!VALID_TABS.includes(tab)) return false
    if (tab === 'salaries' && !can('finance.salaries')) return false
    if (tab === 'reports' && !can('finance.reports')) return false
    if (tab === 'categories' && !can('finance.categories')) return false
    return true
  }

  const resolveInitialTab = () => {
    const queryTab = route.query?.tab
    if (queryTab && isTabAllowed(queryTab)) return queryTab
    const savedTab = readSavedPref('oms_finance_active_tab')
    return savedTab && isTabAllowed(savedTab) ? savedTab : 'transactions'
  }

  const resolveInitialSubTab = () => {
    const querySubTab = route.query?.subtab
    if (querySubTab && VALID_SUB_TABS.includes(querySubTab)) return querySubTab
    const savedSubTab = readSavedPref('oms_finance_compensation_subtab')
    return savedSubTab && VALID_SUB_TABS.includes(savedSubTab) ? savedSubTab : 'salaries'
  }

  const activeTab = ref(resolveInitialTab())
  const compensationSubTab = ref(resolveInitialSubTab())

  const accounts = ref([])
  const categories = ref([])
  const users = ref([])
  const clients = ref([])

  const categoryModalDefaultType = ref('expense')

  const showTaskSettlementModal = ref(false)
  const selectedFreelancerForSettlement = ref(null)
  const selectedTaskVoucherTrxId = ref(null)

  const showCommissionModal = ref(false)
  const selectedCommissionForPayout = ref(null)
  const selectedCommissionVoucherId = ref(null)

  const showTransactionModal = ref(false)
  const transactionDefaultType = ref('expense')
  const selectedTransaction = ref(null)
  const prefilledUser = ref(null)
  const prefilledClient = ref(null)
  const prefilledCategory = ref(null)
  const prefilledAccount = ref(null)

  const showVoidModal = ref(false)
  const showStatementModal = ref(false)
  const selectedClientId = ref(null)

  const showAccountModal = ref(false)
  const selectedAccount = ref(null)

  const showCategoryModal = ref(false)
  const selectedCategory = ref(null)

  const showPayslipModal = ref(false)
  const selectedPayslipTrxId = ref(null)
  const selectedPayslipUserId = ref(null)
  const selectedPayslipMonth = ref(null)

  const showClientReceiptModal = ref(false)
  const selectedReceiptTrxId = ref(null)

  const showAttachmentModal = ref(false)
  const selectedAttachmentTrx = ref(null)

  const showExcelExportModal = ref(false)
  const exportModalStartDate = ref('')
  const exportModalEndDate = ref('')

  const showPayrollExcelModal = ref(false)
  const payrollExportMonth = ref(formatLocalMonth())
  const payrollExportSummary = ref({})

  const prefilledSalaryMonth = computed(
    () => salariesTabRef.value?.payrollMonth || formatLocalMonth(),
  )

  const totalAvailableLiquidity = computed(() =>
    accounts.value.reduce((total, acc) => {
      if (acc.is_active === false) return total
      return total + Number(acc.current_balance || acc.balance || 0)
    }, 0),
  )

  const refreshTransactions = () => {
    transactionsTabRef.value?.fetchTransactions?.(1)
  }

  const refreshSalaries = () => {
    if (!salariesTabRef.value) return
    if (compensationSubTab.value === 'salaries') salariesTabRef.value.fetchPayrollSheet?.()
    else if (compensationSubTab.value === 'tasks') salariesTabRef.value.fetchFreelancersSheet?.()
    else if (compensationSubTab.value === 'commissions') salariesTabRef.value.fetchCommissionsSheet?.()
  }

  const refreshClients = () => {
    clientsTabRef.value?.fetchClientsSummary?.()
  }

  const refreshReports = () => {
    reportsTabRef.value?.fetchProfitAndLoss?.()
  }

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/finance/accounts')
      accounts.value = res.data?.data?.accounts || []
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/finance/categories')
      categories.value = res.data?.data || []
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  let usersClientsPromise = null
  const fetchUsersAndClients = async () => {
    if (users.value.length > 0 && clients.value.length > 0) return
    if (usersClientsPromise) return usersClientsPromise

    usersClientsPromise = (async () => {
      try {
        const [usersRes, clientsRes] = await Promise.allSettled([
          api.get('/users/options', { params: { with_salary: 1 } }),
          api.get('/clients/options'),
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

  const syncTabStateToUrl = () => {
    try {
      writeSavedPref('oms_finance_active_tab', activeTab.value)
      if (activeTab.value === 'salaries') {
        writeSavedPref('oms_finance_compensation_subtab', compensationSubTab.value)
      }
      const currentQuery = { ...route.query }
      const newQuery = { ...currentQuery, tab: activeTab.value }
      if (activeTab.value === 'salaries') newQuery.subtab = compensationSubTab.value
      else delete newQuery.subtab

      if (currentQuery.tab !== newQuery.tab || currentQuery.subtab !== newQuery.subtab) {
        router.replace({ query: newQuery }).catch(() => {})
      }
    } catch (err) {
      console.error('Failed to sync tab state to URL:', err)
    }
  }

  const loadActiveTabData = (force = false) => {
    if (activeTab.value === 'transactions' && force) refreshTransactions()
    else if (activeTab.value === 'salaries' && force) refreshSalaries()
    else if (activeTab.value === 'clients' && force) refreshClients()
    else if (activeTab.value === 'reports' && force) refreshReports()
    else if (activeTab.value === 'accounts' && (force || accounts.value.length === 0)) fetchAccounts()
    else if (activeTab.value === 'categories' && (force || categories.value.length === 0)) fetchCategories()
  }

  let isInternalTabSwitch = false
  const switchTab = (tab) => {
    if (!isTabAllowed(tab) || activeTab.value === tab) return
    activeTab.value = tab
    isInternalTabSwitch = true
    syncTabStateToUrl()
    loadActiveTabData(false)
    setTimeout(() => {
      isInternalTabSwitch = false
    }, 120)
  }

  const switchCompensationSubTab = (subTab) => {
    if (!VALID_SUB_TABS.includes(subTab) || compensationSubTab.value === subTab) return
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

  const openClientReceiptModal = (trxId) => {
    selectedReceiptTrxId.value = trxId
    showClientReceiptModal.value = true
  }

  const closeClientReceiptModal = () => {
    showClientReceiptModal.value = false
    selectedReceiptTrxId.value = null
  }

  const openAttachmentPreview = (trx) => {
    selectedAttachmentTrx.value = trx
    showAttachmentModal.value = true
  }

  const closeAttachmentPreview = () => {
    showAttachmentModal.value = false
    selectedAttachmentTrx.value = null
  }

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

  const openPayrollExcelModal = (month, summary) => {
    payrollExportMonth.value = month || salariesTabRef.value?.payrollMonth || formatLocalMonth()
    payrollExportSummary.value = summary || salariesTabRef.value?.payrollSheet?.summary || {}
    showPayrollExcelModal.value = true
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

  const resetTransactionPrefills = () => {
    prefilledUser.value = null
    prefilledClient.value = null
    prefilledCategory.value = null
    prefilledAccount.value = null
  }

  const closeTransactionModal = () => {
    showTransactionModal.value = false
    resetTransactionPrefills()
  }

  const openTransactionModal = (type = 'expense') => {
    fetchUsersAndClients()
    selectedTransaction.value = null
    transactionDefaultType.value = type
    resetTransactionPrefills()
    showTransactionModal.value = true
  }

  const openQuickPettyCashModal = () => {
    selectedTransaction.value = null
    transactionDefaultType.value = 'expense'
    resetTransactionPrefills()
    showTransactionModal.value = true
  }

  const openIncomeModalForClient = (client) => {
    fetchUsersAndClients()
    selectedTransaction.value = null
    transactionDefaultType.value = 'income'
    resetTransactionPrefills()
    const retainerCat = categories.value.find(
      (c) =>
        c.type === 'income' &&
        (c.slug === 'client_monthly_retainers' ||
          (c.name || '').includes('عقود') ||
          (c.name || '').toLowerCase().includes('retainer')),
    )
    prefilledCategory.value = retainerCat ? retainerCat.id : null
    prefilledClient.value = { id: client.client_id, name: client.client_name }
    showTransactionModal.value = true
  }

  const openEditTransaction = (trx) => {
    fetchUsersAndClients()
    resetTransactionPrefills()
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
      alertService.toast(
        `⚠️ تم بالفعل صرف راتب شهر (${currentMonth}) للموظف (${emp.user_name || emp.name}) مسبقاً!`,
        'warning',
      )
      return
    }
    fetchUsersAndClients()
    selectedTransaction.value = null
    transactionDefaultType.value = 'expense'
    resetTransactionPrefills()
    prefilledUser.value = { id: emp.user_id, name: emp.user_name || emp.name, salary: emp.base_salary }

    const salCat = categories.value.find(
      (c) => c.slug === 'salaries' || (c.name || '').includes('رواتب') || (c.name || '').includes('أجور'),
    )
    prefilledCategory.value = salCat || null

    const bankAcc = accounts.value.find(
      (a) =>
        a.is_active !== false &&
        ((a.type?.value || a.type) === 'bank' ||
          (a.name || '').includes('بنك') ||
          (a.name || '').toLowerCase().includes('bank')),
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
      alertService.toast(`❌ ${err.response?.data?.message || 'حدث خطأ أثناء حذف القسم'}`, 'error')
    }
  }

  const refreshAllBalancesAndLedger = () => {
    fetchAccounts()
    refreshTransactions()
    refreshReports()
    refreshClients()
  }

  const onTasksSettled = () => {
    salariesTabRef.value?.fetchFreelancersSheet?.()
    refreshAllBalancesAndLedger()
  }

  const onCommissionPaid = () => {
    salariesTabRef.value?.fetchCommissionsSheet?.()
    refreshAllBalancesAndLedger()
  }

  const onTransactionSaved = (savedTrx) => {
    refreshAllBalancesAndLedger()
    if (activeTab.value === 'salaries') {
      refreshSalaries()
    } else {
      salariesTabRef.value?.fetchFreelancersSheet?.()
      salariesTabRef.value?.fetchCommissionsSheet?.()
    }

    if (savedTrx && savedTrx.type === 'expense' && (savedTrx.salary_month || savedTrx.category?.slug === 'salaries')) {
      setTimeout(async () => {
        const wantPayslip = await alertService.confirm({
          title: 'تم تسجيل وصرف الراتب بنجاح! 💵✨',
          message: `تم قيد عملية الصرف بالدفاتر برقم سند [${savedTrx.transaction_number || ''}].\nهل ترغب في فتح الفاتورة الرسمية وسند الصرف المعتمد (PDF) الآن؟`,
          confirmText: 'عرض سند الصرف والفاتورة 🧾',
          cancelText: 'إغلاق',
          type: 'success',
        })
        if (wantPayslip) openPayslipModal(savedTrx.id)
      }, 350)
    } else if (savedTrx && savedTrx.type === 'income') {
      setTimeout(async () => {
        const clientName = savedTrx.beneficiary_name || savedTrx.entity?.name || 'العميل'
        const wantReceipt = await alertService.confirm({
          title: 'تم تسجيل وقبض الإيراد بنجاح! 📥✨',
          message: `تم قيد عملية القبض بحساب [${clientName}] بالدفاتر برقم سند [${savedTrx.transaction_number || ''}].\nهل ترغب في فتح سند وإيصال القبض المعتمد للعميل (PDF) الآن؟`,
          confirmText: 'عرض سند القبض المعتمد 🧾',
          cancelText: 'إغلاق',
          type: 'success',
        })
        if (wantReceipt) openClientReceiptModal(savedTrx.id)
      }, 350)
    }
  }

  const onTransactionVoided = () => {
    refreshAllBalancesAndLedger()
    if (activeTab.value === 'salaries') refreshSalaries()
    salariesTabRef.value?.fetchFreelancersSheet?.()
    salariesTabRef.value?.fetchCommissionsSheet?.()
  }

  const onAccountSaved = () => fetchAccounts()
  const onCategorySaved = () => fetchCategories()

  const initFinanceManager = () => {
    syncTabStateToUrl()
    fetchAccounts()
    fetchCategories()
    loadActiveTabData(true)
  }

  watch(
    () => [route.query?.tab, route.query?.subtab],
    ([newTab, newSubTab]) => {
      if (isInternalTabSwitch) return
      if (newTab && isTabAllowed(newTab) && newTab !== activeTab.value) {
        activeTab.value = newTab
        writeSavedPref('oms_finance_active_tab', newTab)
        if (newTab === 'salaries' && newSubTab && VALID_SUB_TABS.includes(newSubTab)) {
          compensationSubTab.value = newSubTab
          writeSavedPref('oms_finance_compensation_subtab', newSubTab)
        }
        loadActiveTabData(false)
      } else if (
        activeTab.value === 'salaries' &&
        newSubTab &&
        VALID_SUB_TABS.includes(newSubTab) &&
        newSubTab !== compensationSubTab.value
      ) {
        compensationSubTab.value = newSubTab
        writeSavedPref('oms_finance_compensation_subtab', newSubTab)
        loadActiveTabData(false)
      }
    },
  )

  return {
    transactionsTabRef,
    salariesTabRef,
    clientsTabRef,
    reportsTabRef,
    activeTab,
    compensationSubTab,
    accounts,
    categories,
    users,
    clients,
    categoryModalDefaultType,
    totalAvailableLiquidity,
    prefilledSalaryMonth,
    showTaskSettlementModal,
    selectedFreelancerForSettlement,
    selectedTaskVoucherTrxId,
    showCommissionModal,
    selectedCommissionForPayout,
    selectedCommissionVoucherId,
    showTransactionModal,
    transactionDefaultType,
    selectedTransaction,
    prefilledUser,
    prefilledClient,
    prefilledCategory,
    prefilledAccount,
    showVoidModal,
    showStatementModal,
    selectedClientId,
    showAccountModal,
    selectedAccount,
    showCategoryModal,
    selectedCategory,
    showPayslipModal,
    selectedPayslipTrxId,
    selectedPayslipUserId,
    selectedPayslipMonth,
    showClientReceiptModal,
    selectedReceiptTrxId,
    showAttachmentModal,
    selectedAttachmentTrx,
    showExcelExportModal,
    exportModalStartDate,
    exportModalEndDate,
    showPayrollExcelModal,
    payrollExportMonth,
    payrollExportSummary,
    switchTab,
    switchCompensationSubTab,
    openTransactionModal,
    openQuickPettyCashModal,
    closeTransactionModal,
    openIncomeModalForClient,
    openEditTransaction,
    openVoidModal,
    openSalaryModalForUser,
    openClientStatement,
    openAddAccountModal,
    openEditAccountModal,
    openAddCategoryModal,
    openEditCategoryModal,
    deleteCategory,
    openTaskSettlementModal,
    openTaskVoucherModal,
    openCommissionPayoutModal,
    openCommissionVoucherModal,
    openPayslipModal,
    closePayslipModal,
    openClientReceiptModal,
    closeClientReceiptModal,
    openAttachmentPreview,
    closeAttachmentPreview,
    openExcelExportModal,
    closeExcelExportModal,
    openPayrollExcelModal,
    onTransactionSaved,
    onTransactionVoided,
    onTasksSettled,
    onCommissionPaid,
    onAccountSaved,
    onCategorySaved,
    initFinanceManager,
  }
}
