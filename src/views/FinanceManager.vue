<template>
  <section class="finance-page" dir="rtl">
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

    <TransactionsTab
      v-if="activeTab === 'transactions'"
      ref="transactionsTabRef"
      :accounts="accounts"
      :categories="categories"
      :total-available-liquidity="totalAvailableLiquidity"
      @open-excel-export="({ startDate, endDate }) => openExcelExportModal(startDate, endDate)"
      @open-payslip="(trxId) => openPayslipModal(trxId)"
      @open-receipt="(trxId) => openClientReceiptModal(trxId)"
      @open-edit="openEditTransaction"
      @open-void="openVoidModal"
      @open-attachment="openAttachmentPreview"
    />

    <SalariesTab
      v-else-if="activeTab === 'salaries'"
      ref="salariesTabRef"
      :initial-sub-tab="compensationSubTab"
      @update:subtab="switchCompensationSubTab"
      @open-salary-modal="openSalaryModalForUser"
      @open-payslip="({ trxId, userId, month }) => openPayslipModal(trxId, userId, month)"
      @open-task-settlement="openTaskSettlementModal"
      @open-commission-payout="openCommissionPayoutModal"
      @open-commission-voucher="openCommissionVoucherModal"
      @open-payroll-excel="({ month, summary }) => openPayrollExcelModal(month, summary)"
    />

    <ClientsTab
      v-else-if="activeTab === 'clients'"
      ref="clientsTabRef"
      @open-income-modal="openIncomeModalForClient"
      @open-statement="openClientStatement"
      @open-receipt="openClientReceiptModal"
    />

    <AccountsTab
      v-else-if="activeTab === 'accounts'"
      :accounts="accounts"
      @add-account="openAddAccountModal"
      @edit-account="openEditAccountModal"
    />

    <ReportsTab
      v-else-if="activeTab === 'reports'"
      ref="reportsTabRef"
      @open-excel-export="({ startDate, endDate }) => openExcelExportModal(startDate, endDate)"
    />

    <CategoriesTab
      v-else-if="activeTab === 'categories'"
      :categories="categories"
      @add-category="openAddCategoryModal"
      @edit-category="openEditCategoryModal"
      @delete-category="deleteCategory"
    />

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

    <SalaryPayslipModal
      :show="showPayslipModal"
      :transaction-id="selectedPayslipTrxId"
      :user-id="selectedPayslipUserId"
      :month="selectedPayslipMonth"
      @close="closePayslipModal"
    />

    <TaskSettlementModal
      :show="showTaskSettlementModal"
      :user="selectedFreelancerForSettlement"
      :accounts="accounts"
      :view-transaction-id="selectedTaskVoucherTrxId"
      @close="showTaskSettlementModal = false; selectedTaskVoucherTrxId = null"
      @settled="onTasksSettled"
    />

    <CommissionPayoutModal
      :show="showCommissionModal"
      :commission="selectedCommissionForPayout"
      :accounts="accounts"
      :view-commission-id="selectedCommissionVoucherId"
      @close="showCommissionModal = false; selectedCommissionVoucherId = null"
      @paid="onCommissionPaid"
    />

    <ClientReceiptModal
      :show="showClientReceiptModal"
      :transaction-id="selectedReceiptTrxId"
      @close="closeClientReceiptModal"
    />

    <AttachmentPreviewModal
      :show="showAttachmentModal"
      :transaction="selectedAttachmentTrx"
      @close="closeAttachmentPreview"
    />

    <ExportFinancialExcelModal
      :show="showExcelExportModal"
      :initial-start-date="exportModalStartDate"
      :initial-end-date="exportModalEndDate"
      @close="closeExcelExportModal"
    />

    <ExportPayrollExcelModal
      :show="showPayrollExcelModal"
      :month="payrollExportMonth"
      :summary="payrollExportSummary"
      @close="showPayrollExcelModal = false"
    />
  </section>
</template>

<script setup>
import { defineAsyncComponent, onMounted } from 'vue'
import { can } from '@/utils/permissions'
import { useFinanceManager } from '@/modules/finance/composables/useFinanceManager'

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

const TransactionsTab = defineAsyncComponent(() => import('@/views/finance/tabs/TransactionsTab.vue'))
const SalariesTab = defineAsyncComponent(() => import('@/views/finance/tabs/SalariesTab.vue'))
const ClientsTab = defineAsyncComponent(() => import('@/views/finance/tabs/ClientsTab.vue'))
const AccountsTab = defineAsyncComponent(() => import('@/views/finance/tabs/AccountsTab.vue'))
const CategoriesTab = defineAsyncComponent(() => import('@/views/finance/tabs/CategoriesTab.vue'))
const ReportsTab = defineAsyncComponent(() => import('@/views/finance/tabs/ReportsTab.vue'))

const {
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
} = useFinanceManager()

onMounted(initFinanceManager)
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
