<template>
  <Teleport to="body">
    <div v-if="show" class="drawer-overlay" dir="rtl" role="dialog" aria-modal="true" @click.self="$emit('close')">
      <aside class="drawer-panel">
        <header class="drawer-header">
          <div class="title-wrap">
            <span class="cat-badge">{{ subscription?.category_icon || '💳' }}</span>
            <div>
              <h3>{{ subscription?.name || 'تفاصيل الاشتراك' }}</h3>
              <p v-if="subscription">
                {{ subscription.provider_name }}
                <span v-if="subscription.domain_or_identifier"> • {{ subscription.domain_or_identifier }}</span>
              </p>
            </div>
          </div>
          <button type="button" class="close-btn" aria-label="إغلاق" @click="$emit('close')">✕</button>
        </header>

        <div v-if="loading" class="drawer-loading">
          <div class="spinner"></div>
          <p>جارٍ تحميل التفاصيل وسجل التنبيهات...</p>
        </div>

        <div v-else-if="subscription" class="drawer-body">
          <!-- البطاقة العلوية للحالة والاستعجال -->
          <div class="hero-status-card" :class="`urgency-${subscription.urgency}`">
            <div class="hero-row">
              <div>
                <span class="urgency-pill">{{ subscription.urgency_label }}</span>
                <div class="countdown-big">{{ formatRemainingLabel(subscription.days_remaining) }}</div>
                <small>موعد الانتهاء: {{ subscription.next_expiry_date }}</small>
              </div>
              <div class="cost-box">
                <strong>{{ formatMoney(subscription.amount, subscription.currency) }}</strong>
                <small>{{ subscription.billing_cycle_label }}</small>
                <small>≈ {{ formatMoney(subscription.monthly_equivalent, subscription.currency) }} / شهر</small>
              </div>
            </div>

            <div class="quick-actions-row">
              <button v-if="canRenew" type="button" class="btn-drawer-primary" @click="$emit('renew', subscription)">
                🔄 تجديد الآن
              </button>
              <button
                v-if="canTestAlert"
                type="button"
                class="btn-drawer-test"
                :disabled="testingAlert"
                @click="$emit('test-alert', subscription)"
              >
                {{ testingAlert ? 'جارٍ الإرسال...' : '🧪 إرسال تنبيه تجريبي' }}
              </button>
              <button v-if="canEdit" type="button" class="btn-drawer-secondary" @click="$emit('edit', subscription)">
                ✏️ تعديل
              </button>
              <a
                v-if="subscription.management_url"
                :href="subscription.management_url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-drawer-link"
              >
                لوحة المزود ↗
              </a>
            </div>
          </div>

          <!-- تفاصيل الإعدادات -->
          <div class="details-grid">
            <div class="detail-item">
              <span>قنوات التنبيه</span>
              <div class="tags-wrap">
                <span v-for="ch in subscription.channels" :key="ch" class="mini-pill">
                  {{ channelLabel(ch) }}
                </span>
              </div>
            </div>
            <div class="detail-item">
              <span>مراحل التذكير</span>
              <div class="tags-wrap">
                <span v-for="d in subscription.reminder_days_before" :key="d" class="mini-pill">
                  {{ d === 0 ? 'يوم الانتهاء' : `قبل ${d} يوم` }}
                </span>
              </div>
            </div>
            <div class="detail-item">
              <span>بريد الحساب لدى المزود</span>
              <strong>{{ subscription.account_email || '—' }}</strong>
            </div>
            <div class="detail-item">
              <span>فترة السماح / التجديد التلقائي</span>
              <strong>{{ subscription.grace_period_days }} يوم • {{ subscription.auto_renew ? 'تلقائي' : 'يدوي' }}</strong>
            </div>
            <div class="detail-item full">
              <span>المستلمون للتنبيهات</span>
              <div class="tags-wrap">
                <span v-for="uName in resolvedUserNames" :key="uName" class="mini-pill user-pill">👤 {{ uName }}</span>
                <span v-for="em in subscription.notify_emails" :key="em" class="mini-pill mail-pill">📧 {{ em }}</span>
              </div>
            </div>
            <div v-if="subscription.notes" class="detail-item full">
              <span>ملاحظات</span>
              <p class="notes-text">{{ subscription.notes }}</p>
            </div>
          </div>

          <!-- تبويبات السجلات -->
          <div class="history-tabs">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: activeTab === 'logs' }"
              @click="activeTab = 'logs'"
            >
              🔔 سجل التنبيهات المرسلة ({{ logsList.length }})
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: activeTab === 'renewals' }"
              @click="activeTab = 'renewals'"
            >
              🧾 سجل التجديدات ({{ renewalsList.length }})
            </button>
          </div>

          <!-- تبويب سجل التنبيهات -->
          <div v-if="activeTab === 'logs'" class="history-list">
            <p v-if="logsList.length === 0" class="empty-history">لم تُرسل أي تنبيهات لهذا الاشتراك بعد.</p>
            <div v-for="log in logsList" :key="log.id" class="history-card">
              <div class="hc-top">
                <span class="hc-channel">{{ log.channel_icon || '🔔' }} {{ log.channel_label || log.channel }}</span>
                <div class="hc-badges">
                  <span v-if="log.is_test" class="test-badge">تجريبي</span>
                  <span class="status-badge" :class="log.status === 'sent' ? 'ok' : 'fail'">
                    {{ log.status === 'sent' ? 'تم الإرسال ✓' : 'فشل الإرسال ✕' }}
                  </span>
                </div>
              </div>
              <div class="hc-meta">
                <span>المستلم: <code>{{ log.recipient }}</code></span>
                <span>المرحلة: {{ log.days_before >= 0 ? `قبل ${log.days_before} يوم` : `متأخر ${Math.abs(log.days_before)} يوم` }}</span>
                <span>{{ formatTimestamp(log.sent_at || log.created_at) }}</span>
              </div>
              <p v-if="log.error_message" class="hc-error">⚠️ {{ log.error_message }}</p>
            </div>
          </div>

          <!-- تبويب سجل التجديدات -->
          <div v-else class="history-list">
            <p v-if="renewalsList.length === 0" class="empty-history">لا توجد عمليات تجديد مسجلة سابقاً.</p>
            <div v-for="ren in renewalsList" :key="ren.id" class="history-card">
              <div class="hc-top">
                <strong>{{ ren.previous_expiry_date }} ← {{ ren.new_expiry_date }}</strong>
                <span class="renew-amount">{{ formatMoney(ren.amount_paid, ren.currency) }}</span>
              </div>
              <div class="hc-meta">
                <span>بواسطة: {{ ren.renewed_by_user?.name || 'النظام' }}</span>
                <span v-if="ren.invoice_reference">مرجع: {{ ren.invoice_reference }}</span>
                <span>{{ formatTimestamp(ren.renewed_at) }}</span>
              </div>
              <p v-if="ren.notes" class="hc-notes">{{ ren.notes }}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatMoney, formatRemainingLabel } from '../constants/subscriptionOptions.js';

const props = defineProps({
  show: { type: Boolean, default: false },
  subscription: { type: Object, default: null },
  logs: { type: Array, default: () => [] },
  meta: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  testingAlert: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  canRenew: { type: Boolean, default: false },
  canTestAlert: { type: Boolean, default: false },
});

defineEmits(['close', 'edit', 'renew', 'test-alert']);

const activeTab = ref('logs');

const logsList = computed(() =>
  props.logs?.length ? props.logs : (props.subscription?.reminder_logs || [])
);
const renewalsList = computed(() => props.subscription?.renewals || []);

const resolvedUserNames = computed(() => {
  const ids = props.subscription?.notify_user_ids || [];
  const users = props.meta?.users || [];
  return ids.map((id) => users.find((u) => u.id === id)?.name || `مستخدم #${id}`);
});

const channelLabel = (ch) => {
  switch (ch) {
    case 'email': return '📧 البريد';
    case 'browser': return '🔔 المتصفح';
    case 'system': return '💬 النظام';
    default: return ch;
  }
};

const formatTimestamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
};
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(4px);
  z-index: 1180;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: 100%;
  max-width: 36rem;
  height: 100%;
  background: #0f172a;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.5);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.35rem;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.cat-badge {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.title-wrap h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 1.05rem;
}

.title-wrap p {
  margin: 0.15rem 0 0 0;
  color: #94a3b8;
  font-size: 0.78rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.drawer-loading {
  padding: 4rem 1.5rem;
  text-align: center;
  color: #94a3b8;
}

.spinner {
  width: 2.2rem;
  height: 2.2rem;
  margin: 0 auto 0.75rem auto;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.hero-status-card {
  border-radius: 0.95rem;
  padding: 1rem 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(30, 41, 59, 0.65);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.hero-status-card.urgency-overdue {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(30, 41, 59, 0.7));
}

.hero-status-card.urgency-critical {
  border-color: rgba(249, 115, 22, 0.45);
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(30, 41, 59, 0.7));
}

.hero-status-card.urgency-warning {
  border-color: rgba(245, 158, 11, 0.4);
}

.hero-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.urgency-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.countdown-big {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0.35rem 0 0.15rem 0;
}

.cost-box {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cost-box strong {
  color: #34d399;
  font-size: 1.05rem;
}

.cost-box small,
.hero-row small {
  color: #94a3b8;
  font-size: 0.75rem;
}

.quick-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-drawer-primary,
.btn-drawer-test,
.btn-drawer-secondary,
.btn-drawer-link {
  padding: 0.45rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
}

.btn-drawer-primary {
  background: #10b981;
  border: none;
  color: #ffffff;
}

.btn-drawer-test {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #7dd3fc;
}

.btn-drawer-secondary,
.btn-drawer-link {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #e2e8f0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  background: rgba(30, 41, 59, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.9rem;
  padding: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-item span {
  font-size: 0.74rem;
  color: #94a3b8;
}

.detail-item strong {
  font-size: 0.82rem;
  color: #f1f5f9;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.mini-pill {
  background: rgba(255, 255, 255, 0.07);
  color: #e2e8f0;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  font-size: 0.72rem;
}

.user-pill {
  background: rgba(16, 185, 129, 0.14);
  color: #a7f3d0;
}

.mail-pill {
  background: rgba(56, 189, 248, 0.14);
  color: #bae6fd;
}

.notes-text {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.82rem;
  line-height: 1.5;
}

.history-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.5rem;
}

.tab-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  padding: 0.45rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.tab-btn.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.35);
  color: #34d399;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.empty-history {
  text-align: center;
  padding: 1.5rem;
  color: #64748b;
  font-size: 0.82rem;
}

.history-card {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 0.75rem;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.hc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.hc-badges {
  display: flex;
  gap: 0.35rem;
}

.test-badge {
  background: rgba(56, 189, 248, 0.18);
  color: #7dd3fc;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.12rem 0.4rem;
  border-radius: 0.3rem;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 0.3rem;
}

.status-badge.ok {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
}

.status-badge.fail {
  background: rgba(239, 68, 68, 0.18);
  color: #fca5a5;
}

.hc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.74rem;
  color: #94a3b8;
}

.hc-error {
  margin: 0.2rem 0 0 0;
  color: #fda4af;
  font-size: 0.74rem;
}

.hc-notes {
  margin: 0.15rem 0 0 0;
  color: #cbd5e1;
  font-size: 0.76rem;
}

.renew-amount {
  color: #34d399;
  font-weight: 700;
}
</style>
