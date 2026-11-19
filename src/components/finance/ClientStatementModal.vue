<template>
  <Teleport to="body">
    <div v-if="show" class="statement-modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <div class="statement-modal-card">
        <!-- شريط التحكم العلوي للمودال -->
        <div class="modal-top-bar">
          <div class="bar-title">
            <div class="bar-icon-wrap">
              <svg class="bar-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3>كشف الحساب المالي الرسمي للعميل</h3>
              <p v-if="clientData">العميل / الشركة: <strong class="client-name-header">{{ clientData.name }}</strong> <span v-if="statementNumber" class="statement-code-header">({{ statementNumber }})</span></p>
            </div>
          </div>

          <div class="bar-actions">
            <button
              v-if="statement"
              type="button"
              class="action-btn-print"
              title="طباعة وتنزيل كشف الحساب الرسمي المعتمد (PDF)"
              @click="printStatement"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              <span>طباعة كشف الحساب / PDF</span>
            </button>

            <button
              v-if="statement"
              type="button"
              class="action-btn-copy"
              title="نسخ ملخص كشف الحساب للمشاركة"
              @click="copyStatementSummary"
            >
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              <span>نسخ الملخص</span>
            </button>

            <button class="close-bar-btn" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">
              <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- محتوى النافذة مع شريط التمرير -->
        <div class="modal-scroll-content">
          <!-- حالة التحميل -->
          <div v-if="loading" class="statement-loading-state">
            <div class="spinner-ring"></div>
            <span>جارٍ استدعاء وتدقيق السجل المالي وكشف الحساب للعميل...</span>
          </div>

          <!-- ورقة كشف الحساب الرسمية المعتمدة -->
          <div v-else-if="statement" id="printable-client-statement" class="official-statement-paper">
            <!-- ترويسة الشركة الرسمية المعتمدة -->
            <div class="statement-header">
              <div class="company-brand">
                <div class="brand-logo-container">
                  <img src="/logo.png" alt="OctoMedia" class="company-logo-img" />
                </div>
                <div class="brand-text">
                  <h2 class="company-name-ar">{{ companyInfo.name || 'شركة أكتوميديا للخدمات الرقمية والتسويق' }}</h2>
                  <span class="company-name-en">{{ companyInfo.name_en || 'OctoMedia Digital Solutions & Marketing L.L.C' }}</span>
                  <div class="company-legal-tags">
                    <span>سجل تجاري: {{ companyInfo.commercial_reg || '194820' }}</span>
                    <span class="dot-separator">•</span>
                    <span>بطاقة ضريبية: {{ companyInfo.tax_number || '724-819-350' }}</span>
                    <span class="dot-separator">•</span>
                    <span>الدقي، الجيزة، مصر</span>
                  </div>
                </div>
              </div>

              <div class="statement-title-block">
                <div class="statement-title-badge">
                  <span class="badge-title-ar">كشف حساب مالي تفصيلي</span>
                  <span class="badge-title-en">OFFICIAL STATEMENT OF ACCOUNT</span>
                </div>
                <div class="statement-ref-row">
                  <span class="ref-label">رقم كشف الحساب:</span>
                  <strong class="ref-code">{{ statementNumber }}</strong>
                </div>
                <span class="statement-status-stamp">
                  <svg class="check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  معتمد ومطابق للدفاتر المالية
                </span>
              </div>
            </div>

            <!-- خط فاصل مؤسسي مزدوج -->
            <div class="statement-divider-rule"></div>

            <!-- شريط بيانات استخراج الكشف -->
            <div class="statement-meta-strip">
              <div class="meta-item">
                <span class="meta-lbl">تاريخ ووقت الاستخراج</span>
                <strong class="meta-val font-mono">{{ statementDate }}</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">نطاق وفترة الكشف</span>
                <strong class="meta-val">سجل مالي شامل (All-Time)</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">إجمالي الحركات المعتمدة</span>
                <strong class="meta-val font-mono text-emerald">{{ metrics.completed_transactions_count || transactions.length }} عمليات مقبوضات</strong>
              </div>
              <div class="meta-item">
                <span class="meta-lbl">كود التدقيق الرقمي</span>
                <strong class="meta-val hash font-mono">{{ auditHash }}</strong>
              </div>
            </div>

            <!-- بطاقة بيانات العميل والتعاقد -->
            <div class="statement-section-card">
              <div class="section-card-title">
                <div class="section-title-text">
                  <h4>بيانات العميل والتعاقد المالي</h4>
                  <span class="sub-en">CLIENT ACCOUNT PROFILE</span>
                </div>
                <span class="account-active-badge">
                  <svg class="badge-check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>حساب نشط ومسجل بالمنظومة</span>
                </span>
              </div>
              <div class="client-details-grid">
                <div class="detail-cell">
                  <span class="detail-label">اسم العميل / الشركة</span>
                  <strong class="detail-value client-name-highlight">{{ clientData?.name }}</strong>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">رقم الهاتف والتواصل</span>
                  <span class="detail-value ltr">{{ clientPhone }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">البريد الإلكتروني</span>
                  <span class="detail-value ltr">{{ clientEmail }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">البنك المسجل للعميل</span>
                  <span class="detail-value">{{ clientData?.bank_name || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">الحساب البنكي / الآيبان</span>
                  <span class="detail-value font-mono ltr">{{ clientData?.bank_account || '—' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="detail-label">المحفظة / إنستاباي</span>
                  <span class="detail-value font-mono ltr">{{ clientData?.instapay || clientData?.wallet || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- بطاقات المؤشرات المالية التنفيذية (Executive KPI Cards) -->
            <div class="statement-kpi-grid">
              <!-- إجمالي ما دفعه العميل -->
              <div class="kpi-card highlight-gold">
                <div class="kpi-icon-wrap gold-icon">
                  <svg class="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="kpi-content">
                  <small>إجمالي مقبوضات العميل (LTV)</small>
                  <strong>{{ Number(metrics.total_paid_lifetime || 0).toLocaleString() }} <small>ج.م</small></strong>
                  <span class="kpi-hint">صافي ما تم تحصيله بالكامل</span>
                </div>
              </div>

              <!-- عقود شهرية مستمرة -->
              <div class="kpi-card highlight-teal">
                <div class="kpi-icon-wrap teal-icon">
                  <svg class="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </div>
                <div class="kpi-content">
                  <small>عقود شهرية مستمرة (Retainers)</small>
                  <strong>{{ Number(metrics.total_retainers || 0).toLocaleString() }} <small>ج.م</small></strong>
                  <span class="kpi-hint">اشتراكات الخطط الشهرية</span>
                </div>
              </div>

              <!-- دفعات المشاريع -->
              <div class="kpi-card highlight-purple">
                <div class="kpi-icon-wrap purple-icon">
                  <svg class="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div class="kpi-content">
                  <small>دفعات المشاريع (Milestones)</small>
                  <strong>{{ Number(metrics.total_project_milestones || 0).toLocaleString() }} <small>ج.م</small></strong>
                  <span class="kpi-hint">أقساط ومراحل المشروعات</span>
                </div>
              </div>

              <!-- مقبوضات هذا الشهر -->
              <div class="kpi-card highlight-green">
                <div class="kpi-icon-wrap green-icon">
                  <svg class="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="kpi-content">
                  <small>المقبوض هذا الشهر</small>
                  <strong>{{ Number(metrics.total_paid_current_month || 0).toLocaleString() }} <small>ج.م</small></strong>
                  <span class="kpi-hint">تحصيلات الشهر الحالي</span>
                </div>
              </div>
            </div>

            <!-- صندوق التفقيط المالي لإجمالي المدفوعات -->
            <div class="tafqeet-summary-box">
              <div class="tafqeet-line">
                <span class="tafqeet-lbl">إجمالي المقبوضات كتابةً:</span>
                <strong class="tafqeet-val">« {{ totalPaidInWords }} »</strong>
              </div>
              <div v-if="metrics.last_payment_date" class="last-pay-tag">
                آخر دفعة مسددة: <strong>{{ metrics.last_payment_date ? metrics.last_payment_date.substring(0, 10) : '—' }}</strong>
              </div>
            </div>

            <!-- توزيع المقبوضات حسب المشاريع إن وُجدت -->
            <div v-if="projectsBreakdown && projectsBreakdown.length > 0" class="statement-section-card">
              <div class="section-card-title">
                <div class="section-title-text">
                  <div class="title-with-icon">
                    <svg class="section-heading-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h4>توزيع المقبوضات حسب المشروعات</h4>
                  </div>
                  <span class="sub-en">PROJECTS REVENUE BREAKDOWN</span>
                </div>
              </div>
              <div class="projects-pill-grid">
                <div v-for="proj in projectsBreakdown" :key="proj.project_id" class="project-pill-item">
                  <div class="proj-name-status">
                    <strong>{{ proj.project_name }}</strong>
                    <span class="proj-badge">{{ proj.project_status }}</span>
                  </div>
                  <div class="proj-financial-row">
                    <span>المسدد: <strong class="text-emerald">{{ Number(proj.total_collected || proj.total_paid || 0).toLocaleString() }} ج.م</strong></span>
                    <small>{{ proj.payments_count }} دفعات</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- جدول سجل المعاملات التاريخية للعميل -->
            <div class="statement-ledger-section">
              <div class="section-card-title">
                <div class="section-title-text">
                  <div class="title-with-icon">
                    <svg class="section-heading-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                    </svg>
                    <h4>سجل الحركات والمعاملات المالية المسجلة للعميل ({{ transactions.length }})</h4>
                  </div>
                  <span class="sub-en">TRANSACTIONS AUDIT LEDGER</span>
                </div>
              </div>

              <div class="table-responsive">
                <table class="statement-ledger-table">
                  <thead>
                    <tr>
                      <th style="width: 35px; text-align: center;">#</th>
                      <th>رقم السند والمعاملة</th>
                      <th>تاريخ الحركة</th>
                      <th>طبيعة الإيراد والبيان</th>
                      <th>طريقة السداد والخزينة</th>
                      <th>المرجع</th>
                      <th style="text-align: left;">المبلغ المسدد</th>
                      <th style="text-align: center;">الحالة</th>
                      <th class="no-print" style="text-align: center;">السند المالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="transactions.length === 0">
                      <td colspan="9" class="empty-cell">لا توجد حركات مالية مسجلة في سجل هذا العميل حتى الآن</td>
                    </tr>
                    <tr v-for="(trx, idx) in transactions" :key="trx.id">
                      <td style="text-align: center; color: #94a3b8; font-size: 11px;">{{ idx + 1 }}</td>
                      <td class="font-mono text-dark-bold">{{ trx.transaction_number }}</td>
                      <td class="font-mono">{{ trx.transaction_date }}</td>
                      <td>
                        <div class="trx-nature-wrap">
                          <strong class="nature-title">{{ trx.revenue_nature_label || trx.category?.name || 'إيراد خدمات' }}</strong>
                          <small v-if="trx.notes" class="trx-notes-text">{{ trx.notes }}</small>
                        </div>
                      </td>
                      <td>
                        <div class="trx-pay-wrap">
                          <strong>{{ trx.payment_method_label || trx.payment_method || 'تحويل' }}</strong>
                          <small>{{ trx.account?.name || 'الخزينة المعتمدة' }}</small>
                        </div>
                      </td>
                      <td class="font-mono">{{ trx.reference_number || '—' }}</td>
                      <td class="amount-cell text-emerald" style="text-align: left;">
                        +{{ Number(trx.amount).toLocaleString() }} {{ trx.currency || 'ج.م' }}
                      </td>
                      <td style="text-align: center;">
                        <span class="status-stamp-pill" :class="trx.status === 'completed' ? 'stamp-completed' : 'stamp-voided'">
                          {{ trx.status === 'completed' ? 'معتمدة' : 'ملغاة' }}
                        </span>
                      </td>
                      <td class="no-print" style="text-align: center;">
                        <button
                          v-if="trx.status === 'completed'"
                          type="button"
                          class="statement-receipt-action-btn"
                          title="عرض وتنزيل سند القبض المعتمد لهذه المعاملة"
                          @click="openReceipt(trx.id)"
                        >
                          <svg class="receipt-action-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <span>سند القبض</span>
                        </button>
                        <span v-else class="text-muted">—</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="ledger-total-row">
                      <td colspan="6" style="text-align: right; font-weight: 800;">
                        إجمالي ما تم سداده وإثباته بالدفاتر المالية:
                      </td>
                      <td class="total-amount-cell" style="text-align: left;">
                        {{ Number(metrics.total_paid_lifetime || 0).toLocaleString() }} ج.م
                      </td>
                      <td colspan="2" class="total-status-note">
                        <span class="verified-cell-text">
                          <svg class="cell-check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span>مطابق للرصيد الفعلي</span>
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- ختم الاعتماد الرسمي والتوقيعات المؤسسية -->
            <div class="statement-authorization-strip">
              <div class="sig-col">
                <span class="sig-header">المحاسب / إعداد الحسابات</span>
                <span class="sig-person">قسم الحسابات والشؤون المالية</span>
                <div class="sig-underline"></div>
                <span class="sig-date">التوقيع والتاريخ</span>
              </div>

              <!-- الختم المالي الرقمي لشركة أكتوميديا -->
              <div class="official-seal-wrap">
                <div class="statement-digital-seal">
                  <div class="seal-inner-circle">
                    <div class="seal-top-text">OCTOMEDIA DIGITAL</div>
                    <div class="seal-dots">• • •</div>
                    <div class="seal-badge-box">معتمد رسمي</div>
                    <div class="seal-status-en">AUDITED & CERTIFIED</div>
                    <div class="seal-bottom-text">الإدارة المالية العامة</div>
                  </div>
                </div>
                <span class="seal-sub-caption">معتمد رسمياً بنظام ERP</span>
              </div>

              <div class="sig-col">
                <span class="sig-header">الاعتماد المالي / الإدارة العليا</span>
                <span class="sig-person">إدارة شركة أكتوميديا L.L.C</span>
                <div class="sig-underline"></div>
                <span class="sig-date">الاعتماد والختم الرسمي</span>
              </div>
            </div>

            <!-- تذييل الكشف القانوني -->
            <div class="statement-footer-notes">
              <div class="footer-legal-notice">
                <p>
                  <strong>إشعار قانوني محاسبي:</strong> يعتبر هذا الكشف مستنداً مالياً رسمياً معتمداً ومطابقاً للدفاتر والسجلات المحاسبية لشركة أكتوميديا للحلول الرقمية والتسويق L.L.C، ويعكس جميع الحركات المالية المسجلة بحساب العميل حتى تاريخ إصداره، وأي تعديل أو كشط في هذا المستند يفقده حجيته القانونية.
                </p>
              </div>
              <div class="footer-meta-row">
                <span>تاريخ إصدار الكشف: <strong>{{ statementDate }}</strong></span>
                <span class="dot-separator">•</span>
                <span>الرقم المرجعي: <strong>{{ statementNumber }}</strong></span>
                <span class="dot-separator">•</span>
                <span>المستند صادر آلياً من منظومة OMS المالية المعتمدة</span>
              </div>
            </div>
          </div>
        </div>

        <!-- شريط التحكم السفلي -->
        <div class="modal-footer-bar">
          <button type="button" class="footer-print-btn" @click="printStatement">
            <svg class="btn-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            <span>طباعة كشف الحساب المعتمد (PDF)</span>
          </button>
          <button type="button" class="footer-cancel-btn" @click="$emit('close')">إغلاق النافذة</button>
        </div>
      </div>
    </div>

    <!-- مودال سند قبض إيراد العميل المعتمد (عند الضغط على سند أي معاملة) -->
    <ClientReceiptModal
      :show="showReceiptModal"
      :transaction-id="selectedReceiptTrxId"
      @close="showReceiptModal = false; selectedReceiptTrxId = null"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import ClientReceiptModal from './ClientReceiptModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  clientId: { type: [Number, String], default: null },
})

defineEmits(['close'])

const loading = ref(true)
const statement = ref(null)
const showReceiptModal = ref(false)
const selectedReceiptTrxId = ref(null)

const clientData = computed(() => statement.value?.client || null)
const companyInfo = computed(() => statement.value?.company || {})
const metrics = computed(() => statement.value?.metrics || {})
const projectsBreakdown = computed(() => statement.value?.projects_breakdown || [])
const transactions = computed(() => statement.value?.transactions || [])
const statementNumber = computed(() => statement.value?.statement_number || `STM-${props.clientId}`)
const statementDate = computed(() => statement.value?.issue_date || new Date().toISOString().substring(0, 16).replace('T', ' '))
const totalPaidInWords = computed(() => statement.value?.total_paid_in_words || 'فقط لا غير')

// استخراج الهاتف والبريد
const clientPhone = computed(() => {
  const p = clientData.value?.phones
  if (!p) return '—'
  if (Array.isArray(p) && p.length > 0) {
    const item = p[0]
    return typeof item === 'object' ? item.number : item
  }
  return typeof p === 'string' ? p : '—'
})

const clientEmail = computed(() => {
  const e = clientData.value?.emails
  if (!e) return '—'
  if (Array.isArray(e) && e.length > 0) {
    const item = e[0]
    return typeof item === 'object' ? item.email : item
  }
  return typeof e === 'string' ? e : '—'
})

const auditHash = computed(() => {
  const raw = `STATEMENT-${props.clientId}-${metrics.value.total_paid_lifetime || '0'}-${transactions.value.length}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0
  }
  return 'AUDIT-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
})

const fetchStatement = async () => {
  if (!props.clientId) return
  loading.value = true
  try {
    const res = await api.get(`/finance/clients/${props.clientId}/statement`)
    statement.value = res.data?.data || null
  } catch (err) {
    console.error('Error fetching client statement:', err)
    alertService.toast('تعذر جلب كشف الحساب المالي للعميل، يرجى المحاولة لاحقاً', 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (val) => {
    if (val && props.clientId) {
      fetchStatement()
    } else if (!val) {
      statement.value = null
    }
  },
  { immediate: true }
)

const openReceipt = (trxId) => {
  selectedReceiptTrxId.value = trxId
  showReceiptModal.value = true
}

const copyStatementSummary = async () => {
  if (!statement.value || !clientData.value) return

  const text = `ملخص كشف الحساب المالي الرسمي
السادة / ${clientData.value.name}
• رقم الكشف: ${statementNumber.value}
• إجمالي المدفوعات المسددة (LTV): ${Number(metrics.value.total_paid_lifetime || 0).toLocaleString()} ج.م
• عقود شهرية (Retainers): ${Number(metrics.value.total_retainers || 0).toLocaleString()} ج.م
• دفعات مشاريع (Milestones): ${Number(metrics.value.total_project_milestones || 0).toLocaleString()} ج.م
• عدد العمليات المعتمدة: ${metrics.value.completed_transactions_count || transactions.value.length} دفعات
• تاريخ الكشف: ${statementDate.value}

شركة أكتوميديا للخدمات الرقمية والتسويق L.L.C`

  try {
    await navigator.clipboard.writeText(text)
    alertService.toast('تم نسخ ملخص كشف الحساب بنجاح', 'success')
  } catch (err) {
    console.error(err)
    alertService.toast('تعذر نسخ الملخص تلقائياً', 'error')
  }
}

// طباعة كشف الحساب عبر Isolated Iframe بمعايير A4 بنكية
const printStatement = () => {
  const printableEl = document.getElementById('printable-client-statement')
  if (!printableEl) {
    alertService.toast('تعذر العثور على وثيقة كشف الحساب للطباعة', 'error')
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.zIndex = '-9999'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  const statementHtml = printableEl.outerHTML

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>كشف حساب مالي - ${clientData.value?.name || ''} - ${statementNumber.value}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #ffffff !important;
          color: #0f172a !important;
          padding: 10px;
          line-height: 1.45;
        }
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        .no-print {
          display: none !important;
        }
        .official-statement-paper {
          background: #ffffff !important;
          color: #0f172a !important;
          width: 100% !important;
          max-width: 860px !important;
          margin: 0 auto !important;
          padding: 20px 24px !important;
          border: 1.5px solid #cbd5e1 !important;
          border-radius: 8px !important;
        }
        .statement-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 12px;
        }
        .company-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand-logo-container {
          display: flex;
          align-items: center;
        }
        .company-logo-img {
          height: 52px;
          width: auto;
          max-width: 170px;
          object-fit: contain;
          display: block;
        }
        .company-name-ar {
          font-size: 16px;
          font-weight: 800;
          color: #020617;
          margin-bottom: 2px;
        }
        .company-name-en {
          font-size: 10.5px;
          color: #475569;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        .company-legal-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
        }
        .dot-separator {
          color: #cbd5e1;
        }
        .statement-title-block {
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }
        .statement-title-badge {
          background: #eff6ff !important;
          border: 1.5px solid #2563eb !important;
          border-radius: 6px;
          padding: 4px 10px;
          text-align: center;
          display: inline-block;
        }
        .badge-title-ar {
          display: block;
          font-size: 13px;
          font-weight: 800;
          color: #1e40af !important;
        }
        .badge-title-en {
          display: block;
          font-size: 8.5px;
          font-weight: 700;
          color: #1d4ed8 !important;
          letter-spacing: 0.8px;
        }
        .statement-ref-row {
          font-size: 11px;
          color: #334155;
          margin-top: 2px;
        }
        .ref-code {
          font-family: 'JetBrains Mono', monospace;
          color: #1d4ed8 !important;
          font-weight: 800;
          font-size: 12px;
        }
        .statement-status-stamp {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #dcfce7 !important;
          color: #15803d !important;
          font-size: 9.5px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
          border: 1px solid #22c55e !important;
        }
        .check-svg {
          width: 12px;
          height: 12px;
        }
        .statement-divider-rule {
          height: 3px;
          background: linear-gradient(90deg, #2563eb 0%, #cbd5e1 50%, #2563eb 100%) !important;
          margin: 10px 0 12px 0;
          border-radius: 2px;
        }
        .statement-meta-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 12px;
          gap: 10px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-lbl {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }
        .meta-val {
          font-size: 12px;
          color: #0f172a;
          font-weight: 700;
        }
        .text-emerald {
          color: #059669 !important;
        }
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }
        .statement-section-card {
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 12px;
          background: #ffffff !important;
        }
        .section-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 6px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 8px;
        }
        .section-title-text h4 {
          font-size: 12.5px;
          font-weight: 800;
          color: #0f172a;
        }
        .sub-en {
          font-size: 8.5px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .account-active-badge {
          font-size: 10px;
          color: #15803d;
          background: #dcfce7 !important;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid #86efac !important;
        }
        .client-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px 12px;
        }
        .detail-cell {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .detail-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }
        .detail-value {
          font-size: 12px;
          color: #0f172a;
          font-weight: 700;
        }
        .client-name-highlight {
          color: #1d4ed8 !important;
          font-size: 13px;
        }
        .ltr {
          direction: ltr;
          text-align: right;
        }
        .statement-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .kpi-card {
          border-radius: 6px;
          padding: 8px 10px;
          border: 1px solid #cbd5e1 !important;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc !important;
        }
        .kpi-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff !important;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .kpi-svg {
          width: 16px;
          height: 16px;
        }
        .gold-icon .kpi-svg { color: #d97706 !important; }
        .teal-icon .kpi-svg { color: #0d9488 !important; }
        .purple-icon .kpi-svg { color: #7c3aed !important; }
        .green-icon .kpi-svg { color: #059669 !important; }
        .badge-check-svg {
          width: 12px;
          height: 12px;
        }
        .title-with-icon {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-heading-svg {
          width: 15px;
          height: 15px;
          color: #2563eb !important;
        }
        .verified-cell-text {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .cell-check-svg {
          width: 13px;
          height: 13px;
          color: #15803d !important;
        }
        .receipt-action-svg {
          width: 13px;
          height: 13px;
        }
        .kpi-content small {
          font-size: 9.5px;
          color: #475569;
          display: block;
          font-weight: 600;
        }
        .kpi-content strong {
          font-size: 14px;
          color: #0f172a;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }
        .kpi-hint {
          display: none;
        }
        .tafqeet-summary-box {
          background: #f0fdf4 !important;
          border: 1px solid #86efac !important;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tafqeet-line {
          font-size: 11.5px;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .tafqeet-lbl {
          font-weight: 700;
          color: #166534;
        }
        .tafqeet-val {
          font-weight: 800;
          color: #14532d;
        }
        .last-pay-tag {
          font-size: 10.5px;
          color: #475569;
        }
        .statement-ledger-section {
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 12px;
          background: #ffffff !important;
        }
        .statement-ledger-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .statement-ledger-table th {
          background: #f1f5f9 !important;
          color: #334155;
          font-weight: 700;
          padding: 6px 8px;
          border-bottom: 1.5px solid #cbd5e1 !important;
          text-align: right;
        }
        .statement-ledger-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0 !important;
          color: #1e293b;
        }
        .text-dark-bold {
          font-weight: 700;
          color: #0f172a;
        }
        .amount-cell {
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }
        .status-stamp-pill {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
        }
        .stamp-completed {
          background: #dcfce7 !important;
          color: #15803d !important;
          border: 1px solid #86efac;
        }
        .stamp-voided {
          background: #fee2e2 !important;
          color: #b91c1c !important;
        }
        .ledger-total-row td {
          background: #f8fafc !important;
          border-top: 1.5px solid #94a3b8 !important;
          font-weight: 800;
          font-size: 11.5px;
        }
        .total-amount-cell {
          color: #047857 !important;
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
        }
        .total-status-note {
          font-size: 10px;
          color: #15803d;
        }
        .statement-authorization-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 10px 4px 10px;
          margin-bottom: 10px;
        }
        .sig-col {
          width: 160px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sig-header {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 2px;
        }
        .sig-person {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 14px;
        }
        .sig-underline {
          width: 100%;
          border-bottom: 1.5px dashed #94a3b8;
          margin-bottom: 3px;
        }
        .sig-date {
          font-size: 9px;
          color: #94a3b8;
        }
        .official-seal-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .statement-digital-seal {
          width: 82px;
          height: 82px;
          border: 2px dashed #2563eb !important;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
        }
        .seal-inner-circle {
          width: 100%;
          height: 100%;
          border: 1px solid #3b82f6 !important;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2px;
        }
        .seal-top-text {
          font-size: 6.5px;
          font-weight: 800;
          color: #1e40af;
          letter-spacing: 0.5px;
        }
        .seal-dots {
          font-size: 6px;
          color: #3b82f6;
          line-height: 1;
          letter-spacing: 2px;
        }
        .seal-badge-box {
          background: #2563eb !important;
          color: #ffffff !important;
          font-size: 7.5px;
          font-weight: 900;
          padding: 1px 3px;
          border-radius: 2px;
          margin: 1px 0;
        }
        .seal-status-en {
          font-size: 5.5px;
          font-weight: 700;
          color: #1d4ed8;
        }
        .seal-bottom-text {
          font-size: 5.5px;
          font-weight: 700;
          color: #1e40af;
        }
        .seal-sub-caption {
          font-size: 8px;
          color: #64748b;
          font-weight: 600;
        }
        .statement-footer-notes {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          font-size: 9px;
          color: #64748b;
        }
        .footer-legal-notice p {
          margin-bottom: 4px;
          line-height: 1.35;
        }
        .footer-meta-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 9px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      ${statementHtml}
    </body>
    </html>
  `)
  doc.close()

  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1500)
  }, 450)
}
</script>

<style scoped>
.statement-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.statement-modal-card {
  background: #0f172a;
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 16px;
  width: 100%;
  max-width: 960px;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 35px rgba(37, 99, 235, 0.12);
  overflow: hidden;
}

/* شريط التحكم العلوي */
.modal-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1e293b;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.bar-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.bar-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
}

.bar-svg {
  width: 22px;
  height: 22px;
}

.bar-title h3 {
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.bar-title p {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.client-name-header {
  color: #60a5fa;
}

.statement-code-header {
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn-print {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #2563eb;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.action-btn-print:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.action-btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-copy:hover {
  background: rgba(148, 163, 184, 0.22);
  color: #ffffff;
}

.close-bar-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-bar-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.btn-svg {
  width: 16px;
  height: 16px;
}

/* التمرير الداخلي */
.modal-scroll-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  justify-content: center;
}

/* ورقة كشف الحساب */
.official-statement-paper {
  background: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 860px;
  padding: 28px 32px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
}

.statement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.company-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-logo-img {
  height: 54px;
  width: auto;
  max-width: 175px;
  object-fit: contain;
  display: block;
}

.company-name-ar {
  font-size: 18px;
  font-weight: 800;
  color: #020617;
  margin: 0 0 2px 0;
}

.company-name-en {
  font-size: 11px;
  color: #475569;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

.company-legal-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.dot-separator {
  color: #cbd5e1;
}

.statement-title-block {
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.statement-title-badge {
  background: #eff6ff;
  border: 1.5px solid #2563eb;
  border-radius: 8px;
  padding: 6px 14px;
  text-align: center;
}

.badge-title-ar {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #1e40af;
}

.badge-title-en {
  display: block;
  font-size: 9px;
  font-weight: 700;
  color: #1d4ed8;
  letter-spacing: 0.8px;
}

.statement-ref-row {
  font-size: 12px;
  color: #334155;
  margin-top: 4px;
}

.ref-code {
  font-family: 'JetBrains Mono', monospace;
  color: #1d4ed8;
  font-weight: 800;
  font-size: 13px;
  margin-right: 4px;
}

.statement-status-stamp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #dcfce7;
  color: #15803d;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid #22c55e;
}

.check-svg {
  width: 14px;
  height: 14px;
}

.statement-divider-rule {
  height: 3px;
  background: linear-gradient(90deg, #2563eb 0%, #cbd5e1 50%, #2563eb 100%);
  margin: 16px 0 18px 0;
  border-radius: 2px;
}

.statement-meta-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 18px;
  gap: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-lbl {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.meta-val {
  font-size: 13px;
  color: #0f172a;
  font-weight: 700;
}

.text-emerald {
  color: #059669 !important;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

/* بطاقة العميل */
.statement-section-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 18px;
  background: #ffffff;
}

.section-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}

.section-title-text h4 {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.sub-en {
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.account-active-badge {
  font-size: 11px;
  color: #15803d;
  background: #dcfce7;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid #86efac;
}

.client-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.detail-value {
  font-size: 13px;
  color: #0f172a;
  font-weight: 700;
}

.client-name-highlight {
  color: #1d4ed8 !important;
  font-size: 14px;
}

.ltr {
  direction: ltr;
  text-align: right;
}

/* بطاقات المؤشرات */
.statement-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.kpi-card {
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
}

.kpi-card.highlight-gold {
  border-color: #f59e0b;
  background: #fffbeb;
}

.kpi-card.highlight-teal {
  border-color: #0d9488;
  background: #f0fdfa;
}

.kpi-card.highlight-purple {
  border-color: #8b5cf6;
  background: #faf5ff;
}

.kpi-card.highlight-green {
  border-color: #10b981;
  background: #f0fdf4;
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.kpi-svg {
  width: 20px;
  height: 20px;
}

.gold-icon .kpi-svg { color: #d97706; }
.teal-icon .kpi-svg { color: #0d9488; }
.purple-icon .kpi-svg { color: #7c3aed; }
.green-icon .kpi-svg { color: #059669; }

.badge-check-svg {
  width: 13px;
  height: 13px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-heading-svg {
  width: 17px;
  height: 17px;
  color: #2563eb;
}

.verified-cell-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cell-check-svg {
  width: 14px;
  height: 14px;
  color: #15803d;
}

.receipt-action-svg {
  width: 14px;
  height: 14px;
}

.kpi-content small {
  font-size: 11px;
  color: #475569;
  display: block;
  font-weight: 600;
}

.kpi-content strong {
  font-size: 16px;
  color: #0f172a;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
}

.kpi-hint {
  font-size: 10px;
  color: #64748b;
  display: block;
  margin-top: 2px;
}

/* صندوق التفقيط */
.tafqeet-summary-box {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tafqeet-line {
  font-size: 13px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.tafqeet-lbl {
  font-weight: 700;
  color: #166534;
}

.tafqeet-val {
  font-weight: 800;
  color: #14532d;
}

.last-pay-tag {
  font-size: 11px;
  color: #475569;
}

/* المشاريع */
.projects-pill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.project-pill-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #f8fafc;
}

.proj-name-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.proj-badge {
  font-size: 10px;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
}

.proj-financial-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

/* جدول الحركات */
.statement-ledger-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 18px;
  background: #ffffff;
}

.statement-ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.statement-ledger-table th {
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
  padding: 8px 10px;
  border-bottom: 2px solid #cbd5e1;
  text-align: right;
}

.statement-ledger-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.text-dark-bold {
  font-weight: 700;
  color: #0f172a;
}

.trx-nature-wrap {
  display: flex;
  flex-direction: column;
}

.nature-title {
  color: #0f172a;
}

.trx-notes-text {
  color: #64748b;
  font-size: 10px;
}

.trx-pay-wrap {
  display: flex;
  flex-direction: column;
}

.trx-pay-wrap small {
  color: #64748b;
  font-size: 10px;
}

.amount-cell {
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
}

.status-stamp-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.stamp-completed {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.stamp-voided {
  background: #fee2e2;
  color: #b91c1c;
}

.statement-receipt-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #059669;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  cursor: pointer;
  transition: all 0.2s;
}

.statement-receipt-action-btn:hover {
  background: #059669;
  color: #ffffff;
}

.ledger-total-row td {
  background: #f8fafc;
  border-top: 2px solid #94a3b8;
  font-weight: 800;
  font-size: 13px;
}

.total-amount-cell {
  color: #047857 !important;
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
}

.total-status-note {
  font-size: 11px;
  color: #15803d;
}

/* التوقيعات والختم */
.statement-authorization-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 14px 6px 14px;
  margin-bottom: 14px;
}

.sig-col {
  width: 180px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sig-header {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}

.sig-person {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 22px;
}

.sig-underline {
  width: 100%;
  border-bottom: 1.5px dashed #94a3b8;
  margin-bottom: 4px;
}

.sig-date {
  font-size: 10px;
  color: #94a3b8;
}

.official-seal-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.statement-digital-seal {
  width: 96px;
  height: 96px;
  border: 2px dashed #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
}

.seal-inner-circle {
  width: 100%;
  height: 100%;
  border: 1px solid #3b82f6;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4px;
}

.seal-top-text {
  font-size: 7.5px;
  font-weight: 800;
  color: #1e40af;
  letter-spacing: 0.5px;
}

.seal-dots {
  font-size: 7px;
  color: #3b82f6;
  line-height: 1;
  letter-spacing: 2px;
}

.seal-badge-box {
  background: #2563eb;
  color: #ffffff;
  font-size: 8.5px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 3px;
  margin: 1px 0;
}

.seal-status-en {
  font-size: 6.5px;
  font-weight: 700;
  color: #1d4ed8;
}

.seal-bottom-text {
  font-size: 6.5px;
  font-weight: 700;
  color: #1e40af;
}

.seal-sub-caption {
  font-size: 9px;
  color: #64748b;
  font-weight: 600;
}

/* تذييل الكشف */
.statement-footer-notes {
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
  font-size: 10px;
  color: #64748b;
}

.footer-legal-notice p {
  margin-bottom: 6px;
  line-height: 1.4;
}

.footer-meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 10px;
  color: #94a3b8;
}

/* شريط التحكم السفلي */
.modal-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
  background: #1e293b;
}

.footer-print-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.footer-print-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.footer-cancel-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.footer-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* حالة التحميل */
.statement-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  gap: 16px;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
