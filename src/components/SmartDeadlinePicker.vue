<template>
  <div class="smart-deadline-cell" ref="cellTriggerRef" @mousedown.stop>
    <!-- 1. عرض الديدلاين داخل خلية الجدول (Cell Trigger) -->
    <div class="deadline-pill-wrapper">
      <!-- في حال لا يوجد ديدلاين محدد -->
      <button
        v-if="!modelValue"
        type="button"
        class="deadline-empty-btn"
        :class="{ disabled: disabled }"
        :disabled="disabled"
        @click.stop="openPicker"
        title="انقر لتعيين الديدلاين وتوقيت الإنجاز"
      >
        <span class="btn-icon">📅</span>
        <span class="btn-text">تعيين ديدلاين</span>
      </button>

      <!-- في حال تم تحديد ديدلاين مسبقاً -->
      <div
        v-else
        class="deadline-active-chip"
        role="button"
        tabindex="0"
        :class="{
          disabled: disabled,
          'is-overdue': deadlineStatus.isOverdue,
          [deadlineStatus.class]: true
        }"
        @click.stop="!disabled && openPicker($event)"
        @keydown.enter="!disabled && openPicker($event)"
        @keydown.space.prevent="!disabled && openPicker($event)"
        :title="disabled ? 'تم قفل هذا الحقل' : 'انقر لتعديل الديدلاين والتوقيت'"
      >
        <div class="chip-main">
          <span class="chip-calendar-icon">⏰</span>
          <span class="chip-date-text">{{ formattedDateDisplay }}</span>
          <span class="chip-time-badge" dir="ltr">{{ formattedTimeDisplay }}</span>
        </div>

        <!-- زر الحذف السريع عند التحويم -->
        <button
          v-if="!disabled"
          type="button"
          class="chip-quick-clear"
          @click.stop="clearDeadline"
          title="مسح الديدلاين"
        >
          ×
        </button>
      </div>

      <!-- مؤشر القفل الإداري إن وُجد -->
      <span
        v-if="isLocked"
        class="lock-indicator"
        :class="{ 'clickable-lock': isManager }"
        @click.stop="$emit('unlock')"
        :title="isManager ? 'اضغط لفك القفل وإتاحته للموظفين' : 'تم تثبيت هذا الحقل من قِبل الإدارة'"
      >
        🔒
      </span>
    </div>

    <!-- 2. النافذة المنبثقة الذكية (Floating Teleported Popover) -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="deadline-popover-overlay"
        @click.self="closePicker"
      >
        <div
          class="deadline-popover-card"
          :style="popoverPositionStyle"
          ref="popoverCardRef"
          dir="rtl"
        >
          <!-- رأس النافذة -->
          <div class="popover-header">
            <div class="header-title">
              <span class="header-icon">⏱️</span>
              <div>
                <h4>تحديد موعد الديدلاين</h4>
                <p>اختر التاريخ والتوقيت بدقة وبدون أي تأخير زمني</p>
              </div>
            </div>
            <button type="button" class="close-btn" @click="closePicker">✕</button>
          </div>

          <!-- شريط الاختصارات السريعة (Quick Presets) -->
          <div class="quick-presets-strip">
            <span class="presets-label">اختصارات سريعة:</span>
            <div class="presets-buttons">
              <button
                type="button"
                class="preset-pill"
                @click="applyPreset('today_5pm')"
                title="اليوم الساعة 5 مساءً"
              >
                ⚡ اليوم 5:00 م
              </button>
              <button
                type="button"
                class="preset-pill"
                @click="applyPreset('today_night')"
                title="اليوم نهاية اليوم 11:59 م"
              >
                🌙 نهاية اليوم
              </button>
              <button
                type="button"
                class="preset-pill"
                @click="applyPreset('tomorrow_noon')"
                title="غداً الساعة 12:00 ظهراً"
              >
                🌅 غداً 12:00 م
              </button>
              <button
                type="button"
                class="preset-pill"
                @click="applyPreset('tomorrow_5pm')"
                title="غداً الساعة 5:00 مساءً"
              >
                🏢 غداً 5:00 م
              </button>
              <button
                type="button"
                class="preset-pill"
                @click="applyPreset('in_3_days')"
                title="بعد 3 أيام"
              >
                ⏳ بعد 3 أيام
              </button>
            </div>
          </div>

          <!-- جسم النافذة: التاريخ + التوقيت جنب إلى جنب -->
          <div class="popover-body">
            <!-- 1. قسم التاريخ (التقويم المصغر) -->
            <div class="calendar-section">
              <div class="section-subtitle">
                <span>📅</span> التاريخ
              </div>

              <!-- رأس التقويم للشهر والسنة والتنقل -->
              <div class="cal-nav-bar">
                <button type="button" class="nav-arrow" @click="changeMonth(1)">‹</button>
                <div class="current-month-label">
                  <strong>{{ monthNames[currentCalMonth] }}</strong> {{ currentCalYear }}
                </div>
                <button type="button" class="nav-arrow" @click="changeMonth(-1)">›</button>
              </div>

              <!-- أسماء أيام الأسبوع -->
              <div class="cal-weekdays">
                <span v-for="day in weekDays" :key="day">{{ day }}</span>
              </div>

              <!-- شبكة أيام الشهر -->
              <div class="cal-days-grid">
                <button
                  v-for="(dayObj, idx) in calendarDays"
                  :key="idx"
                  type="button"
                  class="cal-day-cell"
                  :class="{
                    'other-month': !dayObj.isCurrentMonth,
                    'is-today': dayObj.isToday,
                    'is-selected': dayObj.isSelected
                  }"
                  :disabled="!dayObj.isCurrentMonth"
                  @click="selectDay(dayObj)"
                >
                  {{ dayObj.dayNumber }}
                </button>
              </div>
            </div>

            <!-- 2. قسم التوقيت (احترافي وبدون أي انعكاس LTR) -->
            <div class="time-section">
              <div class="section-subtitle">
                <span>⏰</span> توقيت الاستحقاق (الساعة)
              </div>

              <!-- اختصارات التوقيت السريعة -->
              <div class="time-chips-grid">
                <button
                  v-for="chip in timeChips"
                  :key="chip.label"
                  type="button"
                  class="time-chip"
                  :class="{ active: isChipActive(chip) }"
                  @click="applyTimeChip(chip)"
                >
                  <span dir="ltr">{{ chip.display }}</span>
                </button>
              </div>

              <!-- عناصر تحكم الساعة والدقائق بصيغة 12 ساعة LTR -->
              <div class="time-picker-controls" dir="ltr">
                <!-- الساعات -->
                <div class="control-box">
                  <label>الساعة</label>
                  <div class="stepper-wrap">
                    <button type="button" class="step-btn" @click="stepHour(1)">▲</button>
                    <input
                      type="text"
                      class="step-input"
                      v-model="displayHour"
                      @blur="sanitizeHour"
                      @keydown.up.prevent="stepHour(1)"
                      @keydown.down.prevent="stepHour(-1)"
                      maxlength="2"
                    />
                    <button type="button" class="step-btn" @click="stepHour(-1)">▼</button>
                  </div>
                </div>

                <div class="time-colon">:</div>

                <!-- الدقائق -->
                <div class="control-box">
                  <label>الدقيقة</label>
                  <div class="stepper-wrap">
                    <button type="button" class="step-btn" @click="stepMinute(5)">▲</button>
                    <input
                      type="text"
                      class="step-input"
                      v-model="displayMinute"
                      @blur="sanitizeMinute"
                      @keydown.up.prevent="stepMinute(5)"
                      @keydown.down.prevent="stepMinute(-5)"
                      maxlength="2"
                    />
                    <button type="button" class="step-btn" @click="stepMinute(-5)">▼</button>
                  </div>
                </div>

                <!-- مفتاح صباحاً / مساءً -->
                <div class="control-box ampm-box">
                  <label>الفترة</label>
                  <div class="ampm-toggle">
                    <button
                      type="button"
                      class="ampm-btn"
                      :class="{ active: selectedPeriod === 'AM' }"
                      @click="selectedPeriod = 'AM'"
                    >
                      ص (AM)
                    </button>
                    <button
                      type="button"
                      class="ampm-btn"
                      :class="{ active: selectedPeriod === 'PM' }"
                      @click="selectedPeriod = 'PM'"
                    >
                      م (PM)
                    </button>
                  </div>
                </div>
              </div>

              <!-- معاينة الوقت الحي باللغة العربية -->
              <div class="live-preview-box" dir="rtl">
                <span class="preview-caption">الموعد المحدد:</span>
                <strong class="preview-text">
                  {{ livePreviewFullText }}
                </strong>
              </div>
            </div>
          </div>

          <!-- تذييل النافذة (Actions) -->
          <div class="popover-footer">
            <button
              v-if="modelValue"
              type="button"
              class="footer-clear-btn"
              @click="clearDeadline"
            >
              🗑️ مسح الديدلاين
            </button>
            <div class="footer-right-actions">
              <button type="button" class="footer-cancel-btn" @click="closePicker">إلغاء</button>
              <button type="button" class="footer-save-btn" @click="saveAndApply">
                تأكيد وحفظ 💾
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { getDeadlineStatus } from '../utils/timeHelper';

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isManager: {
    type: Boolean,
    default: false
  },
  post: {
    type: Object,
    default: () => ({})
  },
  executionStartedAt: {
    type: [String, Date],
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'change', 'unlock']);

// الحالة للنافذة المنبثقة
const isOpen = ref(false);
const cellTriggerRef = ref(null);
const popoverCardRef = ref(null);
const popoverPositionStyle = ref({});

// أسماء الشهور والأيام باللغة العربية
const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
const weekDays = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

// الحالة الداخلية للتاريخ والتوقيت
const currentCalYear = ref(new Date().getFullYear());
const currentCalMonth = ref(new Date().getMonth());
const selectedDateStr = ref(''); // YYYY-MM-DD
const selectedHour12 = ref(5); // 1-12
const selectedMinute = ref(0); // 0-59
const selectedPeriod = ref('PM'); // AM or PM

// قوالب توقيت سريعة
const timeChips = [
  { label: 'morning', hour: 9, min: 0, period: 'AM', display: '09:00 AM' },
  { label: 'noon', hour: 12, min: 0, period: 'PM', display: '12:00 PM' },
  { label: 'afternoon', hour: 3, min: 0, period: 'PM', display: '03:00 PM' },
  { label: 'evening', hour: 5, min: 0, period: 'PM', display: '05:00 PM' },
  { label: 'night', hour: 9, min: 0, period: 'PM', display: '09:00 PM' },
  { label: 'midnight', hour: 11, min: 59, period: 'PM', display: '11:59 PM' }
];

// دالة تحليل وتفكيك أي نص ديدلاين بدون الوقوع في فخ التوقيت UTC
const parseParts = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  const match = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[T\s](\d{2}):(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const d = parseInt(match[3], 10);
    const h24 = parseInt(match[4], 10);
    const min = parseInt(match[5], 10);

    let period = 'AM';
    let h12 = h24;
    if (h24 >= 12) {
      period = 'PM';
      if (h24 > 12) h12 = h24 - 12;
    } else if (h24 === 0) {
      h12 = 12;
    }

    return {
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      year: y,
      month: m - 1,
      day: d,
      hour12: h12,
      minute: min,
      period
    };
  }

  // في حال كان كائن تاريخ
  const d = new Date(val);
  if (!isNaN(d)) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const h24 = d.getHours();
    const min = d.getMinutes();

    let period = 'AM';
    let h12 = h24;
    if (h24 >= 12) {
      period = 'PM';
      if (h24 > 12) h12 = h24 - 12;
    } else if (h24 === 0) {
      h12 = 12;
    }

    return {
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      year: y,
      month: m,
      day,
      hour12: h12,
      minute: min,
      period
    };
  }

  return null;
};

// تنسيق العرض داخل خلية الجدول
const formattedDateDisplay = computed(() => {
  const p = parseParts(props.modelValue);
  if (!p) return '';
  const monthName = monthNames[p.month] || '';
  return `${p.day} ${monthName}`;
});

const formattedTimeDisplay = computed(() => {
  const p = parseParts(props.modelValue);
  if (!p) return '';
  const h = String(p.hour12).padStart(2, '0');
  const m = String(p.minute).padStart(2, '0');
  const suffix = p.period === 'AM' ? 'ص' : 'م';
  return `${h}:${m} ${suffix}`;
});

// حالة الـ SLA الحالية
const deadlineStatus = computed(() => {
  const start = props.executionStartedAt || props.post.created_at || props.post.start_date;
  const status = props.post.delivered_at ? 'completed' : 'pending';
  return getDeadlineStatus(start, props.modelValue, status);
});

// مصفوفة أيام التقويم للشهر المفتوح
const calendarDays = computed(() => {
  const year = currentCalYear.value;
  const month = currentCalMonth.value;

  // اليوم الأول في الشهر
  const firstDay = new Date(year, month, 1);
  // في نظامنا العربي: السبت هو 6 في دالة getDay() الخاصة بـ JS
  // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
  // نريد: Sat = 0, Sun = 1, Mon = 2, Tue = 3, Wed = 4, Thu = 5, Fri = 6
  let startingDayOfWeek = (firstDay.getDay() + 1) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // أيام الشهر السابق
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      dayNumber: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateStr: ''
    });
  }

  // أيام الشهر الحالي
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateStr: dStr,
      isToday: dStr === todayStr,
      isSelected: dStr === selectedDateStr.value
    });
  }

  // إكمال الأسبوع الأخير
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateStr: ''
    });
  }

  return days;
});

// الحقول النصية لمدخلات الساعة والدقائق
const displayHour = computed({
  get: () => String(selectedHour12.value).padStart(2, '0'),
  set: (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      selectedHour12.value = num;
    }
  }
});

const displayMinute = computed({
  get: () => String(selectedMinute.value).padStart(2, '0'),
  set: (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      selectedMinute.value = num;
    }
  }
});

const sanitizeHour = () => {
  if (selectedHour12.value < 1 || selectedHour12.value > 12) {
    selectedHour12.value = 12;
  }
};

const sanitizeMinute = () => {
  if (selectedMinute.value < 0 || selectedMinute.value > 59) {
    selectedMinute.value = 0;
  }
};

// التنقل بين الشهور
const changeMonth = (delta) => {
  let m = currentCalMonth.value + delta;
  let y = currentCalYear.value;
  if (m < 0) {
    m = 11;
    y--;
  } else if (m > 11) {
    m = 0;
    y++;
  }
  currentCalMonth.value = m;
  currentCalYear.value = y;
};

// اختيار يوم
const selectDay = (dayObj) => {
  if (!dayObj.isCurrentMonth || !dayObj.dateStr) return;
  selectedDateStr.value = dayObj.dateStr;
};

// تغيير الساعات والدقائق
const stepHour = (delta) => {
  let h = selectedHour12.value + delta;
  if (h > 12) h = 1;
  else if (h < 1) h = 12;
  selectedHour12.value = h;
};

const stepMinute = (delta) => {
  let m = selectedMinute.value + delta;
  if (m > 59) m = 0;
  else if (m < 0) m = 55;
  selectedMinute.value = m;
};

// فحص الشريحة النشطة
const isChipActive = (chip) => {
  return (
    selectedHour12.value === chip.hour &&
    selectedMinute.value === chip.min &&
    selectedPeriod.value === chip.period
  );
};

const applyTimeChip = (chip) => {
  selectedHour12.value = chip.hour;
  selectedMinute.value = chip.min;
  selectedPeriod.value = chip.period;
};

// تطبيق اختصارات الديدلاين السريعة (Presets)
const applyPreset = (presetType) => {
  const now = new Date();
  let target = new Date();

  switch (presetType) {
    case 'today_5pm':
      selectedHour12.value = 5;
      selectedMinute.value = 0;
      selectedPeriod.value = 'PM';
      break;
    case 'today_night':
      selectedHour12.value = 11;
      selectedMinute.value = 59;
      selectedPeriod.value = 'PM';
      break;
    case 'tomorrow_noon':
      target.setDate(now.getDate() + 1);
      selectedHour12.value = 12;
      selectedMinute.value = 0;
      selectedPeriod.value = 'PM';
      break;
    case 'tomorrow_5pm':
      target.setDate(now.getDate() + 1);
      selectedHour12.value = 5;
      selectedMinute.value = 0;
      selectedPeriod.value = 'PM';
      break;
    case 'in_3_days':
      target.setDate(now.getDate() + 3);
      selectedHour12.value = 5;
      selectedMinute.value = 0;
      selectedPeriod.value = 'PM';
      break;
  }

  const y = target.getFullYear();
  const m = target.getMonth();
  const d = target.getDate();

  currentCalYear.value = y;
  currentCalMonth.value = m;
  selectedDateStr.value = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

// نص المعاينة الحية الكامل
const livePreviewFullText = computed(() => {
  if (!selectedDateStr.value) return 'يرجى تحديد تاريخ أولاً';
  const parts = selectedDateStr.value.split('-');
  if (parts.length !== 3) return '';

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const dateObj = new Date(y, m, d);
  const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayName = daysArabic[dateObj.getDay()] || '';
  const monthName = monthNames[m] || '';

  const h = String(selectedHour12.value).padStart(2, '0');
  const min = String(selectedMinute.value).padStart(2, '0');
  const periodText = selectedPeriod.value === 'AM' ? 'صباحاً' : 'مساءً';

  return `${dayName}، ${d} ${monthName} ${y} • ${h}:${min} ${periodText}`;
});

// فتح الـ Popover وتحديد موضعه على الشاشة بدقة
const openPicker = (e) => {
  if (props.disabled) return;

  // استخراج القيم الحالية
  const parsed = parseParts(props.modelValue);
  if (parsed) {
    selectedDateStr.value = parsed.dateStr;
    currentCalYear.value = parsed.year;
    currentCalMonth.value = parsed.month;
    selectedHour12.value = parsed.hour12;
    selectedMinute.value = parsed.minute;
    selectedPeriod.value = parsed.period;
  } else {
    // القيمة الافتراضية: اليوم عند الساعة 5 مساءً
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    currentCalYear.value = y;
    currentCalMonth.value = m;
    selectedDateStr.value = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    selectedHour12.value = 5;
    selectedMinute.value = 0;
    selectedPeriod.value = 'PM';
  }

  // حساب موضع العنصر في الشاشة
  const targetEl = cellTriggerRef.value || e?.currentTarget?.closest('.smart-deadline-cell') || e?.target;
  if (targetEl && typeof targetEl.getBoundingClientRect === 'function') {
    const rect = targetEl.getBoundingClientRect();
    const popoverWidth = 460;
    const popoverHeight = 440;

    let top = rect.bottom + 6;
    let left = rect.left - (popoverWidth - rect.width) / 2;

    // حماية ضد الخروج خارج أطراف الشاشة
    if (left + popoverWidth > window.innerWidth - 20) {
      left = window.innerWidth - popoverWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // إذا كان الموضع أسفل الشاشة جداً، نفتحه لأعلى
    if (top + popoverHeight > window.innerHeight - 20) {
      top = Math.max(20, rect.top - popoverHeight - 6);
    }

    popoverPositionStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 99999
    };
  }

  isOpen.value = true;
};

const closePicker = () => {
  isOpen.value = false;
};

// حفظ وتطبيق القيمة
const saveAndApply = () => {
  if (!selectedDateStr.value) {
    closePicker();
    return;
  }

  // تحويل 12h إلى 24h
  let h24 = selectedHour12.value % 12;
  if (selectedPeriod.value === 'PM') {
    h24 += 12;
  }

  const hStr = String(h24).padStart(2, '0');
  const mStr = String(selectedMinute.value).padStart(2, '0');

  // نص ثابت بنمط YYYY-MM-DD HH:mm:00 محمي 100% من التلاعب بالمنطقة الزمنية
  const finalValue = `${selectedDateStr.value} ${hStr}:${mStr}:00`;

  emit('update:modelValue', finalValue);
  emit('change', finalValue);
  closePicker();
};

// مسح الديدلاين
const clearDeadline = () => {
  emit('update:modelValue', null);
  emit('change', null);
  closePicker();
};
</script>

<style scoped>
.smart-deadline-cell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  user-select: none;
  cursor: pointer;
}

.deadline-pill-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
}

/* الزر الفارغ */
.deadline-empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: rgba(240, 243, 249, 0.7);
  border: 1px dashed #b0bec5;
  border-radius: 6px;
  padding: 5px 8px;
  color: #546e7a;
  font-size: 10.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.deadline-empty-btn * {
  pointer-events: none;
}

.deadline-empty-btn:hover:not(.disabled) {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
  transform: translateY(-1px);
}

.deadline-empty-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-style: solid;
}

/* الشارة النشطة ذات الديدلاين المحدد */
.deadline-active-chip {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #cfd8dc;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  outline: none;
}

.deadline-active-chip .chip-main,
.deadline-active-chip .chip-main * {
  pointer-events: none;
}

.deadline-active-chip:hover:not(.disabled) {
  border-color: #1976d2;
  box-shadow: 0 2px 6px rgba(25, 118, 210, 0.15);
  transform: translateY(-1px);
}

.deadline-active-chip.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.chip-main {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  white-space: nowrap;
}

.chip-calendar-icon {
  font-size: 11px;
}

.chip-date-text {
  font-size: 10px;
  font-weight: 700;
  color: #263238;
}

.chip-time-badge {
  font-size: 9.5px;
  font-weight: 800;
  background: #eceff1;
  color: #37474f;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #cfd8dc;
  letter-spacing: 0.3px;
}

/* حالة التأخير */
.deadline-active-chip.is-overdue {
  background: #fff5f5;
  border-color: #ffcdd2;
}
.deadline-active-chip.is-overdue .chip-time-badge {
  background: #ffebee;
  color: #c62828;
  border-color: #ef9a9a;
}
.deadline-active-chip.is-overdue .chip-date-text {
  color: #b71c1c;
}

/* زر الحذف السريع على الشارة */
.chip-quick-clear {
  background: transparent;
  border: none;
  color: #90a4ae;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
  border-radius: 50%;
  transition: all 0.15s;
  pointer-events: auto !important;
}

.chip-quick-clear:hover {
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.1);
}

/* ========================================================= */
/* النافذة المنبثقة الذكية (Floating Teleported Popover) */
/* ========================================================= */
.deadline-popover-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: rgba(4, 7, 24, 0.45);
  backdrop-filter: blur(2px);
}

.deadline-popover-card {
  width: 480px;
  max-width: calc(100vw - 20px);
  background: #0f1638;
  border: 1px solid rgba(125, 232, 220, 0.3);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 25px rgba(101, 181, 255, 0.15);
  color: #e2e8f0;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  animation: popoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* رأس النافذة */
.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(18, 25, 62, 0.8);
  border-bottom: 1px solid rgba(137, 153, 226, 0.15);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
}

.header-title h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #f1f5f9;
}

.header-title p {
  margin: 2px 0 0;
  font-size: 10px;
  color: #94a3b8;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 11px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

/* شريط الاختصارات */
.quick-presets-strip {
  padding: 8px 14px;
  background: rgba(12, 17, 45, 0.6);
  border-bottom: 1px solid rgba(137, 153, 226, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
}

.presets-label {
  font-size: 10px;
  font-weight: 700;
  color: #7de8dc;
  white-space: nowrap;
}

.presets-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;
}

.preset-pill {
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #cbd5e1;
  font-size: 9.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.preset-pill:hover {
  background: rgba(125, 232, 220, 0.2);
  border-color: #7de8dc;
  color: #fff;
  transform: translateY(-1px);
}

/* جسم النافذة */
.popover-body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 12px;
  padding: 14px;
}

.section-subtitle {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* التقويم */
.calendar-section {
  background: rgba(18, 25, 62, 0.5);
  border: 1px solid rgba(137, 153, 226, 0.12);
  border-radius: 10px;
  padding: 10px;
}

.cal-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.current-month-label {
  font-size: 11px;
  font-weight: 700;
  color: #f1f5f9;
}

.nav-arrow {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  display: grid;
  place-items: center;
  transition: all 0.2s;
}

.nav-arrow:hover {
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
  border-color: #7de8dc;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
  font-size: 9.5px;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 4px;
}

.cal-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.cal-day-cell {
  background: transparent;
  border: 1px solid transparent;
  color: #cbd5e1;
  font-size: 10px;
  font-weight: 700;
  height: 24px;
  border-radius: 5px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s;
}

.cal-day-cell:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
}

.cal-day-cell.other-month {
  color: #334155;
  cursor: default;
}

.cal-day-cell.is-today {
  border-color: rgba(125, 232, 220, 0.4);
  color: #7de8dc;
}

.cal-day-cell.is-selected {
  background: linear-gradient(135deg, #7de8dc, #65b5ff);
  color: #0b1131;
  font-weight: 900;
  box-shadow: 0 0 10px rgba(125, 232, 220, 0.4);
}

/* قسم التوقيت */
.time-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-chips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.time-chip {
  background: rgba(18, 25, 62, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.15);
  color: #94a3b8;
  font-size: 9.5px;
  font-weight: 700;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.time-chip:hover {
  background: rgba(101, 181, 255, 0.15);
  color: #fff;
  border-color: #65b5ff;
}

.time-chip.active {
  background: rgba(101, 181, 255, 0.25);
  border-color: #65b5ff;
  color: #65b5ff;
  font-weight: 900;
}

/* محدد الوقت LTR */
.time-picker-controls {
  background: rgba(18, 25, 62, 0.5);
  border: 1px solid rgba(137, 153, 226, 0.12);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.control-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.control-box label {
  font-size: 9px;
  color: #64748b;
  font-weight: 700;
}

.stepper-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.step-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 32px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 9px;
  display: grid;
  place-items: center;
  transition: all 0.15s;
}

.step-btn:hover {
  background: rgba(101, 181, 255, 0.2);
  color: #65b5ff;
  border-color: #65b5ff;
}

.step-input {
  width: 36px;
  height: 30px;
  background: rgba(11, 17, 49, 0.8);
  border: 1px solid rgba(101, 181, 255, 0.3);
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 15px;
  font-weight: 900;
  text-align: center;
  font-family: monospace;
}

.step-input:focus {
  outline: none;
  border-color: #7de8dc;
  box-shadow: 0 0 8px rgba(125, 232, 220, 0.3);
}

.time-colon {
  font-size: 18px;
  font-weight: 900;
  color: #7de8dc;
  margin-top: 15px;
}

/* زر صباحاً ومساءً */
.ampm-box {
  margin-left: 6px;
}

.ampm-toggle {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ampm-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  padding: 5px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.ampm-btn:hover {
  color: #fff;
  border-color: #65b5ff;
}

.ampm-btn.active {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-color: #818cf8;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

/* معاينة الوقت الحي */
.live-preview-box {
  background: rgba(125, 232, 220, 0.06);
  border: 1px dashed rgba(125, 232, 220, 0.25);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preview-caption {
  font-size: 9px;
  color: #7de8dc;
  font-weight: 700;
}

.preview-text {
  font-size: 11px;
  color: #f1f5f9;
  font-weight: 800;
  line-height: 1.4;
}

/* تذييل النافذة */
.popover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(18, 25, 62, 0.8);
  border-top: 1px solid rgba(137, 153, 226, 0.15);
}

.footer-clear-btn {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 10px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.footer-clear-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fff;
}

.footer-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
}

.footer-cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.footer-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

.footer-save-btn {
  background: linear-gradient(135deg, #7de8dc, #3b82f6);
  border: none;
  color: #0b1131;
  font-size: 11px;
  font-weight: 900;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(125, 232, 220, 0.3);
}

.footer-save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(125, 232, 220, 0.45);
}
</style>
