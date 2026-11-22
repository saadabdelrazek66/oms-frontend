<template>
  <div class="tab-content-pane">
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

          <!-- زر تصدير مسير الرواتب والمستحقات إلى Excel (المسددين فقط أو الكل) -->
          <button
            type="button"
            class="excel-export-action-btn"
            title="تصدير كشف مسير الرواتب والمستحقات (المسددين فقط أو الكل)"
            @click="$emit('open-payroll-excel', { month: payrollMonth, summary: payrollSheet.summary })"
          >
            <span class="btn-icon">📊</span>
            <span>تصدير مسير الرواتب (Excel)</span>
          </button>
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
                    @click="handlePaySalary(emp)"
                  >
                    صرف الراتب الآن 💵
                  </button>
                  <div v-else class="paid-salary-actions">
                    <span class="paid-pill">مسدد بالكامل ✨</span>
                    <button
                      type="button"
                      class="payslip-btn"
                      title="عرض وتنزيل سند صرف الراتب الرسمي (PDF / طباعة)"
                      @click="$emit('open-payslip', { trxId: emp.transaction_id, userId: emp.user_id, month: payrollMonth })"
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
                    @click="$emit('open-task-settlement', fl)"
                  >
                    صرف وتسوية المهام ⚡
                  </button>
                  <button
                    v-else
                    type="button"
                    class="payslip-btn"
                    style="border-color: rgba(245, 158, 11, 0.35); color: #fbbf24; background: rgba(245, 158, 11, 0.1);"
                    @click="$emit('open-task-settlement', fl)"
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
                    @click="$emit('open-commission-payout', comm)"
                  >
                    صرف العمولة الآن 💵
                  </button>
                  <button
                    v-else-if="comm.status === 'paid'"
                    type="button"
                    class="payslip-btn"
                    @click="$emit('open-commission-voucher', comm.id)"
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
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  initialSubTab: {
    type: String,
    default: 'salaries'
  }
})

const emit = defineEmits([
  'update:subtab',
  'open-salary-modal',
  'open-payslip',
  'open-task-settlement',
  'open-commission-payout',
  'open-commission-voucher',
  'open-payroll-excel'
])

const formatLocalDate = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDisplayDate = (d) => {
  if (!d) return '—'
  if (typeof d === 'string') return d.split('T')[0]
  if (d instanceof Date) return formatLocalDate(d)
  return String(d)
}

const formatLocalMonth = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// التبويب الفرعي
const compensationSubTab = ref(props.initialSubTab || 'salaries')
const payrollMonth = ref(formatLocalMonth())
const payrollSheet = ref({ summary: {}, employees: [] })
const salaryRoleFilter = ref('all')

const filteredPayrollEmployees = computed(() => {
  const items = payrollSheet.value.employees || payrollSheet.value.payroll_items || []
  if (salaryRoleFilter.value === 'all') return items
  return items.filter(emp => emp.role === salaryRoleFilter.value)
})

// بيانات الفريلانسرز
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

// بيانات العمولات
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

const switchCompensationSubTab = (subTab) => {
  if (compensationSubTab.value === subTab) return
  compensationSubTab.value = subTab
  emit('update:subtab', subTab)

  if (subTab === 'salaries') {
    if (!payrollSheet.value.employees || payrollSheet.value.employees.length === 0) fetchPayrollSheet()
  } else if (subTab === 'tasks') {
    if (!freelancersSheet.freelancers || freelancersSheet.freelancers.length === 0) fetchFreelancersSheet()
  } else if (subTab === 'commissions') {
    if (!commissionsSheet.sales_reps || commissionsSheet.sales_reps.length === 0) fetchCommissionsSheet()
  }
}

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

const handlePaySalary = (emp) => {
  if (emp.is_paid) {
    alertService.toast(`⚠️ تم بالفعل صرف راتب شهر (${payrollMonth.value}) للموظف (${emp.user_name || emp.name}) مسبقاً!`, 'warning')
    return
  }
  emit('open-salary-modal', emp)
}

watch(() => props.initialSubTab, (newVal) => {
  if (newVal && newVal !== compensationSubTab.value) {
    compensationSubTab.value = newVal
  }
})

onMounted(() => {
  if (compensationSubTab.value === 'salaries') fetchPayrollSheet()
  else if (compensationSubTab.value === 'tasks') fetchFreelancersSheet()
  else if (compensationSubTab.value === 'commissions') fetchCommissionsSheet()

  // جلب إحصائيات المعلقات للشارات الفرعية في الخلفية
  fetchFreelancersSheet()
  fetchCommissionsSheet()
})

defineExpose({
  fetchPayrollSheet,
  fetchFreelancersSheet,
  fetchCommissionsSheet,
  payrollMonth,
  payrollSheet,
  compensationSubTab
})
</script>

<style scoped>
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

.excel-export-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.22));
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.excel-export-action-btn:hover {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
  border-color: #10b981;
}

.excel-export-action-btn .btn-icon {
  font-size: 14px;
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

.finance-table-card {
  background: rgba(8, 14, 40, 0.5);
  border: 1px solid rgba(135, 155, 230, 0.15);
  border-radius: 16px;
  overflow: hidden;
}

.card-heading {
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(135, 155, 230, 0.1);
  flex-wrap: wrap;
  gap: 12px;
}

.card-heading h3 {
  margin: 0;
  font-size: 17px;
  color: #ffffff;
}

.card-heading p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.finance-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  font-size: 13px;
}

.finance-table th {
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  font-weight: 700;
  border-bottom: 1px solid rgba(135, 155, 230, 0.12);
  white-space: nowrap;
}

.finance-table td {
  padding: 13px 16px;
  border-bottom: 1px solid rgba(135, 155, 230, 0.08);
  color: #e2e8f0;
}

.finance-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

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

.status-pill {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.pill-completed {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.pill-pending {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.25);
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

.trx-code {
  font-family: monospace;
  font-weight: 700;
  color: #38bdf8;
  display: block;
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
  transition: all 0.2s;
}

.pay-salary-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
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

.text-muted {
  color: #64748b;
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

.state-cell {
  text-align: center;
  padding: 40px !important;
  color: #64748b;
}

@media (max-width: 640px) {
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
}
</style>
