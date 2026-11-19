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
    <div v-if="activeTab === 'transactions'" class="tab-content-pane">
      <!-- شريط المؤشرات المالية السريعة للنتائج المفلترة -->
      <div class="summary-strip">
        <div class="summary-card-item">
          <span class="summary-icon green">📈</span>
          <div>
            <small>إجمالي الإيرادات (المفلترة)</small>
            <strong>{{ Number(transactionsSummary.total_income || 0).toLocaleString() }} <small>ج.م</small></strong>
          </div>
        </div>

        <div class="summary-card-item">
          <span class="summary-icon red">📉</span>
          <div>
            <small>إجمالي المصروفات (المفلترة)</small>
            <strong>{{ Number(transactionsSummary.total_expense || 0).toLocaleString() }} <small>ج.م</small></strong>
          </div>
        </div>

        <div class="summary-card-item">
          <span class="summary-icon cyan">💎</span>
          <div>
            <small>صافي حركة المعاملات</small>
            <strong :class="Number(transactionsSummary.net_profit || 0) >= 0 ? 'text-income' : 'text-expense'">
              {{ Number(transactionsSummary.net_profit || 0).toLocaleString() }} <small>ج.م</small>
            </strong>
          </div>
        </div>

        <div class="summary-card-item">
          <span class="summary-icon gold">🏦</span>
          <div>
            <small>{{ transactionsSummary.selected_account_name ? `رصيد (${transactionsSummary.selected_account_name})` : 'إجمالي السيولة المتاحة بالخزائن' }}</small>
            <strong>{{ Number(transactionsSummary.liquidity || totalAvailableLiquidity || 0).toLocaleString() }} <small>ج.م</small></strong>
          </div>
        </div>
      </div>

      <!-- شريط أدوات البحث والتصفية -->
      <div class="filter-card">
        <div class="filter-grid">
          <!-- البحث النصي -->
          <div class="filter-item search-item">
            <span class="search-icon">🔍</span>
            <input
              v-model="filters.search"
              type="text"
              class="filter-input search-input"
              placeholder="بحث برقم المعاملة، البيان، المستفيد، الملاحظات..."
              @input="debounceFetchTransactions"
            />
          </div>

          <!-- نوع المعاملة -->
          <div class="filter-item">
            <select v-model="filters.type" class="filter-select" @change="onFilterChange">
              <option value="">كل المعاملات (إيراد + مصروف)</option>
              <option value="income">إيرادات ومقبوضات فقط</option>
              <option value="expense">مصروفات ومدفوعات فقط</option>
            </select>
          </div>

          <!-- القسم -->
          <div class="filter-item">
            <select v-model="filters.category_id" class="filter-select" @change="onFilterChange">
              <option value="">جميع الأقسام والتصنيفات</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- الخزينة / الحساب -->
          <div class="filter-item">
            <select v-model="filters.account_id" class="filter-select" @change="onFilterChange">
              <option value="">جميع الخزائن والحسابات</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.name }}
              </option>
            </select>
          </div>

          <!-- من تاريخ -->
          <div class="filter-item date-item">
            <input
              v-model="filters.start_date"
              type="date"
              class="filter-input"
              title="من تاريخ"
              @change="onFilterChange"
            />
          </div>

          <!-- إلى تاريخ -->
          <div class="filter-item date-item">
            <input
              v-model="filters.end_date"
              type="date"
              class="filter-input"
              title="إلى تاريخ"
              @change="onFilterChange"
            />
          </div>

          <!-- فترات سريعة لتسهيل الفلترة -->
          <div class="filter-quick-periods">
            <button
              type="button"
              class="quick-period-btn"
              :class="{ active: isCurrentPeriod('this_month') }"
              @click="setTransactionsPeriod('this_month')"
              title="معاملات الشهر الحالي"
            >
              هذا الشهر
            </button>
            <button
              type="button"
              class="quick-period-btn"
              :class="{ active: isCurrentPeriod('last_month') }"
              @click="setTransactionsPeriod('last_month')"
              title="معاملات الشهر السابق"
            >
              الشهر السابق
            </button>
            <button
              type="button"
              class="quick-period-btn"
              :class="{ active: isCurrentPeriod('all') }"
              @click="setTransactionsPeriod('all')"
              title="كافة المعاملات دون التقيد بتاريخ"
            >
              كل الفترات
            </button>
          </div>

          <!-- زر إعادة التعيين -->
          <button type="button" class="reset-filter-btn" title="تصفير الفلاتر إلى الافتراضي" @click="resetFilters">
            ↺ تصفير
          </button>
        </div>
      </div>

      <!-- جدول المعاملات المالية -->
      <div class="finance-table-card">
        <div class="card-heading">
          <div>
            <h3>سجل القيود والمعاملات <span>({{ pagination.total || transactions.length }})</span></h3>
            <p>كافة المعاملات المالية الموثقة والمثبتة في الخزائن</p>
          </div>
          <button class="refresh-btn" type="button" @click="fetchTransactions" title="تحديث">
            🔄 تحديث
          </button>
        </div>

        <div class="table-responsive">
          <table class="finance-table" :aria-busy="loadingTransactions">
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">#</th>
                <th>رقم المعاملة</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>القسم والتصنيف</th>
                <th>البيان / المستفيد</th>
                <th>طريقة الدفع والخزينة</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>المرفق</th>
                <th style="text-align: center;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingTransactions">
                <td colspan="11" class="state-cell">
                  <span class="spinner"></span> جارٍ تحميل المعاملات المالية...
                </td>
              </tr>
              <tr v-else-if="transactions.length === 0">
                <td colspan="11" class="state-cell">لا توجد معاملات مطابقة لمعايير البحث</td>
              </tr>
              <tr v-for="(trx, index) in transactions" v-else :key="trx.id" :class="{ 'row-voided': trx.status === 'voided' }">
                <td style="text-align: center;">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
                <td>
                  <span class="trx-code">{{ trx.transaction_number }}</span>
                  <small v-if="trx.reference_number" class="trx-ref">#{{ trx.reference_number }}</small>
                </td>
                <td class="date-cell">{{ trx.transaction_date }}</td>
                <td>
                  <span class="type-pill" :class="trx.type === 'income' ? 'type-income' : 'type-expense'">
                    {{ trx.type === 'income' ? 'إيراد +' : 'مصروف -' }}
                  </span>
                </td>
                <td>
                  <div class="cat-badge-cell" :style="{ borderColor: trx.category?.color || '#94a3b8' }">
                    <span class="cat-icon">{{ trx.category?.icon || '📁' }}</span>
                    <span>{{ trx.category?.name || 'غير مصنف' }}</span>
                  </div>
                </td>
                <td>
                  <div class="entity-cell">
                    <strong>{{ trx.entity_display_name || trx.beneficiary_name || 'غير محدد' }}</strong>
                    <small v-if="trx.salary_month" class="badge-sub">راتب: {{ trx.salary_month }}</small>
                    <small v-else-if="trx.revenue_nature_label" class="badge-sub">{{ trx.revenue_nature_label }}</small>
                  </div>
                </td>
                <td>
                  <div class="account-cell">
                    <strong>{{ trx.payment_method_label || trx.payment_method }}</strong>
                    <small>{{ trx.account?.name || 'غير محدد' }}</small>
                  </div>
                </td>
                <td class="amount-cell" :class="trx.type === 'income' ? 'text-income' : 'text-expense'">
                  {{ trx.type === 'income' ? '+' : '-' }}{{ Number(trx.amount).toLocaleString() }} <small>{{ trx.currency }}</small>
                </td>
                <td>
                  <span class="status-pill" :class="trx.status === 'completed' ? 'pill-completed' : 'pill-voided'">
                    {{ trx.status === 'completed' ? 'مكتملة' : 'ملغاة 🚫' }}
                  </span>
                </td>
                <td>
                  <a
                    v-if="trx.attachment_url"
                    :href="trx.attachment_url"
                    target="_blank"
                    class="attachment-link"
                    title="معاينة المرفق"
                  >
                    📎 فتح
                  </a>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <!-- عرض وتنزيل سند الراتب الرسمي لمصروفات الرواتب فقط -->
                    <button
                      v-if="trx.type === 'expense' && (trx.salary_month || trx.category?.slug === 'salaries')"
                      class="action-btn payslip-action-btn"
                      type="button"
                      title="عرض وتنزيل سند صرف الراتب الرسمي (PDF / طباعة)"
                      @click="openPayslipModal(trx.id)"
                    >
                      🧾
                    </button>

                    <!-- عرض وتنزيل سند قبض إيراد العميل المعتمد (PDF / واتساب) -->
                    <button
                      v-else-if="trx.type === 'income'"
                      class="action-btn receipt-action-btn"
                      type="button"
                      title="عرض وتنزيل سند قبض إيراد العميل المعتمد (PDF / طباعة)"
                      @click="openClientReceiptModal(trx.id)"
                    >
                      🧾
                    </button>

                    <!-- تعديل -->
                    <button
                      v-if="can('finance.edit') && trx.status !== 'voided'"
                      class="action-btn edit-btn"
                      type="button"
                      title="تعديل المعاملة"
                      @click="openEditTransaction(trx)"
                    >
                      ✎
                    </button>

                    <!-- إبطال / إلغاء -->
                    <button
                      v-if="can('finance.void') && trx.status !== 'voided'"
                      class="action-btn void-btn"
                      type="button"
                      title="إلغاء المعاملة وعكس الرصيد"
                      @click="openVoidModal(trx)"
                    >
                      🚫
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- أزرار التصفح والصفحات -->
        <div v-if="pagination.total_pages > 1" class="pagination-bar">
          <span>الصفحة {{ pagination.current_page }} من {{ pagination.total_pages }}</span>
          <div class="pagination-buttons">
            <button
              :disabled="pagination.current_page <= 1"
              class="page-btn"
              @click="changePage(pagination.current_page - 1)"
            >
              السابق
            </button>
            <button
              :disabled="pagination.current_page >= pagination.total_pages"
              class="page-btn"
              @click="changePage(pagination.current_page + 1)"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 2. تبويب الرواتب والمستحقات ================= -->
    <div v-else-if="activeTab === 'salaries'" class="tab-content-pane">
      <!-- شريط التنقل الفرعي لأنظمة العمل والمستحقات (رواتب / تاسكات / عمولات) -->
      <div class="compensations-sub-nav">
        <button
          type="button"
          class="sub-tab-pill"
          :class="{ active: compensationSubTab === 'salaries' }"
          @click="switchCompensationSubTab('salaries')"
        >
          👔 مسير الرواتب الشهرية
        </button>
        <button
          type="button"
          class="sub-tab-pill pill-tasks"
          :class="{ active: compensationSubTab === 'tasks' }"
          @click="switchCompensationSubTab('tasks')"
        >
          ⚡ مستحقات العمل بالتاسك
          <span v-if="freelancersSheet.summary?.total_unpaid_tasks > 0" class="sub-tab-count orange-count">
            {{ freelancersSheet.summary.total_unpaid_tasks }} معلقة
          </span>
        </button>
        <button
          type="button"
          class="sub-tab-pill pill-commissions"
          :class="{ active: compensationSubTab === 'commissions' }"
          @click="switchCompensationSubTab('commissions')"
        >
          🎯 مستحقات العمولات والأرباح
          <span v-if="commissionsSheet.summary?.pending_count > 0" class="sub-tab-count green-count">
            {{ commissionsSheet.summary.pending_count }} معلقة
          </span>
        </button>
      </div>

      <!-- 1. تفريع مسير الرواتب الشهرية -->
      <div v-if="compensationSubTab === 'salaries'">
      <div class="payroll-header-card">
        <div class="month-picker-wrap">
          <button class="month-nav-btn" @click="shiftPayrollMonth(-1)">◀ الشهر السابق</button>
          <div class="current-month-display">
            <span class="cal-icon">🗓️</span>
            <strong> رواتب: {{ payrollMonth }}</strong>
          </div>
          <button class="month-nav-btn" @click="shiftPayrollMonth(1)">الشهر التالي ▶</button>
          <button class="month-today-btn" @click="resetPayrollMonth">الشهر الحالي</button>
        </div>

        <!-- بطاقات ملخص المسير مع عد منفصل للمدراء والموظفين -->
        <div class="payroll-summary-grid">
          <!-- كارت المدراء -->
          <div
            class="payroll-stat-card amber"
            :class="{ 'card-active': salaryRoleFilter === 'manager' }"
            @click="salaryRoleFilter = salaryRoleFilter === 'manager' ? 'all' : 'manager'"
            style="cursor: pointer;"
            title="انقر لتصفية الجدول لعرض المدراء فقط"
          >
            <div class="stat-card-title">
              <span>👔 المدراء (Managers)</span>
              <span v-if="salaryRoleFilter === 'manager'" class="active-dot">● مفعّل</span>
            </div>
            <strong>{{ payrollSheet.summary?.managers_count || 0 }}</strong>
            <small class="stat-subhint">
              مسدد: {{ payrollSheet.summary?.paid_managers_count || 0 }} • متبقي: {{ payrollSheet.summary?.unpaid_managers_count || 0 }}
            </small>
          </div>

          <!-- كارت الموظفين -->
          <div
            class="payroll-stat-card blue"
            :class="{ 'card-active': salaryRoleFilter === 'employee' }"
            @click="salaryRoleFilter = salaryRoleFilter === 'employee' ? 'all' : 'employee'"
            style="cursor: pointer;"
            title="انقر لتصفية الجدول لعرض الموظفين فقط"
          >
            <div class="stat-card-title">
              <span>👤 الموظفون (Employees)</span>
              <span v-if="salaryRoleFilter === 'employee'" class="active-dot">● مفعّل</span>
            </div>
            <strong>{{ payrollSheet.summary?.employees_count || 0 }}</strong>
            <small class="stat-subhint">
              مسدد: {{ payrollSheet.summary?.paid_employees_count || 0 }} • متبقي: {{ payrollSheet.summary?.unpaid_employees_count || 0 }}
            </small>
          </div>

          <!-- كارت تم الصرف -->
          <div class="payroll-stat-card green">
            <div class="stat-card-title">
              <span>✅ تم الصرف لهم</span>
            </div>
            <strong>{{ payrollSheet.summary?.paid_count || 0 }}</strong>
            <small class="stat-subhint">
              من إجمالي {{ payrollSheet.summary?.total_employees_count || 0 }}
            </small>
          </div>

          <!-- كارت لم يتم الصرف -->
          <div class="payroll-stat-card orange">
            <div class="stat-card-title">
              <span>⏳ لم يتم الصرف بعد</span>
            </div>
            <strong>{{ payrollSheet.summary?.unpaid_count || 0 }}</strong>
            <small class="stat-subhint">
              بانتظار الصرف
            </small>
          </div>

          <!-- كارت إجمالي المنصرف -->
          <div class="payroll-stat-card purple">
            <div class="stat-card-title">
              <span>💰 إجمالي المنصرف</span>
            </div>
            <strong>{{ Number(payrollSheet.summary?.total_paid_amount || payrollSheet.summary?.total_paid || 0).toLocaleString() }} ج.م</strong>
            <small class="stat-subhint">
              خلال شهر {{ payrollMonth }}
            </small>
          </div>
        </div>
      </div>

      <!-- جدول الموظفين ومسير الأجور -->
      <div class="finance-table-card">
        <div class="card-heading">
          <div>
            <h3>قائمة موظفي المنظومة وحالة الراتب</h3>
            <p>صرف الرواتب لشهر {{ payrollMonth }} مع منع الازدواجية تلقائياً</p>
          </div>

          <!-- تصفية سريعة حسب الدور الوظيفي -->
          <div class="payroll-filter-pills">
            <button
              type="button"
              class="pill-filter-btn"
              :class="{ active: salaryRoleFilter === 'all' }"
              @click="salaryRoleFilter = 'all'"
            >
              الكل ({{ payrollSheet.summary?.total_employees_count || 0 }})
            </button>
            <button
              type="button"
              class="pill-filter-btn"
              :class="{ active: salaryRoleFilter === 'manager' }"
              @click="salaryRoleFilter = 'manager'"
            >
              👔 المدراء ({{ payrollSheet.summary?.managers_count || 0 }})
            </button>
            <button
              type="button"
              class="pill-filter-btn"
              :class="{ active: salaryRoleFilter === 'employee' }"
              @click="salaryRoleFilter = 'employee'"
            >
              👤 الموظفون ({{ payrollSheet.summary?.employees_count || 0 }})
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="finance-table">
            <thead>
              <tr>
                <th style="width: 45px;">#</th>
                <th>الموظف</th>
                <th>الدور الوظيفي</th>
                <th>المسمى الوظيفي</th>
                <th>حالة الراتب لشهر {{ payrollMonth }}</th>
                <th>تفاصيل السداد</th>
                <th style="text-align: center;">إجراء</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredPayrollEmployees.length === 0">
                <td colspan="7" class="state-cell">لا توجد بيانات موظفين مطابقة للتصفية</td>
              </tr>
              <tr v-for="(emp, idx) in filteredPayrollEmployees" v-else :key="emp.user_id || idx">
                <td>{{ idx + 1 }}</td>
                <td>
                  <div class="emp-profile-cell">
                    <div class="emp-avatar">{{ (emp.user_name || emp.name || '؟').charAt(0) }}</div>
                    <strong>{{ emp.user_name || emp.name }}</strong>
                  </div>
                </td>
                <td>
                  <span
                    class="role-pill"
                    :class="emp.role === 'manager' ? 'role-manager' : (emp.role === 'employee' ? 'role-employee' : 'role-external')"
                  >
                    {{ emp.role === 'manager' ? '👔 مدير' : (emp.role === 'employee' ? '👤 موظف' : '🌐 جهة خارجية') }}
                  </span>
                </td>
                <td>{{ emp.job_title || (emp.role === 'manager' ? 'إدارة عليا' : 'موظف') }}</td>
                <td>
                  <span v-if="emp.is_paid" class="status-pill pill-completed">
                    ✅ تم الصرف
                  </span>
                  <span v-else class="status-pill pill-pending">
                    ⏳ بانتظار الصرف
                  </span>
                </td>
                <td>
                  <div v-if="emp.is_paid && emp.payment_details" class="payment-detail-box">
                    <span class="trx-code">{{ emp.payment_details.transaction_number }}</span>
                    <span>{{ Number(emp.payment_details.amount).toLocaleString() }} ج.م</span>
                    <small class="pay-meta-row">
                      <span class="pay-date-lbl">تاريخ:</span>
                      <bdi class="date-bdi">{{ formatDisplayDate(emp.payment_details.transaction_date) }}</bdi>
                      <span v-if="emp.payment_details.account_name" class="account-tag">({{ emp.payment_details.account_name }})</span>
                    </small>
                  </div>
                  <span v-else class="text-muted">لم يُسجل صرف بعد</span>
                </td>
                <td style="text-align: center;">
                  <button
                    v-if="!emp.is_paid"
                    class="pay-salary-btn"
                    type="button"
                    @click="openSalaryModalForUser(emp)"
                  >
                    صرف الراتب الآن 💵
                  </button>
                  <div v-else class="paid-salary-actions">
                    <span class="paid-pill">مسدد بالكامل ✨</span>
                    <button
                      type="button"
                      class="payslip-btn"
                      title="عرض وتنزيل سند صرف الراتب الرسمي (PDF / طباعة)"
                      @click="openPayslipModal(emp.transaction_id, emp.user_id, payrollMonth)"
                    >
                      🧾 سند الصرف
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <!-- 2. تفريع مستحقات العمل بالتاسك (الفريلانسرز) -->
      <div v-else-if="compensationSubTab === 'tasks'" class="tasks-compensation-pane">
        <!-- كروت إحصائيات مستحقات التاسك -->
        <div class="payroll-header-card">
          <div class="payroll-summary-grid">
            <div class="payroll-stat-card amber">
              <div class="stat-card-title">
                <span>⚡ إجمالي الفريلانسرز</span>
              </div>
              <strong>{{ freelancersSheet.summary?.total_freelancers || 0 }}</strong>
              <small class="stat-subhint">موظفو نظام العمل بالتاسك</small>
            </div>

            <div class="payroll-stat-card orange">
              <div class="stat-card-title">
                <span>⏳ مهام بانتظار الصرف</span>
              </div>
              <strong>{{ freelancersSheet.summary?.total_unpaid_tasks || 0 }}</strong>
              <small class="stat-subhint">مهمة مكتملة معتمدة</small>
            </div>

            <div class="payroll-stat-card purple">
              <div class="stat-card-title">
                <span>💵 إجمالي المستحق للصرف</span>
              </div>
              <strong>{{ Number(freelancersSheet.summary?.total_unpaid_amount || 0).toLocaleString() }} ج.م</strong>
              <small class="stat-subhint">مستحقات معلقة قابلة للصرف فوراً</small>
            </div>

            <div class="payroll-stat-card green">
              <div class="stat-card-title">
                <span>✅ إجمالي ما تم صرفه</span>
              </div>
              <strong>{{ Number(freelancersSheet.summary?.total_paid_amount || 0).toLocaleString() }} ج.م</strong>
              <small class="stat-subhint">أتعاب مسددة تاريخياً</small>
            </div>
          </div>
        </div>

        <!-- جدول الفريلانسرز ومستحقات المهام -->
        <div class="finance-table-card">
          <div class="card-heading">
            <div>
              <h3>قائمة الفريلانسرز وحسابات المهام</h3>
              <p>صرف مستحقات المهام أول بأول أو تصفية مجمعة للمهام المنجزة</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="finance-table">
              <thead>
                <tr>
                  <th style="width: 45px;">#</th>
                  <th>الموظف / الفريلانسر</th>
                  <th>المسمى الوظيفي</th>
                  <th>سعر المهمة الافتراضي</th>
                  <th>المهام المعلقة القابلة للصرف</th>
                  <th>إجمالي المستحق</th>
                  <th>المهام المسددة سابقاً</th>
                  <th style="text-align: center;">إجراءات الصرف</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingFreelancers">
                  <td colspan="8" class="state-cell">جاري تحميل بيانات مستحقات الفريلانسرز...</td>
                </tr>
                <tr v-else-if="freelancersSheet.freelancers.length === 0">
                  <td colspan="8" class="state-cell">لا يوجد موظفون مسجلون بنظام العمل بالتاسك حالياً</td>
                </tr>
                <tr v-for="(fl, idx) in freelancersSheet.freelancers" v-else :key="fl.user_id">
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <div class="user-cell">
                      <strong>{{ fl.name }}</strong>
                      <small class="user-sub">{{ fl.phone || fl.email }}</small>
                    </div>
                  </td>
                  <td>{{ fl.job_title || 'فريلانسر' }}</td>
                  <td>
                    <span class="rate-badge">{{ Number(fl.default_task_rate).toLocaleString() }} ج.م / مهمة</span>
                  </td>
                  <td>
                    <span v-if="fl.pending_tasks_count > 0" class="status-pill pill-pending">
                      ⏳ {{ fl.pending_tasks_count }} مهام مكتملة معلقة
                    </span>
                    <span v-else-if="fl.active_tasks_count > 0" class="status-pill" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                      📝 {{ fl.active_tasks_count }} مهام قيد التنفيذ
                    </span>
                    <span v-else class="status-pill pill-completed">
                      ✅ لا توجد مهام معلقة
                    </span>
                  </td>
                  <td>
                    <strong :class="fl.pending_tasks_count > 0 ? 'text-amber' : 'text-muted'">
                      {{ Number(fl.pending_amount).toLocaleString() }} ج.م
                    </strong>
                  </td>
                  <td>
                    <span class="paid-sub-count">{{ fl.paid_tasks_count }} مهمة ({{ Number(fl.total_paid_amount).toLocaleString() }} ج.م)</span>
                  </td>
                  <td style="text-align: center;">
                    <button
                      v-if="fl.pending_tasks_count > 0 || fl.active_tasks_count > 0"
                      class="pay-salary-btn pay-tasks-btn"
                      type="button"
                      @click="openTaskSettlementModal(fl)"
                    >
                      صرف وتسوية المهام ⚡
                    </button>
                    <button
                      v-else
                      type="button"
                      class="payslip-btn"
                      style="border-color: rgba(245, 158, 11, 0.35); color: #fbbf24; background: rgba(245, 158, 11, 0.1);"
                      @click="openTaskSettlementModal(fl)"
                    >
                      تسوية ومراجعة المهام 📋
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. تفريع مستحقات العمولات والأرباح -->
      <div v-else-if="compensationSubTab === 'commissions'" class="commissions-compensation-pane">
        <!-- كروت إحصائيات العمولات -->
        <div class="payroll-header-card">
          <div class="payroll-summary-grid">
            <div class="payroll-stat-card amber">
              <div class="stat-card-title">
                <span>🎯 مسؤولو المبيعات والشركاء</span>
              </div>
              <strong>{{ commissionsSheet.summary?.total_sales_reps || 0 }}</strong>
              <small class="stat-subhint">موظفون بنظام العمل بالعمولة</small>
            </div>

            <div class="payroll-stat-card orange">
              <div class="stat-card-title">
                <span>⏳ عمولات بانتظار الصرف</span>
              </div>
              <strong>{{ commissionsSheet.summary?.pending_count || 0 }}</strong>
              <small class="stat-subhint">عمولات معلقة غير مسددة</small>
            </div>

            <div class="payroll-stat-card purple">
              <div class="stat-card-title">
                <span>💵 إجمالي المستحق للصرف</span>
              </div>
              <strong>{{ Number(commissionsSheet.summary?.total_pending_amount || 0).toLocaleString() }} ج.م</strong>
              <small class="stat-subhint">مستحقات عمولات جاهزة للصرف</small>
            </div>

            <div class="payroll-stat-card green">
              <div class="stat-card-title">
                <span>✅ إجمالي العمولات المصروفة</span>
              </div>
              <strong>{{ Number(commissionsSheet.summary?.total_paid_amount || 0).toLocaleString() }} ج.م</strong>
              <small class="stat-subhint">مسددة بالدفاتر المالية</small>
            </div>
          </div>
        </div>

        <!-- 1. جدول مسؤولي المبيعات والشركاء بنظام العمولة -->
        <div class="finance-table-card mb-20">
          <div class="card-heading">
            <div>
              <h3>قائمة مسؤولي المبيعات والشركاء بالعمولة</h3>
              <p>الموظفون المسجلون بنظام العمل بالعمولة، معدلات أرباحهم، والعملاء المرتبطين بهم</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="finance-table">
              <thead>
                <tr>
                  <th style="width: 45px;">#</th>
                  <th>الموظف / شريك المبيعات</th>
                  <th>المسمى الوظيفي</th>
                  <th>نظام ونسبة العمولة</th>
                  <th>العملاء المرتبطون</th>
                  <th>العمولات المعلقة القابلة للصرف</th>
                  <th>إجمالي ما تم صرفه</th>
                  <th style="text-align: center;">الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingCommissions">
                  <td colspan="8" class="state-cell">جاري تحميل بيانات مسؤولي المبيعات...</td>
                </tr>
                <tr v-else-if="!commissionsSheet.sales_reps || commissionsSheet.sales_reps.length === 0">
                  <td colspan="8" class="state-cell">لا يوجد موظفون مسجلون بنظام العمل بالعمولة حالياً</td>
                </tr>
                <tr v-for="(rep, idx) in commissionsSheet.sales_reps" v-else :key="rep.user_id">
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <div class="user-cell">
                      <strong>{{ rep.name }}</strong>
                      <small class="user-sub">{{ rep.phone || rep.email }}</small>
                    </div>
                  </td>
                  <td>{{ rep.job_title || 'مسؤول مبيعات' }}</td>
                  <td>
                    <span class="rate-badge">
                      {{ rep.commission_label }}
                    </span>
                  </td>
                  <td>
                    <div v-if="rep.clients && rep.clients.length > 0" class="clients-tags-wrap">
                      <span v-for="c in rep.clients" :key="c.id" class="client-mini-tag">
                        {{ c.name }}
                      </span>
                    </div>
                    <span v-else class="text-muted" style="font-size: 11.5px;">
                      لا يوجد عملاء مرتبطين بعد
                    </span>
                  </td>
                  <td>
                    <span v-if="rep.pending_commissions_count > 0" class="status-pill pill-pending">
                      ⏳ {{ rep.pending_commissions_count }} عمولة ({{ Number(rep.pending_amount).toLocaleString() }} ج.م)
                    </span>
                    <span v-else class="status-pill pill-completed">
                      ✅ لا توجد عمولات معلقة
                    </span>
                  </td>
                  <td>
                    <span class="paid-sub-count">
                      {{ Number(rep.total_paid_amount).toLocaleString() }} ج.م
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <span v-if="rep.pending_commissions_count > 0" class="status-pill pill-pending">
                      مستحق صرف 💵
                    </span>
                    <span v-else class="paid-pill">خالص ومسدد بالكامل ✨</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. جدول سجل تفاصيل استحقاقات العمولات -->
        <div class="finance-table-card">
          <div class="card-heading">
            <div>
              <h3>سجل استحقاقات وصرف عمولات المبيعات</h3>
              <p>احتساب آلي لعمولات المبيعات الناتجة عن إيرادات وتحصيلات العملاء</p>
            </div>
          </div>

          <div class="table-responsive">
            <table class="finance-table">
              <thead>
                <tr>
                  <th style="width: 45px;">#</th>
                  <th>مسؤول المبيعات</th>
                  <th>العميل المتعاقد</th>
                  <th>إيراد العميل</th>
                  <th>نوع ونسبة العمولة</th>
                  <th>المبلغ المستحق</th>
                  <th>الحالة</th>
                  <th style="text-align: center;">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingCommissions">
                  <td colspan="8" class="state-cell">جاري تحميل كشف العمولات...</td>
                </tr>
                <tr v-else-if="commissionsSheet.commissions.length === 0">
                  <td colspan="8" class="state-cell">لا توجد سجلات عمولات مسجلة حتى الآن</td>
                </tr>
                <tr v-for="(comm, idx) in commissionsSheet.commissions" v-else :key="comm.id">
                  <td>{{ idx + 1 }}</td>
                  <td>
                    <strong>{{ comm.user_name }}</strong>
                  </td>
                  <td>
                    <span class="client-badge">{{ comm.client_name }}</span>
                    <small v-if="comm.source_transaction_number" class="trx-ref-tag">
                      (إيراد: {{ comm.source_transaction_number }})
                    </small>
                  </td>
                  <td>{{ Number(comm.revenue_amount).toLocaleString() }} ج.م</td>
                  <td>
                    <span class="rate-badge">
                      {{ comm.commission_type === 'percentage' ? (comm.commission_rate + '% من الإيراد') : (Number(comm.commission_rate).toLocaleString() + ' ج.م ثابت') }}
                    </span>
                  </td>
                  <td>
                    <strong class="text-emerald">{{ Number(comm.commission_amount).toLocaleString() }} ج.م</strong>
                  </td>
                  <td>
                    <span class="status-pill" :class="comm.status === 'paid' ? 'pill-completed' : 'pill-pending'">
                      {{ comm.status_label }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <button
                      v-if="comm.status === 'pending'"
                      class="pay-salary-btn pay-comm-btn"
                      type="button"
                      @click="openCommissionPayoutModal(comm)"
                    >
                      صرف العمولة الآن 💵
                    </button>
                    <button
                      v-else-if="comm.status === 'paid'"
                      type="button"
                      class="payslip-btn"
                      @click="openCommissionVoucherModal(comm.id)"
                    >
                      🧾 سند العمولة
                    </button>
                    <span v-else class="text-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 3. تبويب حسابات العملاء والقيمة الكلية (LTV) ================= -->
    <div v-else-if="activeTab === 'clients'" class="tab-content-pane">
      <!-- شريط المؤشرات المالية للعملاء -->
      <div class="summary-strip">
        <div class="summary-card-item">
          <span class="summary-icon gold">💎</span>
          <div>
            <small>إجمالي مقبوضات العملاء (LTV)</small>
            <strong>{{ Number(clientsMetrics.overall_lifetime_revenue || 0).toLocaleString() }} <small>ج.م</small></strong>
          </div>
        </div>

        <div class="summary-card-item">
          <span class="summary-icon green">📅</span>
          <div>
            <small>مقبوضات الشهر الحالي من العملاء</small>
            <strong>{{ Number(clientsMetrics.overall_revenue_this_month || 0).toLocaleString() }} <small>ج.م</small></strong>
          </div>
        </div>

        <div class="summary-card-item">
          <span class="summary-icon cyan">👥</span>
          <div>
            <small>العملاء المسددين (نشطين)</small>
            <strong>{{ clientsMetrics.active_paying_clients_count || 0 }} <small>/ {{ clientsMetrics.total_clients_count || clientsSummary.length }} عميل</small></strong>
          </div>
        </div>

        <div class="summary-card-item">
          <span class="summary-icon purple">📊</span>
          <div>
            <small>متوسط دخل العميل المسدد (Avg LTV)</small>
            <strong>{{ Number(clientsMetrics.average_client_ltv || 0).toLocaleString() }} <small>ج.م</small></strong>
          </div>
        </div>
      </div>

      <!-- شريط البحث والتصفية للعملاء -->
      <div class="filter-card">
        <div class="filter-grid">
          <div class="filter-item search-item">
            <span class="search-icon">🔍</span>
            <input
              v-model="clientFilterSearch"
              type="text"
              class="filter-input search-input"
              placeholder="بحث باسم العميل أو الشركة..."
            />
          </div>

          <div class="filter-item">
            <select v-model="clientFilterStatus" class="filter-select">
              <option value="all">كل العملاء المسجلين</option>
              <option value="paid_this_month">سددوا خلال هذا الشهر فقط ✅</option>
              <option value="has_history">عملاء لديهم معاملات سابقة 💼</option>
              <option value="no_history">عملاء بدون معاملات حتى الآن 🆕</option>
            </select>
          </div>

          <button v-if="clientFilterSearch || clientFilterStatus !== 'all'" type="button" class="reset-filter-btn" @click="clientFilterSearch = ''; clientFilterStatus = 'all'">
            ↺ تصفير
          </button>
        </div>
      </div>

      <!-- الجدول المعاد هيكلته بالكامل -->
      <div class="finance-table-card">
        <div class="card-heading">
          <div>
            <h3>سجل مقبوضات العملاء وترتيب القيمة الكلية <span>({{ filteredClientsSummary.length }})</span></h3>
            <p>إجمالي ما دخل للشركة من كل عميل وسجل الدفعات المتكامل مع خيارات القبض السريع</p>
          </div>
          <button class="refresh-btn" type="button" @click="fetchClientsSummary">🔄 تحديث</button>
        </div>

        <div class="table-responsive">
          <table class="finance-table">
            <thead>
              <tr>
                <th style="width: 45px; text-align: center;">الترتيب</th>
                <th>العميل / الشركة</th>
                <th>إجمالي ما دفعه العميل (LTV)</th>
                <th>مقبوضات هذا الشهر</th>
                <th>تفصيل الإيراد (عقود vs مشاريع)</th>
                <th>عدد المعاملات</th>
                <th>آخر دفعة مسددة</th>
                <th style="text-align: center;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingClients">
                <td colspan="8" class="state-cell"><span class="spinner"></span> جارٍ تحميل بيانات العملاء...</td>
              </tr>
              <tr v-else-if="filteredClientsSummary.length === 0">
                <td colspan="8" class="state-cell">لا توجد بيانات عملاء مطابقة للبحث</td>
              </tr>
              <tr v-for="cl in filteredClientsSummary" v-else :key="cl.client_id">
                <td style="text-align: center;">
                  <span class="rank-badge" :class="'rank-' + (cl.rank <= 3 ? cl.rank : 'default')">#{{ cl.rank }}</span>
                </td>
                <td>
                  <div class="client-identity-cell">
                    <div class="client-logo-box">
                      <img v-if="cl.logo_url" :src="cl.logo_url" :alt="cl.client_name" class="client-logo-img" />
                      <span v-else class="client-logo-fallback">{{ cl.client_name.charAt(0) }}</span>
                    </div>
                    <div class="client-info-wrap">
                      <strong>{{ cl.client_name }}</strong>
                      <span v-if="cl.has_paid_this_month" class="badge-sub text-income">سدد هذا الشهر ✅</span>
                      <span v-else-if="cl.payments_count > 0" class="badge-sub text-warning">بانتظار سداد الشهر ⏳</span>
                      <span v-else class="badge-sub text-muted">عميل جديد 🆕</span>
                    </div>
                  </div>
                </td>
                <td class="amount-cell text-income">
                  {{ Number(cl.total_paid_lifetime || cl.lifetime_value || 0).toLocaleString() }} <small>ج.م</small>
                  <small v-if="Number(cl.total_paid_this_year || 0) > 0" class="sub-amount-hint">هذا العام: {{ Number(cl.total_paid_this_year).toLocaleString() }} ج.م</small>
                </td>
                <td>
                  <strong v-if="Number(cl.total_paid_this_month || 0) > 0" class="text-income">
                    +{{ Number(cl.total_paid_this_month).toLocaleString() }} ج.م
                  </strong>
                  <span v-else class="text-muted">0.00 ج.م</span>
                </td>
                <td>
                  <div class="split-nature-box">
                    <span v-if="Number(cl.retainers_total || 0) > 0" class="nature-pill pill-retainer">
                      عقود: {{ Number(cl.retainers_total).toLocaleString() }}
                    </span>
                    <span v-if="Number(cl.milestones_total || 0) > 0" class="nature-pill pill-milestone">
                      مشاريع: {{ Number(cl.milestones_total).toLocaleString() }}
                    </span>
                    <span v-if="Number(cl.retainers_total || 0) === 0 && Number(cl.milestones_total || 0) === 0" class="text-muted">-</span>
                  </div>
                </td>
                <td>
                  <span class="count-badge">
                    <strong>{{ cl.payments_count || cl.transactions_count || 0 }}</strong> دفعة
                  </span>
                </td>
                <td>
                  <div v-if="cl.last_payment_date" class="last-payment-box">
                    <div class="last-payment-head-row">
                      <strong>{{ cl.last_payment_date }}</strong>
                      <button
                        v-if="cl.last_payment_transaction_id"
                        type="button"
                        class="receipt-mini-badge-btn"
                        title="عرض وتنزيل سند قبض آخر دفعة (PDF / طباعة)"
                        @click="openClientReceiptModal(cl.last_payment_transaction_id)"
                      >
                        🧾 السند
                      </button>
                    </div>
                    <small v-if="cl.last_payment_amount">
                      {{ Number(cl.last_payment_amount).toLocaleString() }} ج.م ({{ cl.last_payment_method || 'مسدد' }})
                    </small>
                  </div>
                  <span v-else class="text-muted">لا يوجد سداد سابق</span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button
                      v-if="can('finance.create')"
                      class="quick-pay-btn"
                      type="button"
                      title="تسجيل دفعة جديدة لهذا العميل"
                      @click="openIncomeModalForClient(cl)"
                    >
                      <span>＋</span> قبض دفعة
                    </button>
                    <button
                      class="view-statement-btn"
                      type="button"
                      title="كشف حساب تفصيلي"
                      @click="openClientStatement(cl.client_id)"
                    >
                      📑 كشف الحساب
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ================= 4. تبويب الخزائن والمحافظ البنكية ================= -->
    <div v-else-if="activeTab === 'accounts'" class="tab-content-pane">
      <div class="accounts-header-strip">
        <div>
          <h3>الخزائن والمحافظ البنكية</h3>
          <p>إدارة الحسابات البنكية، الخزائن النقدية، ومحافظ الدفع الإلكتروني</p>
        </div>
        <button
          v-if="can('finance.accounts')"
          class="primary-btn"
          type="button"
          @click="openAddAccountModal"
        >
          <span>＋</span> إضافة خزينة / محفظة جديدة
        </button>
      </div>

      <div class="accounts-grid">
        <div v-for="acc in accounts" :key="acc.id" class="account-card" :class="{ 'card-inactive': !acc.is_active }">
          <div class="account-card-top">
            <span class="account-type-icon">
              {{ acc.type === 'cash' ? '💵' : (acc.type === 'bank' ? '🏦' : '📱') }}
            </span>
            <div class="account-type-badge">{{ acc.type_label || acc.type }}</div>
          </div>

          <div class="account-card-body">
            <h4>{{ acc.name }}</h4>
            <span v-if="acc.bank_name" class="acc-bank" style="font-size: 12px; color: #7de8dc; font-weight: 600; display: block; margin-bottom: 4px;">🏦 {{ acc.bank_name }}</span>
            <span v-if="acc.account_number" class="acc-number">{{ acc.account_number }}</span>
            <div class="account-balance">
              <small>الرصيد اللحظي الحالي:</small>
              <strong>{{ Number(acc.current_balance || acc.balance || 0).toLocaleString() }} <small>{{ acc.currency }}</small></strong>
            </div>
          </div>

          <div class="account-card-footer">
            <span class="status-indicator" :class="acc.is_active ? 'active' : 'inactive'">
              <i></i> {{ acc.is_active ? 'نشط ومتاح' : 'معطل' }}
            </span>
            <button
              v-if="can('finance.accounts')"
              class="edit-acc-btn"
              type="button"
              @click="openEditAccountModal(acc)"
            >
              تعديل ✎
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 5. تبويب الأرباح والتقارير المالية ================= -->
    <div v-else-if="activeTab === 'reports'" class="tab-content-pane">
      <div class="reports-control-bar">
        <div class="period-quick-buttons">
          <button :class="{ active: reportPeriodType === 'this_month' }" @click="setReportPeriod('this_month')">هذا الشهر</button>
          <button :class="{ active: reportPeriodType === 'last_month' }" @click="setReportPeriod('last_month')">الشهر الماضي</button>
          <button :class="{ active: reportPeriodType === 'this_year' }" @click="setReportPeriod('this_year')">هذا العام</button>
          <button :class="{ active: reportPeriodType === 'custom' }" @click="reportPeriodType = 'custom'">مخصص</button>
        </div>

        <div v-if="reportPeriodType === 'custom'" class="custom-dates">
          <input v-model="reportStartDate" type="date" class="filter-input" />
          <span>إلى</span>
          <input v-model="reportEndDate" type="date" class="filter-input" />
          <button class="apply-btn" @click="fetchProfitAndLoss">تطبيق</button>
        </div>
      </div>

      <!-- بطاقات نتائج الأرباح والخسائر P&L -->
      <div class="pnl-summary-cards">
        <div class="pnl-card green">
          <span class="pnl-icon">📥</span>
          <div>
            <small>إجمالي الإيرادات</small>
            <strong>{{ Number(pnlReport.summary?.total_income || 0).toLocaleString() }} ج.م</strong>
          </div>
        </div>

        <div class="pnl-card red">
          <span class="pnl-icon">📤</span>
          <div>
            <small>إجمالي المصروفات</small>
            <strong>{{ Number(pnlReport.summary?.total_expense || 0).toLocaleString() }} ج.م</strong>
          </div>
        </div>

        <div class="pnl-card cyan">
          <span class="pnl-icon">⚖️</span>
          <div>
            <small>صافي الربح / الخسارة</small>
            <strong :class="Number(pnlReport.summary?.net_profit || 0) >= 0 ? 'text-income' : 'text-expense'">
              {{ Number(pnlReport.summary?.net_profit || 0).toLocaleString() }} ج.م
            </strong>
          </div>
        </div>

        <div class="pnl-card purple">
          <span class="pnl-icon">📈</span>
          <div>
            <small>هامش الربح (Profit Margin)</small>
            <strong>{{ pnlReport.summary?.profit_margin_percentage || 0 }}%</strong>
          </div>
        </div>
      </div>

      <!-- توزيع الأقسام المرئي -->
      <div class="breakdown-columns">
        <!-- توزيع المصروفات -->
        <div class="breakdown-card">
          <h4>📊 تحليل المصروفات حسب الأقسام</h4>
          <div v-if="!pnlReport.expense_breakdown || pnlReport.expense_breakdown.length === 0" class="empty-state">
            لا توجد مصروفات مسجلة في هذه الفترة
          </div>
          <div v-else class="breakdown-list">
            <div v-for="item in pnlReport.expense_breakdown" :key="item.category_id" class="breakdown-item">
              <div class="item-head">
                <span class="item-name">{{ item.icon }} {{ item.category_name }}</span>
                <div class="item-stat">
                  <strong class="item-amount">{{ Number(item.total).toLocaleString() }} ج.م</strong>
                  <span class="item-percentage text-expense font-mono">({{ getItemPercentage(item, pnlReport.summary?.total_expense) }}%)</span>
                </div>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(100, Math.max(0, Number(getItemPercentage(item, pnlReport.summary?.total_expense)))) + '%',
                    backgroundColor: item.color || '#f43f5e'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- توزيع الإيرادات -->
        <div class="breakdown-card">
          <h4>📊 تحليل الإيرادات والمقبوضات حسب الأقسام</h4>
          <div v-if="!pnlReport.income_breakdown || pnlReport.income_breakdown.length === 0" class="empty-state">
            لا توجد إيرادات مسجلة في هذه الفترة
          </div>
          <div v-else class="breakdown-list">
            <div v-for="item in pnlReport.income_breakdown" :key="item.category_id" class="breakdown-item">
              <div class="item-head">
                <span class="item-name">{{ item.icon }} {{ item.category_name }}</span>
                <div class="item-stat">
                  <strong class="item-amount">{{ Number(item.total).toLocaleString() }} ج.م</strong>
                  <span class="item-percentage text-income font-mono">({{ getItemPercentage(item, pnlReport.summary?.total_income) }}%)</span>
                </div>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-fill"
                  :style="{
                    width: Math.min(100, Math.max(0, Number(getItemPercentage(item, pnlReport.summary?.total_income)))) + '%',
                    backgroundColor: item.color || '#10b981'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 6. تبويب الأقسام والتصنيفات ================= -->
    <div v-else-if="activeTab === 'categories'" class="tab-content-pane">
      <div class="accounts-header-strip">
        <div>
          <h3>أقسام وتصنيفات الحسابات</h3>
          <p>تنظيم وتبويب أبواب المصروفات والإيرادات لسهولة التحليل والتقارير</p>
        </div>
        <button class="primary-btn" type="button" @click="openAddCategoryModal">
          <span>＋</span> إضافة قسم جديد
        </button>
      </div>

      <!-- فلتر تصنيف الأقسام (مصروفات / إيرادات / الكل والبحث السريع) -->
      <div class="filter-card categories-filter-bar">
        <div class="categories-filter-content">
          <!-- أزرار التصفية السريعة بالنوع -->
          <div class="categories-filter-pills">
            <button
              type="button"
              class="pill-filter-btn"
              :class="{ active: categoryTypeFilter === 'all' }"
              @click="categoryTypeFilter = 'all'"
            >
              جميع الأقسام ({{ categories.length }})
            </button>
            <button
              type="button"
              class="pill-filter-btn pill-expense"
              :class="{ active: categoryTypeFilter === 'expense' }"
              @click="categoryTypeFilter = 'expense'"
            >
              📉 أقسام المصروفات ({{ expenseCategoriesCount }})
            </button>
            <button
              type="button"
              class="pill-filter-btn pill-income"
              :class="{ active: categoryTypeFilter === 'income' }"
              @click="categoryTypeFilter = 'income'"
            >
              📈 أقسام الإيرادات ({{ incomeCategoriesCount }})
            </button>
          </div>

          <!-- البحث والفرز السريع -->
          <div class="categories-search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="categorySearchQuery"
              type="text"
              class="filter-input search-input"
              placeholder="بحث باسم القسم أو الوصف..."
            />
            <button
              v-if="categorySearchQuery || categoryTypeFilter !== 'all'"
              type="button"
              class="reset-filter-btn"
              title="إعادة ضبط الفلتر"
              @click="categorySearchQuery = ''; categoryTypeFilter = 'all'"
            >
              ↺ تصفير
            </button>
          </div>
        </div>
      </div>

      <!-- شبكة بطاقات الأقسام المفلترة -->
      <div v-if="filteredCategories.length > 0" class="categories-grid">
        <div v-for="cat in filteredCategories" :key="cat.id" class="category-card" :style="{ borderTopColor: cat.color || '#38bdf8' }">
          <div class="cat-card-header">
            <span class="cat-big-icon">{{ cat.icon || '📁' }}</span>
            <div class="cat-badges-wrap">
              <span v-if="cat.cost_type === 'fixed' || cat.slug === 'office_rent'" class="cost-type-pill">مصروف ثابت</span>
              <span class="type-pill" :class="cat.type === 'income' ? 'type-income' : 'type-expense'">
                {{ cat.type === 'income' ? 'إيراد' : 'مصروف' }}
              </span>
            </div>
          </div>

          <div class="cat-card-body">
            <h4>{{ cat.name }}</h4>
            <p>{{ cat.description || 'لا يوجد وصف مضاف' }}</p>
            <div v-if="(cat.cost_type === 'fixed' || cat.slug === 'office_rent') && Number(cat.fixed_amount) > 0" class="cat-fixed-amount-box">
              <span class="fixed-label">المبلغ المحدد:</span>
              <strong class="fixed-val">{{ formatCurrency(cat.fixed_amount) }}</strong>
            </div>
            <small class="trx-count">{{ cat.transactions_count || 0 }} معاملة مسجلة</small>
          </div>

          <div class="cat-card-footer">
            <template v-if="cat.is_system">
              <span class="system-badge">قسم أساسي للنظام 🔒</span>
              <button class="edit-btn" @click="openEditCategoryModal(cat)" title="تعديل بيانات أو قيمة القسم">تعديل ✏️</button>
            </template>
            <div v-else class="custom-actions">
              <button class="edit-btn" @click="openEditCategoryModal(cat)">تعديل</button>
              <button class="delete-btn" @click="deleteCategory(cat)">حذف</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        لا توجد أقسام مطابقة للفلتر المحدد
      </div>
    </div>

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
      :prefilled-month="payrollMonth"
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
      :default-type="categoryTypeFilter === 'income' ? 'income' : 'expense'"
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
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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

// بيانات المنظومة
const transactions = ref([])
const accounts = ref([])
const categories = ref([])
const users = ref([])
const clients = ref([])
const clientsSummary = ref([])
const clientsMetrics = ref({})
const clientFilterSearch = ref('')
const clientFilterStatus = ref('all')
const prefilledClient = ref(null)

const filteredClientsSummary = computed(() => {
  return clientsSummary.value.filter(cl => {
    if (clientFilterSearch.value) {
      const q = clientFilterSearch.value.trim().toLowerCase()
      if (!cl.client_name?.toLowerCase().includes(q)) return false
    }
    if (clientFilterStatus.value === 'paid_this_month') {
      return cl.has_paid_this_month
    } else if (clientFilterStatus.value === 'has_history') {
      return (Number(cl.payments_count || cl.transactions_count || 0)) > 0
    } else if (clientFilterStatus.value === 'no_history') {
      return (Number(cl.payments_count || cl.transactions_count || 0)) === 0
    }
    return true
  })
})

// فلترة أقسام وتصنيفات الحسابات (إيرادات / مصروفات / الكل والبحث)
const categoryTypeFilter = ref('all') // 'all' | 'expense' | 'income'
const categorySearchQuery = ref('')

const expenseCategoriesCount = computed(() => {
  return categories.value.filter(c => c.type === 'expense').length
})

const incomeCategoriesCount = computed(() => {
  return categories.value.filter(c => c.type === 'income').length
})

const filteredCategories = computed(() => {
  return categories.value.filter(cat => {
    if (categoryTypeFilter.value !== 'all' && cat.type !== categoryTypeFilter.value) {
      return false
    }
    if (categorySearchQuery.value && categorySearchQuery.value.trim()) {
      const q = categorySearchQuery.value.trim().toLowerCase()
      const matchName = cat.name && cat.name.toLowerCase().includes(q)
      const matchDesc = cat.description && cat.description.toLowerCase().includes(q)
      if (!matchName && !matchDesc) {
        return false
      }
    }
    return true
  })
})

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

const getDefaultStartDate = () => {
  const now = new Date()
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

const getDefaultEndDate = () => {
  const now = new Date()
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}

// حالات التحميل
const loadingTransactions = ref(false)
const loadingClients = ref(false)

// الفلاتر والصفحات - مهيئة بالقيم الافتراضية للشهر الحالي
const filters = reactive({
  search: '',
  type: '',
  category_id: '',
  account_id: '',
  start_date: getDefaultStartDate(),
  end_date: getDefaultEndDate(),
})

const pagination = reactive({
  current_page: 1,
  per_page: 25,
  total: 0,
  total_pages: 1,
})

// ملخص إحصائيات المعاملات المفلترة (خاص بتبويب المعاملات وسجل القيود)
const transactionsSummary = reactive({
  total_income: '0.00',
  total_expense: '0.00',
  net_profit: '0.00',
  liquidity: '0.00',
  selected_account_name: null,
  completed_count: 0,
  total_count: 0,
})

// ملخص الأرباح والسيولة
const pnlSummary = reactive({
  total_income: '0.00',
  total_expense: '0.00',
  net_profit: '0.00',
})

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
const payrollMonth = ref(formatLocalMonth())
const payrollSheet = ref({ summary: {}, employees: [] })
const salaryRoleFilter = ref('all')

// بيانات الفريلانسرز ومستحقات المهام
const freelancersSheet = reactive({
  freelancers: [],
  summary: {
    total_freelancers: 0,
    total_unpaid_tasks: 0,
    total_unpaid_amount: '0.00',
    total_paid_amount: '0.00',
  }
})
const loadingFreelancers = ref(false)
const showTaskSettlementModal = ref(false)
const selectedFreelancerForSettlement = ref(null)
const selectedTaskVoucherTrxId = ref(null)

// بيانات العمولات ومسؤولي المبيعات
const commissionsSheet = reactive({
  sales_reps: [],
  commissions: [],
  summary: {
    total_sales_reps: 0,
    total_commissions_count: 0,
    pending_count: 0,
    total_pending_amount: '0.00',
    paid_count: 0,
    total_paid_amount: '0.00',
  }
})
const loadingCommissions = ref(false)
const showCommissionModal = ref(false)
const selectedCommissionForPayout = ref(null)
const selectedCommissionVoucherId = ref(null)

const filteredPayrollEmployees = computed(() => {
  const items = payrollSheet.value.employees || payrollSheet.value.payroll_items || []
  if (salaryRoleFilter.value === 'all') return items
  return items.filter(emp => emp.role === salaryRoleFilter.value)
})

// تقارير P&L
const reportPeriodType = ref('this_month')
const reportStartDate = ref(formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
const reportEndDate = ref(formatLocalDate(new Date()))
const pnlReport = ref({ summary: {}, expense_breakdown: [], income_breakdown: [] })

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

let debounceTimer = null
const debounceFetchTransactions = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.current_page = 1
    fetchTransactions(1)
  }, 350)
}

const onFilterChange = () => {
  pagination.current_page = 1
  fetchTransactions(1)
}

const setTransactionsPeriod = (period) => {
  const now = new Date()
  if (period === 'this_month') {
    filters.start_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    filters.end_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  } else if (period === 'last_month') {
    filters.start_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    filters.end_date = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (period === 'all') {
    filters.start_date = ''
    filters.end_date = ''
  }
  onFilterChange()
}

const isCurrentPeriod = (period) => {
  const now = new Date()
  const thisMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
  const thisMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const lastMonthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))

  if (period === 'this_month') {
    return filters.start_date === thisMonthStart && filters.end_date === thisMonthEnd
  }
  if (period === 'last_month') {
    return filters.start_date === lastMonthStart && filters.end_date === lastMonthEnd
  }
  if (period === 'all') {
    return !filters.start_date && !filters.end_date
  }
  return false
}

// 1. جلب المعاملات
const fetchTransactions = async (page = 1) => {
  loadingTransactions.value = true
  // حماية وتأكيد أن رقم الصفحة عدد صحيح موجب وليس كائن حدث Event
  const pageNum = (typeof page === 'number' && page >= 1) ? Math.floor(page) : 1
  try {
    const params = {
      page: pageNum,
      per_page: pagination.per_page,
    }

    if (filters.search && filters.search.trim()) params.search = filters.search.trim()
    if (filters.type) params.type = filters.type
    if (filters.category_id) params.category_id = filters.category_id
    if (filters.account_id) params.account_id = filters.account_id
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date

    const res = await api.get('/finance/transactions', { params })
    const data = res.data?.data
    transactions.value = data?.data || []
    pagination.current_page = data?.current_page || 1
    pagination.per_page = data?.per_page || 25
    pagination.total = data?.total || 0
    pagination.total_pages = data?.last_page || 1

    if (data?.summary) {
      transactionsSummary.total_income = data.summary.total_income || '0.00'
      transactionsSummary.total_expense = data.summary.total_expense || '0.00'
      transactionsSummary.net_profit = data.summary.net_profit ?? data.summary.net_flow ?? '0.00'
      transactionsSummary.liquidity = data.summary.liquidity || '0.00'
      transactionsSummary.selected_account_name = data.summary.selected_account_name || null
      transactionsSummary.completed_count = data.summary.completed_count || 0
      transactionsSummary.total_count = data.summary.total_count || 0
    }
  } catch (err) {
    console.error('Error fetching transactions:', err)
  } finally {
    loadingTransactions.value = false
  }
}

const changePage = (newPage) => {
  pagination.current_page = newPage
  fetchTransactions(newPage)
}

const resetFilters = () => {
  filters.search = ''
  filters.type = ''
  filters.category_id = ''
  filters.account_id = ''
  filters.start_date = getDefaultStartDate()
  filters.end_date = getDefaultEndDate()
  pagination.current_page = 1
  fetchTransactions(1)
}

// 2. جلب الحسابات
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

// 5. مسير الرواتب
const fetchPayrollSheet = async () => {
  try {
    const res = await api.get('/finance/salaries/payroll-sheet', {
      params: { month: payrollMonth.value }
    })
    payrollSheet.value = res.data?.data || { summary: {}, employees: [] }
  } catch (err) {
    console.error('Error fetching payroll sheet:', err)
  }
}

const shiftPayrollMonth = (offset) => {
  let [year, month] = payrollMonth.value.split('-').map(Number)
  month += offset
  while (month > 12) {
    month -= 12
    year += 1
  }
  while (month < 1) {
    month += 12
    year -= 1
  }
  payrollMonth.value = `${year}-${String(month).padStart(2, '0')}`
  fetchPayrollSheet()
}

const resetPayrollMonth = () => {
  payrollMonth.value = formatLocalMonth()
  fetchPayrollSheet()
}

// 5.1 مستحقات الفريلانسرز (نظام العمل بالتاسك)
const fetchFreelancersSheet = async () => {
  loadingFreelancers.value = true
  try {
    const res = await api.get('/finance/compensations/freelancers-sheet')
    freelancersSheet.freelancers = res.data?.data?.freelancers || []
    freelancersSheet.summary = res.data?.data?.summary || {
      total_freelancers: 0,
      total_unpaid_tasks: 0,
      total_unpaid_amount: '0.00',
      total_paid_amount: '0.00',
    }
  } catch (err) {
    console.error('Error fetching freelancers sheet:', err)
  } finally {
    loadingFreelancers.value = false
  }
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
  fetchFreelancersSheet()
  fetchAccounts()
  fetchTransactions(pagination.current_page)
  fetchProfitAndLoss()
}

// 5.2 مستحقات العمولات والأرباح (مسؤولو المبيعات والعملاء)
const fetchCommissionsSheet = async () => {
  loadingCommissions.value = true
  try {
    const res = await api.get('/finance/compensations/commissions-sheet')
    commissionsSheet.sales_reps = res.data?.data?.sales_reps || []
    commissionsSheet.commissions = res.data?.data?.commissions || []
    commissionsSheet.summary = res.data?.data?.summary || {
      total_sales_reps: 0,
      total_commissions_count: 0,
      pending_count: 0,
      total_pending_amount: '0.00',
      paid_count: 0,
      total_paid_amount: '0.00',
    }
  } catch (err) {
    console.error('Error fetching commissions sheet:', err)
  } finally {
    loadingCommissions.value = false
  }
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
  fetchCommissionsSheet()
  fetchAccounts()
  fetchTransactions(pagination.current_page)
  fetchProfitAndLoss()
}

// 6. ملخص العملاء (LTV)
const fetchClientsSummary = async () => {
  loadingClients.value = true
  try {
    const res = await api.get('/finance/clients/summary')
    const data = res.data?.data
    if (data && data.clients) {
      clientsSummary.value = data.clients || []
      clientsMetrics.value = data.metrics || {}
    } else if (Array.isArray(data)) {
      clientsSummary.value = data
      clientsMetrics.value = {}
    }
  } catch (err) {
    console.error('Error fetching clients summary:', err)
  } finally {
    loadingClients.value = false
  }
}

// 7. تقارير P&L
const setReportPeriod = (type) => {
  reportPeriodType.value = type
  const now = new Date()
  if (type === 'this_month') {
    reportStartDate.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
    reportEndDate.value = formatLocalDate(now)
  } else if (type === 'last_month') {
    reportStartDate.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    reportEndDate.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0))
  } else if (type === 'this_year') {
    reportStartDate.value = formatLocalDate(new Date(now.getFullYear(), 0, 1))
    reportEndDate.value = formatLocalDate(now)
  }
  fetchProfitAndLoss()
}

const fetchProfitAndLoss = async () => {
  try {
    const res = await api.get('/finance/reports/profit-and-loss', {
      params: {
        start_date: reportStartDate.value,
        end_date: reportEndDate.value,
      }
    })
    pnlReport.value = res.data?.data || { summary: {}, expense_breakdown: [], income_breakdown: [] }
    // Update summary strip
    pnlSummary.total_income = pnlReport.value.summary?.total_income || '0.00'
    pnlSummary.total_expense = pnlReport.value.summary?.total_expense || '0.00'
    pnlSummary.net_profit = pnlReport.value.summary?.net_profit || '0.00'
  } catch (err) {
    console.error('Error fetching P&L report:', err)
  }
}

// حساب النسبة المئوية للقسم من إجمالي الإيرادات أو المصروفات
const getItemPercentage = (item, totalGroup) => {
  if (item && item.percentage !== undefined && item.percentage !== null && !isNaN(item.percentage)) {
    const val = Number(item.percentage)
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
  }
  const total = Number(totalGroup || 0)
  const itemTotal = Number(item?.total || 0)
  if (total > 0 && itemTotal > 0) {
    const val = (itemTotal / total) * 100
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
  }
  return '0.0'
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
    if (force || transactions.value.length === 0) fetchTransactions(pagination.current_page)
  } else if (activeTab.value === 'salaries') {
    if (compensationSubTab.value === 'salaries') {
      if (force || !payrollSheet.value.employees || payrollSheet.value.employees.length === 0) fetchPayrollSheet()
    } else if (compensationSubTab.value === 'tasks') {
      if (force || !freelancersSheet.freelancers || freelancersSheet.freelancers.length === 0) fetchFreelancersSheet()
    } else if (compensationSubTab.value === 'commissions') {
      if (force || !commissionsSheet.sales_reps || commissionsSheet.sales_reps.length === 0) fetchCommissionsSheet()
    }
  } else if (activeTab.value === 'clients') {
    if (force || clientsSummary.value.length === 0) fetchClientsSummary()
  } else if (activeTab.value === 'reports') {
    if (force || !pnlReport.value.summary || Object.keys(pnlReport.value.summary).length === 0) {
      setReportPeriod('this_month')
    }
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

  if (subTab === 'salaries') {
    if (!payrollSheet.value.employees || payrollSheet.value.employees.length === 0) fetchPayrollSheet()
  } else if (subTab === 'tasks') {
    if (!freelancersSheet.freelancers || freelancersSheet.freelancers.length === 0) fetchFreelancersSheet()
  } else if (subTab === 'commissions') {
    if (!commissionsSheet.sales_reps || commissionsSheet.sales_reps.length === 0) fetchCommissionsSheet()
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
  if (emp.is_paid) {
    alertService.toast(`⚠️ تم بالفعل صرف راتب شهر (${payrollMonth.value}) للموظف (${emp.user_name || emp.name}) مسبقاً!`, 'warning')
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

const openAddCategoryModal = () => {
  selectedCategory.value = null
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
  fetchTransactions(pagination.current_page)
  fetchAccounts()
  fetchProfitAndLoss()
  if (activeTab.value === 'salaries') {
    if (compensationSubTab.value === 'salaries') fetchPayrollSheet()
    else if (compensationSubTab.value === 'tasks') fetchFreelancersSheet()
    else if (compensationSubTab.value === 'commissions') fetchCommissionsSheet()
  } else {
    fetchFreelancersSheet()
    fetchCommissionsSheet()
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
  fetchTransactions(pagination.current_page)
  fetchAccounts()
  fetchProfitAndLoss()
  if (activeTab.value === 'salaries') {
    if (compensationSubTab.value === 'salaries') fetchPayrollSheet()
    else if (compensationSubTab.value === 'tasks') fetchFreelancersSheet()
    else if (compensationSubTab.value === 'commissions') fetchCommissionsSheet()
  }
  fetchFreelancersSheet()
  fetchCommissionsSheet()
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

.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card-item {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.summary-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.summary-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.summary-icon.red { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
.summary-icon.cyan { background: rgba(0, 242, 254, 0.15); color: #00f2fe; }
.summary-icon.gold { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.summary-card-item small {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.summary-card-item strong {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
}

.filter-card {
  background: rgba(8, 14, 40, 0.4);
  border: 1px solid rgba(135, 155, 230, 0.12);
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 20px;
}

.filter-grid {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  position: relative;
}

.search-item {
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 13px;
}

.search-input {
  padding-right: 36px !important;
  width: 100%;
}

.filter-input, .filter-select {
  background: rgba(14, 22, 60, 0.6);
  border: 1px solid rgba(135, 155, 230, 0.18);
  border-radius: 8px;
  padding: 8px 12px;
  color: #f1f5f9;
  font-size: 13px;
  outline: none;
}

.reset-filter-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-filter-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
}

.filter-quick-periods {
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-period-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.quick-period-btn:hover {
  background: rgba(135, 155, 230, 0.15);
  color: #e2e8f0;
  border-color: rgba(135, 155, 230, 0.3);
}

.quick-period-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.45);
  font-weight: 700;
}

.finance-table-card {
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(135, 155, 230, 0.16);
  border-radius: 16px;
  overflow: hidden;
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.12);
}

.card-heading h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
}

.card-heading h3 span {
  color: #38bdf8;
  font-size: 13px;
}

.card-heading p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #38bdf8;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.table-responsive {
  overflow-x: auto;
}

.finance-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 13px;
}

.finance-table th {
  background: rgba(14, 22, 60, 0.7);
  padding: 12px 14px;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(135, 155, 230, 0.15);
  white-space: nowrap;
}

.finance-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.08);
  color: #cbd5e1;
}

.row-voided {
  opacity: 0.55;
  text-decoration: line-through;
  background: rgba(244, 63, 94, 0.03);
}

.trx-code {
  font-family: monospace;
  font-weight: 700;
  color: #38bdf8;
  display: block;
}

.trx-ref {
  color: #64748b;
  font-size: 10px;
}

.date-cell {
  white-space: nowrap;
  font-size: 12px;
}

.type-pill {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.type-income {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.type-expense {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.cat-badge-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border-right: 3px solid;
  font-size: 12px;
}

.entity-cell {
  display: flex;
  flex-direction: column;
}

.badge-sub {
  color: #38bdf8;
  font-size: 10px;
}

.account-cell {
  display: flex;
  flex-direction: column;
}

.account-cell small {
  color: #64748b;
  font-size: 11px;
}

.amount-cell {
  font-weight: 800;
  white-space: nowrap;
  font-size: 14px;
}

.text-income { color: #10b981; }
.text-expense { color: #f43f5e; }

.status-pill {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.pill-completed {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.pill-voided {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.attachment-link {
  color: #38bdf8;
  text-decoration: none;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.1);
}

.actions-cell {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
}

.void-btn:hover {
  background: rgba(244, 63, 94, 0.2);
  color: #f43f5e;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 22px;
  border-top: 1px solid rgba(135, 155, 230, 0.12);
  font-size: 13px;
  color: #94a3b8;
}

.page-btn {
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* مسير الرواتب */
.payroll-header-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 16px;
  padding: 18px 22px;
  margin-bottom: 20px;
}

.month-picker-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.month-nav-btn {
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
}

.current-month-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #ffffff;
}

.month-today-btn {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.payroll-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.payroll-stat-card {
  padding: 14px;
  border-radius: 12px;
  background: rgba(14, 22, 60, 0.45);
  border: 1px solid rgba(135, 155, 230, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s ease;
}

.payroll-stat-card.amber {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.25);
}

.payroll-stat-card.blue {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.25);
}

.payroll-stat-card.green {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
}

.payroll-stat-card.orange {
  background: rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.25);
}

.payroll-stat-card.purple {
  background: rgba(168, 85, 247, 0.08);
  border-color: rgba(168, 85, 247, 0.25);
}

.payroll-stat-card.card-active {
  box-shadow: 0 0 0 2px #38bdf8;
  border-color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.15) !important;
}

.payroll-stat-card.amber.card-active {
  box-shadow: 0 0 0 2px #f59e0b;
  border-color: #f59e0b !important;
  background: rgba(245, 158, 11, 0.18) !important;
}

.stat-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.active-dot {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 700;
}

.payroll-stat-card.amber .active-dot {
  color: #f59e0b;
}

.stat-subhint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.payroll-filter-pills {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.pill-filter-btn {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.pill-filter-btn.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.35));
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.role-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.role-manager {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.role-employee {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.role-external {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.payroll-stat-card span { font-size: 12px; color: #94a3b8; }
.payroll-stat-card strong { font-size: 18px; color: #ffffff; }

.emp-profile-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emp-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f2fe, #4facfe);
  color: #0c1236;
  font-weight: 800;
  display: grid;
  place-items: center;
  font-size: 12px;
}

.pay-salary-btn {
  padding: 6px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.paid-salary-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.paid-pill {
  font-size: 11px;
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.payslip-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payslip-btn:hover {
  background: #38bdf8;
  color: #0f172a;
  transform: translateY(-1px);
}

.payslip-action-btn {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.25);
  cursor: pointer;
}

.payslip-action-btn:hover {
  background: #38bdf8;
  color: #0f172a;
}

.receipt-action-btn {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.28);
  cursor: pointer;
  transition: all 0.2s;
}

.receipt-action-btn:hover {
  background: #10b981;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
}

.last-payment-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.receipt-mini-badge-btn {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.25);
  cursor: pointer;
  transition: all 0.15s;
}

.receipt-mini-badge-btn:hover {
  background: #10b981;
  color: #020617;
}

.payment-detail-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
}

.payment-detail-box .pay-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  color: #94a3b8;
  font-size: 11px;
}

.payment-detail-box .date-bdi {
  direction: ltr;
  unicode-bidi: isolate;
  font-family: monospace, sans-serif;
  font-weight: 700;
  color: #cbd5e1;
}

.payment-detail-box .account-tag {
  color: #38bdf8;
  font-size: 10.5px;
}

/* شريط التنقل لأنظمة العمل والمستحقات */
.compensations-sub-nav {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  background: rgba(8, 14, 40, 0.4);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(135, 155, 230, 0.12);
}

.sub-tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #94a3b8;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sub-tab-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
}

.sub-tab-pill.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.25));
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
}

.sub-tab-pill.pill-tasks.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.25));
  border-color: #f59e0b;
  color: #fbbf24;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.sub-tab-pill.pill-commissions.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25));
  border-color: #10b981;
  color: #34d399;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.sub-tab-count {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
}

.orange-count {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.green-count {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.pay-tasks-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: #0f172a !important;
  font-weight: 800 !important;
}

.pay-tasks-btn:hover {
  filter: brightness(1.1);
}

.pay-comm-btn {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
}

.pay-comm-btn:hover {
  filter: brightness(1.1);
}

.rate-badge {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 6px;
  color: #38bdf8;
  font-size: 11.5px;
  font-weight: 700;
}

.client-badge {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.25);
  border-radius: 6px;
  color: #c084fc;
  font-size: 12px;
  font-weight: 700;
}

.trx-ref-tag {
  display: block;
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 2px;
  font-family: monospace, sans-serif;
}

.paid-sub-count {
  font-size: 11.5px;
  color: #94a3b8;
}

.text-emerald {
  color: #10b981;
}

.text-amber {
  color: #f59e0b;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-sub {
  font-size: 11px;
  color: #94a3b8;
}

.mb-20 {
  margin-bottom: 20px;
}

.clients-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.client-mini-tag {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.25);
  color: #c084fc;
  font-size: 11px;
  font-weight: 600;
}

/* حسابات العملاء */
.rank-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
  display: inline-block;
}

.rank-1 { background: rgba(245, 158, 11, 0.25); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
.rank-2 { background: rgba(192, 132, 252, 0.25); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.4); }
.rank-3 { background: rgba(56, 189, 248, 0.25); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
.rank-default { background: rgba(255, 255, 255, 0.06); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.1); }

.client-identity-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-logo-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(14, 22, 60, 0.6);
  border: 1px solid rgba(135, 155, 230, 0.2);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.client-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.client-logo-fallback {
  color: #38bdf8;
  font-weight: 800;
  font-size: 14px;
}

.client-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-info-wrap strong {
  color: #f1f5f9;
  font-size: 14px;
}

.sub-amount-hint {
  display: block;
  font-size: 11px;
  color: #64748b;
  font-weight: normal;
  margin-top: 2px;
}

.split-nature-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nature-pill {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  width: fit-content;
}

.pill-retainer {
  background: rgba(0, 242, 254, 0.12);
  color: #00f2fe;
  border: 1px solid rgba(0, 242, 254, 0.25);
}

.pill-milestone {
  background: rgba(192, 132, 252, 0.12);
  color: #c084fc;
  border: 1px solid rgba(192, 132, 252, 0.25);
}

.count-badge {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #cbd5e1;
}

.last-payment-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.last-payment-box strong {
  color: #f1f5f9;
  font-size: 12px;
}

.last-payment-box small {
  color: #64748b;
  font-size: 10px;
}

.quick-pay-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  transition: all 0.2s;
}

.quick-pay-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.view-statement-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.view-statement-btn:hover {
  background: rgba(56, 189, 248, 0.2);
}

.text-warning { color: #f59e0b; }
.text-muted { color: #64748b; }

/* الخزائن والمحافظ */
.accounts-header-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}

.accounts-header-strip h3 { margin: 0; font-size: 18px; color: #ffffff; }
.accounts-header-strip p { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.account-card {
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(135, 155, 230, 0.16);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.account-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-type-icon { font-size: 26px; }

.account-type-badge {
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #38bdf8;
  font-size: 11px;
}

.account-card-body h4 { margin: 0 0 4px; font-size: 16px; color: #ffffff; }
.acc-number { font-size: 11px; color: #64748b; font-family: monospace; display: block; margin-bottom: 10px; }

.account-balance small { font-size: 11px; color: #94a3b8; display: block; }
.account-balance strong { font-size: 20px; font-weight: 800; color: #38bdf8; }

.account-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(135, 155, 230, 0.1);
}

.status-indicator {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-indicator i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.active i { background: #10b981; }
.status-indicator.inactive i { background: #64748b; }

.edit-acc-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}

.edit-acc-btn:hover { color: #38bdf8; }

/* التقارير */
.reports-control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 14px;
  flex-wrap: wrap;
}

.period-quick-buttons {
  display: flex;
  gap: 8px;
}

.period-quick-buttons button {
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
}

.period-quick-buttons button.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.custom-dates {
  display: flex;
  align-items: center;
  gap: 8px;
}

.apply-btn {
  padding: 8px 14px;
  border-radius: 8px;
  background: #38bdf8;
  border: none;
  color: #0c1236;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.pnl-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.pnl-card {
  padding: 18px 22px;
  border-radius: 16px;
  background: rgba(8, 14, 40, 0.55);
  border: 1px solid rgba(135, 155, 230, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
}

.pnl-icon { font-size: 24px; }
.pnl-card small { font-size: 11px; color: #94a3b8; display: block; }
.pnl-card strong { font-size: 20px; font-weight: 800; color: #ffffff; }

.breakdown-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 800px) {
  .breakdown-columns { grid-template-columns: 1fr; }
}

.breakdown-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 16px;
  padding: 18px 22px;
}

.breakdown-card h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #ffffff;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.item-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-amount {
  color: #f1f5f9;
  font-weight: 700;
}

.item-percentage {
  font-weight: 800;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 0.3px;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 0;
}

/* شريط فلترة الأقسام والتصنيفات */
.categories-filter-bar {
  margin-bottom: 20px;
  padding: 14px 18px;
}

.categories-filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.categories-filter-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.categories-filter-pills .pill-expense.active {
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.22), rgba(225, 29, 72, 0.32));
  border-color: #f43f5e;
  color: #fb7185;
}

.categories-filter-pills .pill-income.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.32));
  border-color: #10b981;
  color: #34d399;
}

.categories-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  min-width: 250px;
}

.categories-search-box .search-input {
  width: 100%;
}

/* تصنيفات */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.category-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-top: 4px solid;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-big-icon { font-size: 26px; }

.cat-badges-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cost-type-pill {
  font-size: 10.5px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 700;
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.cat-card-body h4 { margin: 0 0 4px; font-size: 15px; color: #ffffff; }
.cat-card-body p { margin: 0 0 6px; font-size: 12px; color: #94a3b8; }
.cat-fixed-amount-box {
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
}
.cat-fixed-amount-box .fixed-label { color: #94a3b8; }
.cat-fixed-amount-box .fixed-val { color: #38bdf8; font-weight: 700; }
.trx-count { font-size: 11px; color: #64748b; }

.cat-card-footer {
  padding-top: 8px;
  border-top: 1px solid rgba(135, 155, 230, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.system-badge { font-size: 11px; color: #64748b; }

.cat-card-footer .edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.cat-card-footer .edit-btn:hover {
  background: rgba(56, 189, 248, 0.12);
}

.custom-actions {
  display: flex;
  gap: 10px;
}

.custom-actions button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.custom-actions .edit-btn { color: #38bdf8; }
.custom-actions .delete-btn { color: #f43f5e; }

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-radius: 50%;
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-cell {
  text-align: center;
  padding: 40px !important;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 13px;
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
  .summary-strip {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .filter-grid {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-item, .filter-input, .filter-select {
    width: 100%;
  }
  .month-picker-wrap {
    flex-direction: column;
    align-items: stretch;
  }
  .current-month-display {
    justify-content: center;
  }
  .month-nav-btn, .month-today-btn {
    width: 100%;
    text-align: center;
  }
  .payroll-summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  .period-quick-buttons {
    flex-wrap: wrap;
    width: 100%;
  }
  .period-quick-buttons button {
    flex: 1;
    min-width: 70px;
    text-align: center;
  }
}
</style>
