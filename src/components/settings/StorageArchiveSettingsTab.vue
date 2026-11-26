<template>
  <div class="settings-tab-panel">
    <div class="panel-section-header">
      <div class="section-icon-badge">☁️</div>
      <div>
        <h2>التخزين السحابي وسياسات الأرشفة (Google Drive Archive)</h2>
        <p>إدارة مجلد الأرشيف المركزي على Google Drive والتعليمات الإرشادية لتنظيم ملفات العملاء</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card full-span">
        <label class="setting-label">رابط أو معرف مجلد الأرشيف المركزي على Google Drive</label>
        <div class="drive-input-group">
          <div class="input-with-icon flex-grow">
            <span class="input-icon">📁</span>
            <input
              v-model="settingsForm.root_drive_archive_folder"
              type="text"
              class="form-control"
              placeholder="https://drive.google.com/drive/folders/xxxxxxxxxxxxxxxxx أو معرف المجلد"
              dir="ltr"
            />
          </div>
          <button
            v-if="settingsForm.root_drive_archive_folder"
            type="button"
            class="btn btn-secondary"
            @click="openDriveLink(settingsForm.root_drive_archive_folder)"
          >
            <span>🔗</span> فتح المجلد
          </button>
        </div>
        <small class="setting-hint">المجلد السحابي الرئيسي المعتمد للوكالة لتنظيم ومزامنة كافة أعمال العملاء والإنتاج</small>
      </div>

      <div class="setting-card full-span">
        <label class="setting-label">إرشادات وسياسات الأرشفة والتسليم الموجهة للموظفين</label>
        <textarea
          v-model="settingsForm.archive_instructions_ar"
          rows="6"
          class="form-control code-font"
          placeholder="اكتب الخطوات المنظمة التي يجب على الموظفين اتباعها عند إنشاء مجلدات وتسمية الملفات..."
        ></textarea>
        <small class="setting-hint">تظهر هذه التوجيهات للموظفين في نوافذ تسليم المهام وشيت المنشورات لضمان التوحيد القياسي</small>
      </div>
    </div>

    <!-- قسم قواعد الأرشفة التلقائية داخل المنظومة (Auto-Archive) -->
    <div class="panel-section-header" style="margin-top: 28px;">
      <div class="section-icon-badge">🗄️</div>
      <div>
        <h2>الأرشفة التلقائية وقواعد الترحيل للأرشيف المركزي</h2>
        <p>ضبط المدة الزمنية لكل وحدة بعد انتهائها أو اكتمالها لنقلها تلقائياً من الشاشات التشغيلية إلى الأرشيف</p>
      </div>
    </div>

    <div class="settings-grid">
      <div class="setting-card full-span flex-card">
        <div class="toggle-info">
          <strong class="toggle-title">تفعيل الأرشفة التلقائية اليومية (Auto-Archive)</strong>
          <p class="toggle-desc">
            يفحص النظام يومياً الساعة 2:30 صباحاً المشاريع والخطط والمنشورات والمهام السريعة وينقل المستوفي للشروط إلى الأرشيف المركزي.
          </p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.auto_archive_enabled" />
          <span class="slider-round"></span>
        </label>
      </div>

      <div class="setting-card full-span flex-card">
        <div class="toggle-info">
          <strong class="toggle-title">اشتراط اكتمال/تسليم العنصر قبل الأرشفة التلقائية</strong>
          <p class="toggle-desc">
            عند التفعيل: تبقى العناصر الجارية أو غير المكتملة ظاهرة في الصفحات التشغيلية حتى بعد انتهاء تاريخها، ولا يُؤرشف تلقائياً إلا المكتمل/المسلّم.
          </p>
        </div>
        <label class="switch-toggle">
          <input type="checkbox" v-model="settingsForm.auto_archive_require_completed" />
          <span class="slider-round"></span>
        </label>
      </div>

      <div class="setting-card">
        <label class="setting-label">📁 مهلة أرشفة المشاريع (بالأيام)</label>
        <select v-model.number="settingsForm.auto_archive_projects_days" class="form-control">
          <option :value="0">فوراً بعد يوم الانتهاء (0 يوم)</option>
          <option :value="7">7 أيام (أسبوع)</option>
          <option :value="14">14 يوماً (أسبوعين)</option>
          <option :value="30">30 يوماً (شهر)</option>
        </select>
        <small class="setting-hint">عدد الأيام بعد انتهاء تاريخ المشروع أو اكتماله</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">🗓️ مهلة أرشفة خطط المحتوى (بالأيام)</label>
        <select v-model.number="settingsForm.auto_archive_plans_days" class="form-control">
          <option :value="0">فوراً بعد انتهاء الشهر (0 يوم)</option>
          <option :value="7">7 أيام (أسبوع)</option>
          <option :value="14">14 يوماً (أسبوعين)</option>
          <option :value="30">30 يوماً (شهر)</option>
        </select>
        <small class="setting-hint">عدد الأيام بعد انتهاء تاريخ الخطة واعتمادها/تسليمها</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">📊 مهلة أرشفة جداول المنشورات (بالأيام)</label>
        <select v-model.number="settingsForm.auto_archive_posts_days" class="form-control">
          <option :value="7">7 أيام (أسبوع)</option>
          <option :value="14">14 يوماً (أسبوعين)</option>
          <option :value="30">30 يوماً (شهر)</option>
          <option :value="60">60 يوماً (شهرين)</option>
        </select>
        <small class="setting-hint">عدد الأيام بعد تاريخ النشر المخطط أو التسليم النهائي للمنشور</small>
      </div>

      <div class="setting-card">
        <label class="setting-label">⚡ مهلة أرشفة المهام السريعة (بالأيام)</label>
        <select v-model.number="settingsForm.auto_archive_quick_tasks_days" class="form-control">
          <option :value="3">3 أيام</option>
          <option :value="7">7 أيام (أسبوع)</option>
          <option :value="14">14 يوماً (أسبوعين)</option>
          <option :value="30">30 يوماً (شهر)</option>
        </select>
        <small class="setting-hint">عدد الأيام بعد اكتمال المهمة السريعة وانتهاء موعدها</small>
      </div>

      <div class="setting-card full-span">
        <div class="archive-runner-box">
          <div>
            <strong class="toggle-title">⚡ الفحص الفوري والمعاينة (Dry Run)</strong>
            <p class="toggle-desc">
              احسب عدد العناصر المؤهلة للأرشفة حالياً وفق القواعد المحفوظة أو نفّذ الأرشفة التلقائية فوراً.
            </p>
          </div>
          <div class="archive-runner-actions">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="archivePreviewLoading || archiveExecuteLoading"
              @click="previewAutoArchive"
            >
              <span v-if="archivePreviewLoading" class="spinner-inline"></span>
              <span v-else>🔍</span>
              <span>معاينة المؤهل للأرشفة</span>
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="archivePreviewLoading || archiveExecuteLoading"
              @click="executeAutoArchiveNow"
            >
              <span v-if="archiveExecuteLoading" class="spinner-inline"></span>
              <span v-else>⚡</span>
              <span>تشغيل الأرشفة الآن</span>
            </button>
            <button type="button" class="btn btn-secondary" @click="$router.push('/archive')">
              <span>🗄️</span>
              <span>فتح الأرشيف المركزي</span>
            </button>
          </div>
        </div>

        <div v-if="archivePreviewResult" class="archive-preview-strip">
          <span>📁 مشاريع: <strong>{{ archivePreviewResult.counts?.projects || 0 }}</strong></span>
          <span>🗓️ خطط محتوى: <strong>{{ archivePreviewResult.counts?.content_plans || 0 }}</strong></span>
          <span>📊 منشورات: <strong>{{ archivePreviewResult.counts?.plan_posts || 0 }}</strong></span>
          <span>⚡ مهام سريعة: <strong>{{ archivePreviewResult.counts?.quick_tasks || 0 }}</strong></span>
          <span class="total-badge">الإجمالي المؤهل: {{ archivePreviewResult.total || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import alertService from '@/services/alertService';
import archiveApi from '@/modules/archive/api/archiveApi';
import { openExternalUrl } from '@/utils/driveValidation';

defineProps({
  settingsForm: { type: Object, required: true },
});

const archivePreviewLoading = ref(false);
const archiveExecuteLoading = ref(false);
const archivePreviewResult = ref(null);

const openDriveLink = (url) => {
  if (!url) return;
  let target = url.trim();
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://drive.google.com/drive/folders/${target}`;
  }
  openExternalUrl(target);
};

const previewAutoArchive = async () => {
  archivePreviewLoading.value = true;
  try {
    const res = await archiveApi.runAutoArchive({ dry_run: true, force: true });
    archivePreviewResult.value = res.data?.result || null;
    if (archivePreviewResult.value?.total === 0) {
      alertService.info('لا توجد عناصر مستوفية لشروط الأرشفة التلقائية حالياً.');
    }
  } catch (err) {
    alertService.error(err?.response?.data?.message || 'تعذر معاينة الأرشفة التلقائية.');
  } finally {
    archivePreviewLoading.value = false;
  }
};

const executeAutoArchiveNow = async () => {
  const confirmed = await alertService.confirm({
    title: 'تشغيل الأرشفة التلقائية الآن',
    message: 'سيتم فحص ونقل كافة العناصر المكتملة التي تجاوزت مهلتها الزمنية إلى الأرشيف المركزي (تُطبق الإعدادات المحفوظة حالياً). هل تود المتابعة؟',
    type: 'warning',
    confirmText: 'تنفيذ الأرشفة ⚡',
    cancelText: 'إلغاء',
  });
  if (!confirmed) return;

  archiveExecuteLoading.value = true;
  try {
    const res = await archiveApi.runAutoArchive({ dry_run: false, force: true });
    archivePreviewResult.value = res.data?.result || null;
    alertService.success(res.data?.message || 'تم تنفيذ الأرشفة التلقائية بنجاح ✅');
  } catch (err) {
    alertService.error(err?.response?.data?.message || 'تعذر تشغيل الأرشفة التلقائية.');
  } finally {
    archiveExecuteLoading.value = false;
  }
};
</script>
