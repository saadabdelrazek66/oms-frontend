<template>
  <div class="settings-tab-panel">
    <div class="panel-section-header">
      <div class="section-icon-badge">🔔</div>
      <div>
        <h2>إعدادات التنبيهات ورسائل الواتساب</h2>
        <p>إدارة فترات الإنذار بالمواعيد النهائية، المؤثرات الصوتية، وقوالب رسائل الواتساب التلقائية</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card flex-card full-span">
        <div class="toggle-info">
          <strong class="toggle-title">المؤثرات الصوتية للتنبيهات (Notification Sound Effects)</strong>
          <p class="toggle-desc">تشغيل نغمة صوتية خفيفة عند وصول تكليف جديد أو تنبيه باقتراب الديدلاين</p>
        </div>
        <div class="flex-align-center gap-3">
          <button
            type="button"
            class="btn btn-secondary-subtle btn-sm"
            title="تجربة النغمة الصوتية"
            @click="playTestSound"
          >
            🔊 تجربة الصوت
          </button>
          <label class="switch-toggle">
            <input type="checkbox" v-model="settingsForm.sound_effects_enabled" />
            <span class="slider-round"></span>
          </label>
        </div>
      </div>

      <div class="setting-card flex-card full-span">
        <div class="toggle-info">
          <strong class="toggle-title">تفعيل إشعارات الواتساب الرسمية (WhatsApp Notifications)</strong>
          <p class="toggle-desc">إرسال إشعارات فورية عبر الواتساب للمدير أو العميل عند اعتماد الخطط أو حدوث تأخيرات</p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.whatsapp_notifications_enabled" />
          <span class="slider-round"></span>
        </label>
      </div>

      <div class="setting-card">
        <label class="setting-label">رقم واتساب الإدارة المعتمد لاستقبال التقارير</label>
        <div class="input-with-icon">
          <span class="input-icon">📱</span>
          <input
            v-model="settingsForm.admin_whatsapp_number"
            type="text"
            class="form-control"
            placeholder="+201000000000"
            dir="ltr"
          />
        </div>
        <small class="setting-hint">الرقم المخصص لتلقي ملخصات الأداء اليومية وإشعارات الطوارئ</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">فترات التنبيه التلقائي قبل الديدلاين</label>
        <div class="alert-intervals-tags">
          <span
            v-for="hours in [24, 12, 6, 2, 1]"
            :key="hours"
            class="interval-chip"
            :class="{ 'interval-active': isIntervalSelected(hours) }"
            @click="toggleInterval(hours)"
          >
            {{ hours === 24 ? 'قبل 24 ساعة (يوم)' : `قبل ${hours} ساعات` }}
            <span class="chip-status">{{ isIntervalSelected(hours) ? '✓' : '＋' }}</span>
          </span>
        </div>
        <small class="setting-hint">يتم إرسال إشعار للنظام والواتساب عند دخول المنشور في هذه النوافذ الزمنية</small>
      </div>

      <div class="setting-card full-span whatsapp-preview-grid">
        <div class="whatsapp-editor-side">
          <label class="setting-label">تذييل رسائل الواتساب التلقائية (Custom Footer)</label>
          <textarea
            v-model="settingsForm.whatsapp_custom_footer"
            rows="4"
            class="form-control"
            placeholder="نص التوقيع أو التحية في نهاية كل رسالة واتساب..."
          ></textarea>
          <small class="setting-hint">يظهر هذا النص كخاتمة رسمية موثقة في نهاية كل رسالة تنبيه صادرة من السيستم</small>
        </div>

        <div class="whatsapp-preview-side">
          <span class="preview-tag">معاينة شكل الرسالة على الهاتف 📲</span>
          <div class="mock-whatsapp-bubble">
            <div class="bubble-header">
              <strong>Octo Media Bot 🤖</strong>
            </div>
            <div class="bubble-content">
              <p>مرحباً بك! تم اعتماد منشور "حملة إطلاق المنتج الجديد" بنجاح ✅</p>
              <hr class="bubble-divider" />
              <p class="bubble-footer-text">{{ settingsForm.whatsapp_custom_footer || 'مع تحيات فريق إدارة Octo Media' }}</p>
            </div>
            <div class="bubble-time">13:45 ✓✓</div>
          </div>
        </div>
      </div>

      <div class="setting-card full-span flex-card templates-cta-card">
        <div class="toggle-info">
          <strong class="toggle-title">💬 قوالب رسائل التنبيهات والواتساب الموحدة (25 قالب)</strong>
          <p class="toggle-desc">تخصيص صياغة ومحتوى جميع الرسائل والتنبيهات التلقائية المرسلة للموظفين والعملاء والإدارة في صفحة مستقلة مع فحص الصياغة والمعاينة الحية.</p>
        </div>
        <router-link to="/settings/notification-templates" class="btn btn-primary">
          <span>فتح صفحة قوالب الرسائل ↗</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import alertService from '@/services/alertService';

const props = defineProps({
  settingsForm: { type: Object, required: true },
});

const isIntervalSelected = (hours) => {
  if (!Array.isArray(props.settingsForm.deadline_alert_intervals)) return false;
  return props.settingsForm.deadline_alert_intervals.includes(hours);
};

const toggleInterval = (hours) => {
  if (!Array.isArray(props.settingsForm.deadline_alert_intervals)) {
    props.settingsForm.deadline_alert_intervals = [];
  }
  const idx = props.settingsForm.deadline_alert_intervals.indexOf(hours);
  if (idx === -1) {
    props.settingsForm.deadline_alert_intervals.push(hours);
    props.settingsForm.deadline_alert_intervals.sort((a, b) => b - a);
  } else {
    props.settingsForm.deadline_alert_intervals.splice(idx, 1);
  }
};

const playTestSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    alertService.info('تم تشغيل نغمة التنبيه التجريبية 🔊');
  } catch (e) {
    console.warn('AudioContext not supported or blocked:', e);
  }
};
</script>
