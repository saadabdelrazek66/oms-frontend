<template>
  <Teleport to="body">
    <div v-if="user" class="users-modal-root" dir="rtl">
      <div class="modal-overlay" role="presentation" @click.self="$emit('close')">
        <div
          class="modal-content view-profile-modal"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          @keydown.esc="$emit('close')"
        >
          <button class="modal-close" type="button" aria-label="إغلاق النافذة" @click="$emit('close')">
            <span aria-hidden="true">×</span>
          </button>

          <div class="profile-header-card">
            <UserAvatar :name="user.name" :size="60" class="profile-avatar" />
            <div class="profile-title-block">
              <div class="profile-name-row">
                <h3>{{ user.name }}</h3>
                <span :class="['badge', user.role === 'manager' ? 'manager' : 'employee']">
                  <i aria-hidden="true"></i>{{ user.role === 'manager' ? 'مدير' : 'موظف' }}
                </span>
                <span :class="['badge', getWorkTypeInfo(user.work_type).class]">
                  {{ getWorkTypeInfo(user.work_type).text }}
                </span>
              </div>
              <p v-if="user.job_title" class="profile-job">💼 {{ user.job_title }}</p>
              <p class="profile-email">✉️ {{ user.email }}</p>
            </div>
          </div>

          <div class="profile-sections-grid">
            <!-- كارت الراتب والمستحقات المالية -->
            <div class="profile-info-card salary-feature-card">
              <template v-if="user.work_type === 'per_task'">
                <div class="info-card-header">
                  <div class="header-title-box">
                    <span class="info-icon">⚡</span>
                    <h4>نظام العمل بالتاسك (Per-Task)</h4>
                  </div>
                </div>
                <div class="salary-value-wrap">
                  <div v-if="user.default_task_rate && Number(user.default_task_rate) > 0" class="salary-display-number">
                    <strong>
                      {{
                        Number(user.default_task_rate).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      }}
                    </strong>
                    <span class="salary-currency">ج.م / لكل مهمة معتمدة</span>
                  </div>
                  <div v-else class="salary-not-set">
                    <span>لم يتم تحديد سعر افتراضي للمهام بعد</span>
                  </div>
                </div>
              </template>

              <template v-else-if="user.work_type === 'commission'">
                <div class="info-card-header">
                  <div class="header-title-box">
                    <span class="info-icon">🎯</span>
                    <h4>نظام العمل بالعمولة (Commissions)</h4>
                  </div>
                </div>
                <div class="salary-value-wrap">
                  <div v-if="user.commission_rate && Number(user.commission_rate) > 0" class="salary-display-number">
                    <strong>
                      {{
                        user.commission_type === 'percentage'
                          ? `${user.commission_rate}%`
                          : `${Number(user.commission_rate).toLocaleString('en-US')} ج.م`
                      }}
                    </strong>
                    <span class="salary-currency">
                      {{
                        user.commission_type === 'percentage'
                          ? 'نسبة من إيرادات التعاقد'
                          : 'مبلغ مقطوع لكل عميل جديد'
                      }}
                    </span>
                  </div>
                  <div
                    v-if="user.salary && Number(user.salary) > 0"
                    style="margin-top: 6px; font-size: 11px; color: #94a3b8"
                  >
                    + راتب أساسي إضافي: <strong>{{ Number(user.salary).toLocaleString() }} ج.م</strong>
                  </div>
                  <div v-else-if="!user.commission_rate" class="salary-not-set">
                    <span>لم يتم تحديد نسبة أو قيمة العمولة بعد</span>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="info-card-header">
                  <div class="header-title-box">
                    <span class="info-icon">💰</span>
                    <h4>الراتب الأساسي / الشهري</h4>
                  </div>
                  <button
                    type="button"
                    class="privacy-toggle-btn"
                    :title="showSalaryValue ? 'إخفاء الراتب' : 'إظهار الراتب'"
                    @click="showSalaryValue = !showSalaryValue"
                  >
                    <span v-if="showSalaryValue">👁️ إخفاء</span>
                    <span v-else>🔒 كشف</span>
                  </button>
                </div>
                <div class="salary-value-wrap">
                  <template v-if="user.salary && Number(user.salary) > 0">
                    <div v-if="showSalaryValue" class="salary-display-number">
                      <strong>
                        {{
                          Number(user.salary).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        }}
                      </strong>
                      <span class="salary-currency">جنيه مصري (EGP)</span>
                    </div>
                    <div v-else class="salary-masked">•••••••• <small>ج.م (محمي)</small></div>
                  </template>
                  <div v-else class="salary-not-set">
                    <span>لم يتم تسجيل راتب لهذا الموظف حتى الآن</span>
                  </div>
                </div>
              </template>
            </div>

            <!-- كارت الأقسام -->
            <div class="profile-info-card">
              <div class="info-card-header">
                <div class="header-title-box">
                  <span class="info-icon">🏢</span>
                  <h4>الأقسام والتوزيع</h4>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">القسم الأساسي:</span>
                <strong class="info-val primary-text">{{ getPrimaryDepartmentName(user) }}</strong>
              </div>
              <div v-if="getAdditionalDepartments(user).length" class="info-row">
                <span class="info-label">الأقسام الفرعية:</span>
                <div class="sub-depts-wrap">
                  <span v-for="d in getAdditionalDepartments(user)" :key="d.id" class="badge sub-dept">
                    {{ d.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- كارت مواعيد ونظام العمل -->
            <div class="profile-info-card">
              <div class="info-card-header">
                <div class="header-title-box">
                  <span class="info-icon">⏰</span>
                  <h4>مواعيد وجدول العمل</h4>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">أيام أسبوع العمل:</span>
                <span class="info-val">{{ formatDaysRange(user.work_start_day, user.work_end_day) || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">ساعات العمل اليومية:</span>
                <span class="info-val">{{ user.daily_work_hours || 8 }} ساعات / يومياً</span>
              </div>
              <div v-if="user.work_start_time && user.work_end_time" class="info-row">
                <span class="info-label">أوقات الدوام:</span>
                <span class="info-val" dir="ltr">
                  {{ formatTimeLabel(user.work_start_time) }} - {{ formatTimeLabel(user.work_end_time) }}
                </span>
              </div>
            </div>

            <!-- كارت معلومات الاتصال -->
            <div class="profile-info-card">
              <div class="info-card-header">
                <div class="header-title-box">
                  <span class="info-icon">📞</span>
                  <h4>معلومات التواصل</h4>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">رقم الهاتف:</span>
                <div v-if="user.phone" class="phone-contact-box">
                  <span class="info-val" dir="ltr">{{ user.phone }}</span>
                  <div class="contact-actions">
                    <a
                      :href="buildWhatsAppUrl(user.phone) || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="مراسلة واتساب"
                      aria-label="مراسلة الموظف عبر واتساب"
                      class="contact-btn wa"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                    </a>
                    <a
                      :href="'tel:' + user.phone"
                      title="اتصال هاتفي"
                      aria-label="الاتصال بالموظف"
                      class="contact-btn call"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </a>
                  </div>
                </div>
                <span v-else class="info-val muted">—</span>
              </div>
              <div class="info-row">
                <span class="info-label">البريد الإلكتروني:</span>
                <a
                  v-if="user.email"
                  :href="'mailto:' + user.email"
                  class="info-val email-link"
                  title="إرسال بريد إلكتروني"
                >
                  {{ user.email }}
                </a>
                <span v-else class="info-val muted">—</span>
              </div>
            </div>
          </div>

          <div class="modal-actions profile-modal-actions">
            <button type="button" class="secondary-btn" @click="$emit('close')">إغلاق</button>
            <button type="button" class="primary-btn" @click="$emit('edit', user)">
              <span>✎</span> تعديل بيانات الموظف
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { buildWhatsAppUrl } from '@/utils/whatsapp'
import {
  formatDaysRange,
  formatTimeLabel,
  getAdditionalDepartments,
  getPrimaryDepartmentName,
  getWorkTypeInfo,
} from '../utils/userSchedules'

const props = defineProps({
  user: { type: Object, default: null },
})

defineEmits(['close', 'edit'])

const showSalaryValue = ref(true)

watch(
  () => props.user,
  (val) => {
    if (val) showSalaryValue.value = true
  },
)
</script>
