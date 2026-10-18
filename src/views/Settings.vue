<template>
  <div class="settings-page" dir="rtl">
    <!-- رأس الصفحة -->
    <div class="settings-header">
      <div class="header-titles">
        <div class="breadcrumbs">
          <span>لوحة التحكم</span>
          <span class="crumb-separator">/</span>
          <span class="active-crumb">الإعدادات العامة والسياسات</span>
        </div>
        <div class="title-with-badge">
          <div class="settings-icon-badge">⚙️</div>
          <div>
            <h1>إعدادات المنظومة العامة والسياسات</h1>
            <p>لوحة تحكم مركزية لضبط هوية الوكالة، سياسات الدوام، ضوابط خطط المحتوى، الإشعارات، والأمان</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <!-- زر إعادة ضبط التبويب الحالي -->
        <button 
          v-if="activeTab !== 'plans' || plansSubTab === 'policies'"
          type="button" 
          class="btn btn-secondary-subtle" 
          :disabled="savingSettings || resettingGroup"
          @click="confirmResetCurrentGroup"
          title="استعادة القيم الافتراضية الأصلية لهذا القسم"
        >
          <span v-if="resettingGroup" class="spinner-inline"></span>
          <span v-else>🔄</span>
          <span>استعادة افتراضيات التبويب</span>
        </button>

        <!-- في تبويب الخطط: إمكانية إضافة نوع خطة جديد -->
        <button 
          v-if="activeTab === 'plans' && plansSubTab === 'estimates'"
          type="button" 
          class="btn btn-secondary" 
          @click="openAddCategoryModal"
        >
          <span>＋</span> نوع خطة جديد
        </button>

        <!-- زر حفظ ساعات الخطط عند التواجد في معايير الساعات -->
        <button 
          v-if="activeTab === 'plans' && plansSubTab === 'estimates'"
          type="button" 
          class="btn btn-primary save-all-btn" 
          :class="{ 'needs-save-pulse': hasUnsavedHoursChanges }"
          :disabled="savingBulkHours"
          @click="saveAllHours"
        >
          <span v-if="savingBulkHours" class="spinner-inline"></span>
          <span v-else>💾</span>
          <span>حفظ كافة الساعات</span>
          <span v-if="hasUnsavedHoursChanges" class="unsaved-badge" title="يوجد تعديلات غير محفوظة">!</span>
        </button>

        <!-- زر حفظ الإعدادات العامة الأساسي -->
        <button 
          type="button" 
          class="btn btn-primary main-save-btn" 
          :class="{ 'needs-save-pulse': hasUnsavedSettings }"
          :disabled="savingSettings"
          @click="saveGeneralSettings"
        >
          <span v-if="savingSettings" class="spinner-inline"></span>
          <span v-else>💾</span>
          <span>حفظ التعديلات العامة</span>
          <span v-if="hasUnsavedSettings" class="unsaved-badge" title="يوجد تعديلات غير محفوظة">!</span>
        </button>
      </div>
    </div>

    <!-- تنبيه تجميد المنظومة إن كان مفعلاً -->
    <div v-if="settingsForm.system_freeze_mode" class="system-freeze-banner">
      <div class="freeze-icon">❄️</div>
      <div class="freeze-content">
        <strong>تنبيه: وضع تجميد المنظومة مفعّل حالياً (System Freeze Active)</strong>
        <p>المنظومة في وضع القراءة فقط للموظفين، ويمنع إنشاء أو تعديل أي مهام أو خطط لحين إلغاء التفعيل.</p>
      </div>
    </div>

    <!-- حاوية التبويبات والمحتوى الرئيسية -->
    <div class="settings-layout">
      <!-- القائمة الجانبية للتبويبات -->
      <aside class="settings-sidebar">
        <nav class="settings-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="nav-tab-btn"
            :class="{ 
              'active': activeTab === tab.id, 
              'has-unsaved': tabHasUnsaved(tab.id) 
            }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <div class="tab-text">
              <span class="tab-title">{{ tab.title }}</span>
              <span class="tab-desc">{{ tab.desc }}</span>
            </div>
            <span v-if="tabHasUnsaved(tab.id)" class="tab-unsaved-dot" title="تعديلات غير محفوظة"></span>
          </button>
        </nav>

        <!-- بطاقة معلومات سريعة عن النظام -->
        <div class="quick-status-card">
          <div class="status-header">
            <span class="status-indicator-dot online"></span>
            <strong>حالة خادم المنظومة</strong>
          </div>
          <div class="status-details">
            <div class="status-row">
              <span>المنطقة الزمنية:</span>
              <code>{{ settingsForm.system_timezone || 'Africa/Cairo' }}</code>
            </div>
            <div class="status-row">
              <span>العملة الافتراضية:</span>
              <span class="currency-tag">{{ settingsForm.default_currency || 'EGP' }}</span>
            </div>
            <div class="status-row">
              <span>ساعات الدوام اليومي:</span>
              <span>{{ settingsForm.default_daily_hours || 8 }} ساعات</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- منطقة محتوى التبويب النشط -->
      <main class="settings-content-area">
        <!-- شاشة التحميل الأولية -->
        <div v-if="loadingSettings" class="loading-state-box">
          <div class="spinner-large"></div>
          <p>جارٍ تحميل الإعدادات والسياسات العامة...</p>
        </div>

        <div v-else class="tab-panel-container">
          <!-- ======================================================== -->
          <!-- التبويب 1: الهوية والبيانات العامة (General) -->
          <!-- ======================================================== -->
          <div v-if="activeTab === 'general'" class="settings-tab-panel">
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

          <!-- ======================================================== -->
          <!-- التبويب 2: سياسات الدوام وحِمل العمل (Workload) -->
          <!-- ======================================================== -->
          <div v-if="activeTab === 'workload'" class="settings-tab-panel">
            <div class="panel-section-header">
              <div class="section-icon-badge">⏱️</div>
              <div>
                <h2>سياسات الدوام وحِمل العمل (Workload Policies)</h2>
                <p>ضبط ساعات العمل اليومية، مواعيد الدوام الرسمي، أيام الإجازات، وحدود الضغط على الموظفين</p>
              </div>
            </div>

            <div class="settings-grid">
              <!-- ساعات العمل القياسية -->
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

              <!-- حد التحذير من حِمل العمل الزائد -->
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

              <!-- مواعيد الحضور والانصراف -->
              <div class="setting-card">
                <label class="setting-label">مواعيد الدوام المكتبي الرسمي</label>
                <div class="time-range-group">
                  <div class="time-input-col">
                    <span class="sub-label">من الساعة (بداية العمل):</span>
                    <input 
                      v-model="settingsForm.office_start_time" 
                      type="time" 
                      class="form-control"
                    />
                  </div>
                  <div class="time-input-col">
                    <span class="sub-label">إلى الساعة (نهاية العمل):</span>
                    <input 
                      v-model="settingsForm.office_end_time" 
                      type="time" 
                      class="form-control"
                    />
                  </div>
                </div>
                <small class="setting-hint">نطاق ساعات العمل المكتبي لتوزيع التكليفات العاجلة</small>
              </div>

              <!-- مهلة التسليم المسموحة قبل احتساب التأخير -->
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

              <!-- اختيار أيام العطلات الأسبوعية -->
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

              <!-- مفتاح الترحيل التلقائي للمهام -->
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

          <!-- ======================================================== -->
          <!-- التبويب 3: خطط المحتوى والمعايير (Plans & Estimates) -->
          <!-- ======================================================== -->
          <div v-if="activeTab === 'plans'" class="settings-tab-panel">
            <div class="panel-section-header">
              <div class="section-icon-badge">📊</div>
              <div>
                <h2>إعدادات خطط المحتوى وساعات المعايير</h2>
                <p>ضبط سياسات إنشاء واعتماد المنشورات بالإضافة إلى جداول الساعات التقديرية المعتمدة</p>
              </div>
            </div>

            <!-- أزرار التبديل الداخلية بين سياسات الخطط وجداول الساعات -->
            <div class="sub-tab-switcher">
              <button 
                type="button" 
                class="sub-tab-btn" 
                :class="{ 'active': plansSubTab === 'policies' }"
                @click="plansSubTab = 'policies'"
              >
                <span>⚙️</span> سياسات وضوابط الخطط
              </button>
              <button 
                type="button" 
                class="sub-tab-btn" 
                :class="{ 'active': plansSubTab === 'estimates' }"
                @click="plansSubTab = 'estimates'"
              >
                <span>⏱️</span> جدول الساعات المقدرة لكل عنصر ({{ categories.length }} أنواع)
                <span v-if="hasUnsavedHoursChanges" class="mini-unsaved-dot"></span>
              </button>
            </div>

            <!-- القسم الأول: السياسات والضوابط -->
            <div v-if="plansSubTab === 'policies'" class="settings-grid">
              <div class="setting-card">
                <label class="setting-label">الحد الأدنى لمهلة تسليم البريف (بالساعات)</label>
                <div class="input-with-icon">
                  <span class="input-icon">⏳</span>
                  <input 
                    v-model.number="settingsForm.min_brief_lead_hours" 
                    type="number" 
                    min="1" 
                    class="form-control" 
                    placeholder="مثال: 48"
                  />
                  <span class="input-unit">ساعة</span>
                </div>
                <small class="setting-hint">أقل مهلة زمنية مسموح بها بين طلب البريف وموعد النشر المجدول (48 ساعة = يومين)</small>
              </div>

              <!-- التكرار التلقائي -->
              <div class="setting-card flex-card">
                <div class="toggle-info">
                  <strong class="toggle-title">التكرار التلقائي الشهري للخطط (Auto-Recurrence)</strong>
                  <p class="toggle-desc">توليد مسودة الخطة الجديدة للشهر القادم تلقائياً للعملاء المستمرين</p>
                </div>
                <label class="switch-toggle">
                  <input type="checkbox" v-model="settingsForm.default_auto_recurrence" />
                  <span class="slider-round"></span>
                </label>
              </div>

              <!-- مراجعة رئيس القسم أولاً -->
              <div class="setting-card flex-card">
                <div class="toggle-info">
                  <strong class="toggle-title">إلزامية مراجعة رئيس القسم أولاً (Require Dept Review)</strong>
                  <p class="toggle-desc">منع إرسال المنشور للمدير أو العميل مباشرة دون موافقة تيم ليدر القسم المعني أولاً</p>
                </div>
                <label class="switch-toggle">
                  <input type="checkbox" v-model="settingsForm.require_dept_review_first" />
                  <span class="slider-round"></span>
                </label>
              </div>

              <!-- الفحص الصارم لروابط جوجل درايف -->
              <div class="setting-card flex-card">
                <div class="toggle-info">
                  <strong class="toggle-title">التحقق الصارم من روابط جوجل درايف (Strict Drive Validation)</strong>
                  <p class="toggle-desc">التحقق من صحة وقابلية فتح روابط درايف للمنشورات ومنع الروابط المعطوبة أو غير المصرح بها</p>
                </div>
                <label class="switch-toggle">
                  <input type="checkbox" v-model="settingsForm.strict_drive_validation" />
                  <span class="slider-round"></span>
                </label>
              </div>

              <!-- القفل التلقائي بعد الاعتماد -->
              <div class="setting-card flex-card full-span">
                <div class="toggle-info">
                  <strong class="toggle-title">القفل التلقائي للمنشورات بعد الاعتماد (Auto-Lock on Approval)</strong>
                  <p class="toggle-desc">قفل التعديل على أي منشور فور اعتماد العميل أو الإدارة له لمنع التغييرات غير الموثقة</p>
                </div>
                <label class="switch-toggle">
                  <input type="checkbox" v-model="settingsForm.auto_lock_on_approval" />
                  <span class="slider-round"></span>
                </label>
              </div>
            </div>

            <!-- القسم الثاني: الجدول الكامل للساعات المقدرة والأنواع الموروث بالكامل -->
            <div v-if="plansSubTab === 'estimates'" class="estimates-embedded-container">
              <!-- شريط البحث والملخص السريع -->
              <div class="summary-and-search-bar">
                <div class="stats-pills">
                  <div class="stat-pill">
                    <span class="pill-label">إجمالي أنواع الخطط:</span>
                    <span class="pill-value">{{ categories.length }}</span>
                  </div>
                  <div class="stat-pill">
                    <span class="pill-label">إجمالي العناصر المقدرة:</span>
                    <span class="pill-value">{{ totalItemsCount }}</span>
                  </div>
                  <div class="stat-pill">
                    <span class="pill-label">الوحدة المعتمدة:</span>
                    <span class="pill-value highlight">الساعة ⏱️</span>
                  </div>
                  <div v-if="hasUnsavedHoursChanges" class="stat-pill warning-pill">
                    <span class="pill-label">الحالة:</span>
                    <span class="pill-value warning-text">يوجد تعديلات غير محفوظة ⚠️</span>
                  </div>
                </div>

                <div class="search-box">
                  <span class="search-icon">🔍</span>
                  <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="بحث سريع عن عنصر أو نوع خطة..." 
                    class="search-input"
                  />
                  <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">×</button>
                </div>
              </div>

              <!-- قائمة أنواع الخطط والعناصر -->
              <div v-if="loadingHours" class="state-container">
                <div class="spinner-large"></div>
                <p>جارٍ تحميل إعدادات ساعات الخطط والمعايير...</p>
              </div>

              <div v-else class="categories-container">
                <div 
                  v-for="category in filteredCategories" 
                  :key="category.id" 
                  class="category-card"
                >
                  <!-- رأس كارت نوع الخطة -->
                  <div class="category-header">
                    <div class="category-info">
                      <div class="category-badge-icon">
                        {{ getCategoryIcon(category.name) }}
                      </div>
                      <div>
                        <div class="cat-title-row">
                          <h3 class="category-name">{{ category.name }}</h3>
                          <span class="items-count-badge">
                            {{ category.items ? category.items.length : 0 }} عناصر
                          </span>
                          <span class="total-hours-badge" v-if="category.items && category.items.length">
                            إجمالي: {{ calculateCategoryTotalHours(category) }} ساعة
                          </span>
                        </div>
                        <p v-if="category.description" class="category-desc">{{ category.description }}</p>
                      </div>
                    </div>

                    <div class="category-actions">
                      <button 
                        type="button" 
                        class="icon-action-btn add-item-btn" 
                        title="إضافة عنصر عمل جديد لهذا النوع"
                        @click="openAddItemModal(category)"
                      >
                        <span>＋</span> إضافة عنصر
                      </button>
                      <button 
                        type="button" 
                        class="icon-action-btn edit-cat-btn" 
                        title="تعديل اسم أو وصف نوع الخطة"
                        @click="openEditCategoryModal(category)"
                      >
                        ✏️
                      </button>
                      <button 
                        type="button" 
                        class="icon-action-btn delete-cat-btn" 
                        title="حذف هذا النوع بالكامل"
                        @click="confirmDeleteCategory(category)"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <!-- شبكة العناصر المقدرة -->
                  <div class="category-body">
                    <div v-if="!category.items || category.items.length === 0" class="empty-category-box">
                      <p>لا توجد عناصر مضافة بعد لخطة "{{ category.name }}".</p>
                      <button 
                        type="button" 
                        class="btn-subtle" 
                        @click="openAddItemModal(category)"
                      >
                        <span>＋</span> إضافة أول عنصر الآن
                      </button>
                    </div>

                    <div v-else class="items-grid">
                      <div 
                        v-for="item in category.items" 
                        :key="item.id" 
                        class="item-card"
                        :class="{ 'item-modified': isItemModified(item) }"
                      >
                        <div class="item-header">
                          <div class="item-name-wrap">
                            <span class="item-name" :title="item.name">{{ item.name }}</span>
                            <span v-if="isItemModified(item)" class="modified-dot" title="قيمة معدلة لم تُحفظ بعد"></span>
                          </div>
                          <button 
                            type="button" 
                            class="item-delete-btn" 
                            title="حذف هذا العنصر"
                            @click="confirmDeleteItem(item, category)"
                          >
                            🗑️
                          </button>
                        </div>

                        <div class="item-input-group">
                          <label class="input-label">الوقت المقدر:</label>
                          <div class="hours-input-wrapper" :class="{ 'wrapper-modified': isItemModified(item) }">
                            <span class="clock-icon">⏱️</span>
                            <input 
                              v-model.number="item.estimated_hours" 
                              type="number" 
                              step="0.5" 
                              min="0" 
                              max="999" 
                              class="hours-input"
                            />
                            <span class="unit-tag">ساعة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- كارت إضافة نوع خطة جديد سريع -->
                <div class="add-new-category-placeholder" @click="openAddCategoryModal">
                  <div class="placeholder-icon">＋</div>
                  <h3>إضافة نوع خطة جديد</h3>
                  <p>انقر هنا لإنشاء خطة مخصصة وإدراج عناصر عمل جديدة بساعاتها التقديرية</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- التبويب 4: التنبيهات والواتساب (Notifications & WhatsApp) -->
          <!-- ======================================================== -->
          <div v-if="activeTab === 'notifications'" class="settings-tab-panel">
            <div class="panel-section-header">
              <div class="section-icon-badge">🔔</div>
              <div>
                <h2>إعدادات التنبيهات ورسائل الواتساب</h2>
                <p>إدارة فترات الإنذار بالمواعيد النهائية، المؤثرات الصوتية، وقوالب رسائل الواتساب التلقائية</p>
              </div>
            </div>

            <div class="settings-grid">
              <!-- المؤثرات الصوتية -->
              <div class="setting-card flex-card full-span">
                <div class="toggle-info">
                  <strong class="toggle-title">المؤثرات الصوتية للتنبيهات (Notification Sound Effects)</strong>
                  <p class="toggle-desc">تشغيل نغمة صوتية خفيفة عند وصول تكليف جديد أو تنبيه باقتراب الديدلاين</p>
                </div>
                <div class="flex-align-center gap-3">
                  <button 
                    type="button" 
                    class="btn btn-secondary-subtle btn-sm" 
                    @click="playTestSound"
                    title="تجربة النغمة الصوتية"
                  >
                    🔊 تجربة الصوت
                  </button>
                  <label class="switch-toggle">
                    <input type="checkbox" v-model="settingsForm.sound_effects_enabled" />
                    <span class="slider-round"></span>
                  </label>
                </div>
              </div>

              <!-- تفعيل الواتساب -->
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

              <!-- رقم واتساب الإدارة المعتمد -->
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

              <!-- فترات الإنذار بالديدلاين -->
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

              <!-- تذييل رسائل الواتساب مع المعاينة التفاعلية -->
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
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- التبويب 5: الأمان وسلة المهملات (Security & Retention) -->
          <!-- ======================================================== -->
          <div v-if="activeTab === 'security'" class="settings-tab-panel">
            <div class="panel-section-header">
              <div class="section-icon-badge">🔒</div>
              <div>
                <h2>الأمان وسياسات الاحتفاظ بالبيانات</h2>
                <p>ضبط أمن الجلسات، مهلة سلة المهملات، أرشيف النشاطات، ووضع الطوارئ والصيانة</p>
              </div>
            </div>

            <div class="settings-grid">
              <!-- مدة بقاء الجلسة -->
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

              <!-- مهلة سلة المهملات -->
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

              <!-- سجل النشاطات والـ Audit Log -->
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

              <!-- تجميد المنظومة والطوارئ -->
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

          <!-- ======================================================== -->
          <!-- التبويب 6: التخزين والأرشفة السحابية (Storage & Drive) -->
          <!-- ======================================================== -->
          <div v-if="activeTab === 'storage'" class="settings-tab-panel">
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
          </div>
        </div>
      </main>
    </div>

    <!-- شريط عائم سفلي ثابت يظهر فور وجود تعديلات غير محفوظة على الإعدادات العامة أو الساعات -->
    <Transition name="slide-up">
      <div v-if="hasUnsavedSettings || hasUnsavedHoursChanges" class="unsaved-floating-bar" dir="rtl">
        <div class="floating-bar-inner">
          <div class="floating-bar-info">
            <span class="floating-beacon">⚠️</span>
            <div>
              <strong>
                {{ hasUnsavedSettings ? 'توجد تعديلات غير محفوظة على الإعدادات والسياسات!' : 'توجد تعديلات على ساعات العمل المعيارية لم تُحفظ بعد!' }}
              </strong>
              <span>لا تنسَ حفظ التغييرات لتثبيتها على النظام وتفادي فقدان ما قمت بتعديله.</span>
            </div>
          </div>
          <div class="floating-bar-actions">
            <!-- تراجع عن تعديلات الإعدادات العامة -->
            <button 
              v-if="hasUnsavedSettings"
              type="button" 
              class="btn btn-secondary btn-sm" 
              @click="discardSettingsChanges"
              :disabled="savingSettings"
            >
              تراجع عن إعدادات السياسات
            </button>

            <!-- تراجع عن تعديلات الساعات -->
            <button 
              v-if="hasUnsavedHoursChanges"
              type="button" 
              class="btn btn-secondary btn-sm" 
              @click="discardHoursChanges"
              :disabled="savingBulkHours"
            >
              تراجع عن الساعات
            </button>

            <!-- حفظ الساعات إن كانت معدلة -->
            <button 
              v-if="hasUnsavedHoursChanges"
              type="button" 
              class="btn btn-primary btn-sm save-floating-btn" 
              @click="saveAllHours"
              :disabled="savingBulkHours"
            >
              <span v-if="savingBulkHours" class="spinner-inline"></span>
              <span v-else>💾</span>
              <span>حفظ الساعات الآن</span>
            </button>

            <!-- حفظ الإعدادات العامة إن كانت معدلة -->
            <button 
              v-if="hasUnsavedSettings"
              type="button" 
              class="btn btn-primary btn-sm save-floating-btn" 
              @click="saveGeneralSettings"
              :disabled="savingSettings"
            >
              <span v-if="savingSettings" class="spinner-inline"></span>
              <span v-else>💾</span>
              <span>حفظ الإعدادات العامة الآن</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- مودال إضافة / تعديل نوع خطة -->
    <Teleport to="body">
      <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditingCategory ? 'تعديل نوع الخطة' : 'إضافة نوع خطة جديد' }}</h3>
            <button class="modal-close-btn" @click="showCategoryModal = false">×</button>
          </div>
          <form @submit.prevent="submitCategoryForm">
            <div class="form-group">
              <label>اسم نوع الخطة <span class="required-star">*</span></label>
              <input 
                v-model="categoryForm.name" 
                type="text" 
                required 
                placeholder="مثال: Social Media Growth Plan"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>وصف توضيحي (اختياري)</label>
              <textarea 
                v-model="categoryForm.description" 
                rows="3" 
                placeholder="نبذة عن طبيعة مهام وعناصر هذا النوع..." 
                class="form-control"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showCategoryModal = false">إلغاء</button>
              <button type="submit" class="btn btn-primary" :disabled="submittingCategory">
                {{ submittingCategory ? 'جارٍ الحفظ...' : (isEditingCategory ? 'تحديث' : 'إضافة النوع') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- مودال إضافة عنصر جديد -->
    <Teleport to="body">
      <div v-if="showItemModal" class="modal-overlay" @click.self="showItemModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>إضافة عنصر عمل جديد إلى "{{ targetCategoryForNewItem?.name }}"</h3>
            <button class="modal-close-btn" @click="showItemModal = false">×</button>
          </div>
          <form @submit.prevent="submitItemForm">
            <div class="form-group">
              <label>اسم العنصر / نوع المنشور <span class="required-star">*</span></label>
              <input 
                v-model="itemForm.name" 
                type="text" 
                required 
                placeholder="مثال: انفوجرافيك تفاعلي، فيديو ترويجي 30 ثانية..."
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>عدد ساعات العمل المقدرة (بالساعة) <span class="required-star">*</span></label>
              <div class="hours-input-wrapper modal-input-wrapper">
                <span class="clock-icon">⏱️</span>
                <input 
                  v-model.number="itemForm.estimated_hours" 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  required
                  placeholder="مثال: 3"
                  class="hours-input form-control"
                />
                <span class="unit-tag">ساعة</span>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showItemModal = false">إلغاء</button>
              <button type="submit" class="btn btn-primary" :disabled="submittingItem">
                {{ submittingItem ? 'جارٍ الإضافة...' : 'إضافة العنصر' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import api from '../axios';
import alertService from '../services/alertService';
import { useSystemSettings } from '../composables/useSystemSettings';

const { fetchSettings: refreshGlobalSettings } = useSystemSettings();

// ==========================================
// 1. التبويبات الرئيسية للإعدادات
// ==========================================
const tabs = [
  { id: 'general', title: 'الهوية والبيانات', icon: '🏢', desc: 'الاسم، الشعار، العملة، التوقيت' },
  { id: 'workload', title: 'الدوام وحِمل العمل', icon: '⏱️', desc: 'ساعات العمل، العطلات، الإجهاد' },
  { id: 'plans', title: 'خطط المحتوى والمعايير', icon: '📊', desc: 'ضوابط النشر، وجداول الساعات' },
  { id: 'notifications', title: 'التنبيهات والواتساب', icon: '🔔', desc: 'الديدلاين، الأصوات، الواتساب' },
  { id: 'security', title: 'الأمان والاحتفاظ', icon: '🔒', desc: 'الجلسات، السلة، وسجل التدقيق' },
  { id: 'storage', title: 'التخزين والأرشفة', icon: '☁️', desc: 'مجلد درايف، وسياسات التسليم' },
];

const activeTab = ref('general');
const plansSubTab = ref('policies'); // 'policies' | 'estimates'

// ==========================================
// 2. حالة الإعدادات العامة (General Settings)
// ==========================================
const loadingSettings = ref(true);
const savingSettings = ref(false);
const resettingGroup = ref(false);

const settingsForm = ref({});
const originalSettings = ref({});
const groupsMeta = ref({});

// أيام الأسبوع الثابتة
const weekDaysList = [
  { id: 'friday', name_ar: 'الجمعة' },
  { id: 'saturday', name_ar: 'السبت' },
  { id: 'sunday', name_ar: 'الأحد' },
  { id: 'monday', name_ar: 'الإثنين' },
  { id: 'tuesday', name_ar: 'الثلاثاء' },
  { id: 'wednesday', name_ar: 'الأربعاء' },
  { id: 'thursday', name_ar: 'الخميس' },
];

// فحص وجود أي تعديلات معلقة في الإعدادات العامة
const hasUnsavedSettings = computed(() => {
  if (!originalSettings.value || Object.keys(originalSettings.value).length === 0) return false;
  return JSON.stringify(settingsForm.value) !== JSON.stringify(originalSettings.value);
});

// فحص وجود تعديلات غير محفوظة لتبويب محدد
const tabHasUnsaved = (tabId) => {
  if (tabId === 'plans' && hasUnsavedHoursChanges.value) return true;
  if (!groupsMeta.value[tabId] || !originalSettings.value) return false;
  
  const keys = groupsMeta.value[tabId].map(s => s.key);
  for (const k of keys) {
    if (JSON.stringify(settingsForm.value[k]) !== JSON.stringify(originalSettings.value[k])) {
      return true;
    }
  }
  return false;
};

// جلب الإعدادات العامة من الباك إند
const fetchGeneralSettings = async () => {
  loadingSettings.value = true;
  try {
    const res = await api.get('/settings/general');
    if (res.data) {
      groupsMeta.value = res.data.groups || {};
      settingsForm.value = JSON.parse(JSON.stringify(res.data.flat || {}));
      originalSettings.value = JSON.parse(JSON.stringify(res.data.flat || {}));
    }
  } catch (error) {
    console.error('Failed to fetch general settings:', error);
    alertService.error('تعذر جلب الإعدادات العامة للمنظومة.');
  } finally {
    loadingSettings.value = false;
  }
};

// حفظ الإعدادات العامة
const saveGeneralSettings = async () => {
  savingSettings.value = true;
  try {
    const res = await api.post('/settings/general', {
      settings: settingsForm.value
    });

    if (res.data && res.data.flat) {
      settingsForm.value = JSON.parse(JSON.stringify(res.data.flat));
      originalSettings.value = JSON.parse(JSON.stringify(res.data.flat));
    } else {
      originalSettings.value = JSON.parse(JSON.stringify(settingsForm.value));
    }

    try {
      await refreshGlobalSettings(true);
    } catch (e) {}

    alertService.success('تم حفظ وتطبيق كافة الإعدادات والسياسات بنجاح ✅');
  } catch (error) {
    console.error('Error saving settings:', error);
    alertService.error(error.response?.data?.message || 'تعذر حفظ الإعدادات، يرجى التحقق من المدخلات.');
  } finally {
    savingSettings.value = false;
  }
};

// التراجع عن تعديلات الإعدادات العامة
const discardSettingsChanges = () => {
  settingsForm.value = JSON.parse(JSON.stringify(originalSettings.value));
  alertService.info('تم التراجع عن التعديلات واستعادة الإعدادات الأصلية.');
};

// تأكيد وإعادة ضبط التبويب الحالي إلى الافتراضي
const confirmResetCurrentGroup = async () => {
  const currentTabObj = tabs.find(t => t.id === activeTab.value);
  const tabName = currentTabObj ? currentTabObj.title : activeTab.value;

  const confirmed = await alertService.confirm({
    title: `استعادة افتراضيات "${tabName}"؟`,
    message: `هل أنت متأكد من استعادة القيم الافتراضية المصنعية لتبويب ${tabName}؟ سيتم إلغاء أي تعديلات مخصصة قمت بضبطها مسبقاً لهذا القسم.`,
    confirmText: 'نعم، استعد الافتراضيات',
    cancelText: 'إلغاء',
    type: 'warning'
  });

  if (!confirmed) return;

  resettingGroup.value = true;
  try {
    const res = await api.post('/settings/general/reset', {
      group: activeTab.value
    });

    if (res.data && res.data.flat) {
      settingsForm.value = JSON.parse(JSON.stringify(res.data.flat));
      originalSettings.value = JSON.parse(JSON.stringify(res.data.flat));
    }

    try {
      await refreshGlobalSettings(true);
    } catch (e) {}

    alertService.success(`تمت استعادة إعدادات "${tabName}" إلى الافتراضي بنجاح 🔄`);
  } catch (error) {
    alertService.error('فشل في استعادة الافتراضيات.');
  } finally {
    resettingGroup.value = false;
  }
};

// التعامل مع أيام الإجازة (Weekend Days)
const isWeekendSelected = (dayId) => {
  if (!Array.isArray(settingsForm.value.weekend_days)) return false;
  return settingsForm.value.weekend_days.includes(dayId);
};

const toggleWeekendDay = (dayId) => {
  if (!Array.isArray(settingsForm.value.weekend_days)) {
    settingsForm.value.weekend_days = [];
  }
  const idx = settingsForm.value.weekend_days.indexOf(dayId);
  if (idx === -1) {
    settingsForm.value.weekend_days.push(dayId);
  } else {
    // لا تسمح بإفراغ كافة أيام الأسبوع من الإجازات إلا إذا أراد المستخدم، لكن يفضل بقاء يوم واحد على الأقل
    settingsForm.value.weekend_days.splice(idx, 1);
  }
};

const getWeekendDaysLabels = () => {
  if (!Array.isArray(settingsForm.value.weekend_days) || settingsForm.value.weekend_days.length === 0) {
    return 'لا توجد عطلات محددة';
  }
  return settingsForm.value.weekend_days
    .map(d => weekDaysList.find(item => item.id === d)?.name_ar || d)
    .join(' ، ');
};

// التعامل مع فترات التنبيه (Alert Intervals)
const isIntervalSelected = (hours) => {
  if (!Array.isArray(settingsForm.value.deadline_alert_intervals)) return false;
  return settingsForm.value.deadline_alert_intervals.includes(hours);
};

const toggleInterval = (hours) => {
  if (!Array.isArray(settingsForm.value.deadline_alert_intervals)) {
    settingsForm.value.deadline_alert_intervals = [];
  }
  const idx = settingsForm.value.deadline_alert_intervals.indexOf(hours);
  if (idx === -1) {
    settingsForm.value.deadline_alert_intervals.push(hours);
    settingsForm.value.deadline_alert_intervals.sort((a, b) => b - a);
  } else {
    settingsForm.value.deadline_alert_intervals.splice(idx, 1);
  }
};

// تجربة النغمة الصوتية للتنبيه عبر Web Audio API
const playTestSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

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

// فتح رابط مجلد درايف
const openDriveLink = (url) => {
  if (!url) return;
  let target = url.trim();
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://drive.google.com/drive/folders/${target}`;
  }
  window.open(target, '_blank');
};

// ========================================================
// 3. إدارة جداول ساعات الخطط المعتمدة (Legacy & Integrated)
// ========================================================
const categories = ref([]);
const loadingHours = ref(true);
const savingBulkHours = ref(false);
const searchQuery = ref('');
const originalHoursMap = ref({});

const updateHoursSnapshot = () => {
  const map = {};
  categories.value.forEach(cat => {
    if (cat.items && Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        map[item.id] = Number(item.estimated_hours) || 0;
      });
    }
  });
  originalHoursMap.value = map;
};

// فحص وجود تعديلات معلقة على ساعات العمل
const hasUnsavedHoursChanges = computed(() => {
  if (!categories.value.length) return false;
  for (const cat of categories.value) {
    if (cat.items && Array.isArray(cat.items)) {
      for (const item of cat.items) {
        const orig = originalHoursMap.value[item.id];
        const current = Number(item.estimated_hours) || 0;
        if (orig !== undefined && Math.abs(orig - current) > 0.001) {
          return true;
        }
      }
    }
  }
  return false;
});

const isItemModified = (item) => {
  if (!item || originalHoursMap.value[item.id] === undefined) return false;
  const orig = originalHoursMap.value[item.id];
  const current = Number(item.estimated_hours) || 0;
  return Math.abs(orig - current) > 0.001;
};

const discardHoursChanges = () => {
  categories.value.forEach(cat => {
    if (cat.items && Array.isArray(cat.items)) {
      cat.items.forEach(item => {
        if (originalHoursMap.value[item.id] !== undefined) {
          item.estimated_hours = originalHoursMap.value[item.id];
        }
      });
    }
  });
  alertService.info('تم التراجع عن التعديلات واستعادة الساعات السابقة.');
};

const fetchHoursSettings = async () => {
  loadingHours.value = true;
  try {
    const res = await api.get('/settings/plan-item-estimates');
    categories.value = res.data.data || [];
    updateHoursSnapshot();
  } catch (error) {
    alertService.error('تعذر جلب إعدادات ساعات الخطط.');
  } finally {
    loadingHours.value = false;
  }
};

const totalItemsCount = computed(() => {
  return categories.value.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0);
});

const calculateCategoryTotalHours = (category) => {
  if (!category.items) return 0;
  const total = category.items.reduce((sum, item) => sum + (Number(item.estimated_hours) || 0), 0);
  return Number(total.toFixed(2));
};

const filteredCategories = computed(() => {
  if (!searchQuery.value || !searchQuery.value.trim()) {
    return categories.value;
  }
  const q = searchQuery.value.trim().toLowerCase();
  return categories.value.map(cat => {
    const catMatches = cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q));
    const matchingItems = cat.items ? cat.items.filter(item => item.name.toLowerCase().includes(q)) : [];
    
    if (catMatches) {
      return cat;
    }
    if (matchingItems.length > 0) {
      return {
        ...cat,
        items: matchingItems
      };
    }
    return null;
  }).filter(Boolean);
});

const getCategoryIcon = (name) => {
  if (!name) return '📁';
  const n = name.toLowerCase();
  if (n.includes('social') || n.includes('سوشيال')) return '📱';
  if (n.includes('branding') || n.includes('هوية')) return '🎨';
  if (n.includes('web') || n.includes('موقع') || n.includes('تطوير')) return '💻';
  if (n.includes('media production') || n.includes('video')) return '🎬';
  if (n.includes('digital') || n.includes('strategy')) return '🎯';
  if (n.includes('media buying') || n.includes('ad')) return '📢';
  if (n.includes('seo')) return '🔍';
  if (n.includes('analytics') || n.includes('reporting')) return '📊';
  return '📁';
};

const saveAllHours = async () => {
  savingBulkHours.value = true;
  try {
    const allEstimates = [];
    categories.value.forEach(cat => {
      if (cat.items && Array.isArray(cat.items)) {
        cat.items.forEach(item => {
          allEstimates.push({
            id: item.id,
            estimated_hours: Number(item.estimated_hours) || 0
          });
        });
      }
    });

    if (allEstimates.length === 0) {
      alertService.info('لا توجد عناصر للحفظ.');
      savingBulkHours.value = false;
      return;
    }

    await api.put('/settings/plan-item-estimates/bulk-update', {
      estimates: allEstimates
    });

    updateHoursSnapshot();
    alertService.success('تم حفظ وتحديث كافة الساعات بنجاح ✅');
  } catch (error) {
    alertService.error('حدث خطأ أثناء حفظ الساعات.');
  } finally {
    savingBulkHours.value = false;
  }
};

// ==========================================
// 4. مودالات التصنيفات والعناصر
// ==========================================
const showCategoryModal = ref(false);
const isEditingCategory = ref(false);
const submittingCategory = ref(false);
const categoryForm = ref({ id: null, name: '', description: '' });

const openAddCategoryModal = () => {
  isEditingCategory.value = false;
  categoryForm.value = { id: null, name: '', description: '' };
  showCategoryModal.value = true;
};

const openEditCategoryModal = (cat) => {
  isEditingCategory.value = true;
  categoryForm.value = { id: cat.id, name: cat.name, description: cat.description || '' };
  showCategoryModal.value = true;
};

const submitCategoryForm = async () => {
  if (!categoryForm.value.name.trim()) return;
  submittingCategory.value = true;
  try {
    if (isEditingCategory.value) {
      const res = await api.put(`/settings/plan-item-categories/${categoryForm.value.id}`, {
        name: categoryForm.value.name,
        description: categoryForm.value.description
      });
      const idx = categories.value.findIndex(c => c.id === categoryForm.value.id);
      if (idx !== -1) {
        categories.value[idx].name = res.data.data.name;
        categories.value[idx].description = res.data.data.description;
      }
      alertService.success('تم تحديث نوع الخطة بنجاح');
    } else {
      const res = await api.post('/settings/plan-item-categories', {
        name: categoryForm.value.name,
        description: categoryForm.value.description
      });
      categories.value.push(res.data.data);
      alertService.success('تمت إضافة نوع الخطة بنجاح ✅');
    }
    showCategoryModal.value = false;
  } catch (error) {
    alertService.error(error.response?.data?.message || 'تعذر حفظ نوع الخطة');
  } finally {
    submittingCategory.value = false;
  }
};

const confirmDeleteCategory = async (cat) => {
  const confirmed = await alertService.confirm({
    title: 'حذف نوع الخطة',
    message: `هل أنت متأكد من حذف "${cat.name}" وكافة عناصره المقدرة؟`,
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
    type: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.delete(`/settings/plan-item-categories/${cat.id}`);
    categories.value = categories.value.filter(c => c.id !== cat.id);
    updateHoursSnapshot();
    alertService.success('تم حذف نوع الخطة بنجاح 🗑️');
  } catch (error) {
    alertService.error('فشل في حذف نوع الخطة.');
  }
};

const showItemModal = ref(false);
const submittingItem = ref(false);
const targetCategoryForNewItem = ref(null);
const itemForm = ref({ name: '', estimated_hours: 1 });

const openAddItemModal = (cat) => {
  targetCategoryForNewItem.value = cat;
  itemForm.value = { name: '', estimated_hours: 1 };
  showItemModal.value = true;
};

const submitItemForm = async () => {
  if (!itemForm.value.name.trim() || !targetCategoryForNewItem.value) return;
  submittingItem.value = true;
  try {
    const res = await api.post('/settings/plan-item-estimates', {
      category_id: targetCategoryForNewItem.value.id,
      name: itemForm.value.name.trim(),
      estimated_hours: Number(itemForm.value.estimated_hours) || 0
    });

    if (!targetCategoryForNewItem.value.items) {
      targetCategoryForNewItem.value.items = [];
    }
    targetCategoryForNewItem.value.items.push(res.data.data);
    originalHoursMap.value[res.data.data.id] = Number(res.data.data.estimated_hours) || 0;

    showItemModal.value = false;
    alertService.success('تمت إضافة العنصر بنجاح ✅');
  } catch (error) {
    alertService.error(error.response?.data?.message || 'تعذر إضافة العنصر');
  } finally {
    submittingItem.value = false;
  }
};

const confirmDeleteItem = async (item, category) => {
  const confirmed = await alertService.confirm({
    title: 'حذف العنصر',
    message: `هل أنت متأكد من حذف عنصر "${item.name}"؟`,
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
    type: 'warning'
  });
  if (!confirmed) return;

  try {
    await api.delete(`/settings/plan-item-estimates/${item.id}`);
    category.items = category.items.filter(i => i.id !== item.id);
    delete originalHoursMap.value[item.id];
    alertService.success('تم حذف العنصر بنجاح.');
  } catch (error) {
    alertService.error('تعذر حذف العنصر.');
  }
};

// ==========================================
// 5. حماية مغادرة الصفحة والتنبيه التفاعلي
// ==========================================
onBeforeRouteLeave(async (to, from) => {
  if (hasUnsavedSettings.value || hasUnsavedHoursChanges.value) {
    const confirmed = await alertService.confirm({
      title: 'تنبيه: تعديلات غير محفوظة ⚠️',
      message: 'لديك تغييرات تم إجراؤها على الإعدادات أو الساعات ولم تقم بحفظها بعد! هل أنت متأكد من رغبتك في مغادرة الصفحة وإلغاء هذه التعديلات؟',
      confirmText: 'نعم، مغادرة دون حفظ',
      cancelText: 'البقاء في الصفحة لحفظ التغييرات',
      type: 'warning'
    });

    if (!confirmed) {
      return false;
    }
  }
  return true;
});

const handleBeforeUnload = (e) => {
  if (hasUnsavedSettings.value || hasUnsavedHoursChanges.value) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
};

onMounted(() => {
  fetchGeneralSettings();
  fetchHoursSettings();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
  color: #edf2f7;
  font-family: inherit;
  padding-bottom: 100px;
}

/* الرأس */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(18, 24, 65, 0.7);
  border: 1px solid rgba(138, 155, 235, 0.18);
  border-radius: 20px;
  padding: 22px 28px;
  box-shadow: 0 10px 35px rgba(3, 7, 26, 0.35);
  backdrop-filter: blur(14px);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #7987bd;
  margin-bottom: 6px;
}
.crumb-separator {
  color: #4b588c;
}
.active-crumb {
  color: #6366f1;
  font-weight: 600;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 14px;
}
.settings-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25));
  border: 1px solid rgba(139, 92, 246, 0.4);
  font-size: 24px;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
}
.settings-header h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
}
.settings-header p {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* الأزرار العامة */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}
.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4338ca, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(30, 41, 89, 0.7);
  color: #cbd5e1;
  border: 1px solid rgba(138, 155, 235, 0.25);
}
.btn-secondary:hover:not(:disabled) {
  background: rgba(39, 53, 115, 0.9);
  color: #ffffff;
  border-color: rgba(138, 155, 235, 0.45);
}

.btn-secondary-subtle {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.25);
}
.btn-secondary-subtle:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  color: #ffffff;
  border-color: rgba(239, 68, 68, 0.5);
}

.needs-save-pulse {
  animation: pulseButton 2s infinite;
}
@keyframes pulseButton {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

.unsaved-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #f59e0b;
  color: #0b0f19;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 800;
  margin-right: -2px;
}

/* بنر تجميد النظام */
.system-freeze-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(185, 28, 28, 0.25));
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  padding: 16px 20px;
  color: #fca5a5;
}
.freeze-icon {
  font-size: 28px;
}
.freeze-content strong {
  display: block;
  font-size: 14px;
  color: #fecaca;
  margin-bottom: 2px;
}
.freeze-content p {
  font-size: 12px;
  margin: 0;
  color: #fca5a5;
}

/* تخطيط التبويبات والمحتوى */
.settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

/* القائمة الجانبية للتبويبات */
.settings-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(18, 24, 65, 0.6);
  border: 1px solid rgba(138, 155, 235, 0.16);
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(3, 7, 26, 0.25);
  backdrop-filter: blur(12px);
}
.nav-tab-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: right;
  padding: 12px 14px;
  border-radius: 14px;
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.nav-tab-btn:hover {
  background: rgba(30, 41, 89, 0.45);
  color: #edf2f7;
}
.nav-tab-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
  border-color: rgba(99, 102, 241, 0.45);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.15);
}
.tab-icon {
  font-size: 20px;
}
.tab-text {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.tab-title {
  font-size: 13px;
  font-weight: 600;
  color: inherit;
}
.tab-desc {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.nav-tab-btn.active .tab-desc {
  color: #a5b4fc;
}
.tab-unsaved-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

/* بطاقة سريعة للمنظومة */
.quick-status-card {
  background: rgba(18, 24, 65, 0.5);
  border: 1px solid rgba(138, 155, 235, 0.14);
  border-radius: 16px;
  padding: 16px;
  font-size: 12px;
}
.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #cbd5e1;
}
.status-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-indicator-dot.online {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}
.status-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #94a3b8;
}
.currency-tag {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
}

/* منطقة المحتوى */
.settings-content-area {
  background: rgba(18, 24, 65, 0.6);
  border: 1px solid rgba(138, 155, 235, 0.16);
  border-radius: 20px;
  padding: 26px;
  box-shadow: 0 10px 30px rgba(3, 7, 26, 0.3);
  backdrop-filter: blur(12px);
  min-height: 520px;
}

.panel-section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(138, 155, 235, 0.14);
}
.section-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-size: 22px;
}
.panel-section-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
}
.panel-section-header p {
  font-size: 12px;
  color: #94a3b8;
  margin: 4px 0 0 0;
}

/* شبكة كروت الإعدادات */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
.full-span {
  grid-column: 1 / -1;
}

.setting-card {
  background: rgba(24, 32, 79, 0.45);
  border: 1px solid rgba(138, 155, 235, 0.14);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
}
.setting-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(24, 32, 79, 0.65);
}
.flex-card {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}
.badge-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}
.setting-subdesc {
  font-size: 11px;
  color: #7987bd;
  margin: 0 0 8px 0;
}
.setting-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

/* حقول الإدخال */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  right: 12px;
  font-size: 15px;
  pointer-events: none;
  z-index: 1;
}
.input-unit {
  position: absolute;
  left: 12px;
  font-size: 12px;
  color: #7987bd;
  pointer-events: none;
}
.form-control {
  width: 100%;
  padding: 10px 38px 10px 14px;
  background: rgba(14, 20, 56, 0.75);
  border: 1px solid rgba(138, 155, 235, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-size: 13px;
  transition: all 0.2s ease;
  font-family: inherit;
}
.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: rgba(14, 20, 56, 0.95);
}
select.form-control {
  cursor: pointer;
}

/* النطاق الزمني */
.time-range-group {
  display: flex;
  gap: 12px;
}
.time-input-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sub-label {
  font-size: 11px;
  color: #7987bd;
}

/* سلايدر الأرقام */
.slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 6px 0;
}
.range-slider {
  width: 100%;
  accent-color: #6366f1;
  cursor: pointer;
}
.slider-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
}
.metric-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}
.badge-safe {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}
.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}
.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* شرائح أيام الأسبوع */
.days-chips-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px 0;
}
.day-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(14, 20, 56, 0.6);
  border: 1px solid rgba(138, 155, 235, 0.2);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.day-chip:hover {
  background: rgba(30, 41, 89, 0.6);
  color: #ffffff;
}
.day-chip.day-selected {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3));
  border-color: rgba(99, 102, 241, 0.6);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
}
.chip-check {
  font-size: 12px;
  font-weight: 700;
}

/* شرائح فترات التنبيه */
.alert-intervals-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0;
}
.interval-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(14, 20, 56, 0.6);
  border: 1px solid rgba(138, 155, 235, 0.2);
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.interval-chip:hover {
  background: rgba(30, 41, 89, 0.6);
  color: #ffffff;
}
.interval-chip.interval-active {
  background: rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.6);
  color: #a5b4fc;
}

/* المفتاح التبادلي Switch Toggle */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}
.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider-round {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(45, 55, 99, 0.8);
  border: 1px solid rgba(138, 155, 235, 0.25);
  transition: .3s;
  border-radius: 34px;
}
.slider-round:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #cbd5e1;
  transition: .3s;
  border-radius: 50%;
}
.switch-toggle input:checked + .slider-round {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
}
.switch-toggle input:checked + .slider-round:before {
  transform: translateX(22px);
  background-color: #ffffff;
}
.danger-toggle input:checked + .slider-round {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  border-color: #ef4444;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 14px;
}
.toggle-title {
  font-size: 13px;
  color: #ffffff;
}
.toggle-desc {
  font-size: 11px;
  color: #7987bd;
  margin: 0;
}

/* تبويبات فرعية للخطط */
.sub-tab-switcher {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(138, 155, 235, 0.14);
  padding-bottom: 14px;
}
.sub-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  background: rgba(30, 41, 89, 0.4);
  border: 1px solid rgba(138, 155, 235, 0.18);
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.sub-tab-btn:hover {
  background: rgba(39, 53, 115, 0.7);
  color: #ffffff;
}
.sub-tab-btn.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2));
  border-color: #6366f1;
  color: #ffffff;
}
.mini-unsaved-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
}

/* معاينة رسالة الواتساب */
.whatsapp-preview-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
}
@media (max-width: 900px) {
  .whatsapp-preview-grid {
    grid-template-columns: 1fr;
  }
}
.whatsapp-editor-side {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.whatsapp-preview-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview-tag {
  font-size: 11px;
  color: #7987bd;
}
.mock-whatsapp-bubble {
  background: #075e54;
  background-image: linear-gradient(135deg, #128c7e, #075e54);
  border-radius: 14px 14px 2px 14px;
  padding: 14px 16px;
  color: #ffffff;
  font-size: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bubble-header {
  font-size: 11px;
  color: #a7f3d0;
}
.bubble-content p {
  margin: 0;
  line-height: 1.4;
}
.bubble-divider {
  border: none;
  border-top: 1px dashed rgba(255, 255, 255, 0.25);
  margin: 6px 0;
}
.bubble-footer-text {
  font-size: 11px;
  color: #d1fae5;
  white-space: pre-line;
}
.bubble-time {
  align-self: flex-end;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

/* كارت الطوارئ في الأمان */
.critical-card {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(185, 28, 28, 0.18));
  border: 1px solid rgba(239, 68, 68, 0.35);
}
.critical-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
}
.critical-icon {
  font-size: 26px;
}
.critical-title {
  font-size: 14px;
  font-weight: 700;
  color: #fca5a5;
  margin: 0 0 4px 0;
}
.critical-desc {
  font-size: 11px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.5;
}
.critical-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(239, 68, 68, 0.25);
}
.critical-status-text {
  font-size: 12px;
  color: #e2e8f0;
}
.text-danger { color: #f87171; }
.text-success { color: #34d399; }

/* درايف */
.drive-input-group {
  display: flex;
  gap: 10px;
}
.code-font {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
}

/* ========================================================
   ستايلات جداول الساعات المقدرة والأنواع المدمجة
   ======================================================== */
.estimates-embedded-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-and-search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(14, 20, 56, 0.5);
  border: 1px solid rgba(138, 155, 235, 0.15);
  border-radius: 14px;
  padding: 12px 18px;
}
.stats-pills {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  background: rgba(30, 41, 89, 0.6);
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(138, 155, 235, 0.15);
}
.pill-label { color: #94a3b8; }
.pill-value { font-weight: 700; color: #ffffff; }
.pill-value.highlight { color: #6366f1; }
.warning-pill {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}
.warning-text { color: #fbbf24; }

.search-box {
  position: relative;
  min-width: 260px;
}
.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #7987bd;
}
.search-input {
  width: 100%;
  padding: 8px 36px 8px 30px;
  background: rgba(18, 24, 65, 0.8);
  border: 1px solid rgba(138, 155, 235, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 12px;
}
.search-input:focus {
  outline: none;
  border-color: #6366f1;
}
.clear-search {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-card {
  background: rgba(18, 24, 65, 0.5);
  border: 1px solid rgba(138, 155, 235, 0.16);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(3, 7, 26, 0.2);
}
.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(138, 155, 235, 0.12);
}
.category-info {
  display: flex;
  align-items: center;
  gap: 14px;
}
.category-badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-size: 20px;
}
.cat-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.category-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
}
.items-count-badge {
  font-size: 11px;
  background: rgba(138, 155, 235, 0.15);
  color: #a5b4fc;
  padding: 2px 8px;
  border-radius: 6px;
}
.total-hours-badge {
  font-size: 11px;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.category-desc {
  font-size: 12px;
  color: #7987bd;
  margin: 4px 0 0 0;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-action-btn {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(30, 41, 89, 0.6);
  border: 1px solid rgba(138, 155, 235, 0.2);
  color: #cbd5e1;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-action-btn:hover {
  background: rgba(39, 53, 115, 0.9);
  color: #ffffff;
}
.add-item-btn {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border-color: rgba(99, 102, 241, 0.4);
}
.add-item-btn:hover {
  background: #6366f1;
  color: #ffffff;
}
.delete-cat-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.empty-category-box {
  text-align: center;
  padding: 24px;
  background: rgba(14, 20, 56, 0.35);
  border-radius: 12px;
  border: 1px dashed rgba(138, 155, 235, 0.2);
}
.empty-category-box p {
  color: #7987bd;
  font-size: 12px;
  margin: 0 0 10px 0;
}
.btn-subtle {
  background: none;
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.btn-subtle:hover {
  background: rgba(99, 102, 241, 0.2);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.item-card {
  background: rgba(14, 20, 56, 0.55);
  border: 1px solid rgba(138, 155, 235, 0.15);
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s ease;
}
.item-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
}
.item-modified {
  border-color: rgba(245, 158, 11, 0.5);
  background: rgba(30, 25, 60, 0.65);
}
.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.item-name-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}
.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #edf2f7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.modified-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}
.item-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.item-delete-btn:hover {
  opacity: 1;
}

.item-input-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.input-label {
  font-size: 11px;
  color: #7987bd;
}
.hours-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.clock-icon {
  position: absolute;
  right: 8px;
  font-size: 12px;
  pointer-events: none;
}
.hours-input {
  width: 90px;
  padding: 6px 26px 6px 36px;
  background: rgba(18, 24, 65, 0.9);
  border: 1px solid rgba(138, 155, 235, 0.25);
  border-radius: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}
.hours-input:focus {
  outline: none;
  border-color: #6366f1;
}
.wrapper-modified .hours-input {
  border-color: #f59e0b;
  color: #fbbf24;
}
.unit-tag {
  position: absolute;
  left: 8px;
  font-size: 10px;
  color: #7987bd;
  pointer-events: none;
}

.add-new-category-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px;
  border: 2px dashed rgba(138, 155, 235, 0.25);
  border-radius: 16px;
  cursor: pointer;
  background: rgba(18, 24, 65, 0.2);
  transition: all 0.2s ease;
}
.add-new-category-placeholder:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
}
.placeholder-icon {
  font-size: 24px;
  color: #818cf8;
  margin-bottom: 6px;
}
.add-new-category-placeholder h3 {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}
.add-new-category-placeholder p {
  font-size: 12px;
  color: #7987bd;
  margin: 4px 0 0 0;
}

/* الشريط العائم السفلي الثابت */
.unsaved-floating-bar {
  position: fixed;
  bottom: 24px;
  left: 24px;
  right: 24px;
  z-index: 999;
}
.floating-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(14, 20, 56, 0.95);
  border: 1px solid rgba(245, 158, 11, 0.5);
  border-radius: 16px;
  padding: 16px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
  max-width: 1200px;
  margin: 0 auto;
}
.floating-bar-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.floating-beacon {
  font-size: 24px;
}
.floating-bar-info strong {
  display: block;
  font-size: 13px;
  color: #fef3c7;
}
.floating-bar-info span {
  font-size: 11px;
  color: #cbd5e1;
}
.floating-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-sm {
  padding: 8px 16px;
  font-size: 12px;
}
.save-floating-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #0b0f19;
  font-weight: 700;
}
.save-floating-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: #ffffff;
}

/* المودالات */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(3, 7, 26, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}
.modal-card {
  background: #0f1738;
  border: 1px solid rgba(138, 155, 235, 0.25);
  border-radius: 18px;
  width: 100%;
  max-width: 480px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  color: #edf2f7;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(138, 155, 235, 0.15);
}
.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.modal-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 22px;
  cursor: pointer;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.form-group label {
  font-size: 12px;
  color: #cbd5e1;
}
.required-star {
  color: #ef4444;
}
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* أنيميشن */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(40px);
  opacity: 0;
}

.spinner-inline {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}
.spinner-large {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 14px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state-box,
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #7987bd;
  font-size: 13px;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.flex-align-center {
  display: flex;
  align-items: center;
}
.flex-grow {
  flex: 1;
}
.gap-3 {
  gap: 12px;
}
.mb-2 {
  margin-bottom: 8px;
}
</style>
