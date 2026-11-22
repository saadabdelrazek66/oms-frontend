<template>
  <div class="tab-content-pane">
    <div class="accounts-header-strip">
      <div>
        <h3>الخزائن والمحافظ البنكية</h3>
        <p>إدارة الحسابات البنكية، الخزائن النقدية، ومحافظ الدفع الإلكتروني</p>
      </div>
      <button
        v-if="can('finance.accounts')"
        class="primary-btn"
        type="button"
        @click="$emit('add-account')"
      >
        <span>＋</span> إضافة خزينة / محفظة جديدة
      </button>
    </div>

    <div class="accounts-grid">
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="account-card"
        :class="{ 'card-inactive': !acc.is_active }"
      >
        <div class="account-card-top">
          <span class="account-type-icon">
            {{ acc.type === 'cash' ? '💵' : (acc.type === 'bank' ? '🏦' : '📱') }}
          </span>
          <div class="account-type-badge">{{ acc.type_label || acc.type }}</div>
        </div>

        <div class="account-card-body">
          <h4>{{ acc.name }}</h4>
          <span
            v-if="acc.bank_name"
            class="acc-bank"
            style="font-size: 12px; color: #7de8dc; font-weight: 600; display: block; margin-bottom: 4px;"
          >
            🏦 {{ acc.bank_name }}
          </span>
          <span v-if="acc.account_number" class="acc-number">{{ acc.account_number }}</span>
          <div class="account-balance">
            <small>الرصيد اللحظي الحالي:</small>
            <strong>
              {{ Number(acc.current_balance || acc.balance || 0).toLocaleString() }}
              <small>{{ acc.currency }}</small>
            </strong>
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
            @click="$emit('edit-account', acc)"
          >
            تعديل ✎
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { can } from '@/utils/permissions'

defineProps({
  accounts: {
    type: Array,
    default: () => []
  }
})

defineEmits(['add-account', 'edit-account'])
</script>

<style scoped>
.accounts-header-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}

.accounts-header-strip h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.accounts-header-strip p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.primary-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #38bdf8, #0284c7);
  color: #0c1236;
  font-size: 13px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4);
}

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
  transition: all 0.2s ease;
}

.account-card.card-inactive {
  opacity: 0.6;
}

.account-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-type-icon {
  font-size: 26px;
}

.account-type-badge {
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #38bdf8;
  font-size: 11px;
}

.account-card-body h4 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #ffffff;
}

.acc-number {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
  display: block;
  margin-bottom: 10px;
}

.account-balance small {
  font-size: 11px;
  color: #94a3b8;
  display: block;
}

.account-balance strong {
  font-size: 20px;
  font-weight: 800;
  color: #38bdf8;
}

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

.status-indicator.active i {
  background: #10b981;
}

.status-indicator.inactive i {
  background: #64748b;
}

.edit-acc-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}

.edit-acc-btn:hover {
  color: #38bdf8;
}
</style>
