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
              class="action-btn-excel"
              title="تصدير كشف الحساب المالي كملف Excel احترافي معتمد"
              :disabled="exportingExcel"
              @click="exportStatementExcel"
            >
              <span v-if="exportingExcel" class="mini-spinner"></span>
              <span v-else class="btn-icon">📊</span>
              <span>{{ exportingExcel ? 'جارٍ التصدير...' : 'تصدير كشف الحساب (Excel)' }}</span>
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
                    <h4>سجل الدفعات والعمليات المالية المعتمدة والمحتسبة للعميل ({{ transactions.length }})</h4>
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
          <button
            type="button"
            class="footer-excel-btn"
            :disabled="exportingExcel"
            @click="exportStatementExcel"
          >
            <span v-if="exportingExcel" class="mini-spinner"></span>
            <span v-else class="btn-icon">📊</span>
            <span>{{ exportingExcel ? 'جارٍ توليد وتصدير ملف Excel...' : 'تصدير كشف الحساب كملف Excel معتمد' }}</span>
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
import { copyToClipboard, downloadBlobResponse } from '@/modules/finance/utils/financeHelpers'
import { printFinanceDocument } from '@/modules/finance/utils/voucherPrint'

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
const transactions = computed(() => {
  return (statement.value?.transactions || []).filter(
    (t) => t.status === 'completed' || t.status?.value === 'completed'
  )
})
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

  await copyToClipboard(
    text,
    'تم نسخ ملخص كشف الحساب بنجاح',
    'تعذر نسخ الملخص تلقائياً',
  )
}

// تصدير كشف الحساب المالي الرسمي كملف Excel احترافي معتمد
const exportingExcel = ref(false)

const exportStatementExcel = async () => {
  if (!props.clientId) return
  exportingExcel.value = true
  try {
    const response = await api.get(`/finance/clients/${props.clientId}/statement/export-excel`, {
      responseType: 'blob',
    })
    const cleanName = (clientData.value?.name || 'العميل').replace(/[\\/:*?"<>|\s]+/g, '_')
    const fallbackName = `كشف_حساب_${cleanName}_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}.xlsx`
    downloadBlobResponse(response, fallbackName)
    alertService.toast(`✅ تم تصدير كشف حساب (${clientData.value?.name || 'العميل'}) كملف Excel بنجاح!`, 'success')
  } catch (err) {
    console.error('Client statement Excel export error:', err)
    alertService.error('فشل تصدير كشف الحساب كملف Excel، يرجى المحاولة لاحقاً.')
  } finally {
    exportingExcel.value = false
  }
}

const printStatement = () => {
  printFinanceDocument({
    elementId: 'printable-client-statement',
    title: `كشف حساب مالي - ${clientData.value?.name || ''} - ${statementNumber.value}`,
    variant: 'statement',
    notFoundMessage: 'تعذر العثور على وثيقة كشف الحساب للطباعة',
  })
}
</script>

<style scoped src="@/modules/finance/styles/client-statement-modal.css"></style>
