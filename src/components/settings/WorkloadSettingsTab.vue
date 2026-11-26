<template>
  <div class="settings-tab-panel">
    <div class="panel-section-header">
      <div class="section-icon-badge">⏱️</div>
      <div>
        <h2>سياسات الدوام وحِمل العمل (Workload Policies)</h2>
        <p>ضبط ساعات العمل اليومية، مواعيد الدوام الرسمي، أيام الإجازات، وحدود الضغط على الموظفين</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card">
        <div class="flex-between mb-2">
          <label class="setting-label">ساعات العمل اليومية القياسية</label>
          <span class="metric-badge">{{ settingsForm.default_daily_hours }} ساعات</span>
        </div>
        <div class="slider-wrapper">
          <input
            v-model.number="settingsForm.default_daily_hours"
            type="range"
            min="4"
            max="12"
            step="0.5"
            class="range-slider"
          />
          <div class="slider-ticks">
            <span>4 ساعات</span>
            <span>8 ساعات</span>
            <span>12 ساعة</span>
          </div>
        </div>
        <small class="setting-hint">الساعات المعيارية المقررة لكل موظف يومياً لاحتساب نسبة الطاقة والإنتاجية</small>
      </div>

      <div class="setting-card">
        <div class="flex-between mb-2">
          <label class="setting-label">مؤشر الضغط الزائد (Overload Threshold)</label>
          <span
            class="metric-badge"
            :class="{
              'badge-safe': settingsForm.overload_threshold_percentage <= 90,
              'badge-warning': settingsForm.overload_threshold_percentage > 90 && settingsForm.overload_threshold_percentage <= 110,
              'badge-danger': settingsForm.overload_threshold_percentage > 110
            }"
          >
            {{ settingsForm.overload_threshold_percentage }}%
          </span>
        </div>
        <div class="slider-wrapper">
          <input
            v-model.number="settingsForm.overload_threshold_percentage"
            type="range"
            min="70"
            max="150"
            step="5"
            class="range-slider"
          />
          <div class="slider-ticks">
            <span>70%</span>
            <span>100% (طبيعي)</span>
            <span>150%</span>
          </div>
        </div>
        <small class="setting-hint">النسبة المئوية التي عندها يتحول لون شريط مهام الموظف للتحذير من الإجهاد</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">مواعيد الدوام المكتبي الرسمي</label>
        <div class="time-range-group">
          <div class="time-input-col">
            <span class="sub-label">من الساعة (بداية العمل):</span>
            <input v-model="settingsForm.office_start_time" type="time" class="form-control" />
          </div>
          <div class="time-input-col">
            <span class="sub-label">إلى الساعة (نهاية العمل):</span>
            <input v-model="settingsForm.office_end_time" type="time" class="form-control" />
          </div>
        </div>
        <small class="setting-hint">نطاق ساعات العمل المكتبي لتوزيع التكليفات العاجلة</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">مهلة السماح قبل تسجيل تأخير التسليم</label>
        <div class="input-with-icon">
          <span class="input-icon">⏳</span>
          <select v-model.number="settingsForm.late_delivery_grace_minutes" class="form-control">
            <option :value="0">بدون مهلة (فور انتهاء الديدلاين)</option>
            <option :value="15">15 دقيقة</option>
            <option :value="30">30 دقيقة</option>
            <option :value="60">ساعة واحدة (60 دقيقة)</option>
            <option :value="120">ساعتان (120 دقيقة)</option>
            <option :value="240">4 ساعات</option>
          </select>
        </div>
        <small class="setting-hint">فترة مرونة تُمنح للموظف لرفع التصاميم والملفات قبل احتساب التأخير في التقارير</small>
      </div>

      <div class="setting-card full-span">
        <label class="setting-label">أيام الإجازات والعطلات الأسبوعية الرسمية</label>
        <p class="setting-subdesc">الأيام المحددة هنا يتم استثناؤها تلقائياً عند احتساب مواعيد التسليم وتوزيع المهام</p>
        <div class="days-chips-wrapper">
          <button
            v-for="day in weekDaysList"
            :key="day.id"
            type="button"
            class="day-chip"
            :class="{ 'day-selected': isWeekendSelected(day.id) }"
            @click="toggleWeekendDay(day.id)"
          >
            <span class="chip-check">{{ isWeekendSelected(day.id) ? '✓' : '＋' }}</span>
            <span>{{ day.name_ar }}</span>
          </button>
        </div>
        <small class="setting-hint">الأيام المحددة حالياً: {{ getWeekendDaysLabels() }}</small>
      </div>

      <div class="setting-card full-span flex-card">
        <div class="toggle-info">
          <strong class="toggle-title">ترحيل المهام التلقائي (Auto-Cascade Overdue Tasks)</strong>
          <p class="toggle-desc">
            عند تعثر إنجاز منشور أو مهمة في موعدها، هل يقوم النظام بترحيل المهام التالية المرتبطة بها تلقائياً لمنع التداخل؟
          </p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.auto_cascade_enabled" />
          <span class="slider-round"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  settingsForm: { type: Object, required: true },
});

const weekDaysList = [
  { id: 'friday', name_ar: 'الجمعة' },
  { id: 'saturday', name_ar: 'السبت' },
  { id: 'sunday', name_ar: 'الأحد' },
  { id: 'monday', name_ar: 'الإثنين' },
  { id: 'tuesday', name_ar: 'الثلاثاء' },
  { id: 'wednesday', name_ar: 'الأربعاء' },
  { id: 'thursday', name_ar: 'الخميس' },
];

const isWeekendSelected = (dayId) => {
  if (!Array.isArray(props.settingsForm.weekend_days)) return false;
  return props.settingsForm.weekend_days.includes(dayId);
};

const toggleWeekendDay = (dayId) => {
  if (!Array.isArray(props.settingsForm.weekend_days)) {
    props.settingsForm.weekend_days = [];
  }
  const idx = props.settingsForm.weekend_days.indexOf(dayId);
  if (idx === -1) {
    props.settingsForm.weekend_days.push(dayId);
  } else {
    props.settingsForm.weekend_days.splice(idx, 1);
  }
};

const getWeekendDaysLabels = () => {
  if (!Array.isArray(props.settingsForm.weekend_days) || props.settingsForm.weekend_days.length === 0) {
    return 'لا توجد عطلات محددة';
  }
  return props.settingsForm.weekend_days
    .map((d) => weekDaysList.find((item) => item.id === d)?.name_ar || d)
    .join(' ، ');
};
</script>
