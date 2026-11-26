<template>
  <div class="settings-tab-panel">
    <div class="panel-section-header">
      <div class="section-icon-badge">🏢</div>
      <div>
        <h2>الهوية والبيانات العامة للمنظومة</h2>
        <p>بيانات تعريف الوكالة التي تظهر في ترويسات التقارير، الرسائل الصادرة، وعقود العمل</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card">
        <label class="setting-label">
          <span>اسم الوكالة / الشركة الرسمية</span>
          <span class="badge-tag">عام</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">🏢</span>
          <input
            v-model="settingsForm.agency_name"
            type="text"
            class="form-control"
            placeholder="مثال: Octo Media"
          />
        </div>
        <small class="setting-hint">يظهر في الشريط العلوي وفواتير وملخصات الخطط</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">
          <span>الشعار النصي (Tagline)</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">✨</span>
          <input
            v-model="settingsForm.agency_tagline"
            type="text"
            class="form-control"
            placeholder="شعار أو نبذة مختصرة عن نشاط الوكالة"
          />
        </div>
        <small class="setting-hint">يظهر تحت اسم المنظومة في التقارير وواجهات الدخول</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">
          <span>البريد الإلكتروني الرسمي للإدارة</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">✉️</span>
          <input
            v-model="settingsForm.official_email"
            type="email"
            class="form-control"
            placeholder="contact@octomedia.com"
          />
        </div>
        <small class="setting-hint">البريد المعتمد لإرسال واستقبال المراسلات الرسمية</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">
          <span>رقم الهاتف المعتمد للمكتب</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">📞</span>
          <input
            v-model="settingsForm.official_phone"
            type="text"
            class="form-control"
            placeholder="+201000000000"
            dir="ltr"
          />
        </div>
        <small class="setting-hint">رقم التواصل المعتمد للعملاء وفريق العمل</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">
          <span>العملة الافتراضية للنظام</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">💱</span>
          <select v-model="settingsForm.default_currency" class="form-control">
            <option value="EGP">جنيه مصري (EGP)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="AED">درهم إماراتي (AED)</option>
            <option value="USD">دولار أمريكي (USD $)</option>
            <option value="EUR">يورو أوروبي (EUR €)</option>
            <option value="QAR">ريال قطري (QAR)</option>
            <option value="KWD">دينار كويتي (KWD)</option>
          </select>
        </div>
        <small class="setting-hint">العملة الأساسية المستخدمة في تسعير الباقات والمشاريع</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">
          <span>المنطقة الزمنية للمنظومة (Timezone)</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">🌍</span>
          <select v-model="settingsForm.system_timezone" class="form-control" dir="ltr">
            <option value="Africa/Cairo">Africa/Cairo (GMT+2 / +3)</option>
            <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
            <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
            <option value="UTC">UTC (Universal Time)</option>
            <option value="Europe/London">Europe/London (GMT+0 / +1)</option>
          </select>
        </div>
        <small class="setting-hint">تعتمد عليها جميع التواريخ وساعات التسليم والمواعيد النهائية</small>
      </div>

      <div class="setting-card full-span">
        <label class="setting-label">
          <span>بداية أسبوع العمل الرسمي</span>
        </label>
        <div class="input-with-icon">
          <span class="input-icon">📅</span>
          <select v-model="settingsForm.week_start_day" class="form-control">
            <option value="saturday">السبت (المعتمد في مصر والشرق الأوسط)</option>
            <option value="sunday">الأحد (المعتمد في دول الخليج)</option>
            <option value="monday">الإثنين (المعتمد عالمياً)</option>
          </select>
        </div>
        <small class="setting-hint">يحدد ترتيب أيام الأسبوع في التقويم وحساب ساعات الأسبوع</small>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  settingsForm: { type: Object, required: true },
});
</script>
