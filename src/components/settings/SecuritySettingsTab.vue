<template>
  <div class="settings-tab-panel">
    <div class="panel-section-header">
      <div class="section-icon-badge">🔒</div>
      <div>
        <h2>الأمان وسياسات الاحتفاظ بالبيانات</h2>
        <p>ضبط أمن الجلسات، مهلة سلة المهملات، أرشيف النشاطات، ووضع الطوارئ والصيانة</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card">
        <label class="setting-label">مدة بقاء جلسة تسجيل الدخول</label>
        <div class="input-with-icon">
          <span class="input-icon">⌛</span>
          <select v-model.number="settingsForm.session_lifetime_hours" class="form-control">
            <option :value="12">12 ساعة</option>
            <option :value="24">24 ساعة (يوم كامل - مستحسن)</option>
            <option :value="72">3 أيام</option>
            <option :value="168">7 أيام (أسبوع)</option>
            <option :value="720">30 يوماً (شهر)</option>
          </select>
        </div>
        <small class="setting-hint">المدة التي يظل فيها حساب المستخدم مسجلاً للدخول قبل المطالبة بإعادة المصادقة</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">مهلة سلة المهملات قبل الحذف النهائي</label>
        <div class="input-with-icon">
          <span class="input-icon">🗑️</span>
          <select v-model.number="settingsForm.trash_retention_days" class="form-control">
            <option :value="0">حفظ دائم (لا يتم الحذف التلقائي أبداً)</option>
            <option :value="7">7 أيام</option>
            <option :value="15">15 يوماً</option>
            <option :value="30">30 يوماً (شهر كامل - مستحسن)</option>
            <option :value="60">60 يوماً</option>
            <option :value="90">90 يوماً</option>
          </select>
        </div>
        <small class="setting-hint">الفترة التي تظل فيها العناصر المحذوفة في السلة قابلة للاستعادة قبل إتلافها</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">فترة الاحتفاظ بسجل النشاطات (Audit Log)</label>
        <div class="input-with-icon">
          <span class="input-icon">📜</span>
          <select v-model.number="settingsForm.audit_log_retention_days" class="form-control">
            <option :value="30">30 يوماً</option>
            <option :value="90">90 يوماً (3 أشهر)</option>
            <option :value="180">180 يوماً (6 أشهر - مستحسن)</option>
            <option :value="365">سنة كاملة (365 يوماً)</option>
          </select>
        </div>
        <small class="setting-hint">مدة حفظ سجل التعديلات وتسجيلات الدخول لأغراض التدقيق الإداري</small>
      </div>

      <div class="setting-card full-span critical-card">
        <div class="critical-header">
          <div class="critical-icon">🚨</div>
          <div>
            <h3 class="critical-title">وضع تجميد المنظومة والصيانة (Emergency System Freeze)</h3>
            <p class="critical-desc">
              عند تفعيل هذا الخيار، يتم قفل المنظومة بالكامل وتحويلها إلى وضع القراءة فقط لجميع الموظفين.
              يمنع إنشاء أو تعديل أي مهام أو خطط أو رفع أي ملفات، مع السماح فقط للمدير بإجراء الصيانة أو التحديثات.
            </p>
          </div>
        </div>
        <div class="critical-action-row">
          <div class="critical-status-text">
            الحالة الحالية:
            <strong :class="settingsForm.system_freeze_mode ? 'text-danger' : 'text-success'">
              {{ settingsForm.system_freeze_mode ? 'مجمّد ومقفل 🔒' : 'المنظومة تعمل بشكل طبيعي ✅' }}
            </strong>
          </div>
          <label class="switch-toggle danger-toggle">
            <input type="checkbox" v-model="settingsForm.system_freeze_mode" />
            <span class="slider-round"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  settingsForm: { type: Object, required: true },
});
</script>
