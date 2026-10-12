<template>
  <section class="manager-dashboard" dir="rtl">
    <div class="page-topline">
      <div class="topline-info">
        <span class="eyebrow">{{ currentDate }} | لوحة القيادة الإدارية 👑</span>
        <h2>مرحباً بك يا مدير، {{ currentUserName }}</h2>
        <p>إليك النظرة الشاملة لأداء الشركة، حالات الخطط، وفريق العمل.</p>
      </div>

      <!-- فلتر النطاق الزمني الذكي (Time Horizon Filter) -->
      <div class="time-horizon-card">
        <div class="horizon-header">
          <span class="horizon-title">⏳ النطاق الزمني:</span>
          <span v-if="dashboardData?.time_horizon?.label" class="horizon-active-pill">
            {{ dashboardData.time_horizon.label }}
          </span>
        </div>

        <!-- أزرار النطاق للشاشات المتوسطة والكبيرة -->
        <div class="horizon-buttons-group">
          <button 
            type="button" 
            class="horizon-btn" 
            :class="{ active: selectedHorizon === 'today' }"
            @click="changeHorizon('today')"
            title="العمليات الفورية لليوم"
          >
            <span class="btn-icon">⚡</span>
            <span>اليوم</span>
          </button>

          <button 
            type="button" 
            class="horizon-btn" 
            :class="{ active: selectedHorizon === 'this_week' }"
            @click="changeHorizon('this_week')"
            title="التسليمات الأسبوعية ومراجعة الجمعة/الخميس"
          >
            <span class="btn-icon">🗓️</span>
            <span>هذا الأسبوع</span>
          </button>

          <button 
            type="button" 
            class="horizon-btn" 
            :class="{ active: selectedHorizon === 'this_month' }"
            @click="changeHorizon('this_month')"
            title="التقفيل العام ومعدل الحرق"
          >
            <span class="btn-icon">📊</span>
            <span>هذا الشهر</span>
          </button>

          <button 
            type="button" 
            class="horizon-btn" 
            :class="{ active: selectedHorizon === 'all' }"
            @click="changeHorizon('all')"
            title="الوضع الافتراضي التراكمي الشامل"
          >
            <span class="btn-icon">🌐</span>
            <span>الكل (تراكمي)</span>
          </button>
        </div>

        <!-- قائمة منسدلة بديلة للموبايل والشاشات الصغيرة -->
        <div class="horizon-select-wrapper">
          <select 
            :value="selectedHorizon" 
            @change="changeHorizon($event.target.value)" 
            class="horizon-native-select"
          >
            <option value="today">⚡ اليوم (للعمليات الفورية)</option>
            <option value="this_week">🗓️ هذا الأسبوع (للتسليمات والمراجعة)</option>
            <option value="this_month">📊 هذا الشهر (للتقفيل العام والحرق)</option>
            <option value="all">🌐 الكل (الوضع التراكمي)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- حالة تحميل الداشبورد الرئيسية -->
    <div v-if="loading" class="state-cell">
      <span class="spinner large"></span> جارٍ تجميع بيانات الشركة...
    </div>

    <div v-else-if="dashboardData" class="dashboard-content">
      
      <!-- 1. النظرة العامة للمشاريع -->
      <div class="stats-section mb-4">
        <h3 class="section-title">🏢 النظرة العامة للمشاريع</h3>
        <div class="stats-grid">
          <article 
            class="stat-card primary-card clickable-card" 
            @click="navigateTo('/projects')" 
            title="انقر للانتقال إلى مساحة المشاريع"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>إجمالي المشاريع</small>
              <strong>{{ dashboardData.overview.projects.total }}</strong>
            </div>
            <div class="stat-icon">📁</div>
            <span class="card-action-chip">عرض الكل ↗</span>
          </article>

          <article 
            class="stat-card blue-card clickable-card" 
            @click="navigateTo('/projects?status=جاري التنفيذ')" 
            title="انقر لتصفية مشاريع جاري التنفيذ"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>جاري التنفيذ</small>
              <strong>{{ dashboardData.overview.projects.active }}</strong>
            </div>
            <div class="stat-icon pulse-blue">⚙️</div>
            <span class="card-action-chip">تصفية القائمة ↗</span>
          </article>

          <article 
            class="stat-card green-card clickable-card" 
            @click="navigateTo('/projects?status=مكتمل')" 
            title="انقر لتصفية المشاريع المكتملة"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>مشاريع مكتملة</small>
              <strong>{{ dashboardData.overview.projects.completed }}</strong>
            </div>
            <div class="stat-icon">✅</div>
            <span class="card-action-chip">تصفية القائمة ↗</span>
          </article>

          <article 
            class="stat-card gray-card clickable-card" 
            @click="navigateTo('/projects?status=متوقف')" 
            title="انقر لتصفية المشاريع المتوقفة"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>مشاريع متوقفة</small>
              <strong>{{ dashboardData.overview.projects.stopped }}</strong>
            </div>
            <div class="stat-icon">⏸️</div>
            <span class="card-action-chip">تصفية القائمة ↗</span>
          </article>
        </div>
      </div>

      <!-- 2. إحصائيات حالات خطط المحتوى -->
      <div class="stats-section mb-4">
        <h3 class="section-title">📝 مسار وحالات خطط المحتوى</h3>
        <div class="stats-grid grid-6">
          <article 
            class="stat-card outline-card clickable-card" 
            @click="navigateTo('/content-plans')" 
            title="انقر للانتقال إلى جدول خطط المحتوى"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>إجمالي الخطط</small>
              <strong>{{ dashboardData.plan_stats.total }}</strong>
            </div>
            <div class="stat-icon">📑</div>
            <span class="card-action-chip">عرض الكل ↗</span>
          </article>

          <article 
            class="stat-card gray-card clickable-card" 
            @click="navigateTo('/content-plans?status=pending')" 
            title="انقر لتصفية الخطط المعلقة وقيد التجهيز"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>معلقة / قيد التجهيز</small>
              <strong>{{ dashboardData.plan_stats.pending }}</strong>
            </div>
            <div class="stat-icon">✍️</div>
            <span class="card-action-chip">تصفية ↗</span>
          </article>

          <article 
            class="stat-card orange-card clickable-card" 
            @click="navigateTo('/content-plans?status=under_review')" 
            title="انقر لتصفية الخطط قيد المراجعة"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>قيد المراجعة</small>
              <strong>{{ dashboardData.plan_stats.under_review }}</strong>
            </div>
            <div class="stat-icon">🔎</div>
            <span class="card-action-chip highlight-chip">تصفية ↗</span>
          </article>

          <article 
            class="stat-card purple-card clickable-card" 
            @click="navigateTo('/content-plans?status=reviewed')" 
            title="انقر لتصفية الخطط المعتمدة / تمت المراجعة"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>تمت المراجعة</small>
              <strong>{{ dashboardData.plan_stats.reviewed }}</strong>
            </div>
            <div class="stat-icon">👁️</div>
            <span class="card-action-chip">تصفية ↗</span>
          </article>

          <article 
            class="stat-card green-card clickable-card" 
            @click="navigateTo('/content-plans?status=completed')" 
            title="انقر لتصفية الخطط المكتملة والمغلقة"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>مكتملة ومغلقة</small>
              <strong>{{ dashboardData.plan_stats.completed }}</strong>
            </div>
            <div class="stat-icon">🎯</div>
            <span class="card-action-chip">تصفية ↗</span>
          </article>

          <article 
            class="stat-card red-card clickable-card" 
            @click="navigateTo('/content-plans?status=rejected')" 
            title="انقر لتصفية الخطط المرفوضة"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>مرفوضة</small>
              <strong>{{ dashboardData.plan_stats.rejected }}</strong>
            </div>
            <div class="stat-icon">🛑</div>
            <span class="card-action-chip">تصفية ↗</span>
          </article>
        </div>
      </div>

      <!-- 3. العمليات التشغيلية (مهام ومنشورات) -->
      <div class="stats-section mb-4">
        <h3 class="section-title">⚡ العمليات التشغيلية ومؤشرات التأخير</h3>
        <div class="stats-grid grid-5">
          <article 
            class="stat-card outline-card clickable-card" 
            @click="navigateTo('/projects')" 
            title="عرض جميع مهام المشاريع"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>إجمالي المهام</small>
              <strong>{{ dashboardData.global_stats.tasks.total }}</strong>
            </div>
            <div class="stat-icon text-blue">📋</div>
            <span class="card-action-chip">المشاريع ↗</span>
          </article>

          <article 
            class="stat-card clickable-card drilldown-card" 
            :class="dashboardData.global_stats.tasks.overdue > 0 ? 'red-card pulse-danger' : 'green-card'"
            @click="openDrilldown('overdue_tasks')"
            title="انقر لفتح درج المهام المتأخرة وإعادة الجدولة والتواصل"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>مهام متأخرة</small>
              <strong>{{ dashboardData.global_stats.tasks.overdue }}</strong>
            </div>
            <div class="stat-icon">🚨</div>
            <span class="card-action-chip drawer-chip">فتح الدرج السريع 👈</span>
          </article>

          <div class="vertical-divider"></div>

          <article 
            class="stat-card outline-card clickable-card" 
            @click="navigateTo('/plan-contents')" 
            title="عرض لوحات المنشورات"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>إجمالي المنشورات</small>
              <strong>{{ dashboardData.global_stats.posts.total }}</strong>
            </div>
            <div class="stat-icon text-purple">📱</div>
            <span class="card-action-chip">اللوحات ↗</span>
          </article>

          <article 
            class="stat-card clickable-card drilldown-card" 
            :class="dashboardData.global_stats.posts.overdue > 0 ? 'red-card pulse-danger' : 'green-card'"
            @click="openDrilldown('overdue_posts')"
            title="انقر لفتح درج المنشورات المتأخرة ومراسلة المصممين"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>منشورات متأخرة</small>
              <strong>{{ dashboardData.global_stats.posts.overdue }}</strong>
            </div>
            <div class="stat-icon">⏳</div>
            <span class="card-action-chip drawer-chip">فتح الدرج السريع 👈</span>
          </article>

          <article 
            class="stat-card dark-red-card clickable-card drilldown-card" 
            @click="openDrilldown('rejected_posts')"
            title="انقر لفتح درج المنشورات المرفوضة وأسباب الرفض"
            tabindex="0"
            role="button"
          >
            <div class="stat-info">
              <small>منشورات مرفوضة</small>
              <strong>{{ dashboardData.global_stats.posts.rejected }}</strong>
            </div>
            <div class="stat-icon">❌</div>
            <span class="card-action-chip drawer-chip">فتح الدرج السريع 👈</span>
          </article>
        </div>
      </div>

      <!-- ⭐ مركز قرارات واعتمادات المدير (Executive Action Hub) -->
      <section class="executive-action-hub mb-4">
        <div class="hub-container">
          
          <!-- الهيدر الرئيسي للودجت -->
          <div class="hub-header">
            <div class="hub-header-right">
              <div class="hub-badge-wrap">
                <span class="hub-crown-badge">⭐ أولوية قصوى</span>
                <span v-if="actionHub.total_pending > 0" class="hub-counter-pulse">
                  <span class="pulse-ring"></span>
                  <span class="pulse-core"></span>
                  {{ actionHub.total_pending }} يتطلب قرارك الفوري
                </span>
                <span v-else class="hub-counter-clear">
                   كل شيء معتمد ومكتمل
                </span>
              </div>
              <h3 class="hub-title">
                مركز قرارات واعتمادات المدير
                <span class="hub-title-en">Executive Action Hub</span>
              </h3>
              <p class="hub-subtitle">
                كل ما يتطلب موافقتك أو مراجعتك الفورية مجمّع هنا في مكان واحد لاتخاذ القرار بضغطة زر.
              </p>
            </div>

            <div class="hub-header-actions">
              <button 
                type="button" 
                class="hub-refresh-btn" 
                @click="refreshActionHub" 
                :disabled="refreshingHub"
                title="تحديث قائمة القرارات"
              >
                <span class="refresh-icon" :class="{ 'is-spinning': refreshingHub }">🔄</span>
                <span>تحديث</span>
              </button>
            </div>
          </div>

          <!-- شريط التبويبات الفاخر -->
          <div class="hub-tabs-bar">
            <button 
              type="button"
              class="hub-tab-btn" 
              :class="{ active: activeHubTab === 'all' }"
              @click="activeHubTab = 'all'"
            >
              <span>الكل</span>
              <span class="tab-count" :class="{ highlight: actionHub.total_pending > 0 }">
                {{ actionHub.total_pending }}
              </span>
            </button>

            <button 
              type="button"
              class="hub-tab-btn" 
              :class="{ active: activeHubTab === 'plans' }"
              @click="activeHubTab = 'plans'"
            >
              <span class="tab-icon">📝</span>
              <span>خطط المحتوى</span>
              <span class="tab-count" :class="{ highlight: (actionHub.counts?.plans || 0) > 0 }">
                {{ actionHub.counts?.plans || 0 }}
              </span>
            </button>

            <button 
              type="button"
              class="hub-tab-btn" 
              :class="{ active: activeHubTab === 'posts' }"
              @click="activeHubTab = 'posts'"
            >
              <span class="tab-icon">📱</span>
              <span>منشورات بانتظار الاعتماد</span>
              <span class="tab-count" :class="{ highlight: (actionHub.counts?.posts || 0) > 0 }">
                {{ actionHub.counts?.posts || 0 }}
              </span>
            </button>

            <button 
              type="button"
              class="hub-tab-btn" 
              :class="{ active: activeHubTab === 'quick_tasks' }"
              @click="activeHubTab = 'quick_tasks'"
            >
              <span class="tab-icon">⚡</span>
              <span>توجيهات سريعة مسلّمة</span>
              <span class="tab-count" :class="{ highlight: (actionHub.counts?.quick_tasks || 0) > 0 }">
                {{ actionHub.counts?.quick_tasks || 0 }}
              </span>
            </button>
          </div>

          <!-- منطقة المحتوى والبطاقات -->
          <div class="hub-body">

            <!-- حالة عدم وجود أي قرارات معلقة إطلاقاً -->
            <div v-if="actionHub.total_pending === 0" class="hub-empty-state">
              <div class="empty-icon-wrap">
                <span class="empty-emoji">🛡️</span>
              </div>
              <h4>رائع يا مدير! كل شيء تحت السيطرة</h4>
              <p>لا توجد خطط محتوى، منشورات، أو مهام سريعة معلقة تنتظر قرارك في الوقت الحالي.</p>
              <span class="empty-status-tag">النظام يعمل بكفاءة 100% 🚀</span>
            </div>

            <!-- حالة التبويب المحدد فارغ بينما توجد بنود في تبويبات أخرى -->
            <div v-else-if="!hasItemsInActiveTab" class="hub-empty-state mini">
              <span class="empty-emoji-mini">👌</span>
              <p>لا توجد بنود معلقة في هذا القسم حالياً.</p>
            </div>

            <!-- شبكة البطاقات -->
            <div v-else class="hub-cards-grid">
              
              <!-- 1. كروت خطط المحتوى (under_review) -->
              <article 
                v-for="plan in displayedPlans" 
                :key="'plan_' + plan.id" 
                class="hub-action-card card-plan"
              >
                <div class="card-topline">
                  <span class="card-badge badge-cyan">
                    <span class="badge-dot"></span>
                    خطة محتوى • مراجعة نهائية
                  </span>
                  <span class="card-time">{{ plan.time_ago }}</span>
                </div>

                <div class="card-main">
                  <div class="card-entity">
                    <div class="client-avatar" v-if="plan.client_logo">
                      <img :src="plan.client_logo" :alt="plan.client_name" />
                    </div>
                    <div class="client-avatar fallback" v-else>
                      {{ getInitials(plan.client_name) }}
                    </div>
                    <div class="entity-details">
                      <h4 class="card-item-title" :title="plan.name">{{ plan.name }}</h4>
                      <span class="card-client-tag">🏢 {{ plan.client_name }}</span>
                    </div>
                  </div>

                  <div class="card-meta-chips">
                    <span class="meta-chip">
                      <span class="chip-icon">📊</span>
                      <span>{{ plan.posts_count }} منشور</span>
                    </span>
                    <span class="meta-chip" v-if="plan.planned_review_date">
                      <span class="chip-icon">📅</span>
                      <span>موعد المراجعة: {{ plan.planned_review_date }}</span>
                    </span>
                  </div>
                </div>

                <div class="card-actions-bar">
                  <button 
                    type="button"
                    class="hub-btn btn-approve"
                    :disabled="approvingKey === 'plan_' + plan.id"
                    @click="approveContentPlan(plan)"
                  >
                    <span v-if="approvingKey === 'plan_' + plan.id" class="spinner-btn"></span>
                    <span v-else>✅</span>
                    <span>اعتماد الخطة فوري</span>
                  </button>

                  <button 
                    type="button"
                    class="hub-btn btn-inspect"
                    @click="navigateTo(plan.url)"
                  >
                    <span>🔎 فحص الخطة</span>
                  </button>
                </div>
              </article>

              <!-- 2. كروت المنشورات بانتظار الاعتماد -->
              <article 
                v-for="post in displayedPosts" 
                :key="'post_' + post.id" 
                class="hub-action-card card-post"
                :class="{ 'is-resubmitted': post.is_resubmitted }"
              >
                <div class="card-topline">
                  <span v-if="post.is_resubmitted" class="card-badge badge-amber">
                    <span class="badge-dot pulse-amber"></span>
                    🔁 معاد رفعه بعد التعديل
                  </span>
                  <span v-else class="card-badge badge-purple">
                    <span class="badge-dot"></span>
                    📱 بانتظار اعتماد المدير
                  </span>
                  <span class="card-time">{{ post.time_ago }}</span>
                </div>

                <div class="card-main">
                  <div class="card-entity">
                    <div class="entity-icon post-icon">🎨</div>
                    <div class="entity-details">
                      <h4 class="card-item-title" :title="post.plan_name">
                        {{ post.plan_name }}
                      </h4>
                      <span class="card-client-tag">🏢 {{ post.client_name }}</span>
                    </div>
                  </div>

                  <div class="card-meta-chips">
                    <span class="meta-chip">
                      <span class="chip-icon">🖌️</span>
                      <span>المصمم: {{ post.designer_name }}</span>
                    </span>
                    <span class="meta-chip" v-if="post.target_date">
                      <span class="chip-icon">📅</span>
                      <span>موعد النشر: {{ post.target_date }}</span>
                    </span>
                    <span class="meta-chip" v-if="post.review_status === 'معتمد'">
                      <span class="chip-icon">👁️</span>
                      <span class="text-green">معتمد من القسم</span>
                    </span>
                  </div>
                </div>

                <div class="card-actions-bar">
                  <button 
                    type="button"
                    class="hub-btn btn-approve"
                    :disabled="approvingKey === 'post_' + post.id"
                    @click="approvePlanPost(post)"
                  >
                    <span v-if="approvingKey === 'post_' + post.id" class="spinner-btn"></span>
                    <span v-else>✅</span>
                    <span>اعتماد فوري</span>
                  </button>

                  <button 
                    type="button"
                    class="hub-btn btn-inspect"
                    @click="navigateTo(post.url)"
                  >
                    <span>🔎 معاينة البوست</span>
                  </button>
                </div>
              </article>

              <!-- 3. كروت التوجيهات والمهام السريعة المسلمة -->
              <article 
                v-for="qt in displayedQuickTasks" 
                :key="'qt_' + qt.id" 
                class="hub-action-card card-quick-task"
              >
                <div class="card-topline">
                  <span class="card-badge badge-teal">
                    <span class="badge-dot"></span>
                    ⚡ مهمة سريعة مسلّمة
                  </span>
                  <span class="card-time">{{ qt.time_ago }}</span>
                </div>

                <div class="card-main">
                  <div class="card-entity">
                    <div class="entity-icon qt-icon">🎙️</div>
                    <div class="entity-details">
                      <h4 class="card-item-title">{{ qt.title }}</h4>
                      <span class="card-assignee-tag">👤 الموظف: {{ qt.assignee_name }}</span>
                    </div>
                  </div>

                  <p v-if="qt.description" class="card-desc">{{ qt.description }}</p>

                  <div v-if="qt.feedback_notes" class="card-feedback-box">
                    <span class="feedback-label">💬 ملاحظة التسليم:</span>
                    <p class="feedback-text">{{ qt.feedback_notes }}</p>
                  </div>

                  <!-- مشغل الصوت الفوري إن وُجد تسجيل صوتي للتسليم أو التوجيه -->
                  <div v-if="qt.voice_record_url" class="card-audio-player">
                    <div class="audio-label">
                      <span>🎧 الاستماع للتسجيل الصوتي:</span>
                    </div>
                    <AudioVoicePlayer 
                      :src="qt.voice_record_url" 
                      variant="compact" 
                      theme="teal" 
                    />
                  </div>

                  <div class="card-meta-chips">
                    <span class="meta-chip" v-if="qt.deadline">
                      <span class="chip-icon">⏰</span>
                      <span>الموعد: {{ qt.deadline }}</span>
                    </span>
                    <a 
                      v-if="qt.attachment_url" 
                      :href="qt.attachment_url" 
                      target="_blank" 
                      class="meta-chip chip-link"
                      title="فتح المرفق في نافذة جديدة"
                    >
                      <span class="chip-icon">📎</span>
                      <span>عرض المرفق</span>
                    </a>
                  </div>
                </div>

                <div class="card-actions-bar">
                  <button 
                    type="button"
                    class="hub-btn btn-approve"
                    :disabled="approvingKey === 'quick_task_' + qt.id"
                    @click="approveQuickTask(qt)"
                  >
                    <span v-if="approvingKey === 'quick_task_' + qt.id" class="spinner-btn"></span>
                    <span v-else>✅</span>
                    <span>اعتماد واكتمال</span>
                  </button>

                  <button 
                    type="button"
                    class="hub-btn btn-inspect"
                    @click="navigateTo(qt.url)"
                  >
                    <span>🔎 تفاصيل المهمة</span>
                  </button>
                </div>
              </article>

            </div>

          </div>

        </div>
      </section>

      <!-- 4. الرسوم البيانية -->
      <div class="charts-grid mb-4">
        <!-- مؤشر صحة النظام -->
        <div class="glass-card chart-card text-center">
          <h3 class="card-title">🩺 صحة النظام (System Health)</h3>
          <div class="circular-progress-wrapper mt-4">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <!-- 🔴 تم إضافة fill="none" هنا مباشرة لمنع ظهور الدائرة السوداء -->
              <path class="circle-bg" fill="none" stroke="rgba(137, 153, 226, 0.1)" stroke-width="2.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="kpi-circle" fill="none" stroke-width="2.5" stroke-linecap="round" :class="systemHealthColor" :stroke-dasharray="`${systemHealthRate}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" class="percentage">{{ systemHealthRate }}%</text>
            </svg>
          </div>
          <p class="muted text-sm mt-2">نسبة الإنجاز الكلي لجميع المهام والمنشورات.</p>
        </div>

        <!-- معدل الحرق (الإنجاز الفعلي) -->
        <div class="glass-card chart-card">
          <h3 class="card-title">🔥 معدل الحرق (الإنجاز الفعلي)</h3>
          <div class="progress-bars-container mt-4">
            
            <div class="progress-item mb-4" style="width: 100%;">
              <div class="progress-labels" style="display: flex; justify-content: space-between; width: 100%;">
                <span>مهام المشاريع</span>
                <strong>{{ tasksCompletionRate }}%</strong>
              </div>
              <!-- 🔴 تم إضافة width: 100% لضمان ظهور الشريط بشكل سليم -->
              <div class="progress-bar-bg" style="width: 100%; height: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; overflow: hidden; margin: 8px 0;">
                <div class="progress-bar-fill bg-blue" :style="{ width: tasksCompletionRate + '%', height: '100%', borderRadius: '5px', transition: 'width 0.8s ease' }"></div>
              </div>
              <small class="muted">{{ dashboardData.global_stats.tasks.completed }} من أصل {{ dashboardData.global_stats.tasks.total }} مكتمل</small>
            </div>

            <div class="progress-item" style="width: 100%;">
              <div class="progress-labels" style="display: flex; justify-content: space-between; width: 100%;">
                <span>محتوى الخطط</span>
                <strong>{{ postsCompletionRate }}%</strong>
              </div>
              <div class="progress-bar-bg" style="width: 100%; height: 10px; background: rgba(0,0,0,0.3); border-radius: 5px; overflow: hidden; margin: 8px 0;">
                <div class="progress-bar-fill bg-purple" :style="{ width: postsCompletionRate + '%', height: '100%', borderRadius: '5px', transition: 'width 0.8s ease' }"></div>
              </div>
              <small class="muted">{{ dashboardData.global_stats.posts.completed }} من أصل {{ dashboardData.global_stats.posts.total }} مسلم</small>
            </div>

          </div>
        </div>
      </div>

      <!-- 5. مصفوفة أداء الفريق (Leaderboard with Deep Metrics) -->
      <div class="glass-card mb-4 table-container relative-container">
        
        <div v-if="loadingLeaderboard" class="inner-loading-overlay">
          <span class="spinner"></span>
        </div>

        <div class="card-header border-bottom pb-3 mb-3">
          <h3 class="card-title">👥 لوحة أداء وتأخيرات الفريق التفصيلية</h3>
          <span class="badge bg-amber">مرتبة من الأكثر تأخيراً</span>
        </div>
        
        <div class="table-responsive">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">#</th>
                <th style="min-width: 150px;">الموظف</th>
                <th>إجمالي المُسند</th>
                <th>قيد العمل ⏳</th>
                <th>مكتمل ✅</th>
                <th>متأخر 🚨</th>
                <th>الحالة والتقييم</th>
                <th>إجراء سريع</th>
              </tr>
            </thead>
            <tbody v-if="leaderboardData && leaderboardData.data.length > 0">
              <tr v-for="(user, index) in leaderboardData.data" :key="user.id" :class="getRowClass(user.health_status)">
                <td class="text-center" style="font-weight: 700; color: #8792be; width: 50px; vertical-align: middle;">{{ ((leaderboardData.current_page - 1) * (leaderboardData.per_page || 10)) + index + 1 }}</td>
                
                <!-- الموظف -->
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ getInitials(user.name) }}</div>
                    <div class="user-info"><strong>{{ user.name }}</strong></div>
                  </div>
                </td>
                
                <!-- إجمالي المُسند -->
                <td>
                  <div class="metric-cell">
                    <strong class="text-white big-num">{{ user.metrics.total.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.total.overall > 0">
                      <span v-if="user.metrics.total.tasks > 0" class="sub-badge blue">📋 {{ user.metrics.total.tasks }} مهام</span>
                      <span v-if="user.metrics.total.exec_posts > 0" class="sub-badge purple">🖌️ {{ user.metrics.total.exec_posts }} تنفيذ</span>
                      <span v-if="user.metrics.total.rev_posts > 0" class="sub-badge gray">👁️ {{ user.metrics.total.rev_posts }} مراجعة</span>
                    </div>
                  </div>
                </td>
                
                <!-- قيد العمل -->
                <td>
                  <div class="metric-cell">
                    <strong class="text-orange big-num">{{ user.metrics.pending.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.pending.overall > 0">
                      <span v-if="user.metrics.pending.tasks > 0" class="sub-item">📋 {{ user.metrics.pending.tasks }}</span>
                      <span v-if="user.metrics.pending.exec_posts > 0" class="sub-item">🖌️ {{ user.metrics.pending.exec_posts }}</span>
                      <span v-if="user.metrics.pending.rev_posts > 0" class="sub-item">👁️ {{ user.metrics.pending.rev_posts }}</span>
                    </div>
                  </div>
                </td>

                <!-- مكتمل -->
                <td>
                  <div class="metric-cell">
                    <strong class="text-green big-num">{{ user.metrics.completed.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.completed.overall > 0">
                      <span v-if="user.metrics.completed.tasks > 0" class="sub-item">📋 {{ user.metrics.completed.tasks }}</span>
                      <span v-if="user.metrics.completed.exec_posts > 0" class="sub-item">🖌️ {{ user.metrics.completed.exec_posts }}</span>
                      <span v-if="user.metrics.completed.rev_posts > 0" class="sub-item">👁️ {{ user.metrics.completed.rev_posts }}</span>
                    </div>
                  </div>
                </td>

                <!-- متأخر -->
                <td>
                  <div class="metric-cell">
                    <strong :class="user.metrics.overdue.overall > 0 ? 'text-red pulse-text big-num' : 'text-gray big-num'">{{ user.metrics.overdue.overall }}</strong>
                    <div class="sub-metrics" v-if="user.metrics.overdue.overall > 0">
                      <span v-if="user.metrics.overdue.tasks > 0" class="sub-item text-red">📋 {{ user.metrics.overdue.tasks }}</span>
                      <span v-if="user.metrics.overdue.exec_posts > 0" class="sub-item text-red">🖌️ {{ user.metrics.overdue.exec_posts }}</span>
                      <span v-if="user.metrics.overdue.rev_posts > 0" class="sub-item text-red">👁️ {{ user.metrics.overdue.rev_posts }}</span>
                    </div>
                  </div>
                </td>
                
                <!-- الحالة -->
                <td>
                  <div class="health-cell">
                    <span :class="['health-badge', user.health_status]">
                      {{ getHealthLabel(user.health_status) }}
                    </span>
                    <small class="muted mt-1 text-center d-block">خطر: {{ user.overdue_rate }}%</small>
                  </div>
                </td>
                
                <!-- إجراء سريع -->
                <td>
                  <div style="display: flex; gap: 8px; justify-content: center;">
                    <button @click="sendWhatsAppWarning(user)" class="quick-action-btn warn-btn" :disabled="user.metrics.overdue.overall === 0" title="إرسال تنبيه بالمتأخرات">
                      ⚠️ تنبيه
                    </button>
                    <button @click="sendGeneralMessage(user)" class="quick-action-btn msg-btn" title="بدء محادثة واتساب">
                      💬 رسالة
                    </button>
                  </div>
                </td>
                
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="8" class="text-center py-4 muted">لا يوجد موظفين مسند إليهم أعمال في هذه الصفحة.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- أزرار التنقل (Pagination Controls) -->
        <div v-if="leaderboardData && leaderboardData.last_page > 1" class="pagination-controls mt-4">
          <button class="page-btn" :disabled="leaderboardData.current_page === 1" @click="fetchLeaderboard(leaderboardData.current_page - 1)">
            السابق
          </button>
          <span class="page-info">
            صفحة <strong>{{ leaderboardData.current_page }}</strong> من <strong>{{ leaderboardData.last_page }}</strong>
          </span>
          <button class="page-btn" :disabled="leaderboardData.current_page === leaderboardData.last_page" @click="fetchLeaderboard(leaderboardData.current_page + 1)">
            التالي
          </button>
        </div>

      </div>

    </div>
  </section>

  <!-- 📂 الدرج الجانبي التفاعلي للبيانات التفصيلية (Offcanvas Drilldown Drawer) -->
  <Teleport to="body">
      <div 
        v-if="drawerOpen" 
        class="drilldown-drawer-overlay" 
        @click.self="closeDrawer"
        role="dialog"
        aria-modal="true"
      >
        <aside class="drilldown-drawer" dir="rtl">
          
          <!-- هيدر الدرج الجانبي -->
          <div class="drawer-header">
            <div class="drawer-header-info">
              <div class="drawer-icon-badge">{{ drawerIcon }}</div>
              <div>
                <h3 class="drawer-title">{{ drawerTitle }}</h3>
                <div class="drawer-meta-tags">
                  <span class="drawer-count-badge">
                    {{ filteredDrawerItems.length }} {{ drawerType === 'overdue_tasks' ? 'مهمة' : 'منشور' }}
                  </span>
                  <span class="drawer-horizon-badge">
                    📅 النطاق: {{ getHorizonLabel(selectedHorizon) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="drawer-header-actions">
              <button 
                type="button" 
                class="drawer-refresh-btn" 
                @click="openDrilldown(drawerType)" 
                :disabled="loadingDrawer"
                title="تحديث القائمة"
              >
                <span :class="{ 'is-spinning': loadingDrawer }">🔄</span>
              </button>
              <button 
                type="button" 
                class="drawer-close-btn" 
                @click="closeDrawer"
                title="إغلاق الدرج (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- شريط البحث السريع داخل الدرج -->
          <div class="drawer-search-bar" v-if="drawerItems.length > 0">
            <span class="drawer-search-icon">🔍</span>
            <input 
              type="text" 
              v-model="drawerSearch" 
              placeholder="ابحث بالاسم، المشروع، أو اسم الموظف..."
              class="drawer-search-input"
            />
            <button 
              v-if="drawerSearch" 
              type="button" 
              class="drawer-clear-search" 
              @click="drawerSearch = ''"
            >
              ✕
            </button>
          </div>

          <!-- جسم الدرج (قائمة العناصر) -->
          <div class="drawer-body">
            
            <!-- حالة التحميل داخل الدرج -->
            <div v-if="loadingDrawer" class="drawer-loading-state">
              <span class="spinner large"></span>
              <p>جارٍ تحميل التفاصيل التشغيلية...</p>
            </div>

            <!-- حالة عدم وجود بيانات -->
            <div v-else-if="filteredDrawerItems.length === 0" class="drawer-empty-state">
              <div class="drawer-empty-icon">🎉</div>
              <h4>لا توجد عناصر متأخرة حالياً</h4>
              <p v-if="drawerSearch">لا توجد نتائج تطابق بحثك "{{ drawerSearch }}".</p>
              <p v-else>كل العمليات التشغيلية ضمن هذا النطاق منجزة وفي موعدها المحدد.</p>
            </div>

            <!-- قائمة العناصر المتأخرة -->
            <div v-else class="drawer-items-list">
              
              <!-- كارت مهمة متأخرة -->
              <template v-if="drawerType === 'overdue_tasks'">
                <div 
                  v-for="task in filteredDrawerItems" 
                  :key="task.id" 
                  class="drawer-item-card task-card"
                  :class="{ 'is-urgent': task.is_urgent }"
                >
                  <div class="item-card-topline">
                    <div class="item-badges-row">
                      <span v-if="task.is_urgent" class="urgent-pill">🚨 عاجل جداً</span>
                      <span class="overdue-pill pulse-danger">
                        متأخرة منذ {{ task.days_overdue }} يوم
                      </span>
                      <span class="priority-pill" :class="'prio-' + task.priority">
                        {{ task.priority }}
                      </span>
                    </div>
                    <span class="item-date-text" :title="'تاريخ الاستحقاق: ' + task.due_date">
                      ⏰ {{ task.due_date || 'غير محدد' }}
                    </span>
                  </div>

                  <h4 class="item-title">{{ task.title }}</h4>

                  <div class="item-project-info">
                    <span class="project-pill">📁 {{ task.project_name }}</span>
                  </div>

                  <div class="item-person-strip">
                    <div class="person-avatar-wrap">
                      <div class="person-avatar">{{ getInitials(task.assignee_name) }}</div>
                      <div class="person-details">
                        <strong class="person-name">{{ task.assignee_name }}</strong>
                        <small class="person-role">{{ task.assignee_job }}</small>
                      </div>
                    </div>

                    <div class="item-actions-row">
                      <!-- زر الواتساب -->
                      <button 
                        type="button" 
                        class="drawer-btn wa-contact-btn"
                        @click="sendTaskWhatsApp(task)"
                        :title="task.assignee_phone ? 'مراسلة ' + task.assignee_name + ' عبر واتساب' : 'لا يوجد رقم مسجل'"
                      >
                        <span class="wa-icon">💬</span>
                        <span>واتساب</span>
                      </button>

                      <!-- زر إعادة الجدولة -->
                      <button 
                        type="button" 
                        class="drawer-btn reschedule-trigger-btn"
                        @click="startReschedule(task)"
                        title="إعادة جدولة موعد الاستحقاق"
                      >
                        <span>🗓️</span>
                        <span>إعادة جدولة</span>
                      </button>

                      <!-- رابط فتح المشروع -->
                      <button 
                        type="button" 
                        class="drawer-btn view-project-btn"
                        @click="navigateFromDrawer('/projects/' + task.project_id)"
                        title="الانتقال للمشروع"
                      >
                        <span>فتح ↗</span>
                      </button>
                    </div>
                  </div>

                  <!-- فورم إعادة الجدولة المباشر السريع -->
                  <div v-if="activeRescheduleId === task.id" class="inline-reschedule-box">
                    <div class="reschedule-box-header">
                      <span>🗓️ تحديد موعد استحقاق جديد للمهمة:</span>
                    </div>
                    <div class="reschedule-input-row">
                      <input 
                        type="datetime-local" 
                        v-model="rescheduleDate" 
                        class="reschedule-native-input"
                      />
                      <button 
                        type="button" 
                        class="reschedule-submit-btn" 
                        @click="submitReschedule(task)"
                        :disabled="savingReschedule"
                      >
                        {{ savingReschedule ? 'جارٍ الحفظ...' : 'تأكيد وحفظ' }}
                      </button>
                      <button 
                        type="button" 
                        class="reschedule-cancel-btn" 
                        @click="cancelReschedule"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- كارت منشور متأخر عن موعد التسليم -->
              <template v-else-if="drawerType === 'overdue_posts'">
                <div 
                  v-for="post in filteredDrawerItems" 
                  :key="post.id" 
                  class="drawer-item-card post-card"
                >
                  <div class="item-card-topline">
                    <div class="item-badges-row">
                      <span class="overdue-pill pulse-danger">
                        متأخر منذ {{ post.days_overdue }} يوم
                      </span>
                      <span class="type-pill">📱 {{ post.post_type }}</span>
                    </div>
                    <span class="item-date-text">
                      ⏰ الديدلاين: {{ post.deadline || 'غير محدد' }}
                    </span>
                  </div>

                  <h4 class="item-title">{{ post.title }}</h4>

                  <div class="item-project-info">
                    <span class="project-pill">📝 {{ post.plan_name }}</span>
                    <span v-if="post.target_date" class="target-date-pill">
                      📅 النشر المستهدف: {{ post.target_date }}
                    </span>
                  </div>

                  <div class="item-person-strip">
                    <div class="person-avatar-wrap">
                      <div class="person-avatar purple-avatar">{{ getInitials(post.designer_name) }}</div>
                      <div class="person-details">
                        <strong class="person-name">{{ post.designer_name }}</strong>
                        <small class="person-role">{{ post.designer_job }}</small>
                      </div>
                    </div>

                    <div class="item-actions-row">
                      <!-- زر الواتساب -->
                      <button 
                        type="button" 
                        class="drawer-btn wa-contact-btn"
                        @click="sendPostWhatsApp(post)"
                        :title="post.designer_phone ? 'مراسلة ' + post.designer_name + ' عبر واتساب' : 'لا يوجد رقم مسجل'"
                      >
                        <span class="wa-icon">💬</span>
                        <span>واتساب</span>
                      </button>

                      <!-- رابط فتح لوحة الخطة -->
                      <button 
                        type="button" 
                        class="drawer-btn view-board-btn"
                        @click="navigateFromDrawer('/plan-board/' + post.plan_id)"
                        title="فتح لوحة الخطة"
                      >
                        <span>لوحة الخطة ↗</span>
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- كارت منشور مرفوض في المراجعة -->
              <template v-else-if="drawerType === 'rejected_posts'">
                <div 
                  v-for="post in filteredDrawerItems" 
                  :key="post.id" 
                  class="drawer-item-card rejected-post-card"
                >
                  <div class="item-card-topline">
                    <div class="item-badges-row">
                      <span class="rejected-pill">❌ مرفوض</span>
                      <span class="type-pill">📱 {{ post.post_type }}</span>
                    </div>
                    <span class="item-date-text" v-if="post.target_date">
                      📅 النشر: {{ post.target_date }}
                    </span>
                  </div>

                  <h4 class="item-title">{{ post.title }}</h4>

                  <div class="item-project-info">
                    <span class="project-pill">📝 {{ post.plan_name }}</span>
                    <span class="rejected-by-pill">🔍 الرفض من: {{ post.rejected_by }}</span>
                  </div>

                  <!-- ملاحظات الرفض -->
                  <div class="rejection-reason-callout">
                    <div class="reason-label">⚠️ سبب الرفض والتعديلات المطلوبة:</div>
                    <p class="reason-text">{{ post.rejection_reason }}</p>
                  </div>

                  <div class="item-person-strip">
                    <div class="person-avatar-wrap">
                      <div class="person-avatar red-avatar">{{ getInitials(post.designer_name) }}</div>
                      <div class="person-details">
                        <strong class="person-name">{{ post.designer_name }}</strong>
                        <small class="person-role">{{ post.designer_job }}</small>
                      </div>
                    </div>

                    <div class="item-actions-row">
                      <!-- زر الواتساب -->
                      <button 
                        type="button" 
                        class="drawer-btn wa-contact-btn"
                        @click="sendPostWhatsApp(post)"
                        :title="post.designer_phone ? 'مراسلة ' + post.designer_name + ' عبر واتساب' : 'لا يوجد رقم مسجل'"
                      >
                        <span class="wa-icon">💬</span>
                        <span>تنبيه واتساب</span>
                      </button>

                      <!-- رابط فتح لوحة الخطة -->
                      <button 
                        type="button" 
                        class="drawer-btn view-board-btn"
                        @click="navigateFromDrawer('/plan-board/' + post.plan_id)"
                        title="فتح لوحة الخطة"
                      >
                        <span>لوحة الخطة ↗</span>
                      </button>
                    </div>
                  </div>
                </div>
              </template>

            </div>
          </div>

          <!-- ذيل الدرج -->
          <div class="drawer-footer">
            <button type="button" class="drawer-close-footer-btn" @click="closeDrawer">
              إغلاق الدرج
            </button>
          </div>

        </aside>
      </div>
    </Teleport>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../axios';
import alertService from '@/services/alertService';
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue';

const router = useRouter();
const loading = ref(true);
const loadingLeaderboard = ref(true);
const dashboardData = ref(null);
const leaderboardData = ref({ data: [], current_page: 1, last_page: 1 });

// ⏳ فلتر النطاق الزمني الذكي (Time Horizon)
const selectedHorizon = ref('all'); // 'today' | 'this_week' | 'this_month' | 'all'

// 📂 حالة الدرج الجانبي التفاعلي للبيانات التفصيلية (Offcanvas Drilldown Drawer)
const drawerOpen = ref(false);
const drawerType = ref(''); // 'overdue_tasks' | 'overdue_posts' | 'rejected_posts'
const drawerTitle = ref('');
const drawerIcon = ref('');
const drawerItems = ref([]);
const loadingDrawer = ref(false);
const drawerSearch = ref('');
const activeRescheduleId = ref(null);
const rescheduleDate = ref('');
const savingReschedule = ref(false);

const filteredDrawerItems = computed(() => {
  if (!drawerSearch.value || !drawerSearch.value.trim()) {
    return drawerItems.value;
  }
  const q = drawerSearch.value.trim().toLowerCase();
  return drawerItems.value.filter(item => {
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.project_name && item.project_name.toLowerCase().includes(q)) ||
      (item.plan_name && item.plan_name.toLowerCase().includes(q)) ||
      (item.assignee_name && item.assignee_name.toLowerCase().includes(q)) ||
      (item.designer_name && item.designer_name.toLowerCase().includes(q))
    );
  });
});

const getHorizonLabel = (range) => {
  if (range === 'today') return 'اليوم';
  if (range === 'this_week') return 'هذا الأسبوع';
  if (range === 'this_month') return 'هذا الشهر';
  return 'الكل (تراكمي)';
};

// ⭐ حالة مركز قرارات المدير
const activeHubTab = ref('all'); // 'all' | 'plans' | 'posts' | 'quick_tasks'
const approvingKey = ref(null);
const refreshingHub = ref(false);

const actionHub = computed(() => {
  return dashboardData.value?.action_hub || {
    total_pending: 0,
    counts: { plans: 0, posts: 0, quick_tasks: 0 },
    plans: [],
    posts: [],
    quick_tasks: []
  };
});

const displayedPlans = computed(() => {
  if (activeHubTab.value === 'all' || activeHubTab.value === 'plans') {
    return actionHub.value.plans || [];
  }
  return [];
});

const displayedPosts = computed(() => {
  if (activeHubTab.value === 'all' || activeHubTab.value === 'posts') {
    return actionHub.value.posts || [];
  }
  return [];
});

const displayedQuickTasks = computed(() => {
  if (activeHubTab.value === 'all' || activeHubTab.value === 'quick_tasks') {
    return actionHub.value.quick_tasks || [];
  }
  return [];
});

const hasItemsInActiveTab = computed(() => {
  if (activeHubTab.value === 'all') return (actionHub.value.total_pending || 0) > 0;
  if (activeHubTab.value === 'plans') return (actionHub.value.counts?.plans || 0) > 0;
  if (activeHubTab.value === 'posts') return (actionHub.value.counts?.posts || 0) > 0;
  if (activeHubTab.value === 'quick_tasks') return (actionHub.value.counts?.quick_tasks || 0) > 0;
  return false;
});

const currentUserName = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name ? user.name.split(' ')[0] : 'أيها المدير';
  } catch (e) {
    return 'أيها المدير';
  }
});

const currentDate = computed(() => {
  return new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

// الحسابات الذكية
const tasksCompletionRate = computed(() => {
  if (!dashboardData.value || dashboardData.value.global_stats.tasks.total === 0) return 0;
  return Math.round((dashboardData.value.global_stats.tasks.completed / dashboardData.value.global_stats.tasks.total) * 100);
});
const postsCompletionRate = computed(() => {
  if (!dashboardData.value || dashboardData.value.global_stats.posts.total === 0) return 0;
  return Math.round((dashboardData.value.global_stats.posts.completed / dashboardData.value.global_stats.posts.total) * 100);
});
const systemHealthRate = computed(() => {
  if (!dashboardData.value) return 0;
  const total = dashboardData.value.global_stats.tasks.total + dashboardData.value.global_stats.posts.total;
  if (total === 0) return 100;
  const completed = dashboardData.value.global_stats.tasks.completed + dashboardData.value.global_stats.posts.completed;
  return Math.round((completed / total) * 100);
});
const systemHealthColor = computed(() => {
  if (systemHealthRate.value >= 75) return 'stroke-green';
  if (systemHealthRate.value >= 40) return 'stroke-yellow';
  return 'stroke-red';
});

// دوال مساعدة
const getInitials = (name) => name ? name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';
const getHealthLabel = (status) => {
  if (status === 'safe') return '✅ سليم';
  if (status === 'warning') return '⚠️ حذر';
  return '🚨 خطر';
};
const getRowClass = (status) => {
  if (status === 'warning') return 'row-warning';
  if (status === 'danger') return 'row-danger';
  return '';
};

// واتساب


const sendGeneralMessage = (user) => {
  const message = `مرحباً ${user.name}،\n`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

const sendWhatsAppWarning = (user) => {
  if (user.metrics.overdue.overall === 0) return;
  
  let message = `مرحباً ${user.name}،\n\nيرجى الانتباه، لديك أعمال متأخرة عن موعد التسليم في النظام:\n`;
  if (user.metrics.overdue.tasks > 0) message += `- مهام مشاريع: ${user.metrics.overdue.tasks} متأخرة\n`;
  if (user.metrics.overdue.exec_posts > 0) message += `- منشورات خطط (كتنفيذ): ${user.metrics.overdue.exec_posts} متأخرة\n`;
  if (user.metrics.overdue.rev_posts > 0) message += `- منشورات خطط (كمراجعة): ${user.metrics.overdue.rev_posts} متأخرة\n`;
  
  message += `\nيرجى سرعة الإنجاز. بالتوفيق!`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
};

// ==========================================
// ⭐ دوال مركز قرارات واعتمادات المدير
// ==========================================
const navigateTo = (url) => {
  if (!url) return;
  router.push(url);
};

const changeHorizon = (range) => {
  if (selectedHorizon.value === range && !loading.value) return;
  selectedHorizon.value = range;
  fetchDashboardData(range);
  fetchLeaderboard(1, range);
};

const refreshActionHub = async () => {
  refreshingHub.value = true;
  try {
    await fetchDashboardData(selectedHorizon.value);
    alertService.success('تم تحديث قائمة القرارات والاعتمادات بنجاح');
  } catch (err) {
    console.error('Error refreshing action hub:', err);
  } finally {
    refreshingHub.value = false;
  }
};

const approveContentPlan = async (plan) => {
  const confirmed = await alertService.confirm({
    title: 'اعتماد خطة المحتوى 📋',
    message: `هل أنت متأكد من اعتماد خطة "${plan.name}"؟ ستصبح جاهزة للتسليم النهائي للعميل وسيتم إشعار الفريق فوراً.`,
    confirmText: 'نعم، اعتماد الآن',
    cancelText: 'إلغاء',
    type: 'success'
  });
  if (!confirmed) return;

  const key = `plan_${plan.id}`;
  approvingKey.value = key;
  try {
    const res = await api.post(`/content-plans/${plan.id}/approve`);
    alertService.success(res.data?.message || `تم اعتماد خطة "${plan.name}" بنجاح! 🎉`);
    
    // إزالة فورية من القائمة محلياً
    if (dashboardData.value?.action_hub) {
      dashboardData.value.action_hub.plans = dashboardData.value.action_hub.plans.filter(p => p.id !== plan.id);
      dashboardData.value.action_hub.counts.plans = Math.max(0, (dashboardData.value.action_hub.counts.plans || 1) - 1);
      dashboardData.value.action_hub.total_pending = Math.max(0, (dashboardData.value.action_hub.total_pending || 1) - 1);
    }
  } catch (err) {
    console.error('Error approving plan:', err);
    alertService.error(err.response?.data?.message || 'تعذر اعتماد الخطة، يرجى التحقق من اتصالك');
  } finally {
    approvingKey.value = null;
  }
};

const approvePlanPost = async (post) => {
  const confirmed = await alertService.confirm({
    title: 'اعتماد المنشور 📱',
    message: `هل أنت متأكد من اعتماد المنشور المحدد بخطة "${post.plan_name}"؟`,
    confirmText: 'نعم، اعتماد فوري',
    cancelText: 'إلغاء',
    type: 'success'
  });
  if (!confirmed) return;

  const key = `post_${post.id}`;
  approvingKey.value = key;
  try {
    await api.post(`/plan-posts/${post.id}/review`, {
      review_type: 'manager',
      status: 'معتمد'
    });
    alertService.success('تم اعتماد المنشور بنجاح ✅');
    
    // إزالة فورية من القائمة محلياً
    if (dashboardData.value?.action_hub) {
      dashboardData.value.action_hub.posts = dashboardData.value.action_hub.posts.filter(p => p.id !== post.id);
      dashboardData.value.action_hub.counts.posts = Math.max(0, (dashboardData.value.action_hub.counts.posts || 1) - 1);
      dashboardData.value.action_hub.total_pending = Math.max(0, (dashboardData.value.action_hub.total_pending || 1) - 1);
    }
  } catch (err) {
    console.error('Error approving post:', err);
    alertService.error(err.response?.data?.message || 'تعذر اعتماد المنشور');
  } finally {
    approvingKey.value = null;
  }
};

const approveQuickTask = async (task) => {
  const confirmed = await alertService.confirm({
    title: 'اعتماد المهمة السريعة ⚡',
    message: `هل أنت متأكد من اعتماد واكتمال المهمة السريعة "${task.title}" المسلمة من قِبل ${task.assignee_name}؟`,
    confirmText: 'نعم، اعتماد وإغلاق',
    cancelText: 'إلغاء',
    type: 'success'
  });
  if (!confirmed) return;

  const key = `quick_task_${task.id}`;
  approvingKey.value = key;
  try {
    await api.post(`/quick-tasks/${task.id}/review`, {
      status_changed_to: 'completed',
      feedback_text: 'تم الاعتماد والموافقة الفورية من مركز قرارات المدير'
    });
    alertService.success(`تم اعتماد المهمة "${task.title}" وإغلاقها بنجاح ✅`);
    
    // إزالة فورية من القائمة محلياً
    if (dashboardData.value?.action_hub) {
      dashboardData.value.action_hub.quick_tasks = dashboardData.value.action_hub.quick_tasks.filter(t => t.id !== task.id);
      dashboardData.value.action_hub.counts.quick_tasks = Math.max(0, (dashboardData.value.action_hub.counts.quick_tasks || 1) - 1);
      dashboardData.value.action_hub.total_pending = Math.max(0, (dashboardData.value.action_hub.total_pending || 1) - 1);
    }
  } catch (err) {
    console.error('Error approving quick task:', err);
    alertService.error(err.response?.data?.message || 'تعذر اعتماد المهمة السريعة');
  } finally {
    approvingKey.value = null;
  }
};

const fetchDashboardData = async (range = selectedHorizon.value) => {
  loading.value = true;
  try {
    const response = await api.get('/dashboard/manager', {
      params: { range }
    });
    dashboardData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const fetchLeaderboard = async (page = 1, range = selectedHorizon.value) => {
  loadingLeaderboard.value = true;
  try {
    const response = await api.get(`/dashboard/manager/leaderboard`, {
      params: { page, range }
    });
    leaderboardData.value = response.data.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  } finally {
    loadingLeaderboard.value = false;
  }
};

const openDrilldown = async (type) => {
  drawerType.value = type;
  drawerSearch.value = '';
  activeRescheduleId.value = null;
  drawerOpen.value = true;
  loadingDrawer.value = true;
  document.body.classList.add('drawer-open');

  if (type === 'overdue_tasks') {
    drawerTitle.value = 'المهام المتأخرة عن موعد التسليم';
    drawerIcon.value = '🚨';
  } else if (type === 'overdue_posts') {
    drawerTitle.value = 'المنشورات المتأخرة عن الديدلاين';
    drawerIcon.value = '⏳';
  } else if (type === 'rejected_posts') {
    drawerTitle.value = 'المنشورات المرفوضة في المراجعة';
    drawerIcon.value = '❌';
  }

  try {
    const res = await api.get('/dashboard/manager/drilldown', {
      params: {
        type: type,
        range: selectedHorizon.value
      }
    });
    if (res.data?.status === 'success') {
      drawerItems.value = res.data.data || [];
      drawerTitle.value = res.data.title || drawerTitle.value;
      drawerIcon.value = res.data.icon || drawerIcon.value;
    }
  } catch (err) {
    console.error('Error fetching drilldown data:', err);
    alertService.error('تعذر جلب تفاصيل القائمة المتأخرة');
  } finally {
    loadingDrawer.value = false;
  }
};

const closeDrawer = () => {
  drawerOpen.value = false;
  activeRescheduleId.value = null;
  document.body.classList.remove('drawer-open');
};

const navigateFromDrawer = (url) => {
  closeDrawer();
  navigateTo(url);
};

const sendTaskWhatsApp = (task) => {
  if (!task.assignee_phone) {
    alertService.info(`الموظف (${task.assignee_name}) ليس لديه رقم هاتف مسجل للنظام`);
    return;
  }
  const cleanPhone = String(task.assignee_phone).replace(/[^0-9]/g, '');
  const phone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  const msg = `مرحباً ${task.assignee_name}،\nتنبيه بشأن المهمة المتأخرة: *${task.title}*\n📁 المشروع: *${task.project_name}*\n⏰ تاريخ الاستحقاق السابق: ${task.due_date || 'غير محدد'}\nيرجى سرعة المتابعة والإنجاز وتحديث الحالة.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
};

const sendPostWhatsApp = (post) => {
  if (!post.designer_phone) {
    alertService.info(`المصمم (${post.designer_name}) ليس لديه رقم هاتف مسجل للنظام`);
    return;
  }
  const cleanPhone = String(post.designer_phone).replace(/[^0-9]/g, '');
  const phone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  let msg = '';
  if (post.type === 'rejected_post') {
    msg = `مرحباً ${post.designer_name}،\nتنبيه بشأن المنشور المرفوض: *${post.title}*\n📝 الخطة: *${post.plan_name}*\n⚠️ سبب الرفض: "${post.rejection_reason}"\nيرجى مراجعة الملاحظات وتعديل المنشور وإعادة رفعه.`;
  } else {
    msg = `مرحباً ${post.designer_name}،\nتنبيه بشأن المنشور المتأخر: *${post.title}*\n📝 الخطة: *${post.plan_name}*\n⏰ الديدلاين: ${post.deadline || 'غير محدد'}\nيرجى سرعة إنجازه ورفعه للمراجعة.`;
  }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
};

const startReschedule = (task) => {
  activeRescheduleId.value = task.id;
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  rescheduleDate.value = d.toISOString().slice(0, 16);
};

const cancelReschedule = () => {
  activeRescheduleId.value = null;
  rescheduleDate.value = '';
};

const submitReschedule = async (task) => {
  if (!rescheduleDate.value) {
    alertService.error('يرجى تحديد موعد الاستحقاق الجديد');
    return;
  }
  savingReschedule.value = true;
  try {
    const formattedDate = rescheduleDate.value.replace('T', ' ') + ':00';
    await api.put(`/tasks/${task.id}`, {
      due_date: formattedDate
    });

    alertService.success(`تمت إعادة جدولة المهمة "${task.title}" بنجاح 🗓️`);
    
    // إزالة المهمة من قائمة الدرج محلياً
    drawerItems.value = drawerItems.value.filter(t => t.id !== task.id);
    activeRescheduleId.value = null;

    // تحديث إحصائيات الداشبورد الرئيسية أيضاً
    if (dashboardData.value?.global_stats?.tasks?.overdue > 0) {
      dashboardData.value.global_stats.tasks.overdue--;
    }
  } catch (err) {
    console.error('Error rescheduling task:', err);
    alertService.error(err.response?.data?.message || 'تعذر إعادة جدولة المهمة');
  } finally {
    savingReschedule.value = false;
  }
};

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && drawerOpen.value) {
    closeDrawer();
  }
};

onMounted(() => {
  fetchDashboardData(selectedHorizon.value);
  fetchLeaderboard(1, selectedHorizon.value);
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  document.body.classList.remove('drawer-open');
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

:global(*) { box-sizing: border-box; }
.manager-dashboard { min-height: 100vh; color: #edf0ff; font-family: 'Cairo', sans-serif; padding-bottom: 30px; }
.page-topline { margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.topline-info { flex: 1; min-width: 280px; }

/* Time Horizon Filter Card */
.time-horizon-card {
  background: rgba(16, 22, 58, 0.85);
  border: 1px solid rgba(125, 232, 220, 0.25);
  border-radius: 16px;
  padding: 12px 18px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.horizon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.horizon-title {
  font-size: 12px;
  font-weight: 700;
  color: #9ba3c4;
}

.horizon-active-pill {
  font-size: 11px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

.horizon-buttons-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.horizon-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(137, 153, 226, 0.08);
  border: 1px solid rgba(137, 153, 226, 0.18);
  color: #9ba3c4;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.horizon-btn:hover {
  background: rgba(137, 153, 226, 0.2);
  color: #fff;
  border-color: rgba(137, 153, 226, 0.35);
}

.horizon-btn.active {
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.25), rgba(59, 130, 246, 0.25));
  border-color: #7de8dc;
  color: #fff;
  box-shadow: 0 4px 12px rgba(125, 232, 220, 0.2);
}

.horizon-select-wrapper {
  display: none;
}

.horizon-native-select {
  width: 100%;
  background: rgba(10, 15, 42, 0.85);
  border: 1px solid rgba(125, 232, 220, 0.3);
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-family: 'Cairo', sans-serif;
  outline: none;
  cursor: pointer;
}

.horizon-native-select option {
  background: #0f163d;
  color: #fff;
}

@media (max-width: 680px) {
  .horizon-buttons-group {
    display: none;
  }
  .horizon-select-wrapper {
    display: block;
  }
  .time-horizon-card {
    width: 100%;
  }
}
.eyebrow { color: #f59e0b; font-size: 13px; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 4px 12px; border-radius: 8px; display: inline-block; margin-bottom: 8px; }
.page-topline h2 { margin: 5px 0; font-size: 32px; font-weight: 800; color: #fff; }
.page-topline p { color: #9ba3c4; font-size: 14px; margin: 0; }

.state-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #7d89b6; font-size: 16px; }
.spinner { display: inline-block; border: 3px solid rgba(245, 158, 11, 0.25); border-top-color: #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; }
.spinner.large { width: 40px; height: 40px; margin-bottom: 15px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Stats Grids */
.mb-3 { margin-bottom: 15px; } .mb-4 { margin-bottom: 30px; } .mt-2 { margin-top: 10px; } .mt-4 { margin-top: 20px; }
.pb-3 { padding-bottom: 15px; } .d-block { display: block; }
.border-bottom { border-bottom: 1px solid rgba(137, 153, 226, 0.1); }
.section-title { font-size: 18px; color: #fff; font-weight: 800; margin-bottom: 15px; border-bottom: 1px solid rgba(137, 153, 226, 0.1); padding-bottom: 10px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; align-items: center; }
.grid-5 { grid-template-columns: 1fr 1fr auto 1fr 1fr 1fr; }
.grid-6 { grid-template-columns: repeat(6, 1fr); }

.stat-card { display: flex; align-items: center; justify-content: space-between; padding: 22px 20px; border-radius: 14px; background: rgba(10, 15, 44, 0.75); border: 1px solid rgba(137, 153, 226, 0.15); transition: transform 0.2s, box-shadow 0.2s; height: 100%; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.stat-info { display: flex; flex-direction: column; text-align: right; }
.stat-info small { color: #818cb9; font-size: 12px; margin-bottom: 5px; font-weight: 600; }
.stat-info strong { font-size: 26px; color: #fff; line-height: 1; font-weight: 800; }
.stat-icon { width: 45px; height: 45px; display: grid; place-items: center; font-size: 22px; background: rgba(255,255,255,0.05); border-radius: 12px; }

.primary-card { border-bottom: 3px solid #f59e0b; background: linear-gradient(180deg, rgba(10, 15, 44, 0.75) 0%, rgba(245, 158, 11, 0.05) 100%); }
.blue-card { border-bottom: 3px solid #3b82f6; }
.gray-card { border-bottom: 3px solid #64748b; opacity: 0.85; }
.orange-card { border-bottom: 3px solid #f97316; }
.purple-card { border-bottom: 3px solid #a855f7; }
.green-card { border-bottom: 3px solid #10b981; }
.red-card { border-bottom: 3px solid #ef4444; background: rgba(239, 68, 68, 0.08); }
.dark-red-card { border-bottom: 3px solid #991b1b; background: rgba(153, 27, 27, 0.15); }
.outline-card { border: 1px dashed rgba(137, 153, 226, 0.3); background: rgba(6, 11, 37, 0.4); }

.text-blue { color: #60a5fa; } .text-purple { color: #c084fc; } .text-green { color: #34d399; } .text-red { color: #f87171; } .text-orange { color: #f59e0b; } .text-white { color: #fff; } .text-gray { color: #94a3b8; }
.bg-amber { background: rgba(245, 158, 11, 0.15); color: #fcd34d; padding: 4px 10px; border-radius: 8px; font-size: 11px; }
.vertical-divider { width: 1px; height: 60px; background: rgba(137, 153, 226, 0.2); margin: 0 10px; }

.pulse-text { animation: pulse-text-red 2s infinite; }
@keyframes pulse-text-red { 0%, 100% { color: #f87171; text-shadow: none; } 50% { color: #ff9bad; text-shadow: 0 0 8px rgba(239,68,68,0.6); } }

/* Charts Grid */
.charts-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
.glass-card { background: rgba(15, 22, 61, 0.65); border: 1px solid rgba(137, 153, 226, 0.15); border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { margin: 0; font-size: 18px; color: #fff; font-weight: 700; }
.muted { color: #818cb9; } .text-sm { font-size: 12px; } .text-center { text-align: center; }

/* Table Styles & Micro Layout */
.relative-container { position: relative; }
.inner-loading-overlay { position: absolute; inset: 0; background: rgba(10, 15, 44, 0.6); backdrop-filter: blur(3px); display: grid; place-items: center; border-radius: 16px; z-index: 10; }
.table-responsive { overflow-x: auto; }
.leaderboard-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.leaderboard-table th { text-align: right; padding: 12px 15px; color: #818cb9; border-bottom: 1px solid rgba(137, 153, 226, 0.15); font-weight: 700; white-space: nowrap; }
.leaderboard-table td { padding: 15px; border-bottom: 1px solid rgba(137, 153, 226, 0.05); vertical-align: middle; }
.leaderboard-table tr:hover td { background: rgba(255,255,255,0.02); }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 35px; height: 35px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: grid; place-items: center; font-size: 11px; font-weight: bold; color: #fff; }
.user-info strong { color: #fff; font-size: 14px; display: block; }

/* Micro Layout Classes */
.metric-cell { display: flex; flex-direction: column; gap: 4px; }
.big-num { font-size: 20px; line-height: 1; font-weight: 800; }
.sub-metrics { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.sub-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; white-space: nowrap; }
.sub-badge.blue { background: rgba(59, 130, 246, 0.15); color: #93c5fd; }
.sub-badge.purple { background: rgba(168, 85, 247, 0.15); color: #d8b4fe; }
.sub-badge.gray { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; }
.sub-item { font-size: 10px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

.health-cell { display: flex; flex-direction: column; align-items: center; }
.health-badge { padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; width: 100%; text-align: center; }
.health-badge.safe { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.health-badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.health-badge.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

.row-warning td:first-child { border-right: 3px solid #f59e0b; }
.row-danger td:first-child { border-right: 3px solid #ef4444; background: rgba(239, 68, 68, 0.03); }

.wa-btn { background: #25d366; color: #000; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-family: 'Cairo'; cursor: pointer; transition: 0.2s; font-size: 12px; display: flex; align-items: center; gap: 5px; }
.wa-btn:hover:not(:disabled) { background: #22c55e; transform: scale(1.05); }
.wa-btn:disabled { background: #334155; color: #94a3b8; cursor: not-allowed; opacity: 0.7; }

/* SVG Donut Chart */
.circular-progress-wrapper { width: 130px; margin: 0 auto; }
.circular-chart { display: block; max-width: 100%; max-height: 250px; }
.kpi-circle { animation: progress 1s ease-out forwards; }
.stroke-green { stroke: #10b981; } .stroke-yellow { stroke: #f59e0b; } .stroke-red { stroke: #ef4444; }
.percentage { fill: #fff; font-family: 'Cairo', sans-serif; font-size: 9px; font-weight: 800; text-anchor: middle; }
@keyframes progress { 0% { stroke-dasharray: 0 100; } }

/* Progress Bars */
.progress-bars-container { display: flex; flex-direction: column; justify-content: center; height: 100%; }
.bg-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bg-purple { background: linear-gradient(90deg, #9333ea, #c084fc); }

/* Pagination Controls */
.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 20px; border-top: 1px solid rgba(137, 153, 226, 0.1); padding-top: 20px; }
.page-btn { background: rgba(137, 153, 226, 0.1); color: #8fc9ff; border: 1px solid rgba(137, 153, 226, 0.2); padding: 6px 16px; border-radius: 8px; font-family: 'Cairo'; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.page-btn:hover:not(:disabled) { background: #3b82f6; color: #fff; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: #aab5da; font-size: 13px; }
.page-info strong { color: #fff; }

@media (max-width: 1200px) {
  .grid-5 { grid-template-columns: 1fr 1fr; }
  .grid-6 { grid-template-columns: repeat(3, 1fr); }
  .vertical-divider { display: none; }
  .charts-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .grid-5, .grid-6 { grid-template-columns: 1fr 1fr; }
  .page-topline h2 { font-size: 26px; }
}
@media (max-width: 540px) {
  .grid-5, .grid-6 { grid-template-columns: 1fr; }
  .page-topline h2 { font-size: 22px; }
  .glass-card { padding: 16px 14px; }
  .stat-card { padding: 16px 14px; }
  .stat-info strong { font-size: 22px; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .pagination-controls { flex-wrap: wrap; gap: 10px; }
}

.quick-action-btn { border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-family: 'Cairo'; cursor: pointer; transition: 0.2s; font-size: 11px; display: flex; align-items: center; gap: 5px; }
.quick-action-btn.warn-btn { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.quick-action-btn.warn-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); transform: scale(1.05); }
.quick-action-btn.warn-btn:disabled { background: rgba(148, 163, 184, 0.1); color: #94a3b8; cursor: not-allowed; opacity: 0.5; }
.quick-action-btn.msg-btn { background: rgba(37, 211, 102, 0.15); color: #25d366; }
.quick-action-btn.msg-btn:hover { background: rgba(37, 211, 102, 0.25); transform: scale(1.05); }

/* ========================================================= */
/* ⭐ مركز قرارات واعتمادات المدير (Executive Action Hub) CSS */
/* ========================================================= */
.executive-action-hub {
  position: relative;
}

.hub-container {
  background: linear-gradient(135deg, rgba(16, 22, 58, 0.95), rgba(10, 15, 42, 0.98));
  border: 1px solid rgba(125, 232, 220, 0.25);
  border-top: 3px solid #7de8dc;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 25px rgba(125, 232, 220, 0.08);
  backdrop-filter: blur(20px);
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.hub-header-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hub-badge-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hub-crown-badge {
  font-size: 11px;
  font-weight: 800;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}

.hub-counter-pulse {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #ff6b81;
  background: rgba(255, 107, 129, 0.12);
  border: 1px solid rgba(255, 107, 129, 0.35);
  padding: 3px 12px;
  border-radius: 20px;
  position: relative;
}

.pulse-ring {
  width: 8px;
  height: 8px;
  background: #ff6b81;
  border-radius: 50%;
  animation: pulse-ring-anim 1.5s infinite;
}

.pulse-core {
  display: none;
}

@keyframes pulse-ring-anim {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 107, 129, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(255, 107, 129, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 107, 129, 0); }
}

.hub-counter-clear {
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 3px 12px;
  border-radius: 20px;
}

.hub-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hub-title-en {
  font-size: 13px;
  font-weight: 600;
  color: #7de8dc;
  opacity: 0.85;
}

.hub-subtitle {
  margin: 0;
  font-size: 13px;
  color: #9ba3c4;
}

.hub-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #b9c7ff;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.hub-refresh-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.2);
  color: #fff;
  border-color: #7de8dc;
}

.refresh-icon.is-spinning {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

/* Tabs Bar */
.hub-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(137, 153, 226, 0.12);
}

.hub-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(137, 153, 226, 0.08);
  border: 1px solid rgba(137, 153, 226, 0.16);
  color: #9ba3c4;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.hub-tab-btn:hover {
  background: rgba(137, 153, 226, 0.18);
  color: #fff;
}

.hub-tab-btn.active {
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.25), rgba(59, 130, 246, 0.25));
  border-color: #7de8dc;
  color: #fff;
  box-shadow: 0 4px 15px rgba(125, 232, 220, 0.15);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 800;
}

.tab-count.highlight {
  background: #f59e0b;
  color: #0b0f2a;
}

/* Empty State */
.hub-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  background: rgba(20, 28, 70, 0.4);
  border: 1px dashed rgba(125, 232, 220, 0.2);
  border-radius: 16px;
}

.hub-empty-state.mini {
  padding: 25px 15px;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(125, 232, 220, 0.1);
  display: grid;
  place-items: center;
  margin-bottom: 15px;
  box-shadow: 0 0 20px rgba(125, 232, 220, 0.2);
}

.empty-emoji {
  font-size: 30px;
}

.empty-emoji-mini {
  font-size: 24px;
  margin-bottom: 6px;
}

.hub-empty-state h4 {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}

.hub-empty-state p {
  margin: 0 0 14px 0;
  font-size: 13px;
  color: #9ba3c4;
  max-width: 500px;
}

.empty-status-tag {
  font-size: 11px;
  font-weight: 700;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
}

/* Cards Grid */
.hub-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 18px;
}

/* Individual Action Card */
.hub-action-card {
  background: rgba(20, 28, 70, 0.7);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.hub-action-card:hover {
  transform: translateY(-4px);
  background: rgba(26, 36, 88, 0.85);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

.hub-action-card.card-plan {
  border-right: 4px solid #38bdf8;
}

.hub-action-card.card-post {
  border-right: 4px solid #a855f7;
}

.hub-action-card.card-post.is-resubmitted {
  border-right: 4px solid #f59e0b;
}

.hub-action-card.card-quick-task {
  border-right: 4px solid #10b981;
}

.card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 10px;
}

.card-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge-cyan {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.badge-purple {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.badge-amber {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-teal {
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  border: 1px solid rgba(20, 184, 166, 0.3);
}

.pulse-amber {
  animation: pulse-amber-anim 1.5s infinite;
}

@keyframes pulse-amber-anim {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

.card-time {
  font-size: 11px;
  color: #818cb9;
  white-space: nowrap;
}

/* Card Main Details */
.card-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.card-entity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 1px solid rgba(137, 153, 226, 0.2);
}

.client-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.client-avatar.fallback {
  font-size: 12px;
  font-weight: 800;
  color: #7de8dc;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2));
}

.entity-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 18px;
  flex-shrink: 0;
}

.entity-icon.post-icon {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.entity-icon.qt-icon {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.entity-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-client-tag, .card-assignee-tag {
  font-size: 11px;
  color: #9ba3c4;
  margin-top: 2px;
}

.card-desc {
  margin: 0;
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  background: rgba(10, 15, 42, 0.4);
  padding: 8px 12px;
  border-radius: 8px;
}

.card-feedback-box {
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
}

.feedback-label {
  font-size: 10px;
  font-weight: 700;
  color: #fbbf24;
  display: block;
  margin-bottom: 3px;
}

.feedback-text {
  margin: 0;
  font-size: 12px;
  color: #fef3c7;
}

.card-audio-player {
  background: rgba(12, 18, 48, 0.6);
  border: 1px solid rgba(125, 232, 220, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
}

.audio-label {
  font-size: 11px;
  font-weight: 700;
  color: #7de8dc;
  margin-bottom: 6px;
}

.card-meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #cbd5e1;
  background: rgba(137, 153, 226, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.meta-chip.chip-link {
  color: #7de8dc;
  text-decoration: none;
  border: 1px solid rgba(125, 232, 220, 0.3);
  transition: all 0.2s;
}

.meta-chip.chip-link:hover {
  background: rgba(125, 232, 220, 0.2);
  color: #fff;
}

/* Card Actions Bar */
.card-actions-bar {
  display: flex;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid rgba(137, 153, 226, 0.12);
}

.hub-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.hub-btn.btn-approve {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: none;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.hub-btn.btn-approve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
}

.hub-btn.btn-approve:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.hub-btn.btn-inspect {
  background: rgba(137, 153, 226, 0.1);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #b9c7ff;
}

.hub-btn.btn-inspect:hover {
  background: rgba(137, 153, 226, 0.22);
  color: #fff;
  border-color: rgba(137, 153, 226, 0.45);
}

.spinner-btn {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@media (max-width: 768px) {
  .hub-container {
    padding: 16px;
  }
  .hub-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .hub-cards-grid {
    grid-template-columns: 1fr;
  }
  .hub-title {
    font-size: 18px;
  }
}

/* ========================================================= */
/* 🎯 الكروت الإحصائية التفاعلية الذكية (Clickable Drilldown) */
/* ========================================================= */
.clickable-card {
  cursor: pointer;
  position: relative;
  flex-wrap: wrap;
  row-gap: 8px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s, border-color 0.25s;
  user-select: none;
}

.clickable-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
  border-color: rgba(125, 232, 220, 0.45);
}

.clickable-card:active {
  transform: translateY(-2px);
}

.clickable-card:focus-visible {
  outline: 2px solid #7de8dc;
  outline-offset: 2px;
}

.card-action-chip {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #7de8dc;
  opacity: 0.85;
  transition: opacity 0.2s, transform 0.2s;
  padding-top: 6px;
  border-top: 1px dashed rgba(137, 153, 226, 0.15);
}

.clickable-card:hover .card-action-chip {
  opacity: 1;
  transform: translateX(-3px);
  color: #a5f3fc;
}

.card-action-chip.drawer-chip {
  color: #f87171;
}

.clickable-card:hover .card-action-chip.drawer-chip {
  color: #fca5a5;
}

.card-action-chip.highlight-chip {
  color: #fbbf24;
}

/* ========================================================= */
/* 📂 الدرج الجانبي التفاعلي السريع (Offcanvas Drilldown Drawer) */
/* ========================================================= */
.drilldown-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 6, 23, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999999;
  display: flex;
  justify-content: flex-end;
  animation: fadeInDrawerOverlay 0.25s ease-out;
}

@keyframes fadeInDrawerOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.drilldown-drawer {
  width: min(560px, 94vw);
  height: 100vh;
  background: linear-gradient(180deg, #10163a 0%, #0b0f2a 100%);
  border-left: 1px solid rgba(125, 232, 220, 0.25);
  box-shadow: -15px 0 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  animation: slideInDrawer 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Cairo', sans-serif;
  color: #edf0ff;
}

@keyframes slideInDrawer {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* هيدر الدرج */
.drawer-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(14, 20, 56, 0.85);
  border-bottom: 1px solid rgba(137, 153, 226, 0.18);
}

.drawer-header-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.drawer-icon-badge {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: grid;
  place-items: center;
  font-size: 24px;
}

.drawer-title {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
}

.drawer-meta-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drawer-count-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.drawer-horizon-badge {
  background: rgba(125, 232, 220, 0.12);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-refresh-btn, .drawer-close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(137, 153, 226, 0.2);
  color: #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s;
}

.drawer-refresh-btn {
  width: 38px;
  height: 38px;
  font-size: 15px;
}

.drawer-refresh-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.2);
  color: #7de8dc;
  border-color: #7de8dc;
}

.drawer-close-btn {
  width: 38px;
  height: 38px;
  font-size: 16px;
  font-weight: 800;
}

.drawer-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: #ef4444;
}

/* شريط البحث السريع بالدرج */
.drawer-search-bar {
  padding: 12px 24px;
  position: relative;
  background: rgba(10, 15, 42, 0.6);
  border-bottom: 1px solid rgba(137, 153, 226, 0.12);
}

.drawer-search-icon {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #818cb9;
}

.drawer-search-input {
  width: 100%;
  padding: 10px 38px 10px 36px;
  background: rgba(16, 22, 60, 0.7);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 12.5px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.drawer-search-input:focus {
  border-color: #7de8dc;
  box-shadow: 0 0 0 3px rgba(125, 232, 220, 0.15);
}

.drawer-clear-search {
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
}

/* جسم وقائمة الدرج */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.drawer-loading-state, .drawer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 280px;
  color: #818cb9;
}

.drawer-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.drawer-empty-state h4 {
  color: #fff;
  margin: 0 0 6px 0;
  font-size: 17px;
}

.drawer-empty-state p {
  margin: 0;
  font-size: 12.5px;
  max-width: 320px;
}

.drawer-items-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* كروت عناصر الدرج */
.drawer-item-card {
  background: rgba(18, 25, 68, 0.85);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 14px;
  padding: 16px 18px;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

.drawer-item-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 232, 220, 0.35);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.drawer-item-card.is-urgent {
  border-right: 4px solid #ef4444;
}

.item-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
  flex-wrap: wrap;
}

.item-badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.urgent-pill {
  background: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.45);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
}

.overdue-pill {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
}

.priority-pill {
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(137, 153, 226, 0.15);
  color: #cbd5e1;
}

.priority-pill.prio-عالية, .priority-pill.prio-high {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.type-pill {
  background: rgba(168, 85, 247, 0.18);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
}

.rejected-pill {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 800;
}

.item-date-text {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.item-title {
  margin: 0 0 10px 0;
  font-size: 14.5px;
  font-weight: 800;
  color: #fff;
  line-height: 1.4;
}

.item-project-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.project-pill {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.25);
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
}

.target-date-pill {
  background: rgba(137, 153, 226, 0.1);
  color: #a5b4fc;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11px;
}

.rejected-by-pill {
  background: rgba(245, 158, 11, 0.15);
  color: #fcd34d;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
}

/* سبب الرفض */
.rejection-reason-callout {
  background: rgba(239, 68, 68, 0.1);
  border: 1px dashed rgba(239, 68, 68, 0.35);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.reason-label {
  font-size: 11px;
  font-weight: 800;
  color: #fca5a5;
  margin-bottom: 4px;
}

.reason-text {
  margin: 0;
  font-size: 12px;
  color: #fecaca;
  line-height: 1.45;
}

/* شريط الموظف والإجراءات */
.item-person-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(137, 153, 226, 0.15);
  flex-wrap: wrap;
}

.person-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.person-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
}

.person-avatar.purple-avatar {
  background: linear-gradient(135deg, #a855f7, #6d28d9);
}

.person-avatar.red-avatar {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
}

.person-details {
  display: flex;
  flex-direction: column;
}

.person-name {
  font-size: 12.5px;
  color: #fff;
}

.person-role {
  font-size: 10.5px;
  color: #818cb9;
}

.item-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.wa-contact-btn {
  background: rgba(37, 211, 102, 0.15);
  color: #25D366;
  border-color: rgba(37, 211, 102, 0.35);
}

.wa-contact-btn:hover {
  background: #25D366;
  color: #0b1132;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
  transform: translateY(-2px);
}

.reschedule-trigger-btn {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border-color: rgba(168, 85, 247, 0.3);
}

.reschedule-trigger-btn:hover {
  background: rgba(168, 85, 247, 0.28);
  color: #fff;
  border-color: #a855f7;
  transform: translateY(-2px);
}

.view-project-btn, .view-board-btn {
  background: rgba(137, 153, 226, 0.12);
  color: #7de8dc;
  border-color: rgba(125, 232, 220, 0.25);
}

.view-project-btn:hover, .view-board-btn:hover {
  background: rgba(125, 232, 220, 0.25);
  color: #fff;
  border-color: #7de8dc;
  transform: translateY(-2px);
}

/* فورم إعادة الجدولة المباشر */
.inline-reschedule-box {
  margin-top: 14px;
  padding: 12px;
  background: rgba(10, 15, 42, 0.85);
  border: 1px solid rgba(168, 85, 247, 0.35);
  border-radius: 10px;
}

.reschedule-box-header {
  font-size: 11px;
  font-weight: 700;
  color: #c084fc;
  margin-bottom: 8px;
}

.reschedule-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reschedule-native-input {
  flex: 1;
  min-width: 180px;
  padding: 6px 10px;
  background: rgba(16, 22, 60, 0.8);
  border: 1px solid rgba(137, 153, 226, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-family: inherit;
  outline: none;
}

.reschedule-submit-btn {
  background: linear-gradient(135deg, #a855f7, #6d28d9);
  color: #fff;
  border: none;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s;
}

.reschedule-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.reschedule-cancel-btn {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(137, 153, 226, 0.2);
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
}

.reschedule-cancel-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

/* ذيل الدرج */
.drawer-footer {
  padding: 16px 24px;
  background: rgba(14, 20, 56, 0.85);
  border-top: 1px solid rgba(137, 153, 226, 0.18);
  display: flex;
  justify-content: flex-end;
}

.drawer-close-footer-btn {
  background: rgba(137, 153, 226, 0.12);
  border: 1px solid rgba(137, 153, 226, 0.25);
  color: #cbd5e1;
  padding: 8px 16px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.drawer-close-footer-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}
</style>