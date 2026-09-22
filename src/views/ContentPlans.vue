<template>
  <section class="plans-page" dir="rtl">
    <div class="page-topline">
      <div>
        <span class="eyebrow">مساحة العمل / خطط المحتوى</span>
        <h2>{{ (user && (user.role === 'manager' || user.job_title === 'Account Manager')) ? 'إدارة خطط المحتوى' : 'الخطط المسندة إليّ' }}</h2>
        <p>تابع مراحل العمل، دورات المراجعة، ومواعيد التسليم من مكان واحد.</p>
      </div>
      <button
        v-if="user && (user.role === 'manager' || user.job_title === 'Account Manager')"
        class="primary-btn"
        type="button"
        @click="openManagerModal()"
      >
        <span>＋</span> إنشاء خطة جديدة
      </button>
    </div>

    <div class="summary-strip">
      <div><span class="summary-icon teal">◈</span><div><small>إجمالي الخطط</small><strong>{{ plans.length }}</strong></div></div>
      <div><span class="summary-icon purple">◌</span><div><small>قيد المراجعة</small><strong>{{ underReviewCount }}</strong></div></div>
      <div><span class="summary-icon orange">◷</span><div><small>مرفوضة / متأخرة</small><strong>{{ delayedCount }}</strong></div></div>
      <div class="sync-status"><i></i> بيانات محدثة من مساحة العمل</div>
    </div>


    <!-- Filters Bar -->
    <div class="filters-bar" :class="{ 'advanced-open': showAdvancedFilters }">
      <div class="filters-header">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="filters.search" placeholder="بحث باسم العميل، نوع الخطة، أو ملاحظات..." @keyup.enter="applyFilters" />
        </div>
        <div class="filters-actions">
          <button class="secondary-btn" @click="toggleAdvancedFilters">
            <span>⎈</span> فلاتر متقدمة
          </button>
          <button class="primary-btn" @click="applyFilters" :disabled="loading">
            بحث وتصفية
          </button>
          <button class="secondary-btn text-red" v-if="hasActiveFilters" @click="resetFilters">
            إلغاء الفلاتر
          </button>
        </div>
      </div>
      
      <div class="advanced-filters" v-show="showAdvancedFilters">
        <div class="form-grid-3">
          <!-- Client Filter -->
          <div class="form-group">
            <label>العميل</label>
            <select v-model="filters.client_id">
              <option value="">الكل</option>
              <option v-for="client in allClients" :key="client.id" :value="client.id">{{ client.name }}</option>
            </select>
          </div>
          <!-- Plan Type -->
          <div class="form-group">
            <label>نوع الخطة</label>
            <select v-model="filters.plan_type">
              <option value="">الكل</option>
              <option value="استراتيجية">استراتيجية</option>
              <option value="محتوى">محتوى</option>
              <option value="سوشيال ميديا">سوشيال ميديا</option>
              <option value="إعلانات ممولة">إعلانات ممولة</option>
              <option value="SEO">SEO</option>
              <option value="خطة شاملة">خطة شاملة</option>
            </select>
          </div>
          <!-- Status -->
          <div class="form-group">
            <label>حالة الخطة</label>
            <select v-model="filters.status">
              <option value="">الكل</option>
              <option value="pending">قيد الانتظار</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="in_review">قيد المراجعة</option>
              <option value="completed">مكتملة</option>
              <option value="rejected">مرفوضة</option>
            </select>
          </div>
          <!-- Employee (Manager Only) -->
          <div class="form-group" v-if="user && (user.role === 'manager' || user.job_title === 'Account Manager')">
            <label>الموظف</label>
            <select v-model="filters.employee_id">
              <option value="">الكل</option>
              <option v-for="user in allUsers" :key="user.id" :value="user.id">{{ user.name }}</option>
            </select>
          </div>
          <!-- Plan Period -->
          <div class="form-group">
            <label>تاريخ الخطة (من)</label>
            <input type="date" v-model="filters.start_date" />
          </div>
          <div class="form-group">
            <label>تاريخ الخطة (إلى)</label>
            <input type="date" v-model="filters.end_date" />
          </div>
          <!-- Delivery Period -->
          <div class="form-group">
            <label>موعد التسليم (من)</label>
            <input type="date" v-model="filters.delivery_from" />
          </div>
          <div class="form-group">
            <label>موعد التسليم (إلى)</label>
            <input type="date" v-model="filters.delivery_to" />
          </div>
          <!-- Review Period -->
          <div class="form-group">
            <label>موعد المراجعة (من)</label>
            <input type="date" v-model="filters.review_from" />
          </div>
          <div class="form-group">
            <label>موعد المراجعة (إلى)</label>
            <input type="date" v-model="filters.review_to" />
          </div>
          
          <!-- Toggles -->
          <div class="form-group toggle-group" style="align-items: flex-start; grid-column: span 2;">
            <label>خيارات إضافية</label>
            <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top:5px;">
              <label class="custom-cb">
                <input type="checkbox" v-model="filters.is_overdue" value="1" />
                <span class="cb-text text-red">متأخرة فقط</span>
              </label>
              <label class="custom-cb">
                <input type="checkbox" v-model="filters.requires_review" value="1" />
                <span class="cb-text">تتطلب مراجعة</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="plans-card">
      <div class="card-heading">
        <div class="heading-title-group">
          <h3>الخطط الحالية <span>{{ plans.length }}</span></h3>
          <p>متابعة دورات الإنتاج، المراجعة، ومواعيد التسليم</p>
        </div>

        <div class="heading-actions-bar">
          <!-- أزرار تبديل نمط العرض (كروت / جدول) -->
          <div class="view-switcher">
            <button 
              type="button" 
              class="switcher-btn" 
              :class="{ active: viewMode === 'cards' }" 
              @click="setViewMode('cards')"
              title="عرض الكروت المنظمة (حديث ومبهر)"
            >
              <span>🔲</span> الكروت
            </button>
            <button 
              type="button" 
              class="switcher-btn" 
              :class="{ active: viewMode === 'table' }" 
              @click="setViewMode('table')"
              title="عرض الجدول الممتد"
            >
              <span>📑</span> الجدول
            </button>
          </div>

          <!-- أدوات التمرير السريع للجدول (تظهر فقط في وضع الجدول عند وجود Overflow) -->
          <div class="table-scroll-tools" v-if="viewMode === 'table' && isOverflowing">
            <span class="drag-hint">
              <span class="hint-icon">🖐️</span>
              <span>اسحب بالماوس أو Shift + العجلة</span>
            </span>
            <div class="quick-nav-group">
              <button
                type="button"
                class="quick-nav-btn"
                :disabled="!canScrollRight"
                @click="scrollTable('right')"
                title="تمرير الجدول لليمين"
                aria-label="تمرير الجدول لليمين"
              >
                <span>▶</span> لليمين
              </button>
              <button
                type="button"
                class="quick-nav-btn"
                :disabled="!canScrollLeft"
                @click="scrollTable('left')"
                title="تمرير الجدول لليسار"
                aria-label="تمرير الجدول لليسار"
              >
                لليسار <span>◀</span>
              </button>
            </div>
          </div>
        </div>

        <div class="legend" v-if="viewMode === 'table'">
          <span><i class="green-dot"></i> مكتملة</span>
          <span><i class="blue-dot"></i> جاهزة لمراجعة العميل</span>
          <span><i class="purple-dot"></i> قيد المراجعة</span>
          <span><i class="gray-dot"></i> قيد التنفيذ</span>
          <span><i class="orange-dot"></i> مرفوضة</span>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- 1. عرض الكروت المنظمة والحديثة (Cards View) -->
      <!-- ============================================== -->
      <div v-if="viewMode === 'cards'" class="cards-view-container">
        <div v-if="loading" class="state-cell">
          <span class="spinner"></span> جارٍ تحميل خطط المحتوى...
        </div>
        <div v-else-if="plans.length === 0" class="state-cell">
          لا توجد خطط مسجلة حاليًا تطابق الفلاتر المحددة.
        </div>
        <div v-else class="plans-grid">
          <div 
            v-for="plan in plans" 
            :key="plan.id" 
            class="plan-card"
            :class="['plan-card-' + plan.status, { 'is-delayed': isPlanDelayed(plan) }]"
          >
            <!-- شريط التوهج العلوي الديناميكي -->
            <div class="card-accent-bar" :class="'accent-' + plan.status"></div>

            <!-- رأس الكارت: معلومات العميل والحالة والإجراءات الإدارية -->
            <div class="card-header-row">
              <div class="client-meta-group">
                <div class="client-avatar-badge">{{ getInitials(plan.client?.name || '؟') }}</div>
                <div class="client-title-block">
                  <div class="client-title-line">
                    <h3 class="client-heading" :title="plan.client?.name">{{ plan.client?.name || 'عميل محذوف' }}</h3>
                    <span class="plan-type-tag">{{ plan.plan_type }}</span>
                  </div>
                  <div class="plan-date-range" v-if="plan.start_date || plan.end_date">
                    <span class="range-icon">📅</span>
                    <span class="range-text">{{ formatShortDate(plan.start_date) }} ⭢ {{ formatShortDate(plan.end_date) }}</span>
                  </div>
                </div>
              </div>

              <div class="card-top-right">
                <!-- شارة الحالة مع نقطة نابضة -->
                <div :class="['card-status-badge', getPlanStatusInfo(plan.status).class]">
                  <span class="pulse-indicator"></span>
                  <span>{{ getPlanStatusInfo(plan.status).text }}</span>
                </div>

                <!-- أدوات الإدارة للمدير السريعة -->
                <div class="admin-quick-actions" v-if="user && (user.role === 'manager' || user.job_title === 'Account Manager')">
                  <button 
                    v-if="plan.status !== 'completed'"
                    class="quick-icon-btn wa-btn" 
                    type="button" 
                    title="تنبيه واتساب الذكي"
                    aria-label="تنبيه واتساب"
                    @click="smartNotify(plan)"
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </button>
                  <button class="quick-icon-btn duplicate" type="button" title="استنساخ كقالب" @click="openDuplicateModal(plan)">⎘</button>
                  <button class="quick-icon-btn edit" type="button" title="تعديل الخطة" @click="openManagerModal(plan)">✎</button>
                  <button class="quick-icon-btn delete" type="button" title="حذف الخطة" @click="deletePlan(plan.id)">⌫</button>
                </div>
              </div>
            </div>

            <!-- صف الأدوار وفريق العمل -->
            <div class="team-roles-panel">
              <div class="team-role-item" :title="'المسؤول: ' + (getRoleNames(plan.users, 'responsible') || 'غير محدد')">
                <span class="role-icon-crown">👑</span>
                <div class="role-data">
                  <span class="role-name-caption">المسؤول</span>
                  <span class="role-user-val">{{ getRoleNames(plan.users, 'responsible') || '—' }}</span>
                </div>
              </div>

              <div class="team-role-item" :title="plan.requires_review ? ('المراجع: ' + (getRoleNames(plan.users, 'reviewer') || 'غير محدد')) : 'لا تتطلب مراجعة'">
                <span class="role-icon-eye">👁️</span>
                <div class="role-data">
                  <span class="role-name-caption">المراجع</span>
                  <span class="role-user-val" v-if="plan.requires_review">{{ getRoleNames(plan.users, 'reviewer') || '—' }}</span>
                  <span class="role-user-val muted" v-else>بدون مراجعة</span>
                </div>
              </div>

              <div class="team-role-item" :title="'المنفذين: ' + (getRoleNames(plan.users, 'executor') || 'غير محدد')">
                <span class="role-icon-bolt">⚡</span>
                <div class="role-data">
                  <span class="role-name-caption">المنفذين</span>
                  <span class="role-user-val">{{ getRoleNames(plan.users, 'executor') || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- شبكة معالم الإنجاز والـ SLA المزدوجة -->
            <div class="milestones-card-grid">
              <!-- 1. المراجعة الداخلية (المرحلة الأولى) -->
              <div class="milestone-card-block review-block">
                <div class="block-top">
                  <span class="block-label">🔍 المراجعة الداخلية</span>
                  <span class="block-date" v-if="plan.requires_review">إنهاء: {{ formatDate(plan.planned_review_date) }}</span>
                  <span class="block-date muted" v-else>— غير مطلوبة —</span>
                </div>

                <!-- تفاصيل موعد التسليم الابتدائي للمراجعة (ديدلاين المنفذ) -->
                <div v-if="plan.requires_review" class="initial-delivery-box">
                  <div class="initial-delivery-row">
                    <span class="id-label">موعد التسليم الابتدائي:</span>
                    <span class="id-val" :class="{ 'id-highlight': plan.planned_initial_delivery_date }">
                      {{ plan.planned_initial_delivery_date ? formatDate(plan.planned_initial_delivery_date) : 'غير محدد' }}
                    </span>
                  </div>

                  <!-- شارة التسليم الفعلي إذا تم التسليم الابتدائي -->
                  <div v-if="plan.actual_initial_delivery_date" class="actual-delivery-tag">
                    <span class="tag-icon">✓</span>
                    <span>تم التسليم الابتدائي: {{ formatDate(plan.actual_initial_delivery_date) }}</span>
                  </div>

                  <!-- عداد SLA للتسليم الابتدائي إذا لم يُسلّم بعد للمراجعة -->
                  <div class="sla-indicator" v-else-if="plan.planned_initial_delivery_date && (plan.status === 'pending' || plan.status === 'rejected')">
                    <span class="sla-msg" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_initial_delivery_date, plan.status, currentTime).class + '-text'">
                      {{ getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_initial_delivery_date, plan.status, currentTime).message }}
                    </span>
                    <div class="sla-progress-bg">
                      <div class="sla-progress-fill" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_initial_delivery_date, plan.status, currentTime).class + '-bg'" :style="{ width: getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_initial_delivery_date, plan.status, currentTime).percentage + '%' }"></div>
                    </div>
                  </div>
                </div>

                <!-- مؤشر SLA لإنهاء المراجعة عند دخول الخطة للمراجعة أو كاحتياطي -->
                <div class="sla-indicator" v-if="plan.requires_review && plan.planned_review_date && (plan.status === 'under_review' || (!plan.planned_initial_delivery_date && ['pending', 'rejected'].includes(plan.status)))">
                  <span class="sla-msg" :class="getDeadlineStatus(plan.actual_initial_delivery_date || plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).class + '-text'">
                    {{ getDeadlineStatus(plan.actual_initial_delivery_date || plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).message }}
                  </span>
                  <div class="sla-progress-bg" v-if="!['reviewed', 'completed'].includes(plan.status)">
                    <div class="sla-progress-fill" :class="getDeadlineStatus(plan.actual_initial_delivery_date || plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).class + '-bg'" :style="{ width: getDeadlineStatus(plan.actual_initial_delivery_date || plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).percentage + '%' }"></div>
                  </div>
                </div>
                <div v-else-if="!plan.requires_review" class="no-review-placeholder">
                  لا تتطلب مراجعة داخلية
                </div>

                <div class="block-action-slot">
                  <!-- زر تسليم للمراجعة للمسؤول أو المنفذ أو الـ Account Manager أو المدير -->
                  <div v-if="canSubmitForReview(plan) && plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')">
                    <div v-if="!hasPlanLink(plan)" class="plan-link-warning-pill" @click="openDetailsModal(plan, true)" title="اضغط لإضافة رابط البلان في تفاصيل الخطة">
                      <span>⚠️ يجب إضافة رابط البلان أولاً</span>
                    </div>
                    <button class="confirm-btn review full-w-btn" :class="{ 'btn-missing-link': !hasPlanLink(plan) }" type="button" :disabled="actionLoading === `submit-review-${plan.id}`" @click="submitForReview(plan)" :title="!hasPlanLink(plan) ? 'اضغط لإضافة رابط البلان النهائي بتفاصيل الخطة أولاً' : 'تسليم الخطة للمراجعة'">
                      {{ actionLoading === `submit-review-${plan.id}` ? 'جارٍ...' : 'تسليم للمراجعة 📤' }}
                    </button>
                  </div>

                  <!-- أزرار القبول والرفض للمراجع أو المدير -->
                  <div v-if="isUserReviewer(plan) && plan.status === 'under_review'" class="review-btn-duo">
                    <button class="confirm-btn accept-btn" :disabled="actionLoading === `approve-${plan.id}`" @click="approvePlan(plan)">قبول ✅</button>
                    <button class="confirm-btn reject-btn" :disabled="actionLoading === `reject-${plan.id}`" @click="openRejectModal(plan)">رفض ❌</button>
                  </div>
                  <!-- شارة واضحة إذا كانت الخطة قيد المراجعة ولمن ليس لديه صلاحية مراجعة -->
                  <div v-else-if="plan.status === 'under_review'" class="status-badge status-yellow full-w-badge text-center" style="justify-content:center;">
                    <i></i> قيد المراجعة الداخلية حالياً
                  </div>

                  <div v-if="plan.status === 'rejected'">
                    <button class="reject-reasons-btn full-w-btn mt-1" type="button" @click="openRejectionsModal(plan)">عرض أسباب الرفض 📄</button>
                  </div>

                  <span v-if="plan.requires_review && (plan.status === 'reviewed' || plan.status === 'completed')" class="review-done-badge">
                    تمت المراجعة: {{ formatDate(plan.actual_review_date) }}
                  </span>
                </div>
              </div>

              <!-- 2. التسليم النهائي (المرحلة الثانية) -->
              <div class="milestone-card-block delivery-block">
                <div class="block-top">
                  <span class="block-label">🏁 التسليم النهائي</span>
                  <span class="block-date">{{ formatDate(plan.planned_delivery_date) }}</span>
                </div>

                <div class="sla-indicator" v-if="plan.planned_delivery_date">
                  <span class="sla-msg" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).class + '-text'">
                    {{ getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).message }}
                  </span>
                  <div class="sla-progress-bg" v-if="plan.status !== 'completed'">
                    <div class="sla-progress-fill" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).class + '-bg'" :style="{ width: getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).percentage + '%' }"></div>
                  </div>
                </div>

                <div class="block-action-slot">
                  <div v-if="plan.status === 'completed'" class="status-badge status-green">
                    <i></i> تم التسليم <small>{{ formatDate(plan.actual_delivery_date) }}</small>
                  </div>
                  <div v-else-if="isUserResponsible(plan) && (plan.status === 'reviewed' || (!plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')))">
                    <div v-if="!hasPlanLink(plan)" class="plan-link-warning-pill" @click="openDetailsModal(plan, true)" title="اضغط لإضافة رابط البلان في تفاصيل الخطة">
                      <span>⚠️ يجب إضافة رابط البلان أولاً</span>
                    </div>
                    <button 
                      class="confirm-btn full-w-btn" 
                      :class="{ 'btn-missing-link': !hasPlanLink(plan) }"
                      type="button" 
                      :disabled="actionLoading === `delivery-${plan.id}`" 
                      @click="submitFinalDelivery(plan)"
                      :title="!hasPlanLink(plan) ? 'اضغط لإضافة رابط البلان النهائي بتفاصيل الخطة أولاً' : 'تأكيد التسليم النهائي للعميل'"
                    >
                      {{ actionLoading === `delivery-${plan.id}` ? 'جارٍ...' : 'تأكيد التسليم النهائي ✅' }}
                    </button>
                  </div>
                  <span v-else-if="plan.requires_review && !['reviewed', 'completed'].includes(plan.status)" class="muted-slot-text">بانتظار إنهاء المراجعة</span>
                  <span v-else class="muted-slot-text">بانتظار إنهاء الدورة</span>
                </div>
              </div>
            </div>

            <!-- فوتر الكارت: المتابعات والروابط المساعدة والزر المباشر للوحة -->
            <div class="card-footer-controls">
              <div class="card-links-cluster">
                <button 
                  class="cluster-btn followup" 
                  type="button" 
                  :disabled="plan.requires_review && !['reviewed', 'completed'].includes(plan.status)"
                  :title="plan.requires_review && !['reviewed', 'completed'].includes(plan.status) ? 'غير متاح قبل انتهاء المراجعة الداخلية' : 'متابعات العميل'"
                  @click="openFollowUpsModal(plan)"
                >
                  <span>💬</span> متابعة العميل ({{ getFollowUps(plan).length }})
                </button>

                <button 
                  v-if="plan.reference_links && plan.reference_links.length > 0" 
                  class="cluster-btn references" 
                  type="button" 
                  @click="openReferencesModal(plan)"
                  title="المراجع المساعدة المرفقة"
                >
                  <span>🔗</span> المراجع ({{ plan.reference_links.length }})
                </button>

                <button 
                  v-if="getReviewHistories(plan).length > 0" 
                  class="cluster-btn history" 
                  type="button" 
                  @click="openHistoryModal(plan)"
                  title="سجل حركات واعتمادات الخطة"
                >
                  <span>📋</span> سجل الحركات
                </button>

                <button 
                  class="cluster-btn details" 
                  type="button" 
                  @click="openDetailsModal(plan)"
                  title="عرض تفاصيل الخطة والديدلاين والملاحظات"
                >
                  <span>✎</span> تفاصيل الخطة
                </button>

                <a 
                  v-if="hasPlanLink(plan)" 
                  class="cluster-btn plan-link" 
                  :href="plan.final_link.startsWith('http') ? plan.final_link : 'https://' + plan.final_link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="فتح رابط البلان النهائي في نافذة جديدة"
                >
                  <span>🔗</span> رابط البلان
                </a>
              </div>

              <router-link :to="`/plan-board/${plan.id}`" class="spreadsheet-link-banner">
                <span>فتح لوحة المحتوى (Spreadsheet)</span>
                <span class="rocket-icon">🚀</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- 2. عرض الجدول الكلاسيكي (Table View) -->
      <!-- ============================================== -->
      <div v-else-if="viewMode === 'table'" class="table-view-container">
        <div class="table-scroll-wrapper" ref="tableScrollWrapper">
          <!-- أزرار التمرير العائمة على حواف الجدول -->
          <button
            v-if="isOverflowing && canScrollRight"
            type="button"
            class="edge-scroll-btn btn-right"
            @click="scrollTable('right')"
            title="تمرير الجدول لليمين"
            aria-label="تمرير الجدول لليمين"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>

          <button
            v-if="isOverflowing && canScrollLeft"
            type="button"
            class="edge-scroll-btn btn-left"
            @click="scrollTable('left')"
            title="تمرير الجدول لليسار"
            aria-label="تمرير الجدول لليسار"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>

          <!-- ظلال أطراف الجدول لتوضيح وجود محتوى مخفي -->
          <div class="scroll-edge-shadow shadow-right" :class="{ 'is-active': isOverflowing && canScrollRight }"></div>
          <div class="scroll-edge-shadow shadow-left" :class="{ 'is-active': isOverflowing && canScrollLeft }"></div>

          <div
            class="table-responsive"
            ref="tableContainer"
            tabindex="0"
            aria-label="جدول خطط المحتوى قابل للتمرير أفقيًا"
            @mousedown="onTableMouseDown"
            @mousemove="onTableMouseMove"
            @mouseup="onTableMouseUp"
            @wheel="onTableWheel"
            @scroll="onTableScroll"
          >
            <table class="plans-table" :aria-busy="loading">
            <thead>
              <tr>
                <th scope="col">العميل والخطة</th>
                <th scope="col">المسؤول</th>
                <th scope="col">المراجع الداخلي</th>
                <th scope="col">القائم بالخطة (المنفذ)</th>
                <th scope="col">التسليم النهائي</th>
                <th scope="col">المراجعة وحالة الخطة</th>
                <th scope="col">الروابط والمتابعة</th>
                <th v-if="user && (user.role === 'manager' || user.job_title === 'Account Manager')">إدارة</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td :colspan="(user && (user.role === 'manager' || user.job_title === 'Account Manager')) ? 8 : 7" class="state-cell"><span class="spinner"></span> جارٍ التحميل...</td></tr>
              <tr v-else-if="plans.length === 0"><td :colspan="(user && (user.role === 'manager' || user.job_title === 'Account Manager')) ? 8 : 7" class="state-cell">لا توجد خطط مسجلة حاليًا</td></tr>
              <tr v-for="plan in plans" v-else :key="plan.id">
                <td>
                  <div class="plan-cell">
                    <div class="plan-avatar">{{ getInitials(plan.client?.name || '؟') }}</div>
                    <div><strong>{{ plan.client?.name || 'عميل محذوف' }}</strong><span>{{ plan.plan_type }}</span></div>
                  </div>
                </td>
                <td><span class="people-cell">{{ getRoleNames(plan.users, 'responsible') }}</span></td>
                <td><span v-if="plan.requires_review" class="people-cell">{{ getRoleNames(plan.users, 'reviewer') }}</span><span v-else class="muted">—</span></td>
                <td><span class="people-cell">{{ getRoleNames(plan.users, 'executor') }}</span></td>
                
                <td>
                  <div class="milestone">
                    <span class="date">{{ formatDate(plan.planned_delivery_date) }}</span>
                    
                    <div class="sla-indicator" v-if="plan.planned_delivery_date">
                      <span class="sla-msg" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).class + '-text'">
                        {{ getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).message }}
                      </span>
                      <div class="sla-progress-bg" v-if="plan.status !== 'completed'">
                        <div class="sla-progress-fill" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).class + '-bg'" :style="{ width: getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime).percentage + '%' }"></div>
                      </div>
                    </div>

                    <div v-if="plan.status === 'completed'" class="status-badge status-green mt-2">
                      <i></i> تم التسليم <small>{{ formatDate(plan.actual_delivery_date) }}</small>
                    </div>
                    <div v-else-if="isUserResponsible(plan) && (plan.status === 'reviewed' || (!plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')))">
                      <div v-if="!hasPlanLink(plan)" class="plan-link-warning-pill table-pill" @click="openDetailsModal(plan, true)" title="اضغط لإضافة رابط البلان">
                        <span>⚠️ رابط البلان مطلوب</span>
                      </div>
                      <button class="confirm-btn mt-1" :class="{ 'btn-missing-link': !hasPlanLink(plan) }" type="button" :disabled="actionLoading === `delivery-${plan.id}`" @click="submitFinalDelivery(plan)" :title="!hasPlanLink(plan) ? 'اضغط لإضافة رابط البلان بتفاصيل الخطة أولاً' : 'تأكيد التسليم النهائي'">
                        {{ actionLoading === `delivery-${plan.id}` ? 'جارٍ...' : 'تأكيد التسليم النهائي' }}
                      </button>
                    </div>
                    <span v-else class="muted mt-2 d-block">بانتظار إنهاء الدورة</span>
                  </div>
                </td>
                
                <td>
                  <div class="milestone" style="min-width: 175px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span v-if="plan.requires_review" class="date-header-badge">المراجعة الداخلية</span>
                      <span v-else class="muted mb-1" style="display:block;">— لا تتطلب مراجعة —</span>
                      
                      <button v-if="isManager && plan.status !== 'completed'" title="تنبيه واتساب الذكي" aria-label="إرسال تنبيه واتساب ذكي" class="wa-quick-btn" type="button" @click="smartNotify(plan)">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      </button>
                    </div>

                    <div v-if="plan.requires_review" class="table-milestone-dates">
                      <div class="table-date-line">
                        <span class="t-label">التسليم الابتدائي:</span>
                        <span class="t-val">{{ plan.planned_initial_delivery_date ? formatDate(plan.planned_initial_delivery_date) : 'غير محدد' }}</span>
                      </div>
                      <div v-if="plan.actual_initial_delivery_date" class="t-actual-badge">
                        ✓ تم التسليم: {{ formatDate(plan.actual_initial_delivery_date) }}
                      </div>
                      <div class="table-date-line">
                        <span class="t-label">إنهاء المراجعة:</span>
                        <span class="t-val">{{ formatDate(plan.planned_review_date) }}</span>
                      </div>
                    </div>
                    
                    <div class="sla-indicator mb-2" v-if="plan.requires_review && plan.planned_review_date">
                      <span class="sla-msg" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).class + '-text'">
                        {{ getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).message }}
                      </span>
                      <div class="sla-progress-bg" v-if="!['reviewed', 'completed'].includes(plan.status)">
                        <div class="sla-progress-fill" :class="getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).class + '-bg'" :style="{ width: getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_review_date, ['reviewed', 'completed'].includes(plan.status) ? 'completed' : plan.status, currentTime).percentage + '%' }"></div>
                      </div>
                    </div>

                    <div v-if="canSubmitForReview(plan) && plan.requires_review && (plan.status === 'pending' || plan.status === 'rejected')" class="mt-1 mb-1">
                      <div v-if="!hasPlanLink(plan)" class="plan-link-warning-pill table-pill" @click="openDetailsModal(plan, true)" title="اضغط لإضافة رابط البلان">
                        <span>⚠️ رابط البلان مطلوب</span>
                      </div>
                      <button class="confirm-btn review" :class="{ 'btn-missing-link': !hasPlanLink(plan) }" type="button" :disabled="actionLoading === `submit-review-${plan.id}`" @click="submitForReview(plan)" :title="!hasPlanLink(plan) ? 'اضغط لإضافة رابط البلان بتفاصيل الخطة أولاً' : 'تسليم للمراجعة'">
                        {{ actionLoading === `submit-review-${plan.id}` ? 'جارٍ...' : 'تسليم للمراجعة 📤' }}
                      </button>
                    </div>
                    
                    <div v-if="isUserReviewer(plan) && plan.status === 'under_review'" class="review-actions mt-1 mb-1">
                      <button class="confirm-btn accept-btn" :disabled="actionLoading === `approve-${plan.id}`" @click="approvePlan(plan)">قبول ✅</button>
                      <button class="confirm-btn reject-btn" :disabled="actionLoading === `reject-${plan.id}`" @click="openRejectModal(plan)">رفض ❌</button>
                    </div>

                    <div :class="['status-badge', getPlanStatusInfo(plan.status).class]">
                      <i></i>{{ getPlanStatusInfo(plan.status).text }}
                      <small v-if="plan.requires_review && (plan.status === 'reviewed' || plan.status === 'completed')">{{ formatDate(plan.actual_review_date) }}</small>
                    </div>

                    <div v-if="plan.status === 'rejected'" class="mt-2">
                      <button class="reject-reasons-btn" type="button" @click="openRejectionsModal(plan)">عرض أسباب الرفض 📄</button>
                    </div>
                  </div>
                </td>
                
                <td class="details-cell">
                  <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-start;">
                    <button class="followup-btn" type="button" 
                            :disabled="plan.requires_review && !['reviewed', 'completed'].includes(plan.status)"
                            :title="plan.requires_review && !['reviewed', 'completed'].includes(plan.status) ? 'غير متاح قبل انتهاء المراجعة الداخلية' : ''"
                            @click="openFollowUpsModal(plan)">
                      متابعة العميل 💬 ({{ getFollowUps(plan).length }})
                    </button>
                    <button v-if="plan.reference_links && plan.reference_links.length > 0" class="ref-links-btn" type="button" @click="openReferencesModal(plan)">
                      المراجع المساعدة 🔗 ({{ plan.reference_links.length }})
                    </button>
                    <button v-if="getReviewHistories(plan).length > 0" @click="openHistoryModal(plan)" class="history-btn">سجل الحركات 📋</button>
                    <button class="details-btn" type="button" @click="openDetailsModal(plan)">تفاصيل الخطة</button>
                    <a v-if="hasPlanLink(plan)" :href="plan.final_link.startsWith('http') ? plan.final_link : 'https://' + plan.final_link" target="_blank" rel="noopener noreferrer" class="plan-link-table-btn" title="فتح رابط البلان النهائي">
                      رابط البلان 🔗
                    </a>
                  </div>
                </td>
                
                <td v-if="user && (user.role === 'manager' || user.job_title === 'Account Manager')">
                  <div class="actions-cell">
                    <button class="action duplicate" type="button" title="استنساخ كقالب" aria-label="استنساخ الخطة" @click="openDuplicateModal(plan)">⎘</button>
                    <button class="action edit" type="button" title="تعديل" aria-label="تعديل خطة المحتوى" @click="openManagerModal(plan)">✎</button>
                    <button class="action delete" type="button" title="حذف" aria-label="حذف خطة المحتوى" @click="deletePlan(plan.id)">⌫</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>

    

    <!-- Pagination -->
    <div class="pagination-controls" v-if="pagination.last_page > 1">
      <button class="secondary-btn" :disabled="pagination.current_page === 1" @click="changePage(pagination.current_page - 1)">السابق</button>
      <span class="page-info">صفحة {{ pagination.current_page }} من {{ pagination.last_page }} (إجمالي {{ pagination.total }})</span>
      <button class="secondary-btn" :disabled="pagination.current_page === pagination.last_page" @click="changePage(pagination.current_page + 1)">التالي</button>
    </div>

    <Teleport to="body">
      <div v-if="showDuplicateModal" class="modal-overlay" role="presentation" @click.self="closeDuplicateModal">
      <div class="modal-content" role="dialog" style="width: min(500px, 100%) !important;">
        <button class="modal-close" type="button" @click="closeDuplicateModal">×</button>
        <div class="modal-icon" style="background: linear-gradient(145deg, #78e4d8, #65b5ff); color: #12183f;">⎘</div>
        <span class="eyebrow" style="color: #65b5ff;">استنساخ سريع</span>
        <h3>تحديد تواريخ الشهر الجديد</h3>
        <p>سيتم نسخ العميل، نوع الخطة، الروابط، وفريق العمل كما هم من الخطة الأصلية.</p>
        
        <form class="plan-form mt-2" @submit.prevent="submitDuplicate">
          <div class="form-grid">
            <div class="form-group">
              <label>تاريخ بداية الخطة</label>
              <input v-model="duplicateForm.start_date" type="date" required />
            </div>
            <div class="form-group">
              <label>تاريخ نهاية الخطة</label>
              <input v-model="duplicateForm.end_date" type="date" required />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>التسليم النهائي</label>
              <input v-model="duplicateForm.planned_delivery_date" type="datetime-local" required />
            </div>
          </div>
          <div class="form-grid" v-if="planToDuplicate?.requires_review">
            <div class="form-group">
              <label>موعد التسليم الابتدائي</label>
              <input v-model="duplicateForm.planned_initial_delivery_date" type="datetime-local" />
            </div>
            <div class="form-group">
              <label>موعد إنهاء المراجعة</label>
              <input v-model="duplicateForm.planned_review_date" type="datetime-local" required />
            </div>
          </div>
          <div class="modal-actions" style="margin-top: 20px;">
            <button type="button" class="secondary-btn" @click="closeDuplicateModal">إلغاء</button>
            <button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #78e4d8, #65b5ff);" :disabled="actionLoading === 'duplicate'">
              {{ actionLoading === 'duplicate' ? 'جارٍ الاستنساخ...' : 'تأكيد واستنساخ 🚀' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>





    
    <Teleport to="body">
      <div v-if="showFollowUpsModal" class="modal-overlay" role="presentation" @click.self="closeFollowUpsModal">
      <div class="modal-content followups-modal" role="dialog" style="width: min(650px, 100%) !important;">
        <button class="modal-close" type="button" @click="closeFollowUpsModal">×</button>
        <div class="modal-icon" style="background: linear-gradient(145deg, #8fc9ff, #65b5ff); color: #12183f;">💬</div>
        <span class="eyebrow" style="color: #65b5ff;">سجل المتابعة</span>
        <h3>متابعة العميل: {{ selectedFollowUpPlan?.client?.name }}</h3>
        
        <form class="plan-form mt-2" style="background: rgba(6,11,37,.3); padding: 15px; border-radius: 12px; border: 1px solid rgba(145,160,230,.1);" @submit.prevent="saveFollowUp">
          <div class="form-group mb-2">
            <label>{{ editingFollowUpId ? 'تعديل التحديث' : 'إضافة تحديث جديد' }}</label>
            <textarea v-model="followUpForm.content" rows="3" required></textarea>
          </div>
          
          <div class="form-group mb-0 flex-upload-group">
            <label class="upload-btn">
              <input type="file" ref="fileInput" @change="handleImageUpload" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" hidden />
              <span>📷 إرفاق صورة (اختياري)</span>
            </label>
            
            <div v-if="imagePreview" class="image-preview-wrapper">
              <img :src="imagePreview" alt="preview" class="image-preview" />
              <button type="button" class="remove-image-btn" @click="clearImage" title="إلغاء الصورة">×</button>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 15px;">
            <button v-if="editingFollowUpId" type="button" class="secondary-btn" @click="cancelEditFollowUp">إلغاء التعديل</button>
            <button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #8fc9ff, #65b5ff);" :disabled="actionLoading === 'save-followup'">
              {{ actionLoading === 'save-followup' ? 'جارٍ...' : (editingFollowUpId ? 'حفظ التعديل' : 'إضافة التحديث') }}
            </button>
          </div>
        </form>

        <hr class="separator" />
        <div class="history-timeline">
          <div v-if="getFollowUps(selectedFollowUpPlan).length === 0" class="muted text-center">لا توجد متابعات مسجلة حتى الآن.</div>
          <div v-for="followUp in getFollowUps(selectedFollowUpPlan)" :key="followUp.id" class="timeline-item">
            <div class="tl-dot" style="background: #65b5ff;"></div>
            <div class="tl-content fu-content">
              <div class="tl-header">
                <strong>{{ followUp.user?.name || 'مجهول' }}</strong>
                <span class="tl-date" dir="ltr">{{ formatDate(followUp.created_at) }}</span>
              </div>
              <div class="fu-text">{{ followUp.content }}</div>
              
              <div v-if="followUp.image_path || followUp.image_url" class="fu-image-container" @click="openImageViewer(getFollowUpImageUrl(followUp))">
                <img :src="getFollowUpImageUrl(followUp)" alt="مرفق" class="fu-thumbnail" />
                <div class="zoom-overlay"><span>🔍</span></div>
              </div>

              <div class="fu-actions" v-if="isManager">
                <button type="button" @click="editFollowUp(followUp)" class="fu-btn edit-fu">✎ تعديل</button>
                <button type="button" @click="deleteFollowUp(followUp.id)" class="fu-btn delete-fu">⌫ حذف</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Teleport>


    
    <Teleport to="body">
      <div v-if="showReferencesModal" class="modal-overlay" role="presentation" @click.self="closeReferencesModal"><div class="modal-content references-modal" role="dialog" style="width: min(450px, 100%) !important;"><button class="modal-close" type="button" @click="closeReferencesModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #76e8de, #4facfe); color: #12183f;">🔗</div><span class="eyebrow" style="color: #4facfe;">مراجع العمل</span><h3>الروابط المساعدة للإنجاز</h3><p>الروابط المرفقة كمرجع ومصدر لإعداد هذه الخطة.</p><div class="ref-links-list mt-3"><a v-for="(link, index) in selectedReferencesPlan?.reference_links" :key="index" :href="link" target="_blank" rel="noopener noreferrer" class="ref-link-item"><span class="link-number">{{ index + 1 }}</span><span class="link-url">{{ link }}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a></div><div class="modal-actions" style="justify-content:center; margin-top:20px;"><button type="button" class="secondary-btn" @click="closeReferencesModal">إغلاق</button></div></div></div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showCreationSuccessModal" class="modal-overlay" role="presentation" @click.self="closeCreationModal"><div class="modal-content delivery-modal" role="dialog" style="width: min(500px, 100%) !important; text-align: center;"><button class="modal-close" type="button" @click="closeCreationModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #7de8dc, #b28aff); color: #12183f; margin: 0 auto 15px;">🚀</div><h3 style="color:#78e4d8;">تم إنشاء الخطة بنجاح!</h3><p style="margin-bottom: 20px;">الآن يمكنك إبلاغ المسؤولين ببدء العمل على هذه الخطة.</p><div class="wa-actions-container" v-if="createdPlan"><div v-if="getResponsibles(createdPlan).length > 0" class="executors-list"><h4 style="font-size:11px; color:#aeb6d7; text-align:right; margin-bottom:10px;">إبلاغ المسؤولين للإنجاز:</h4><div style="display:flex; flex-direction:column; gap:8px;"><a v-for="resp in getResponsibles(createdPlan)" :key="resp.id" :href="generateWaLink('plan_assigned', createdPlan, resp)" target="_blank" class="wa-btn-large" style="text-decoration:none; display:flex; align-items:center; justify-content:center;"><span>إرسال تنبيه للمسؤول: {{ resp.name }}</span> <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right: 8px;"><path d="M17.472...Z"/></svg></a></div></div><div v-else class="muted mt-3" style="font-size:10px;">لا يوجد مسؤولين مسجلين في هذه الخطة.</div></div><div class="modal-actions" style="justify-content:center; margin-top:25px;"><button type="button" class="secondary-btn" @click="closeCreationModal">تخطي</button></div></div></div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showWaPromptModal" class="modal-overlay" @click.self="closeWaPrompt">
        <div class="modal-content delivery-modal" style="width: min(450px, 100%) !important; text-align: center;">
          <button class="modal-close" type="button" @click="closeWaPrompt">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #25D366, #128C7E); margin: 0 auto 15px; color:#fff;">📱</div>
          <h3 style="color:#25D366;">{{ waPromptTitle }}</h3>
          <p style="margin-bottom: 20px;">{{ waPromptDesc }}</p>

          <div v-if="waPromptRecipients && waPromptRecipients.length > 0" style="display:flex; flex-direction:column; gap:10px;">
            <a 
              v-for="(rec, idx) in waPromptRecipients" 
              :key="idx" 
              :href="rec.link" 
              target="_blank" 
              class="wa-btn-large" 
              style="text-decoration: none;" 
              @click="closeWaPrompt"
            >
              <span>إرسال لـ {{ rec.name }} ({{ rec.role }})</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </a>
          </div>

          <a v-else-if="waPromptLink" :href="waPromptLink" target="_blank" class="wa-btn-large" style="text-decoration: none;" @click="closeWaPrompt">
            <span>إرسال التنبيه عبر واتساب</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </a>

          <div class="modal-actions" style="justify-content:center; margin-top:15px;">
            <button type="button" class="secondary-btn" @click="closeWaPrompt">تخطي</button>
          </div>
        </div>
      </div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showDeliverySuccessModal" class="modal-overlay" @click.self="closeDeliveryModal">
        <div class="modal-content delivery-modal" role="dialog" style="width: min(500px, 100%) !important; text-align: center;">
          <button class="modal-close" type="button" @click="closeDeliveryModal">×</button>
          <div class="modal-icon" style="background: linear-gradient(145deg, #70e1d5, #55c8bc); margin: 0 auto 15px;">🎉</div>
          <h3 style="color:#78e4d8;">تم اعتماد وتسليم الخطة بنجاح!</h3>
          <p style="margin-bottom: 20px;">الآن يمكنك إبلاغ العميل بالرابط، وإبلاغ الإدارة، وإعطاء إشارة البدء لفريق التنفيذ.</p>
          <div class="wa-actions-container" v-if="deliveredPlan">
            <!-- 1. إبلاغ العميل -->
            <a :href="generateWaLink('client_delivery', deliveredPlan)" target="_blank" class="wa-btn-large" style="text-decoration:none;">
              <span>إبلاغ العميل على واتساب</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </a>

            <!-- 2. إبلاغ المدير بالتسليم النهائي -->
            <div v-if="getManagers().length > 0" class="managers-list mt-3">
              <h4 style="font-size:11px; color:#aeb6d7; text-align:right; margin-bottom:8px;">إبلاغ الإدارة / المدير بالتسليم:</h4>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <a 
                  v-for="mgr in getManagers()" 
                  :key="'mgr_'+mgr.id" 
                  :href="generateWaLink('manager_delivery', deliveredPlan, mgr)" 
                  target="_blank" 
                  class="wa-btn-manager" 
                  style="text-decoration:none;"
                >
                  <span>📋 إرسال تنبيه للمدير: {{ mgr.name }}</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>

            <!-- 3. إبلاغ المنفذين -->
            <div v-if="getExecutors(deliveredPlan).length > 0" class="executors-list mt-3">
              <h4 style="font-size:11px; color:#aeb6d7; text-align:right; margin-bottom:10px;">إبلاغ المنفذين للبدء:</h4>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <a v-for="executor in getExecutors(deliveredPlan)" :key="executor.id" :href="generateWaLink('executors_start', deliveredPlan, executor)" target="_blank" class="wa-btn-small" style="text-decoration:none; display:block; text-align:center;">إرسال للمنفذ: {{ executor.name }} 📱</a>
              </div>
            </div>
            <div v-else class="muted mt-3" style="font-size:9px;">لا يوجد منفذين مسجلين في هذه الخطة.</div>
          </div>
          <div class="modal-actions" style="justify-content:center; margin-top:25px;">
            <button type="button" class="secondary-btn" @click="closeDeliveryModal">إغلاق</button>
          </div>
        </div>
      </div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showManagerModal && (user && (user.role === 'manager' || user.job_title === 'Account Manager'))" class="modal-overlay" @click.self="closeManagerModal"><div class="modal-content" role="dialog"><button class="modal-close" type="button" @click="closeManagerModal">×</button><div class="modal-icon">◈</div><span class="eyebrow">مساحة التخطيط</span><h3>{{ isEditing ? 'تعديل الخطة' : 'إنشاء خطة جديدة' }}</h3><form class="plan-form" @submit.prevent="saveManagerPlan"><div class="form-grid"><div class="form-group"><label>العميل المستهدف</label><select v-model="form.client_id" required><option value="" disabled>اختر العميل...</option><option v-for="client in allClients" :key="client.id" :value="client.id">{{ client.name }}</option></select></div><div class="form-group"><label>نوع الخطة</label><select v-model="form.plan_type" required><option value="" disabled>اختر...</option><option value="استراتيجية (Strategic)">استراتيجية</option><option value="محتوى (Content)">محتوى</option><option value="تسويق عبر السوشيال ميديا">سوشيال ميديا</option><option value="إعلانات ممولة (Media Buying)">إعلانات ممولة</option><option value="تحسين محركات البحث (SEO)">SEO</option><option value="خطة شاملة">خطة شاملة</option></select></div></div><div class="form-grid"><div class="form-group"><label>تاريخ بداية الخطة</label><input v-model="form.start_date" type="date" required /></div><div class="form-group"><label>تاريخ نهاية الخطة</label><input v-model="form.end_date" type="date" required /></div></div><div class="form-grid"><div class="form-group"><label>التسليم النهائي</label><input v-model="form.planned_delivery_date" type="datetime-local" required /></div><div class="form-group toggle-group"><label>مراجعة داخلية؟</label><label class="toggle-switch"><input type="checkbox" v-model="form.requires_review"><span class="slider"></span></label><span class="toggle-label">{{ form.requires_review ? 'نعم' : 'لا' }}</span></div></div><div class="form-grid" v-if="form.requires_review"><div class="form-group"><label>موعد التسليم الابتدائي</label><input v-model="form.planned_initial_delivery_date" type="datetime-local" /></div><div class="form-group"><label>موعد إنهاء المراجعة</label><input v-model="form.planned_review_date" type="datetime-local" required /></div></div><div class="separator"></div><div class="section-title" style="display:flex; justify-content:space-between; align-items:center;"><div><span>🔗</span> الروابط المرجعية (Reference Links)</div><button type="button" class="add-link-btn" @click="addReferenceLink">＋ إضافة رابط</button></div><div class="reference-links-container"><div v-for="(link, index) in form.reference_links" :key="index" class="link-input-group"><input v-model="form.reference_links[index]" type="url" placeholder="أدخل رابط المرجع (مثال: Google Drive, Notion, etc...)" required /><button type="button" class="remove-link-btn" @click="removeReferenceLink(index)" title="حذف الرابط">⌫</button></div><p v-if="form.reference_links.length === 0" class="muted text-center" style="font-size:10px; margin-top:10px;">لا توجد روابط مرجعية (اختياري)</p></div>
<div class="separator"></div>
<div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
  <div><span>⚙️</span> إعدادات الحقول الإلزامية للمنشورات (Brief Settings)</div>
</div>
<p style="font-size: 11px; color: #8792be; margin-bottom: 20px; margin-top: 5px; padding-right: 5px;">
  حدد الحقول التي يجب على مسؤول الخطة تعبئتها إلزامياً قبل أن يتمكن من إرسال التكليف للمصمم/المنفذ. (بشكل افتراضي جميع الحقول مطلوبة).
</p>
<div class="brief-settings-container" style="margin-bottom: 10px;">
  <div class="checkbox-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; padding: 5px;">
    <label v-for="(label, key) in availableBriefFields" :key="key" class="custom-cb">
      <input type="checkbox" :value="key" v-model="form.required_brief_fields" />
      <span class="cb-text">{{ label }}</span>
    </label>
  </div>
</div>
<div class="separator"></div>
<div class="section-title"><span>⌁</span> توزيع المهام</div><div class="form-grid-3 users-grid"><div class="form-group"><label>المسؤول</label><div class="checkbox-list"><label v-for="user in allUsers" :key="'resp_'+user.id" class="custom-cb"><input type="checkbox" :value="user.id" v-model="form.responsible_ids" /><span class="cb-text">{{ user.name }}</span></label></div></div><div class="form-group" v-if="form.requires_review"><label>المراجع</label><div class="checkbox-list"><label v-for="user in allUsers" :key="'rev_'+user.id" class="custom-cb"><input type="checkbox" :value="user.id" v-model="form.reviewer_ids" /><span class="cb-text">{{ user.name }}</span></label></div></div><div class="form-group" :style="form.requires_review ? '' : 'grid-column: span 2;'"><label>المنفذ</label><div class="checkbox-list" :style="form.requires_review ? '' : 'display:grid; grid-template-columns:1fr 1fr;'"><label v-for="user in allUsers" :key="'exec_'+user.id" class="custom-cb"><input type="checkbox" :value="user.id" v-model="form.executor_ids" /><span class="cb-text">{{ user.name }}</span></label></div></div></div><div class="modal-actions"><button type="button" class="secondary-btn" @click="closeManagerModal">إلغاء</button><button type="submit" class="primary-btn" :disabled="saving">{{ saving ? 'جارٍ الحفظ...' : 'حفظ الخطة' }}</button></div></form></div></div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showDetailsModal" class="modal-overlay" role="presentation" @click.self="closeDetailsModal">
        <div class="modal-content plan-details-modal" role="dialog" style="width: min(560px, 100%) !important;">
          <button class="modal-close" type="button" @click="closeDetailsModal">×</button>
          <div class="modal-icon">✎</div>
          <span class="eyebrow">تفاصيل الخطة</span>
          <h3>تفاصيل ومعلومات الخطة</h3>

          <!-- لوحة معلومات المواعيد والديدلاينز والتسليم الفعلي -->
          <div v-if="currentDetailsPlan" class="details-summary-card">
            <div class="summary-top-row">
              <div class="summary-client-info">
                <span class="summary-client-title">{{ currentDetailsPlan.client?.name || 'عميل محذوف' }}</span>
                <span class="summary-plan-tag">{{ currentDetailsPlan.plan_type }}</span>
              </div>
              <div :class="['status-badge', getPlanStatusInfo(currentDetailsPlan.status).class]">
                <i></i>{{ getPlanStatusInfo(currentDetailsPlan.status).text }}
              </div>
            </div>

            <!-- شبكة الديدلاينز ومواعيد التسليم -->
            <div class="deadlines-timeline-grid">
              <!-- 1. ديدلاين التسليم الابتدائي للمراجعة -->
              <div class="timeline-box" v-if="currentDetailsPlan.requires_review">
                <div class="timeline-box-header">
                  <span class="tb-title">📤 موعد التسليم الابتدائي (المنفذ):</span>
                  <span class="tb-val" :class="{ 'highlight': currentDetailsPlan.planned_initial_delivery_date }">
                    {{ currentDetailsPlan.planned_initial_delivery_date ? formatDate(currentDetailsPlan.planned_initial_delivery_date) : 'غير محدد' }}
                  </span>
                </div>
                <!-- تاريخ التسليم الفعلي عند أول ضغط تسليم للمراجعة (ثابت) -->
                <div v-if="currentDetailsPlan.actual_initial_delivery_date" class="delivery-status-pill success" title="تاريخ أول محاولة تسليم تم تسجيلها">
                  <span class="pill-icon">✓</span>
                  <span>تاريخ أول تسليم للمراجعة: <strong>{{ formatDate(currentDetailsPlan.actual_initial_delivery_date) }}</strong></span>
                </div>
                <div v-else class="delivery-status-pill pending">
                  <span class="pill-icon">⏳</span>
                  <span>لم يتم أول تسليم للمراجعة بعد</span>
                </div>
              </div>

              <!-- 2. موعد إنهاء المراجعة الداخلية -->
              <div class="timeline-box" v-if="currentDetailsPlan.requires_review">
                <div class="timeline-box-header">
                  <span class="tb-title">🔍 موعد إنهاء المراجعة:</span>
                  <span class="tb-val">{{ formatDate(currentDetailsPlan.planned_review_date) }}</span>
                </div>
                <div v-if="currentDetailsPlan.actual_review_date" class="delivery-status-pill success">
                  <span class="pill-icon">✓</span>
                  <span>تمت المراجعة: <strong>{{ formatDate(currentDetailsPlan.actual_review_date) }}</strong></span>
                </div>
              </div>

              <!-- 3. موعد التسليم النهائي -->
              <div class="timeline-box">
                <div class="timeline-box-header">
                  <span class="tb-title">🏁 موعد التسليم النهائي:</span>
                  <span class="tb-val">{{ formatDate(currentDetailsPlan.planned_delivery_date) }}</span>
                </div>
                <div v-if="currentDetailsPlan.actual_delivery_date" class="delivery-status-pill success">
                  <span class="pill-icon">✓</span>
                  <span>تم التسليم النهائي: <strong>{{ formatDate(currentDetailsPlan.actual_delivery_date) }}</strong></span>
                </div>
              </div>
            </div>

            <!-- سجل حركات ومتابعة الخطة (Timeline) المدمج داخل تفاصيل الخطة -->
            <div v-if="getReviewHistories(currentDetailsPlan).length > 0" class="details-history-block">
              <div class="details-history-title">
                <span>📋</span> سجل المتابعة والمراجعات ({{ getReviewHistories(currentDetailsPlan).length }})
              </div>
              <div class="history-timeline compact-timeline">
                <div v-for="(history, index) in getReviewHistories(currentDetailsPlan)" :key="'dh_' + index" class="timeline-item">
                  <div class="tl-dot" :class="history.action === 'approved' ? 'tl-green' : (history.action === 'submitted' ? 'tl-blue' : 'tl-red')"></div>
                  <div class="tl-content">
                    <div class="tl-header">
                      <strong>
                        <template v-if="history.action === 'submitted'">
                          🚀 المنفذ: {{ history.reviewer?.name || history.user?.name || 'الموظف' }}
                        </template>
                        <template v-else>
                          🔍 المراجع: {{ history.reviewer?.name || history.user?.name || 'مجهول' }}
                        </template>
                      </strong>
                      <span class="tl-date" dir="ltr">{{ formatDate(history.created_at) }}</span>
                    </div>
                    <div class="tl-action" :class="history.action === 'approved' ? 'text-green' : (history.action === 'submitted' ? 'text-blue' : 'text-red')">
                      <template v-if="history.action === 'submitted'">
                        🚀 قام {{ history.reviewer?.name || history.user?.name || 'الموظف' }} بتسليم الخطة للمراجعة
                      </template>
                      <template v-else-if="history.action === 'approved'">
                        ✅ وافق على الخطة واعتمدها
                      </template>
                      <template v-else>
                        ❌ رفض الخطة وطلب تعديلات
                      </template>
                    </div>
                    <div class="tl-notes" v-if="history.notes">{{ history.notes }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form class="plan-form mt-3" @submit.prevent="saveDetails">
            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label style="margin-bottom:0;">
                  لينك البلان النهائي
                  <span style="color: #f87171; font-weight: bold; margin-right: 4px;">*</span>
                  <span style="color: #fbbf24; font-size: 11px; font-weight: normal; margin-right: 6px;">(مطلوب للتسليم ⚠️)</span>
                </label>
                <a 
                  v-if="detailsForm.final_link && detailsForm.final_link.trim()" 
                  :href="detailsForm.final_link.startsWith('http') ? detailsForm.final_link : 'https://' + detailsForm.final_link" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style="font-size: 11px; color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 4px;"
                  title="اختبار وفتح الرابط"
                >
                  <span>تجربة الرابط</span> ↗
                </a>
              </div>
              <input 
                ref="planLinkInputRef"
                v-model="detailsForm.final_link" 
                type="text" 
                placeholder="https://..." 
                @blur="onFinalLinkBlur"
              />
              <small style="display:block; font-size:11px; color:#94a3b8; margin-top:4px;">
                مطلوب لتتمكن من تسليم الخطة للمراجعة أو التسليم النهائي للعميل. (مثال: رابط Google Drive, Sheets, Figma, إلخ).
              </small>
            </div>
            <div class="form-group">
              <label>ملاحظات عامة</label>
              <textarea v-model="detailsForm.notes" rows="3"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="closeDetailsModal">إلغاء</button>
              <button type="submit" class="primary-btn" :disabled="saving">حفظ التفاصيل</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showRejectModal" class="modal-overlay" role="presentation" @click.self="closeRejectModal"><div class="modal-content reject-modal" role="dialog" style="width: min(500px, 100%) !important;"><button class="modal-close" type="button" @click="closeRejectModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b);">❌</div><span class="eyebrow" style="color: #ff9bad;">إجراء مراجعة</span><h3 style="color: #ff9bad;">رفض الخطة وطلب تعديل</h3><form class="plan-form" @submit.prevent="submitRejectPlan"><div class="form-group"><label>ملاحظات الرفض (إجبارية)</label><textarea v-model="rejectNotes" rows="5" required></textarea></div><div class="modal-actions"><button type="button" class="secondary-btn" @click="closeRejectModal">إلغاء</button><button type="submit" class="primary-btn" style="background: linear-gradient(110deg, #ff8fa4, #ff678b);" :disabled="actionLoading.startsWith('reject-')">تأكيد الرفض</button></div></form></div></div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showRejectionsModal" class="modal-overlay" role="presentation" @click.self="closeRejectionsModal"><div class="modal-content history-modal" style="width: min(500px, 100%) !important;"><button class="modal-close" type="button" @click="closeRejectionsModal">×</button><div class="modal-icon" style="background: linear-gradient(145deg, #ff8fa4, #ff678b);">❌</div><h3>سجل أسباب الرفض</h3><div class="history-timeline"><div v-for="(rejection, index) in selectedRejections" :key="index" class="timeline-item"><div class="tl-dot tl-red"></div><div class="tl-content"><div class="tl-header"><strong>المراجع: {{ rejection.reviewer?.name || 'مجهول' }}</strong><span class="tl-date" dir="ltr">{{ formatDate(rejection.created_at) }}</span></div><div class="tl-action text-red">الرفض رقم {{ selectedRejections.length - index }}</div><div class="tl-notes">{{ rejection.notes }}</div></div></div></div></div></div>
    </Teleport>

    
    <Teleport to="body">
      <div v-if="showHistoryModal" class="modal-overlay" role="presentation" @click.self="closeHistoryModal">
        <div class="modal-content history-modal" style="width: min(520px, 100%) !important;">
          <button class="modal-close" type="button" @click="closeHistoryModal">×</button>
          <div class="modal-icon">📋</div>
          <h3>السجل الكامل للحركات</h3>
          <div class="history-timeline">
            <div v-for="(history, index) in getReviewHistories(selectedHistoryPlan)" :key="index" class="timeline-item">
              <div class="tl-dot" :class="history.action === 'approved' ? 'tl-green' : (history.action === 'submitted' ? 'tl-blue' : 'tl-red')"></div>
              <div class="tl-content">
                <div class="tl-header">
                  <strong>
                    <template v-if="history.action === 'submitted'">
                      🚀 المنفذ: {{ history.reviewer?.name || history.user?.name || 'الموظف' }}
                    </template>
                    <template v-else>
                      🔍 المراجع: {{ history.reviewer?.name || history.user?.name || 'مجهول' }}
                    </template>
                  </strong>
                  <span class="tl-date" dir="ltr">{{ formatDate(history.created_at) }}</span>
                </div>
                <div class="tl-action" :class="history.action === 'approved' ? 'text-green' : (history.action === 'submitted' ? 'text-blue' : 'text-red')">
                  <template v-if="history.action === 'submitted'">
                    🚀 قام {{ history.reviewer?.name || history.user?.name || 'الموظف' }} بتسليم الخطة للمراجعة
                  </template>
                  <template v-else-if="history.action === 'approved'">
                    ✅ وافق على الخطة واعتمدها
                  </template>
                  <template v-else>
                    ❌ رفض الخطة وطلب تعديلات
                  </template>
                </div>
                <div class="tl-notes" v-if="history.notes">{{ history.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>


    <!-- شريط التمرير الأفقي العائم الذكي (Sticky Floating Mirror Scrollbar) -->
    <Teleport to="body">
      <div
        v-show="showFloatingScrollbar"
        class="floating-sticky-scrollbar"
        :style="floatingScrollbarStyle"
        ref="floatingScrollbarTrack"
        @scroll="onFloatingScroll"
        dir="rtl"
        title="شريط تمرير أفقي عائم - اسحب للتحرك بالجدول"
        aria-label="شريط تمرير أفقي عائم"
      >
        <div class="floating-scrollbar-spacer" :style="{ width: tableScrollWidth + 'px' }"></div>
      </div>
    </Teleport>

    <!-- Image Preview Lightbox (Teleported to Body at end to be on top of all modals) -->
    <Teleport to="body">
      <div
        v-if="showImageViewer"
        class="image-viewer-overlay"
        role="dialog"
        aria-modal="true"
        style="position: fixed !important; inset: 0 !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(3, 6, 23, 0.94) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important;"
        @click.self="closeImageViewer"
      >
        <button
          class="viewer-close"
          type="button"
          @click="closeImageViewer"
          aria-label="إغلاق معاينة الصورة"
          style="position: absolute !important; top: 24px !important; right: 28px !important; z-index: 1000000 !important;"
        >×</button>
        <img
          :src="viewerImageUrl"
          alt="معاينة الصورة"
          class="viewer-image"
          style="max-width: 90vw !important; max-height: 88vh !important; object-fit: contain !important; z-index: 999999 !important; position: relative !important;"
          @error="onViewerImageError"
        />
      </div>
    </Teleport>

  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import api from '../axios';
import alertService from '../services/alertService';

// استيراد المحرك الذكي للتواريخ
import { getDeadlineStatus } from '../utils/timeHelper';

// القائمة المرجعية للحقول الإلزامية للمنشورات
const availableBriefFields = {
  reviewer_ids: 'المراجعين',
  deadline: 'الديدلاين',
  finance_status: 'موقف التمويل',
  publishing_platform: 'منصة النشر',
  post_type: 'نوع المنشور',
  objective: 'الهدف',
  detailed_idea: 'شرح الفكرة تفصيلياً',
  caption: 'Caption',
  tov: 'TOV',
  call_to_action: 'Call to Action',
  hashtags: 'Hashtag'
};

const getUserData = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { return {}; } };
const currentUser = getUserData();
const currentUserId = ref(currentUser.id || parseInt(localStorage.getItem('user_id') || 0));

const userRole = ref(localStorage.getItem('role') || 'employee'); 
const isManager = computed(() => userRole.value === 'manager' || user.value?.role === 'manager');
const user = ref(currentUser);

const isUserResponsible = (plan) => { 
  if (isManager.value || user.value?.role === 'manager' || user.value?.job_title === 'Account Manager') return true; 
  if (!plan || !plan.users) return false;
  const uid = Number(currentUserId.value) || Number(user.value?.id);
  return plan.users.some(u => Number(u.id) === uid && u.pivot?.task_role === 'responsible'); 
};
const isUserReviewer = (plan) => { 
  if (isManager.value || user.value?.role === 'manager') return true; 
  if (!plan || !plan.users) return false;
  const uid = Number(currentUserId.value) || Number(user.value?.id);
  return plan.users.some(u => Number(u.id) === uid && u.pivot?.task_role === 'reviewer'); 
};
const isUserExecutor = (plan) => {
  if (isManager.value || user.value?.role === 'manager' || user.value?.job_title === 'Account Manager') return true;
  if (!plan || !plan.users) return false;
  const uid = Number(currentUserId.value) || Number(user.value?.id);
  return plan.users.some(u => Number(u.id) === uid && u.pivot?.task_role === 'executor');
};
const canSubmitForReview = (plan) => {
  return isUserResponsible(plan) || isUserExecutor(plan);
};
const hasPlanLink = (plan) => {
  return Boolean(plan && plan.final_link && String(plan.final_link).trim().length > 0);
};
const planLinkInputRef = ref(null);
const onFinalLinkBlur = () => {
  if (detailsForm.final_link && detailsForm.final_link.trim()) {
    let val = detailsForm.final_link.trim();
    if (!/^https?:\/\//i.test(val)) {
      detailsForm.final_link = 'https://' + val;
    }
  }
};
const getExecutors = (plan) => { if (!plan || !plan.users) return []; return plan.users.filter(u => u.pivot?.task_role === 'executor'); };
const getResponsibles = (plan) => { if (!plan || !plan.users) return []; return plan.users.filter(u => u.pivot?.task_role === 'responsible'); }; 


const showAdvancedFilters = ref(false);
const toggleAdvancedFilters = () => showAdvancedFilters.value = !showAdvancedFilters.value;

// توقيت مرجعي مركزي يتحدث دورياً لتحديث العداد التنازلي الحي
const currentTime = ref(Date.now());
let countdownInterval = null;

// نمط العرض (كروت أو جدول) مع حفظ تفضيل المستخدم
const viewMode = ref(localStorage.getItem('content_plans_view_mode') || 'cards');
const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('content_plans_view_mode', mode);
  if (mode === 'table') {
    nextTick(() => updateScrollState());
  }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isPlanDelayed = (plan) => {
  return plan.status === 'rejected' || getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime.value).isOverdue;
};

const filters = reactive({
  search: '', client_id: '', plan_type: '', status: '', employee_id: '',
  start_date: '', end_date: '', delivery_from: '', delivery_to: '',
  review_from: '', review_to: '', is_overdue: false, requires_review: false
});

const pagination = reactive({ current_page: 1, last_page: 1, total: 0 });

const hasActiveFilters = computed(() => {
  return Object.values(filters).some(val => val !== '' && val !== false);
});

const resetFilters = () => {
  Object.keys(filters).forEach(key => filters[key] = (typeof filters[key] === 'boolean' ? false : ''));
  pagination.current_page = 1;
  fetchPlans();
};

const applyFilters = () => { pagination.current_page = 1; fetchPlans(); };

const changePage = (page) => {
  if (page < 1 || page > pagination.last_page) return;
  pagination.current_page = page;
  fetchPlans();
};

const plans = ref([]); 
const allUsers = ref([]); 
const allClients = ref([]); 
const loading = ref(true); 
const saving = ref(false); 
const actionLoading = ref('');
const toastMessage = ref('');
const editId = ref(null);

const showManagerModal = ref(false);
const showDetailsModal = ref(false);
const showRejectModal = ref(false);
const showHistoryModal = ref(false);
const showRejectionsModal = ref(false);
const showFollowUpsModal = ref(false);
const showDeliverySuccessModal = ref(false);
const showCreationSuccessModal = ref(false); 
const showReferencesModal = ref(false); 

const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';

const showImageViewer = ref(false);
const viewerImageUrl = ref('');
const openImageViewer = (url) => { 
  if (!url) {
    showToast('لا توجد صورة للمعاينة');
    return;
  }
  viewerImageUrl.value = url; 
  showImageViewer.value = true; 
};
const closeImageViewer = () => { 
  showImageViewer.value = false; 
  viewerImageUrl.value = ''; 
};
const onViewerImageError = () => {
  showToast('تعذر عرض الصورة، يرجى التأكد من مسار الملف');
};
const handleViewerKeyDown = (e) => {
  if (e.key === 'Escape' && showImageViewer.value) {
    closeImageViewer();
    e.stopPropagation();
  }
};

const getFollowUpImageUrl = (followUp) => {
  if (!followUp) return '';
  const path = followUp.image_path || followUp.image_url;
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

const deliveredPlan = ref(null);
const createdPlan = ref(null); 
const selectedReferencesPlan = ref(null); 

const showWaPromptModal = ref(false);
const waPromptTitle = ref('');
const waPromptDesc = ref('');
const waPromptLink = ref('');
const waPromptRecipients = ref([]);
const currentDetailsPlan = ref(null);
const originalDetails = reactive({ final_link: '', notes: '' });

const isEditing = ref(false); 
const rejectNotes = ref('');
const selectedHistoryPlan = ref(null);
const selectedRejections = ref([]);
const selectedFollowUpPlan = ref(null);

// --- أدوات التمرير الأفقي الذكي وسحب الماوس (Horizontal Scroll & Pan) ---
const tableContainer = ref(null);
const floatingScrollbarTrack = ref(null);
const showFloatingScrollbar = ref(false);
const isOverflowing = ref(false);
const canScrollRight = ref(false);
const canScrollLeft = ref(false);
const tableScrollWidth = ref(0);
const tableRect = reactive({ left: 0, width: 0 });

let isSyncingFromTable = false;
let isSyncingFromFloating = false;
let resizeObserver = null;

// حالة السحب بالماوس
let isMouseDown = false;
let dragStartX = 0;
let dragStartScrollLeft = 0;
let hasDraggedDistance = false;

const isAnyModalOpen = computed(() => {
  return showManagerModal.value ||
    showDetailsModal.value ||
    showRejectModal.value ||
    showHistoryModal.value ||
    showRejectionsModal.value ||
    showFollowUpsModal.value ||
    showDeliverySuccessModal.value ||
    showCreationSuccessModal.value ||
    showReferencesModal.value ||
    showWaPromptModal.value ||
    showDuplicateModal.value ||
    showImageViewer.value;
});

const updateScrollState = () => {
  if (!tableContainer.value || isAnyModalOpen.value) {
    showFloatingScrollbar.value = false;
    if (!tableContainer.value) {
      isOverflowing.value = false;
      canScrollRight.value = false;
      canScrollLeft.value = false;
    }
    return;
  }

  const el = tableContainer.value;
  const maxScroll = el.scrollWidth - el.clientWidth;
  tableScrollWidth.value = el.scrollWidth;

  if (maxScroll <= 5) {
    isOverflowing.value = false;
    canScrollRight.value = false;
    canScrollLeft.value = false;
    showFloatingScrollbar.value = false;
    return;
  }

  isOverflowing.value = true;

  // في نظام RTL: 0 في أقصى اليمين، وتصبح القيمة سالبة كلما تمررنا لليسار
  const absScroll = Math.abs(el.scrollLeft);
  canScrollRight.value = absScroll > 5;
  canScrollLeft.value = absScroll < maxScroll - 5;

  // فحص موضع شريط التمرير العائم المتزامن
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  // يظهر الشريط العائم عندما يكون الجدول معروضاً في الشاشة ولكن أسفله خارج حدود الشاشة السفلية
  const isTableInView = rect.top < windowHeight - 40 && rect.bottom > 120;
  const isBottomOffscreen = rect.bottom > windowHeight + 15;

  showFloatingScrollbar.value = isTableInView && isBottomOffscreen;

  if (showFloatingScrollbar.value) {
    tableRect.left = Math.max(0, rect.left);
    tableRect.width = rect.width;

    if (floatingScrollbarTrack.value && !isSyncingFromFloating) {
      isSyncingFromTable = true;
      floatingScrollbarTrack.value.scrollLeft = el.scrollLeft;
      requestAnimationFrame(() => {
        isSyncingFromTable = false;
      });
    }
  }
};

const floatingScrollbarStyle = computed(() => {
  return {
    left: `${tableRect.left}px`,
    width: `${tableRect.width}px`
  };
});

const onFloatingScroll = () => {
  if (isSyncingFromTable) return;
  if (!tableContainer.value || !floatingScrollbarTrack.value) return;
  isSyncingFromFloating = true;
  tableContainer.value.scrollLeft = floatingScrollbarTrack.value.scrollLeft;
  requestAnimationFrame(() => {
    isSyncingFromFloating = false;
    updateScrollState();
  });
};

const onTableScroll = () => {
  if (!tableContainer.value) return;
  const el = tableContainer.value;
  const maxScroll = el.scrollWidth - el.clientWidth;
  const absScroll = Math.abs(el.scrollLeft);
  canScrollRight.value = absScroll > 5;
  canScrollLeft.value = absScroll < maxScroll - 5;

  if (isSyncingFromFloating) return;
  if (floatingScrollbarTrack.value) {
    isSyncingFromTable = true;
    floatingScrollbarTrack.value.scrollLeft = el.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingFromTable = false;
    });
  }
};

const scrollTable = (direction) => {
  if (!tableContainer.value) return;
  const amount = 380;
  // في نظام RTL: الحركة لليسار بالسالب ولليمين بالموجب
  const delta = direction === 'left' ? -amount : amount;
  tableContainer.value.scrollBy({ left: delta, behavior: 'smooth' });
};

// السحب والإفلات بالماوس (Mouse Drag & Pan)
const onTableMouseDown = (e) => {
  if (!tableContainer.value || e.button !== 0) return;

  const targetTag = e.target.tagName?.toLowerCase();
  if (['input', 'select', 'button', 'textarea', 'a', 'label'].includes(targetTag)) return;
  if (e.target.closest('button, a, input, select, textarea, label, .modal-overlay, .wa-quick-btn, .action, .confirm-btn, .details-btn, .history-btn, .ref-links-btn, .followup-btn')) return;

  isMouseDown = true;
  hasDraggedDistance = false;
  dragStartX = e.pageX;
  dragStartScrollLeft = tableContainer.value.scrollLeft;
};

const onTableMouseMove = (e) => {
  if (!isMouseDown || !tableContainer.value) return;
  const deltaX = e.pageX - dragStartX;
  if (Math.abs(deltaX) > 4) {
    hasDraggedDistance = true;
    tableContainer.value.classList.add('table-is-dragging');
    e.preventDefault();
  }
  if (hasDraggedDistance) {
    tableContainer.value.scrollLeft = dragStartScrollLeft - deltaX;
  }
};

const onTableMouseUp = () => {
  if (!isMouseDown) return;
  isMouseDown = false;
  if (tableContainer.value) {
    tableContainer.value.classList.remove('table-is-dragging');
  }
};

const onTableWheel = (e) => {
  if (!tableContainer.value) return;
  // إذا ضغط المستخدم على Shift أثناء تدوير العجلة، يتم تحويل التمرير العمودي إلى تمرير أفقي
  if (e.shiftKey) {
    e.preventDefault();
    tableContainer.value.scrollLeft += e.deltaY * 1.2;
  }
};

const showDuplicateModal = ref(false);
const planToDuplicate = ref(null);
const duplicateForm = reactive({ start_date: '', end_date: '', planned_delivery_date: '', planned_review_date: '', planned_initial_delivery_date: '' });

const openDuplicateModal = (plan) => {
  if (user.value?.role !== 'manager' && user.value?.job_title !== 'Account Manager') {
    showToast('عذراً، لا تمتلك الصلاحية لاستنساخ الخطط');
    return;
  }
  planToDuplicate.value = plan;
  
  if (plan.start_date && plan.end_date && plan.planned_delivery_date) {
    const oldStart = new Date(plan.start_date);
    const oldEnd = new Date(plan.end_date);
    const oldReview = plan.planned_review_date ? new Date(plan.planned_review_date) : null;
    const oldInitialDelivery = plan.planned_initial_delivery_date ? new Date(plan.planned_initial_delivery_date) : null;
    const oldDelivery = new Date(plan.planned_delivery_date);

    const durationMs = oldEnd.getTime() - oldStart.getTime();
    const reviewGapMs = oldReview ? (oldReview.getTime() - oldStart.getTime()) : 0;
    const initialDeliveryGapMs = oldInitialDelivery ? (oldInitialDelivery.getTime() - oldStart.getTime()) : 0;
    const deliveryGapMs = oldDelivery.getTime() - oldStart.getTime();

    const now = new Date();
    let newStart = new Date(oldStart);
    newStart.setMonth(newStart.getMonth() + 1);
    
    // التاكد من ان البداية الجديدة ليست في الماضي
    if (newStart < now) {
      const targetDay = oldStart.getDate();
      newStart = new Date();
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
      newStart.setDate(targetDay);
      if (newStart < now) newStart.setMonth(newStart.getMonth() + 1);
    }

    const newEnd = new Date(newStart.getTime() + durationMs);
    const newReview = oldReview ? new Date(newStart.getTime() + reviewGapMs) : null;
    const newInitialDelivery = oldInitialDelivery ? new Date(newStart.getTime() + initialDeliveryGapMs) : null;
    const newDelivery = new Date(newStart.getTime() + deliveryGapMs);

    const toDateString = (d) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    duplicateForm.start_date = toDateString(newStart);
    duplicateForm.end_date = toDateString(newEnd);
    duplicateForm.planned_review_date = newReview ? toDatetimeLocal(newReview) : '';
    duplicateForm.planned_initial_delivery_date = newInitialDelivery ? toDatetimeLocal(newInitialDelivery) : '';
    duplicateForm.planned_delivery_date = toDatetimeLocal(newDelivery);
  } else {
    duplicateForm.start_date = '';
    duplicateForm.end_date = '';
    duplicateForm.planned_delivery_date = '';
    duplicateForm.planned_review_date = '';
    duplicateForm.planned_initial_delivery_date = '';
  }
  
  showDuplicateModal.value = true;
};

const closeDuplicateModal = () => {
  showDuplicateModal.value = false;
  planToDuplicate.value = null;
};

const submitDuplicate = async () => {
  actionLoading.value = 'duplicate';
  try {
    const payload = {
      ...duplicateForm,
      planned_initial_delivery_date: duplicateForm.planned_initial_delivery_date || null,
      planned_review_date: duplicateForm.planned_review_date || null,
    };
    await api.post(`/content-plans/${planToDuplicate.value.id}/duplicate`, payload);
    closeDuplicateModal();
    showToast('تم استنساخ الخطة بنجاح 🚀');
    await fetchPlans();
  } catch (error) {
    console.error('فشل الاستنساخ:', error);
    showToast(error.response?.data?.message || 'حدث خطأ أثناء محاولة الاستنساخ');
  } finally {
    actionLoading.value = '';
  }
};

const editingFollowUpId = ref(null);
const fileInput = ref(null);
const imagePreview = ref(null);
const followUpForm = reactive({ content: '', image: null });

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('حجم الصورة يجب أن لا يتعدى 5 ميجابايت'); return; }
  followUpForm.image = file;
  imagePreview.value = URL.createObjectURL(file);
};
const clearImage = () => {
  followUpForm.image = null;
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
};
const cancelEditFollowUp = () => {
  editingFollowUpId.value = null;
  followUpForm.content = '';
  clearImage();
};
const editFollowUp = (item) => {
  editingFollowUpId.value = item.id;
  followUpForm.content = item.content;
  followUpForm.image = null; 
  imagePreview.value = getFollowUpImageUrl(item) || null;
};
const saveFollowUp = async () => { 
  if (!followUpForm.content.trim()) return; 
  actionLoading.value = 'save-followup'; 
  const formData = new FormData();
  formData.append('content', followUpForm.content);
  if (followUpForm.image) {
    formData.append('image', followUpForm.image);
  }
  try { 
    if (editingFollowUpId.value) { 
      formData.append('_method', 'PUT');
      await api.post(`/follow-ups/${editingFollowUpId.value}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
      showToast('تم التعديل'); 
    } else { 
      await api.post(`/content-plans/${selectedFollowUpPlan.value.id}/follow-ups`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
      showToast('تمت الإضافة'); 
    } 
    cancelEditFollowUp(); 
    await fetchPlans(); 
    selectedFollowUpPlan.value = plans.value.find(p => p.id === selectedFollowUpPlan.value.id); 
  } catch (error) {} finally { actionLoading.value = ''; } 
};
const deleteFollowUp = async (id) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف المتابعة',
    message: 'هل أنت متأكد من رغبتك في حذف هذا التحديث من سجل المتابعة نهائياً؟',
    confirmText: 'نعم، احذف 🗑️',
    cancelText: 'إلغاء',
    type: 'danger'
  });
  if (!confirmed) return;
  try {
    await api.delete(`/follow-ups/${id}`);
    showToast('تم حذف المتابعة بنجاح');
    await fetchPlans();
    selectedFollowUpPlan.value = plans.value.find(p => p.id === selectedFollowUpPlan.value.id);
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء حذف المتابعة');
  }
};

const form = reactive({ 
  client_id: '', plan_type: '', start_date: '', end_date: '', requires_review: true, 
  planned_delivery_date: '', planned_review_date: '', planned_initial_delivery_date: '',
  final_link: '', notes: '', reference_links: [], 
  responsible_ids: [], reviewer_ids: [], executor_ids: [],
  required_brief_fields: Object.keys(availableBriefFields) 
});
const detailsForm = reactive({ final_link: '', notes: '' });

const getReviewHistories = (plan) => { if (!plan) return []; return plan.review_histories || plan.reviewHistories || []; };
const getFollowUps = (plan) => { if (!plan) return []; return plan.client_follow_ups || plan.clientFollowUps || []; };

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();
const getRoleNames = (users = [], role) => { const matches = users.filter(user => user.pivot?.task_role === role); return matches.length ? matches.map(user => user.name).join('، ') : '—'; };
const formatDate = (value) => value ? new Date(value).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const toDatetimeLocal = (value) => { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const showToast = (message, type = 'info') => {
  if (!message) return;
  if (message.includes('خطأ') || message.includes('تعذر') || message.includes('فشل') || message.includes('عذراً') || message.includes('لا تمتلك') || message.includes('رفض')) {
    alertService.error(message);
  } else if (message.includes('تم') || message.includes('نجاح') || message.includes('✅') || message.includes('🚀')) {
    alertService.success(message);
  } else if (message.includes('تنبيه') || message.includes('الحد الأقصى') || message.includes('⚠️')) {
    alertService.warning(message);
  } else {
    alertService.toast(message, type);
  }
};

const getPlanStatusInfo = (status) => {
  switch(status) {
    case 'completed': return { text: 'مكتملة ومُعتمدة', class: 'status-green' };
    case 'reviewed': return { text: 'جاهزة لمراجعة العميل', class: 'status-blue' };
    case 'under_review': return { text: 'قيد المراجعة', class: 'status-purple' };
    case 'rejected': return { text: 'مرفوضة (تعديل)', class: 'status-red' };
    case 'pending': default: return { text: 'قيد التنفيذ', class: 'status-gray' };
  }
};

const underReviewCount = computed(() => plans.value.filter(plan => plan.status === 'under_review').length);

// استخدام اللوجيك الذكي لحساب المتأخرات
const delayedCount = computed(() => plans.value.filter(plan => {
  return plan.status === 'rejected' || getDeadlineStatus(plan.start_date || plan.created_at, plan.planned_delivery_date, plan.status, currentTime.value).isOverdue;
}).length);

const fetchPlans = async () => { 
  loading.value = true; 
  try { 
    const params = new URLSearchParams();
    params.append('page', pagination.current_page);
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== false) {
        params.append(key, typeof filters[key] === 'boolean' ? 1 : filters[key]);
      }
    });

    const response = await api.get(`/content-plans?${params.toString()}`); 
    
    if (response.data && response.data.data !== undefined && response.data.current_page) {
      plans.value = response.data.data;
      pagination.current_page = response.data.current_page;
      pagination.last_page = response.data.last_page;
      pagination.total = response.data.total;
    } else {
      plans.value = response.data.data || response.data || [];
      pagination.last_page = 1;
      pagination.total = plans.value.length;
    }
  } catch (error) { 
    showToast('تعذر تحميل الخطط'); 
  } finally { 
    loading.value = false; 
  } 
};
const fetchResources = async () => { 
  try {
    const resUsers = await api.get('/users?per_page=100');
    allUsers.value = resUsers.data.data || resUsers.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
  }

  if (isManager.value || user.value?.job_title === 'Account Manager') { 
    try { 
      const resClients = await api.get('/clients?per_page=100'); 
      allClients.value = resClients.data.data || resClients.data || []; 
    } catch (error) {
      console.error('Error fetching clients:', error);
    } 
  } 
};

const getPlanDisplayName = (plan) => {
  if (!plan) return 'خطة غير محددة';
  if (plan.name && String(plan.name).trim()) return plan.name.trim();
  if (plan.title && String(plan.title).trim()) return plan.title.trim();
  if (plan.plan_name && String(plan.plan_name).trim()) return plan.plan_name.trim();
  if (plan.plan_type && plan.client?.name) {
    return `${plan.plan_type} - ${plan.client.name}`;
  }
  if (plan.plan_type) return `خطة ${plan.plan_type}`;
  return `خطة ${plan.client?.name || ('#' + plan.id)}`;
};

const getManagers = () => {
  if (!allUsers.value || allUsers.value.length === 0) return [];
  return allUsers.value.filter(u => u.role === 'manager');
};

const formatPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
};

const generateWaLink = (type, plan, specificUser = null) => {
  if (!plan) return '#';
  const systemPrefix = "-- *تنبيه آلي من نظام Octo Space*\n\n";
  let phone = '';
  let message = '';
  let targetUser = specificUser;

  switch (type) {
    case 'plan_assigned':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'responsible');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتم إسناد خطة جديدة لك لعميل (*${plan.client?.name || ''}*).\nيرجى الدخول للنظام والبدء في الإنجاز.`;
      break;
    case 'review_needed':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'reviewer');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nيوجد خطة لعميل (*${plan.client?.name || ''}*) بانتظار مراجعتك الداخلية الآن.\nيرجى الدخول للنظام.`;
      break;
    case 'plan_rejected':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'responsible');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتم رفض خطة العميل (*${plan.client?.name || ''}*).\nيرجى الدخول للنظام لقراءة الملاحظات وتعديلها.`;
      break;
    case 'plan_approved':
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === 'responsible');
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتمت الموافقة على خطة العميل (*${plan.client?.name || ''}*).\nالخطة جاهزة الآن للتسليم النهائي، يرجى المتابعة وتسليمها.`;
      break;
    case 'plan_delayed':
      const roleToBlame = plan.status === 'under_review' ? 'reviewer' : 'responsible';
      targetUser = targetUser || plan.users?.find(u => u.pivot?.task_role === roleToBlame);
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\n-- تنبيه بتأخير إنجاز خطة العميل (*${plan.client?.name || ''}*) عن الموعد المحدد.\nيرجى سرعة الإنجاز لتجنب تعطيل العمل.`;
      break;
    case 'client_delivery':
      phone = plan.client?.phone;
      message = `${systemPrefix}مرحباً بك عميلنا العزيز (*${plan.client?.name || ''}*)،\nتم اعتماد خطة العمل الخاصة بك بنجاح.\nيمكنك الاطلاع عليها من الرابط التالي:\n${plan.final_link || '---'}\n\nنسعد بخدمتكم.`;
      break;
    case 'manager_delivery':
      targetUser = targetUser || getManagers()[0];
      const deliveryPlanName = getPlanDisplayName(plan);
      message = `${systemPrefix}مرحباً ${targetUser?.name || 'يا مدير'}،\n` +
                `✅ تم التسليم النهائي لخطة العميل (*${plan.client?.name || ''}*) بنجاح.\n\n` +
                `📌 *اسم الخطة:* ${deliveryPlanName}\n` +
                `🔗 *رابط التسليم النهائي:* ${plan.final_link || 'لم يُحدد'}\n` +
                (plan.notes ? `📝 *الملاحظات:* ${plan.notes}\n` : '') +
                `\nتم اعتماد الخطة وتسليمها للعميل بنجاح.`;
      break;
    case 'manager_details_updated':
      targetUser = targetUser || getManagers()[0];
      const updatePlanName = getPlanDisplayName(plan);
      message = `${systemPrefix}مرحباً ${targetUser?.name || 'يا مدير'}،\n` +
                `📢 تم تحديث تفاصيل التسليم لخطة العميل (*${plan.client?.name || ''}*):\n\n` +
                `📌 *اسم الخطة:* ${updatePlanName}\n` +
                `🔗 *رابط البلان المحدث:* ${plan.final_link || 'لم يُحدد'}\n` +
                `📝 *الملاحظات المحدثة:* ${plan.notes || 'لا توجد'}\n\n` +
                `يرجى الاطلاع على التحديث عبر النظام.`;
      break;
    case 'executors_start':
      message = `${systemPrefix}مرحباً ${targetUser?.name || ''}،\nتم اعتماد وتسليم خطة العميل (*${plan.client?.name || ''}*).\nيرجى البدء في مهام التنفيذ الخاصة بك.\nرابط الخطة: ${plan.final_link || '---'}`;
      break;
  }

  if (type !== 'client_delivery' && targetUser) {
    phone = targetUser.phone;
  }
  
  const formattedPhone = formatPhone(phone);
  if (!formattedPhone) return null;

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

const triggerWaPrompt = (title, desc, type, plan, specificUser = null) => {
  const link = generateWaLink(type, plan, specificUser);
  if (!link) { showToast('رقم الهاتف غير مسجل أو غير صالح للشخص المستهدف.'); return; }
  waPromptTitle.value = title;
  waPromptDesc.value = desc;
  waPromptLink.value = link;
  waPromptRecipients.value = [];
  showWaPromptModal.value = true;
};
const closeWaPrompt = () => { 
  showWaPromptModal.value = false; 
  waPromptRecipients.value = [];
  waPromptLink.value = '';
};

const smartNotify = (plan) => {
  if (plan.status === 'pending' || plan.status === 'rejected') { triggerWaPrompt('تنبيه بالتأخير', 'تنبيه المسؤول عن الخطة بضرورة الإنجاز.', 'plan_delayed', plan); } 
  else if (plan.status === 'under_review') { triggerWaPrompt('تنبيه بالتأخير', 'تنبيه المراجع الداخلي لإنهاء المراجعة.', 'plan_delayed', plan); } 
  else if (plan.status === 'reviewed') { triggerWaPrompt('الخطة جاهزة', 'تنبيه المسؤول لتسليم الخطة للعميل.', 'plan_approved', plan); } 
  else { showToast('الخطة مكتملة.'); }
};

const submitForReview = async (plan) => {
  if (!hasPlanLink(plan)) {
    await alertService.alert({
      title: 'رابط الخطة مطلوب ⚠️',
      message: `لا يمكن تسليم خطة "${plan?.client?.name || ''}" للمراجعة بدون إضافة رابط البلان النهائي أولاً.\nيرجى إضافة الرابط في خانة (لينك البلان النهائي) بتفاصيل الخطة.`,
      okText: 'إضافة الرابط الآن 🔗',
      type: 'warning'
    });
    openDetailsModal(plan, true);
    return;
  }
  const confirmed = await alertService.confirm({
    title: 'تسليم الخطة للمراجعة',
    message: `هل أنت متأكد من تسليم خطة "${plan?.client?.name || ''}" للمراجعة الداخلية؟`,
    confirmText: 'نعم، تسليم للمراجعة 🚀',
    cancelText: 'إلغاء',
    type: 'info'
  });
  if (!confirmed) return;
  actionLoading.value = `submit-review-${plan.id}`;
  try { 
    await api.post(`/content-plans/${plan.id}/submit-review`); 
    showToast('تم التسليم للمراجعة بنجاح ✅'); 
    await fetchPlans(); 
    triggerWaPrompt('تم التسليم بنجاح', 'هل تريد إرسال تنبيه للمراجع لكي يبدأ الآن؟', 'review_needed', plan);
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء التسليم للمراجعة');
  } finally { actionLoading.value = ''; }
};

const approvePlan = async (plan) => {
  const confirmed = await alertService.confirm({
    title: 'تأكيد اعتماد الخطة',
    message: `هل أنت متأكد من اعتماد خطة "${plan?.client?.name || ''}" لتصبح جاهزة للعميل؟`,
    confirmText: 'نعم، اعتمد الخطة ✅',
    cancelText: 'إلغاء',
    type: 'success'
  });
  if (!confirmed) return;
  actionLoading.value = `approve-${plan.id}`;
  try { 
    await api.post(`/content-plans/${plan.id}/approve`); 
    showToast('تم اعتماد الخطة بنجاح ✅'); 
    await fetchPlans();
    triggerWaPrompt('تمت الموافقة بنجاح', 'أبلغ المسؤول الآن بأن الخطة جاهزة لتُسلم للعميل.', 'plan_approved', plan);
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الاعتماد');
  } finally { actionLoading.value = ''; }
};

const submitRejectPlan = async () => {
  actionLoading.value = `reject-${editId.value}`;
  const planToReject = plans.value.find(p => p.id === editId.value);
  try { 
    await api.post(`/content-plans/${editId.value}/reject`, { notes: rejectNotes.value }); 
    showToast('تم رفض الخطة'); 
    closeRejectModal(); 
    await fetchPlans();
    triggerWaPrompt('تم تسجيل الرفض', 'أبلغ المسؤول الآن بضرورة الدخول لقراءة ملاحظاتك وتعديلها.', 'plan_rejected', planToReject);
  } catch (error) {} finally { actionLoading.value = ''; }
};

const submitFinalDelivery = async (plan) => {
  if (!hasPlanLink(plan)) {
    await alertService.alert({
      title: 'رابط الخطة مطلوب ⚠️',
      message: `لا يمكن تسجيل التسليم النهائي لخطة "${plan?.client?.name || ''}" بدون إضافة رابط البلان النهائي أولاً.\nيرجى إضافة الرابط في خانة (لينك البلان النهائي) بتفاصيل الخطة.`,
      okText: 'إضافة الرابط الآن 🔗',
      type: 'warning'
    });
    openDetailsModal(plan, true);
    return;
  }
  const confirmed = await alertService.confirm({
    title: 'تأكيد التسليم النهائي للعميل',
    message: `هل أنت متأكد من تسجيل التسليم النهائي لخطة "${plan?.client?.name || ''}" للعميل؟`,
    confirmText: 'نعم، تسليم للعميل 🚀',
    cancelText: 'إلغاء',
    type: 'success'
  });
  if (!confirmed) return;
  actionLoading.value = `delivery-${plan.id}`;
  try { 
    await api.post(`/content-plans/${plan.id}/final-delivery`); 
    showToast('تم التسليم للعميل بنجاح ✅'); 
    await fetchPlans(); 
    deliveredPlan.value = plans.value.find(p => p.id === plan.id) || plan;
    showDeliverySuccessModal.value = true;
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء التسليم');
  } finally { actionLoading.value = ''; }
};
const closeDeliveryModal = () => { showDeliverySuccessModal.value = false; deliveredPlan.value = null; };

const addReferenceLink = () => {
  if (form.reference_links.length >= 15) { showToast('الحد الأقصى هو 15 رابط.'); return; }
  form.reference_links.push('');
};
const removeReferenceLink = (index) => { form.reference_links.splice(index, 1); };
const openReferencesModal = (plan) => { selectedReferencesPlan.value = plan; showReferencesModal.value = true; };
const closeReferencesModal = () => { showReferencesModal.value = false; selectedReferencesPlan.value = null; };

const resetForm = () => Object.assign(form, { 
  client_id: '', plan_type: '', start_date: '', end_date: '', requires_review: true, 
  planned_delivery_date: '', planned_review_date: '', planned_initial_delivery_date: '',
  final_link: '', notes: '', reference_links: [],
  responsible_ids: [], reviewer_ids: [], executor_ids: [],
  required_brief_fields: Object.keys(availableBriefFields) 
});

const openManagerModal = (plan = null) => { 
  if (user.value?.role !== 'manager' && user.value?.job_title !== 'Account Manager') {
    showToast('عذراً، لا تمتلك الصلاحية لإنشاء أو تعديل الخطط');
    return;
  }
  isEditing.value = Boolean(plan); 
  editId.value = plan?.id || null; 
  if (plan) { 
    Object.assign(form, { 
      client_id: plan.client_id, 
      plan_type: plan.plan_type, 
      start_date: plan.start_date ? plan.start_date.split('T')[0].split(' ')[0] : '', 
      end_date: plan.end_date ? plan.end_date.split('T')[0].split(' ')[0] : '', 
      requires_review: Boolean(plan.requires_review), 
      planned_delivery_date: toDatetimeLocal(plan.planned_delivery_date), 
      planned_review_date: toDatetimeLocal(plan.planned_review_date), 
      planned_initial_delivery_date: toDatetimeLocal(plan.planned_initial_delivery_date),
      final_link: plan.final_link || '', 
      notes: plan.notes || '', 
      reference_links: Array.isArray(plan.reference_links) ? [...plan.reference_links] : [],
      responsible_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'responsible').map(user => user.id), 
      reviewer_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'reviewer').map(user => user.id), 
      executor_ids: (plan.users || []).filter(user => user.pivot?.task_role === 'executor').map(user => user.id),
      required_brief_fields: plan.required_brief_fields === null 
        ? Object.keys(availableBriefFields) 
        : (Array.isArray(plan.required_brief_fields) ? [...plan.required_brief_fields] : [])
    }); 
  } else { 
    resetForm(); 
  } 
  showManagerModal.value = true; 
};
const closeManagerModal = () => { showManagerModal.value = false; };
const closeCreationModal = () => { showCreationSuccessModal.value = false; createdPlan.value = null; };

const saveManagerPlan = async () => { 
  if (user.value?.role !== 'manager' && user.value?.job_title !== 'Account Manager') {
    showToast('عذراً، لا تمتلك الصلاحية لحفظ الخطط');
    return;
  }
  saving.value = true; 
  if (!form.requires_review) {
    form.planned_review_date = '';
    form.planned_initial_delivery_date = '';
    form.reviewer_ids = [];
  } 
  form.reference_links = form.reference_links.filter(link => link.trim() !== '');

  const payload = {
    ...form,
    planned_initial_delivery_date: form.planned_initial_delivery_date || null,
    planned_review_date: form.planned_review_date || null,
  };
  
  try { 
    if (isEditing.value) {
      await api.put(`/content-plans/${editId.value}`, payload);
      closeManagerModal(); 
      showToast('تم التحديث بنجاح'); 
      await fetchPlans(); 
    } else {
      const response = await api.post('/content-plans', payload);
      closeManagerModal();
      showToast('تم الإنشاء بنجاح'); 
      await fetchPlans(); 
      const newPlanId = response.data?.data?.id;
      if(newPlanId) {
        createdPlan.value = plans.value.find(p => p.id === newPlanId);
        showCreationSuccessModal.value = true;
      }
    }
  } catch (error) {} finally { saving.value = false; } 
};

const deletePlan = async (id) => {
  if (user.value?.role !== 'manager' && user.value?.job_title !== 'Account Manager') {
    showToast('عذراً، لا تمتلك الصلاحية لحذف الخطط');
    return;
  }
  const planToDelete = plans.value.find(p => p.id === id);
  const planName = planToDelete?.client?.name ? `خطة عميل "${planToDelete.client.name}"` : 'هذه الخطة';
  const confirmed = await alertService.confirm({
    title: 'تأكيد حذف الخطة',
    message: `هل أنت متأكد من رغبتك في حذف ${planName} نهائياً؟ سيتم حذف جميع المنشورات والمتابعات التابعة لها.`,
    confirmText: 'نعم، احذف الخطة 🗑️',
    cancelText: 'إلغاء',
    type: 'danger'
  });
  if (!confirmed) return;
  try {
    await api.delete(`/content-plans/${id}`);
    showToast('تم حذف الخطة بنجاح 🗑️');
    await fetchPlans();
  } catch (error) {
    showToast(error.response?.data?.message || 'حدث خطأ أثناء الحذف');
  }
};

const openDetailsModal = (plan, focusLink = false) => { 
  editId.value = plan.id; 
  currentDetailsPlan.value = plan;
  detailsForm.final_link = plan.final_link || ''; 
  detailsForm.notes = plan.notes || ''; 
  originalDetails.final_link = (plan.final_link || '').trim();
  originalDetails.notes = (plan.notes || '').trim();
  showDetailsModal.value = true; 
  if (focusLink || !plan.final_link) {
    nextTick(() => {
      planLinkInputRef.value?.focus();
    });
  }
};
const closeDetailsModal = () => { 
  showDetailsModal.value = false; 
  currentDetailsPlan.value = null;
};
const saveDetails = async () => { 
  let newLink = (detailsForm.final_link || '').trim();
  if (newLink && !/^https?:\/\//i.test(newLink)) {
    newLink = 'https://' + newLink;
    detailsForm.final_link = newLink;
  }
  const newNotes = (detailsForm.notes || '').trim();
  const isLinkChanged = newLink !== originalDetails.final_link;
  const isNotesChanged = newNotes !== originalDetails.notes;
  const hasRealChanges = isLinkChanged || isNotesChanged;

  saving.value = true; 
  try { 
    await api.put(`/content-plans/${editId.value}/details`, detailsForm); 
    const targetPlan = currentDetailsPlan.value;
    if (targetPlan) {
      targetPlan.final_link = detailsForm.final_link;
      targetPlan.notes = detailsForm.notes;
    }
    const foundPlan = plans.value.find(p => p.id === editId.value);
    if (foundPlan) {
      foundPlan.final_link = detailsForm.final_link;
      foundPlan.notes = detailsForm.notes;
    }
    closeDetailsModal(); 
    showToast('تم حفظ التفاصيل بنجاح ✅'); 
    await fetchPlans(); 

    // إذا كانت هناك بيانات محدثة بالفعل، نجهز رسالة ونبلغ المدير
    if (hasRealChanges && targetPlan) {
      const managers = getManagers();
      if (managers.length === 1) {
        triggerWaPrompt(
          'تحديث تفاصيل الخطة',
          `تم حفظ التحديثات بنجاح. يمكنك إبلاغ المدير (${managers[0].name}) بالتفاصيل المحدثة عبر واتساب:`,
          'manager_details_updated',
          targetPlan,
          managers[0]
        );
      } else if (managers.length > 1) {
        const recipients = managers.map(mgr => ({
          name: mgr.name,
          role: 'مدير',
          link: generateWaLink('manager_details_updated', targetPlan, mgr)
        })).filter(r => !!r.link);

        if (recipients.length > 0) {
          waPromptTitle.value = 'تحديث تفاصيل الخطة';
          waPromptDesc.value = 'تم حفظ التحديثات بنجاح. يمكنك إبلاغ المدير بالتفاصيل المحدثة عبر واتساب:';
          waPromptRecipients.value = recipients;
          waPromptLink.value = recipients[0].link;
          showWaPromptModal.value = true;
        }
      }
    }
  } catch (error) {
    showToast('حدث خطأ أثناء حفظ التفاصيل');
  } finally { 
    saving.value = false; 
  } 
};

const openRejectModal = (plan) => { editId.value = plan.id; rejectNotes.value = ''; showRejectModal.value = true; };
const closeRejectModal = () => { showRejectModal.value = false; editId.value = null; };

const openHistoryModal = (plan) => { selectedHistoryPlan.value = plan; showHistoryModal.value = true; };
const closeHistoryModal = () => { showHistoryModal.value = false; selectedHistoryPlan.value = null; };

const openRejectionsModal = (plan) => { selectedHistoryPlan.value = plan; selectedRejections.value = getReviewHistories(plan).filter(h => h.action === 'rejected'); showRejectionsModal.value = true; };
const closeRejectionsModal = () => { showRejectionsModal.value = false; selectedHistoryPlan.value = null; selectedRejections.value = []; };

const openFollowUpsModal = (plan) => { selectedFollowUpPlan.value = plan; cancelEditFollowUp(); showFollowUpsModal.value = true; };
const closeFollowUpsModal = () => { showFollowUpsModal.value = false; selectedFollowUpPlan.value = null; };

watch(showManagerModal, async (open) => {
  document.body.classList.toggle('modal-is-open', open)
  if (open) {
    await nextTick()
  }
})

watch(() => plans.value, async () => {
  await nextTick();
  updateScrollState();
}, { deep: false });

watch(() => loading.value, async () => {
  await nextTick();
  updateScrollState();
});

watch(isAnyModalOpen, () => {
  updateScrollState();
});

onMounted(() => {
  fetchPlans();
  fetchResources();
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  window.addEventListener('mouseup', onTableMouseUp);
  window.addEventListener('blur', onTableMouseUp);

  if (window.ResizeObserver && tableContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(tableContainer.value);
  }
  nextTick(() => updateScrollState());

  // تشغيل المؤقت الحي كل 30 ثانية لتحديث العداد التنازلي
  countdownInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 30000);

  window.addEventListener('keydown', handleViewerKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleViewerKeyDown);
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  document.body.classList.remove('modal-is-open');
  window.removeEventListener('scroll', updateScrollState);
  window.removeEventListener('resize', updateScrollState);
  window.removeEventListener('mouseup', onTableMouseUp);
  window.removeEventListener('blur', onTableMouseUp);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
:global(*) { box-sizing:border-box; } :global(body) { margin:0; font-family:'Cairo',sans-serif; }.plans-page { min-height:100%; color:#edf0ff; font-family:'Cairo',sans-serif; }.page-topline { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:25px; }.eyebrow { color:#76e8de; font-size:10px; font-weight:700; letter-spacing:.7px; }.page-topline h2 { margin:7px 0 3px; font-size:28px; }.page-topline p { margin:0; color:#818cb9; font-size:12px; }.primary-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:43px; padding:0 17px; border:0; border-radius:11px; color:#12183f; background:linear-gradient(110deg,#7de8dc,#b28aff); font:inherit; font-size:11px; font-weight:800; cursor:pointer; box-shadow:0 9px 22px rgba(111,222,211,.13); transition:.2s; }.primary-btn span { font-size:20px; line-height:0; }.primary-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.06); }.primary-btn:disabled { opacity:.6; cursor:wait; }
.summary-strip { display:grid; grid-template-columns:repeat(3,1fr) 1.7fr; gap:1px; overflow:hidden; margin-bottom:18px; border:1px solid rgba(137,153,226,.13); border-radius:15px; background:rgba(137,153,226,.13); }.summary-strip > div { display:flex; align-items:center; gap:10px; padding:13px 17px; background:rgba(21,29,73,.68); }.summary-icon { width:31px; height:31px; display:grid; place-items:center; border-radius:9px; font-size:16px; }.teal { color:#7de8dc; background:rgba(93,222,209,.12); }.purple { color:#c994ff; background:rgba(180,112,255,.12); }.orange { color:#ffc480; background:rgba(255,186,86,.12); }.summary-strip small,.summary-strip strong { display:block; }.summary-strip small { color:#7c87b5; font-size:9px; }.summary-strip strong { color:#eef0ff; font-size:20px; }.sync-status { justify-content:center; color:#7480ae; font-size:9px; }.sync-status i { width:6px; height:6px; border-radius:50%; background:#72e5d9; box-shadow:0 0 8px #72e5d9; }
.plans-card { overflow:hidden; border:1px solid rgba(137,153,226,.13); border-radius:18px; background:rgba(15,22,61,.65); }.card-heading { display:flex; align-items:center; justify-content:space-between; padding:20px 23px 17px; }.card-heading h3 { margin:0; font-size:15px; }.card-heading h3 span { margin-right:6px; padding:2px 7px; border-radius:7px; color:#7de8dc; background:rgba(89,220,207,.11); font-size:9px; }.card-heading p { margin:4px 0 0; color:#6e79a9; font-size:10px; }.legend { display:flex; gap:14px; color:#7e89b5; font-size:9px; }.legend i { display:inline-block; width:6px; height:6px; margin-left:4px; border-radius:50%; }.green-dot { background:#71e1d5; }.blue-dot { background:#65b5ff; }.purple-dot { background:#c994ff; }.orange-dot { background:#ffbd73; }.gray-dot { background:#97a5d0; }.table-responsive { overflow-x:auto; }.plans-table { width:100%; min-width:1250px; border-collapse:collapse; text-align:right; }.plans-table th,.plans-table td { padding:13px 18px; border-top:1px solid rgba(138,152,222,.09); vertical-align:middle; }.plans-table th { color:#6874a6; background:rgba(10,16,47,.35); font-size:9px; font-weight:600; }.plans-table td { color:#d9ddf5; font-size:10px; }.plan-cell { display:flex; align-items:center; gap:9px; }.plan-avatar { width:31px; height:31px; display:grid; place-items:center; border-radius:9px; color:#252058; background:linear-gradient(145deg,#80e8df,#ac84fa); font-size:9px; font-weight:800; }.plan-cell strong,.plan-cell span { display:block; }.plan-cell strong { font-size:10px; }.plan-cell span,.people-cell,.muted { color:#7782b0; font-size:9px; }.milestone { min-width:145px; }.date { display:block; color:#aeb6d7; direction:ltr; text-align:right; font-size:9px; }.status-badge { display:inline-flex; align-items:center; gap:5px; margin-top:5px; padding:4px 6px; border-radius:6px; font-size:8px; }.status-badge i { width:5px; height:5px; border-radius:50%; }.status-badge small { display:block; margin-right:4px; color:#7782b0; font-size:8px; }

.status-green { color:#78e4d8; background:rgba(90,220,207,.1); } .status-green i { background:#70e1d5; }
.status-blue { color:#8fc9ff; background:rgba(101,181,255,.1); } .status-blue i { background:#65b5ff; }
.status-purple { color:#c491ff; background:rgba(180,112,255,.12); } .status-purple i { background:#b470ff; }
.status-red { color:#ff9bad; background:rgba(255,103,139,.1); } .status-red i { background:#ff8fa4; }
.status-gray { color:#aab5da; background:rgba(133,149,218,.1); } .status-gray i { background:#97a5d0; }

.wa-quick-btn { background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.3); color: #25D366; border-radius: 6px; padding: 3px 6px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
.wa-quick-btn:hover { background: rgba(37, 211, 102, 0.2); transform: scale(1.05); }
.wa-actions-container { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
.wa-btn-large { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:12px; border:none; border-radius:10px; background:linear-gradient(110deg, #25D366, #128C7E); color:#fff; font-size:12px; font-weight:bold; cursor:pointer; font-family:inherit; transition:.2s; box-shadow:0 4px 15px rgba(37,211,102,.2); }
.wa-btn-large:hover { transform: translateY(-2px); box-shadow:0 6px 20px rgba(37,211,102,.3); }
.wa-btn-small { padding:8px 12px; border:1px solid rgba(37,211,102,.3); border-radius:8px; background:rgba(37,211,102,.05); color:#25D366; font-size:10px; font-family:inherit; cursor:pointer; transition:.2s; }
.wa-btn-small:hover { background:rgba(37,211,102,.15); }
.wa-btn-manager { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px 14px; border: 1px solid rgba(178, 138, 255, 0.35); border-radius: 10px; background: linear-gradient(110deg, rgba(125, 232, 220, 0.15), rgba(178, 138, 255, 0.2)); color: #7de8dc; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: .2s ease; box-shadow: 0 4px 15px rgba(125, 232, 220, 0.1); }
.wa-btn-manager:hover { transform: translateY(-2px); background: linear-gradient(110deg, #7de8dc, #b28aff); color: #0b1132; border-color: transparent; box-shadow: 0 6px 20px rgba(125, 232, 220, 0.3); }

.reject-reasons-btn { display:inline-block; margin-top:6px; padding:5px 8px; border:1px dashed rgba(255,103,139,.4); border-radius:6px; color:#ff9bad; background:rgba(255,103,139,.08); font-size:9px; cursor:pointer; transition:.2s; } .reject-reasons-btn:hover { background:rgba(255,103,139,.15); }

.details-cell { min-width:165px; }
.link-btn, .history-btn, .details-btn, .followup-btn { display:inline-block; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:9px; cursor:pointer; text-align:center; border:none; font-family:inherit; }
.link-btn { color:#78e5da; background:rgba(90,220,207,.08); margin-bottom: 6px; } .link-btn:hover { background:rgba(90,220,207,.15); }
.history-btn { color:#c491ff; background:rgba(180,112,255,.08); } .history-btn:hover { background:rgba(180,112,255,.15); }
.details-btn { border:1px solid rgba(180,112,255,.2); color:#c491ff; background:rgba(180,112,255,.08); margin-top: 6px; } .details-btn:hover { filter:brightness(1.25); }

.followup-btn { color:#8fc9ff; border: 1px solid rgba(101,181,255,.2); background:rgba(101,181,255,.08); font-weight:600; padding:6px 8px; transition: 0.2s; margin-bottom: 6px; } 
.followup-btn:hover:not(:disabled) { background:rgba(101,181,255,.15); }
.followup-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }

.ref-links-btn { color:#4facfe; background:rgba(79,172,254,.08); border:1px solid rgba(79,172,254,.2); padding:4px 8px; border-radius:6px; font-size:9px; font-weight:bold; cursor:pointer; text-align:center; transition:.2s; margin-bottom: 6px; font-family: inherit; }
.ref-links-btn:hover { background:rgba(79,172,254,.15); }
.ref-links-list { display:flex; flex-direction:column; gap:10px; max-height: 300px; overflow-y: auto; padding-right: 5px; }
.ref-link-item { display:flex; align-items:center; gap:10px; padding:12px; background:rgba(6,11,37,.4); border:1px solid rgba(79,172,254,.2); border-radius:10px; text-decoration:none; color:#d9ddf5; transition:.2s; }
.ref-link-item:hover { background:rgba(79,172,254,.1); border-color:#4facfe; transform:translateY(-2px); }
.link-number { width:24px; height:24px; display:grid; place-items:center; background:#4facfe; color:#12183f; border-radius:6px; font-size:11px; font-weight:800; }
.link-url { flex-grow:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:11px; direction:ltr; text-align:left; color: #aeb6d7; }

.review-actions { display:flex; gap:6px; } 
.accept-btn { color:#78e4d8 !important; border-color:rgba(120,228,216,.3) !important; background:rgba(90,220,207,.08) !important; } 
.reject-btn { color:#ff9bad !important; border-color:rgba(255,155,173,.3) !important; background:rgba(255,103,139,.08) !important; }

.actions-cell { display:flex; gap:6px; }.action { width:28px; height:28px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; cursor:pointer; font-size:14px; }
.action.duplicate { color: #65b5ff; background: rgba(101, 181, 255, .08); }
.action.edit { color:#78e4da; background:rgba(92,220,208,.08); }.action.delete { color:#ff94ab; background:rgba(255,103,139,.08); }.action:hover { filter:brightness(1.3); transform:translateY(-1px); }.state-cell { height:145px; color:#7d89b6 !important; text-align:center !important; }.spinner { display:inline-block; width:15px; height:15px; margin-left:7px; vertical-align:middle; border:2px solid rgba(125,232,220,.25); border-top-color:#7de8dc; border-radius:50%; animation:spin .7s linear infinite; }
.modal-overlay { position:fixed;   display:grid; place-items:start center; padding:18px; overflow-y:auto; background:rgba(4,7,27,.78); backdrop-filter:blur(7px);     inset: 0 !important; z-index: 9999 !important; }.modal-content { width:min(780px,100%); max-height:calc(100vh - 118px); overflow-y:auto; position:relative; padding:28px; border:1px solid rgba(146,160,233,.2); border-radius:20px; background:linear-gradient(145deg,#171d52,#0d143a); box-shadow:0 25px 70px rgba(0,0,0,.4); }.modal-close { position:absolute; top:12px; left:16px; border:0; color:#8994c2; background:transparent; font-size:25px; cursor:pointer; }.modal-icon { width:42px; height:42px; display:grid; place-items:center; margin-bottom:12px; border-radius:12px; color:#202057; background:linear-gradient(145deg,#80e8df,#b486fb); font-size:21px; }.modal-content h3 { margin:7px 0 2px; font-size:21px; }.modal-content > p { margin:0; color:#818cb9; font-size:11px; }.plan-form { margin-top:23px; }.form-grid,.form-grid-3 { display:grid; gap:13px; margin-bottom:14px; }.form-grid { grid-template-columns:1fr 1fr; }.form-grid-3 { grid-template-columns:repeat(3,1fr); }.form-group { min-width:0; margin-bottom:13px; }.form-group label { display:block; margin-bottom:6px; color:#b8c0e2; font-size:10px; }.form-group label small { color:#6975a7; font-size:8px; }.form-group input,.form-group select, .form-group textarea { width:100%; min-height:42px; padding:0 11px; border:1px solid rgba(145,160,230,.2); border-radius:9px; outline:0; color:#eef0ff; background:rgba(6,11,37,.46); font:inherit; font-size:10px; direction: rtl; }.form-group input[type="url"] { direction: ltr; text-align: left; }.form-group textarea { padding-top: 10px; resize: vertical; }.form-group input:focus,.form-group select:focus, .form-group textarea:focus { border-color:#76e8de; box-shadow:0 0 0 3px rgba(118,232,222,.08); }.form-group input::placeholder, .form-group textarea::placeholder { color:#626e9e; }.separator { height:1px; margin:20px 0 15px; border:0; background:rgba(143,157,226,.14); }.section-title { color:#b986ff; font-size:11px; font-weight:700; }.section-title span { color:#76e8de; margin-left:4px; }.helper-text { margin:3px 0 13px; color:#6f7baa; font-size:9px; }.modal-actions { display:flex; justify-content:flex-start; gap:9px; margin-top:18px; }.secondary-btn { min-height:43px; padding:0 18px; border:1px solid rgba(143,157,226,.2); border-radius:10px; color:#aab4dc; background:transparent; font:inherit; font-size:11px; cursor:pointer; }
.confirm-btn { margin-top:5px; padding:5px 7px; border:1px solid rgba(117,231,218,.2); border-radius:6px; color:#78e4d8; background:rgba(90,220,207,.08); font-size:8px; cursor:pointer; }.confirm-btn:hover:not(:disabled) { filter:brightness(1.3); }.confirm-btn:disabled { opacity:.5; cursor:wait; }
.toggle-group { display:flex; align-items:center; gap:10px; flex-direction:row !important; margin-top:15px; } .toggle-group label:first-child { margin-bottom:0; flex-grow:1; } .toggle-switch { position:relative; display:inline-block; width:44px; height:24px; } .toggle-switch input { opacity:0; width:0; height:0; } .slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:rgba(145,160,230,.2); transition:.4s; border-radius:34px; } .slider:before { position:absolute; content:""; height:18px; width:18px; left:3px; bottom:3px; background-color:#7d89b6; transition:.4s; border-radius:50%; } input:checked + .slider { background-color:rgba(125,232,220,.25); } input:checked + .slider:before { transform:translateX(20px); background-color:#7de8dc; } .toggle-label { font-size:10px; color:#aeb6d7; min-width:55px; }
.checkbox-list { display:flex; flex-direction:column; gap:8px; padding:10px; border:1px solid rgba(145,160,230,.15); border-radius:9px; background:rgba(6,11,37,.25); max-height:150px; overflow-y:auto; } .custom-cb { display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:0 !important; } .custom-cb input[type="checkbox"] { width:14px !important; min-height:14px !important; margin:0; accent-color:#76e8de; } .custom-cb .cb-text { color:#d9ddf5; font-size:11px; }

/* Dynamic Reference Links Styles */
.add-link-btn { background: transparent; border: 1px dashed rgba(118,232,222,.4); color: #76e8de; border-radius: 6px; padding: 4px 8px; font-size: 9px; cursor: pointer; transition: 0.2s; }
.add-link-btn:hover { background: rgba(118,232,222,.1); }
.reference-links-container { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto; padding-right: 5px; }
.link-input-group { display: flex; gap: 8px; align-items: center; }
.link-input-group input { flex-grow: 1; }
.remove-link-btn { background: rgba(255,103,139,.1); color: #ff9bad; border: 1px solid rgba(255,155,173,.3); border-radius: 8px; width: 42px; height: 42px; display: grid; place-items: center; cursor: pointer; transition: 0.2s; font-size: 14px; }
.remove-link-btn:hover { background: rgba(255,103,139,.2); }

/* Timeline Styles */
.history-timeline { margin-top:20px; padding-right:10px; border-right:2px solid rgba(145,160,230,.15); display:flex; flex-direction:column; gap:20px; } 
.timeline-item { position:relative; } 
.tl-dot { position:absolute; right:-15px; top:3px; width:10px; height:10px; border-radius:50%; border:2px solid #171d52; } 
.tl-green { background:#78e4d8; box-shadow: 0 0 8px rgba(120, 228, 216, 0.4); } 
.tl-red { background:#ff9bad; box-shadow: 0 0 8px rgba(255, 155, 173, 0.4); } 
.tl-blue { background:#65b5ff; box-shadow: 0 0 8px rgba(101, 181, 255, 0.6); } 
.tl-content { background:rgba(6,11,37,.4); padding:12px; border-radius:8px; border:1px solid rgba(145,160,230,.1); } 
.tl-header { display:flex; justify-content:space-between; margin-bottom:5px; font-size:11px; color:#d9ddf5; } 
.tl-date { color:#7782b0; font-size:9px; } 
.tl-action { font-size:10px; font-weight:700; margin-bottom:5px; } 
.text-green { color:#78e4d8; } 
.text-red { color:#ff9bad; } 
.text-blue { color:#65b5ff; } 
.tl-notes { background:rgba(0,0,0,.2); padding:8px; border-radius:6px; font-size:10px; color:#aab5da; font-style:italic; }
.details-history-block { margin-top: 10px; border-top: 1px solid rgba(137, 153, 226, 0.12); padding-top: 12px; }
.details-history-title { font-size: 11.5px; font-weight: 800; color: #c9d2f5; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.compact-timeline { margin-top: 10px !important; max-height: 240px; overflow-y: auto; padding-left: 6px; }
.mb-0 { margin-bottom:0 !important; } .mt-2 { margin-top:15px !important; } .mt-3 { margin-top:20px !important; }

/* Follow Ups Styles */
.fu-content { background: rgba(101,181,255,.05); border-color: rgba(101,181,255,.15); } .fu-text { font-size: 11px; color: #d9ddf5; line-height: 1.6; white-space: pre-wrap; margin-bottom: 8px; } .fu-actions { display:flex; gap: 8px; justify-content: flex-end; } .fu-btn { background: transparent; border: 1px solid; border-radius: 4px; padding: 3px 8px; font-size: 9px; cursor: pointer; } .edit-fu { color: #8fc9ff; border-color: rgba(143,201,255,.3); } .edit-fu:hover { background: rgba(143,201,255,.1); } .delete-fu { color: #ff9bad; border-color: rgba(255,155,173,.3); } .delete-fu:hover { background: rgba(255,103,139,.1); }

/* File Upload & Image Preview Styles (Follow Ups) */
.mb-2 { margin-bottom: 15px !important; }
.flex-upload-group { display: flex; align-items: center; gap: 15px; }
.upload-btn { display: inline-block; padding: 8px 12px; border: 1px dashed rgba(101,181,255,.4); border-radius: 8px; color: #8fc9ff; background: rgba(101,181,255,.05); font-size: 10px; cursor: pointer; transition: 0.2s; margin-bottom: 0 !important; }
.upload-btn:hover { background: rgba(101,181,255,.15); }
.image-preview-wrapper { position: relative; width: 45px; height: 45px; border-radius: 8px; border: 1px solid rgba(145,160,230,.2); overflow: visible; }
.image-preview { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.remove-image-btn { position: absolute; top: -6px; left: -6px; width: 18px; height: 18px; background: #ff9bad; color: #12183f; border: none; border-radius: 50%; font-size: 12px; font-weight: bold; cursor: pointer; display: grid; place-items: center; padding: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }

/* Image Viewer inside Timeline */
.fu-image-container { position: relative; display: inline-block; margin-bottom: 8px; cursor: zoom-in; border-radius: 8px; overflow: hidden; border: 1px solid rgba(145,160,230,.15); transition: 0.2s; }
.fu-image-container:hover { border-color: #65b5ff; }
.fu-thumbnail { display: block; max-height: 120px; max-width: 100%; object-fit: cover; border-radius: 8px; }
.zoom-overlay { position: absolute; inset: 0; background: rgba(10,16,47,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; color: #fff; font-size: 20px; }
.fu-image-container:hover .zoom-overlay { opacity: 1; }

/* Full Screen Image Viewer Modal */
.image-viewer-overlay {
  position: fixed !important;
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(3, 6, 23, 0.94) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  z-index: 999999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 24px !important;
}
.viewer-close {
  position: absolute !important;
  top: 24px !important;
  right: 28px !important;
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: #fff !important;
  font-size: 32px !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 1000000 !important;
  line-height: 1 !important;
}
.viewer-close:hover {
  background: #ff5e7e !important;
  border-color: #ff5e7e !important;
  color: #fff !important;
  transform: scale(1.1) rotate(90deg) !important;
}
.viewer-image {
  max-width: 90vw !important;
  max-height: 88vh !important;
  object-fit: contain !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85) !important;
  border: 2px solid rgba(255, 255, 255, 0.18) !important;
  z-index: 999999 !important;
  position: relative !important;
  animation: zoomInImage 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

@keyframes zoomInImage {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.toast-message { position:fixed; left:25px; bottom:25px; z-index:200; padding:12px 17px; border:1px solid rgba(116,232,220,.22); border-radius:10px; color:#bdf7f0; background:#182552; box-shadow:0 12px 30px rgba(0,0,0,.25); font-size:11px; }.toast-enter-active,.toast-leave-active { transition:.25s; }.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(10px); } @keyframes spin { to { transform:rotate(360deg); } }

/* ---------------------------------------------------
   SLA Smart Colors (تأثيرات التأخير الذكية)
--------------------------------------------------- */
.dl-completed-text { color: #7de8dc !important; }
.dl-safe-text { color: #25d366 !important; }
.dl-warning-text { color: #ffc107 !important; }
.dl-danger-text { color: #fd7e14 !important; }
.dl-urgent-text { color: #ff4757 !important; }
.dl-late-text { color: #ff0000 !important; }
.dl-critical-text { color: #ff6b81 !important; font-weight: bold; animation: pulse-text 2s infinite; }

.dl-completed-bg { background: #7de8dc !important; }
.dl-safe-bg { background: #25d366 !important; }
.dl-warning-bg { background: #ffc107 !important; }
.dl-danger-bg { background: #fd7e14 !important; }
.dl-urgent-bg { background: #ff4757 !important; }
.dl-late-bg { background: #ff0000 !important; }
.dl-critical-bg { background: #ff4757 !important; }

.sla-indicator { display: flex; flex-direction: column; gap: 2px; margin-top: 5px; }
.sla-progress-bg { height: 4px; background: rgba(137, 153, 226, 0.1); border-radius: 2px; overflow: hidden; width: 100%; margin-top: 2px; }
.sla-progress-fill { height: 100%; transition: width 0.3s ease; }
.sla-msg { font-size: 10px; font-weight: bold; display: block; line-height: 1.4; }
@keyframes pulse-text { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
.d-block { display: block; }

/* ---------------------------------------------------
   أنماط شبكة الكروت المنظمة الحديثة (Cards Layout)
--------------------------------------------------- */
.cards-view-container {
  width: 100%;
}

.heading-title-group h3 span {
  margin-right: 6px;
  padding: 2px 8px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89, 220, 207, 0.12);
  font-size: 10px;
}

.heading-actions-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.view-switcher {
  display: inline-flex;
  background: rgba(10, 16, 47, 0.65);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(137, 153, 226, 0.18);
  gap: 3px;
}

.switcher-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #8390be;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switcher-btn.active {
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  color: #12183f;
  box-shadow: 0 2px 10px rgba(125, 232, 220, 0.28);
}

.switcher-btn:hover:not(.active) {
  color: #fff;
  background: rgba(137, 153, 226, 0.1);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(390px, 1fr));
  gap: 22px;
  padding: 22px;
}

.plan-card {
  background: linear-gradient(160deg, rgba(20, 27, 72, 0.75), rgba(11, 17, 49, 0.85));
  border: 1px solid rgba(137, 153, 226, 0.16);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(4, 7, 27, 0.35);
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(12px);
}

.plan-card:hover {
  transform: translateY(-4px);
  border-color: rgba(125, 232, 220, 0.38);
  box-shadow: 0 16px 40px rgba(4, 7, 27, 0.5), 0 0 20px rgba(125, 232, 220, 0.08);
}

/* شريط الإضاءة العلوي */
.card-accent-bar {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 4px;
  background: rgba(137, 153, 226, 0.3);
}
.accent-completed { background: linear-gradient(90deg, #10b981, #06b6d4); }
.accent-reviewed { background: linear-gradient(90deg, #3b82f6, #06b6d4); }
.accent-under_review { background: linear-gradient(90deg, #8b5cf6, #ec4899); }
.accent-rejected { background: linear-gradient(90deg, #ef4444, #f59e0b); }
.accent-pending { background: linear-gradient(90deg, #6366f1, #3b82f6); }

/* رأس الكارت */
.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.client-meta-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.client-avatar-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7de8dc, #b28aff);
  color: #12183f;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(125, 232, 220, 0.22);
}

.client-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.client-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.client-heading {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #f1f4ff;
  line-height: 1.3;
}

.plan-type-tag {
  font-size: 10px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}

.plan-date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8894c2;
  font-size: 10px;
}

.range-icon {
  font-size: 11px;
}

.card-top-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.card-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
  animation: pulse-dot 1.8s infinite;
}

@keyframes pulse-dot {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.4); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.admin-quick-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-icon-btn {
  width: 27px;
  height: 27px;
  border-radius: 7px;
  border: 1px solid rgba(137, 153, 226, 0.15);
  background: rgba(10, 16, 47, 0.5);
  color: #929ec7;
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.quick-icon-btn:hover {
  color: #fff;
  border-color: #7de8dc;
  background: rgba(125, 232, 220, 0.15);
  transform: translateY(-1px);
}

.quick-icon-btn.wa-btn {
  color: #25d366;
  border-color: rgba(37, 211, 102, 0.3);
}

.quick-icon-btn.wa-btn:hover {
  background: rgba(37, 211, 102, 0.15);
  border-color: #25d366;
}

.quick-icon-btn.delete:hover {
  color: #ff8e9e;
  border-color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
}

/* صف الأدوار وفريق العمل */
.team-roles-panel {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  background: rgba(8, 13, 38, 0.55);
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid rgba(137, 153, 226, 0.1);
}

.team-role-item {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.role-data {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.role-name-caption {
  font-size: 8.5px;
  color: #717da8;
  font-weight: 700;
  text-transform: uppercase;
}

.role-user-val {
  font-size: 10.5px;
  font-weight: 700;
  color: #dbe2ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* شبكة معالم الإنجاز */
.milestones-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.milestone-card-block {
  background: rgba(10, 16, 47, 0.55);
  border: 1px solid rgba(137, 153, 226, 0.12);
  border-radius: 12px;
  padding: 11px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  min-height: 115px;
}

.block-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.block-label {
  font-size: 10px;
  font-weight: 800;
  color: #c9d2f5;
}

.block-date {
  font-size: 9.5px;
  color: #8b97c6;
  direction: ltr;
  text-align: right;
}

.block-action-slot {
  margin-top: 4px;
}

.full-w-btn {
  width: 100% !important;
  text-align: center;
  justify-content: center;
  font-size: 10px !important;
  padding: 6px 10px !important;
}

.muted-slot-text {
  font-size: 9.5px;
  color: #616c96;
  display: block;
}

.no-review-placeholder {
  font-size: 9.5px;
  color: #6c78a4;
  padding: 6px 0;
}

.review-btn-duo {
  display: flex;
  gap: 6px;
}
.review-btn-duo button {
  flex: 1;
  font-size: 9.5px;
  padding: 5px 8px;
}

.review-done-badge {
  font-size: 9px;
  color: #7de8dc;
  display: block;
}

/* موعد وتسليم ابتدائي */
.initial-delivery-box {
  background: rgba(6, 11, 37, 0.45);
  border: 1px dashed rgba(125, 232, 220, 0.22);
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.initial-delivery-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 9.5px;
}

.id-label {
  color: #9cb0dc;
  font-weight: 700;
}

.id-val {
  color: #cdd6f8;
  font-size: 9px;
  direction: ltr;
}

.id-val.id-highlight {
  color: #7de8dc;
  font-weight: 700;
}

.actual-delivery-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(46, 213, 115, 0.12);
  border: 1px solid rgba(46, 213, 115, 0.35);
  color: #2ed573;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 8.5px;
  font-weight: 700;
  line-height: 1.2;
}

.actual-delivery-tag .tag-icon {
  font-size: 10px;
}

.table-milestone-dates {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 6px;
}

.date-header-badge {
  font-size: 10px;
  font-weight: 800;
  color: #c9d2f5;
  margin-bottom: 3px;
  display: block;
}

.table-date-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 9px;
}

.table-date-line .t-label {
  color: #8fa0cf;
}

.table-date-line .t-val {
  color: #d8e2ff;
  direction: ltr;
}

.t-actual-badge {
  background: rgba(46, 213, 115, 0.12);
  border: 1px solid rgba(46, 213, 115, 0.3);
  color: #2ed573;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 8.5px;
  font-weight: 700;
  margin: 2px 0;
}

/* لوحة ملخص تفاصيل الخطة والمواعيد في المودال */
.details-summary-card {
  background: rgba(6, 11, 37, 0.6);
  border: 1px solid rgba(137, 153, 226, 0.16);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(137, 153, 226, 0.12);
  padding-bottom: 8px;
}

.summary-client-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-client-title {
  font-size: 14px;
  font-weight: 800;
  color: #f1f5ff;
}

.summary-plan-tag {
  font-size: 10px;
  background: rgba(125, 232, 220, 0.12);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 7px;
  border-radius: 6px;
}

.deadlines-timeline-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-box {
  background: rgba(18, 24, 63, 0.5);
  border: 1px solid rgba(137, 153, 226, 0.12);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.timeline-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}

.tb-title {
  color: #9cb0dc;
  font-weight: 700;
}

.tb-val {
  color: #c9d2f5;
  direction: ltr;
  font-size: 10.5px;
}

.tb-val.highlight {
  color: #7de8dc;
  font-weight: 700;
}

.delivery-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  width: fit-content;
}

.delivery-status-pill.success {
  background: rgba(46, 213, 115, 0.14);
  border: 1px solid rgba(46, 213, 115, 0.4);
  color: #2ed573;
}

.delivery-status-pill.pending {
  background: rgba(255, 171, 0, 0.12);
  border: 1px solid rgba(255, 171, 0, 0.35);
  color: #ffab00;
}

.delivery-status-pill .pill-icon {
  font-size: 11px;
}

/* فوتر الكارت */
.card-footer-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px dashed rgba(137, 153, 226, 0.14);
  padding-top: 12px;
  margin-top: 2px;
}

.card-links-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cluster-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 7px;
  background: rgba(137, 153, 226, 0.08);
  border: 1px solid rgba(137, 153, 226, 0.16);
  color: #aeb9e3;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cluster-btn:hover:not(:disabled) {
  color: #fff;
  background: rgba(125, 232, 220, 0.14);
  border-color: rgba(125, 232, 220, 0.35);
  transform: translateY(-1px);
}

.cluster-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spreadsheet-link-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: linear-gradient(110deg, rgba(125, 232, 220, 0.12), rgba(178, 138, 255, 0.12));
  border: 1px solid rgba(125, 232, 220, 0.28);
  border-radius: 9px;
  color: #7de8dc;
  text-decoration: none;
  font-size: 11px;
  font-weight: 800;
  transition: all 0.2s ease;
}

.spreadsheet-link-banner:hover {
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  color: #12183f;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(125, 232, 220, 0.25);
}

.plan-link-warning-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px dashed rgba(245, 158, 11, 0.45);
  border-radius: 6px;
  color: #fbbf24;
  font-size: 9px;
  font-weight: 700;
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;
}
.plan-link-warning-pill:hover {
  background: rgba(245, 158, 11, 0.22);
  border-color: #f59e0b;
  transform: translateY(-1px);
}
.plan-link-warning-pill.table-pill {
  width: auto;
  font-size: 8.5px;
  padding: 2px 6px;
}
.btn-missing-link {
  border-color: rgba(245, 158, 11, 0.35) !important;
}
.cluster-btn.plan-link {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  text-decoration: none;
}
.cluster-btn.plan-link:hover {
  background: rgba(59, 130, 246, 0.22);
  border-color: #3b82f6;
  color: #ffffff;
}
.plan-link-table-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 5px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  font-size: 9px;
  text-decoration: none;
  font-weight: 700;
  transition: 0.2s;
}
.plan-link-table-btn:hover {
  background: rgba(59, 130, 246, 0.25);
  color: #fff;
}

@media (max-width: 900px) {
  .plans-grid {
    grid-template-columns: 1fr;
    padding: 15px;
    gap: 16px;
  }
  .team-roles-panel {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .milestones-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width:720px) { .page-topline { align-items:flex-start; flex-direction:column; }.page-topline h2 { font-size:24px; }.primary-btn { width:100%; }.summary-strip { grid-template-columns:1fr 1fr; }.sync-status { grid-column:1 / -1; }.card-heading { padding-right:15px; padding-left:15px; }.legend { display:none; }.plans-table th,.plans-table td { padding-right:14px; padding-left:14px; }.modal-overlay {  padding:12px;     inset: 0 !important; z-index: 9999 !important; }.modal-content { max-height:calc(100vh - 82px); padding:23px 18px; }.form-grid,.form-grid-3 { grid-template-columns:1fr; gap:0; }.form-group.toggle-group { flex-direction:column !important; align-items:flex-start; margin-top:0; margin-bottom:15px; } .modal-actions { margin-top:5px; } }

.filters-bar { background: rgba(15,22,61,.65); border: 1px solid rgba(137,153,226,.13); border-radius: 15px; margin-bottom: 20px; padding: 15px 20px; transition: 0.3s ease; }
.filters-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.search-input-wrapper { display: flex; align-items: center; background: rgba(10,16,47,.35); border-radius: 10px; padding: 0 15px; flex: 1; min-width: 250px; border: 1px solid rgba(137,153,226,.08); transition: 0.2s; }
.search-input-wrapper:focus-within { border-color: #7de8dc; box-shadow: 0 0 10px rgba(125,232,220,0.1); }
.search-input-wrapper input { background: transparent; border: none; color: #fff; padding: 12px 10px; width: 100%; outline: none; font-family: inherit; font-size: 13px; }
.search-input-wrapper input:focus-visible { outline: none !important; box-shadow: none !important; }
.search-icon { color: #6e79a9; margin-left: 8px; font-size: 16px; display: flex; align-items: center; justify-content: center; }
.filters-actions { display: flex; gap: 10px; }
.advanced-filters { margin-top: 20px; padding-top: 20px; border-top: 1px dashed rgba(137,153,226,.15); animation: slideDown 0.3s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.pagination-controls { display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 25px; padding: 15px; }
.page-info { color: #818cb9; font-size: 12px; font-weight: bold; }

</style>

<style scoped>
:global(body.modal-is-open) { overflow: hidden; }

/* Readability and proportional typography */
.plans-page { min-width: 0; }
.page-topline > div { min-width: 0; }
.eyebrow { display: inline-block; font-size: 12px !important; line-height: 1.5; letter-spacing: .35px; }
.page-topline h2 { font-size: clamp(26px, 2.5vw, 32px) !important; line-height: 1.25; font-weight: 800; }
.page-topline p { font-size: 14px !important; line-height: 1.7; }
.primary-btn, .secondary-btn { min-height: 48px; padding-inline: 19px; font-size: 14px !important; }
.summary-strip > div { min-width: 0; padding: 16px 18px; }
.summary-icon { width: 38px; height: 38px; flex: 0 0 38px; font-size: 19px; }
.summary-strip small { font-size: 12px !important; line-height: 1.5; }
.summary-strip strong { font-size: 24px !important; line-height: 1.2; }
.sync-status { font-size: 12px !important; line-height: 1.5; }
.card-heading { gap: 16px; padding: 22px 24px 18px; }
.card-heading > div:first-child { min-width: 0; }
.card-heading h3 { font-size: 19px !important; line-height: 1.4; }
.card-heading h3 span { font-size: 12px !important; }
.card-heading p { font-size: 13px !important; line-height: 1.6; }
.legend { flex-wrap: wrap; gap: 9px 14px; font-size: 12px !important; line-height: 1.5; }

/* Keep horizontal scrolling limited to the complex table. */
.table-scroll-wrapper { position: relative; width: 100%; }
.table-responsive {
  overflow-x: auto;
  overflow-y: visible;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(125, 232, 220, 0.4) rgba(10, 16, 47, 0.4);
  cursor: grab;
  position: relative;
}
.table-responsive:active { cursor: grabbing; }
.table-responsive.table-is-dragging { cursor: grabbing !important; user-select: none !important; }
.table-responsive.table-is-dragging table { pointer-events: none; }
.table-responsive::-webkit-scrollbar { height: 10px; }
.table-responsive::-webkit-scrollbar-track { background: rgba(10, 16, 47, 0.4); border-radius: 6px; }
.table-responsive::-webkit-scrollbar-thumb { background: rgba(125, 232, 220, 0.35); border-radius: 6px; border: 2px solid rgba(10, 16, 47, 0.4); }
.table-responsive::-webkit-scrollbar-thumb:hover { background: #7de8dc; }

/* أزرار وظلال التمرير المتقدمة */
.scroll-edge-shadow { position: absolute; top: 0; bottom: 0; width: 36px; pointer-events: none; z-index: 5; opacity: 0; transition: opacity 0.3s ease; }
.scroll-edge-shadow.shadow-right { right: 0; background: linear-gradient(to left, rgba(15, 22, 61, 0.95), transparent); }
.scroll-edge-shadow.shadow-left { left: 0; background: linear-gradient(to right, rgba(15, 22, 61, 0.95), transparent); }
.scroll-edge-shadow.is-active { opacity: 1; }

.edge-scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(125, 232, 220, 0.35);
  background: rgba(18, 26, 68, 0.92);
  backdrop-filter: blur(8px);
  color: #7de8dc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.9;
}
.edge-scroll-btn:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.12);
  background: rgba(28, 38, 92, 0.98);
  border-color: #7de8dc;
  box-shadow: 0 6px 22px rgba(125, 232, 220, 0.35);
}
.edge-scroll-btn.btn-right { right: 12px; }
.edge-scroll-btn.btn-left { left: 12px; }

.table-scroll-tools { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.drag-hint { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #92a4de; background: rgba(125, 232, 220, 0.08); border: 1px solid rgba(125, 232, 220, 0.18); padding: 4px 10px; border-radius: 8px; }
.hint-icon { font-size: 13px; line-height: 1; }
.quick-nav-group { display: inline-flex; gap: 6px; }
.quick-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  background: rgba(22, 32, 80, 0.8);
  border: 1px solid rgba(137, 153, 226, 0.22);
  border-radius: 8px;
  color: #d9ddf5;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
  font-family: inherit;
}
.quick-nav-btn:hover:not(:disabled) { background: rgba(125, 232, 220, 0.15); border-color: #7de8dc; color: #7de8dc; transform: translateY(-1px); }
.quick-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }

:global(.floating-sticky-scrollbar) {
  position: fixed;
  bottom: 12px;
  height: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  background: rgba(10, 16, 47, 0.88);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(125, 232, 220, 0.28);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 12px rgba(125, 232, 220, 0.15);
  z-index: 95;
  transition: opacity 0.25s ease, transform 0.25s ease;
  scrollbar-width: thin;
  scrollbar-color: #7de8dc rgba(15, 22, 61, 0.6);
}
:global(.floating-sticky-scrollbar::-webkit-scrollbar) { height: 10px; }
:global(.floating-sticky-scrollbar::-webkit-scrollbar-track) { background: rgba(15, 22, 61, 0.6); border-radius: 6px; margin: 0 4px; }
:global(.floating-sticky-scrollbar::-webkit-scrollbar-thumb) { background: linear-gradient(90deg, #7de8dc, #b28aff); border-radius: 6px; border: 2px solid rgba(15, 22, 61, 0.6); }
:global(.floating-sticky-scrollbar::-webkit-scrollbar-thumb:hover) { background: linear-gradient(90deg, #95efe5, #c49eff); box-shadow: 0 0 8px rgba(125, 232, 220, 0.5); }
:global(.floating-scrollbar-spacer) { height: 1px; }

.plans-table { min-width: 1280px; }
.plans-table a, .plans-table button, .plans-table .action, .plans-table input, .plans-table select { cursor: pointer; pointer-events: auto; }
.plans-table th { font-size: 13px !important; line-height: 1.5; white-space: nowrap; }
.plans-table td { font-size: 14px !important; line-height: 1.6; }
.plan-cell { min-width: 175px; }
.plan-avatar { width: 40px; height: 40px; flex: 0 0 40px; font-size: 13px; }
.plan-cell > div:last-child { min-width: 0; }
.plan-cell strong { overflow: hidden; font-size: 14px !important; text-overflow: ellipsis; white-space: nowrap; }
.plan-cell span, .people-cell, .muted { font-size: 13px !important; }
.milestone { min-width: 175px; }
.date { font-size: 13px !important; line-height: 1.5; }
.status-badge { min-height: 32px; padding: 5px 8px; font-size: 12px !important; }
.status-badge small { font-size: 11px !important; }
.confirm-btn, .followup-btn, .link-btn, .history-btn, .details-btn, .ref-links-btn, .reject-reasons-btn, .wa-quick-btn { min-height: 40px; padding: 7px 10px; font-size: 12px !important; }
.action { width: 40px; height: 40px; font-size: 18px; }

/* Forms and overlays */
.modal-overlay { padding: 20px;     inset: 0 !important; z-index: 9999 !important; }
.modal-content { max-height: calc(100vh - 122px); padding: 30px; }
.modal-content h3 { font-size: 24px !important; line-height: 1.35; }
.modal-content > p { font-size: 14px !important; line-height: 1.7; }
.form-section h4, .section-title { font-size: 16px !important; line-height: 1.5; }
.form-group label { font-size: 14px !important; line-height: 1.5; }
.form-group label small { font-size: 12px !important; }
.form-group input, .form-group select, .form-group textarea { min-height: 48px; padding-inline: 13px; font-size: 14px !important; line-height: 1.6; }
.form-group textarea { min-height: 115px; padding-block: 11px; }
.outline-btn { min-height: 42px; padding-inline: 12px; font-size: 13px !important; }
.remove-btn, .remove-link-btn { width: 40px; height: 40px; flex-basis: 40px; font-size: 20px; }
.checkbox-list { gap: 9px; padding: 12px; }
.custom-cb { min-height: 38px; }
.custom-cb input[type="checkbox"] { width: 18px !important; height: 18px; min-height: 18px !important; }
.custom-cb .cb-text { font-size: 13px !important; }
.toggle-label { font-size: 13px !important; }

/* Detail, history, upload and image controls */
.details-hero h3 { font-size: 25px !important; line-height: 1.35; }
.client-status, .links-count { font-size: 13px !important; }
.details-section h4 { font-size: 15px !important; }
.contact-card small, .finance-list small { font-size: 12px !important; }
.contact-card strong, .finance-list strong { font-size: 14px !important; }
.email-row, .fu-text { font-size: 14px !important; line-height: 1.7; }
.full-contact strong { font-size: 13px !important; }
.full-contact small, .mini-action { font-size: 12px !important; }
.detail-links strong { font-size: 13px !important; }
.detail-links small { font-size: 11px !important; }
.upload-btn { min-height: 44px; display: inline-flex; align-items: center; padding-inline: 12px; font-size: 13px !important; }
.remove-image-btn { width: 28px; height: 28px; font-size: 16px; }
.fu-btn { min-height: 38px; padding: 6px 10px; font-size: 12px !important; }
.viewer-close { width: 52px; height: 52px; z-index: 1000000 !important; }
.image-viewer-overlay { z-index: 999999 !important; }
.toast-message { max-width: min(420px, calc(100vw - 40px)); padding: 14px 18px; font-size: 14px !important; line-height: 1.6; }

.modal-close:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, .table-responsive:focus-visible { outline: 2px solid #79e6db; outline-offset: 2px; }

@media (max-width: 1050px) {
  .summary-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sync-status { grid-column: 1 / -1; justify-content: flex-start; }
  .form-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
  .primary-btn { width: 100%; }
  .summary-strip { grid-template-columns: 1fr 1fr; }
  .sync-status { grid-column: 1 / -1; }
  .card-heading { align-items: flex-start; flex-direction: column; padding: 20px 15px 17px; }
  .table-scroll-tools { width: 100%; justify-content: space-between; margin-top: 5px; }
  .edge-scroll-btn { display: none; }
  .legend { width: 100%; gap: 8px 12px; }
  .plans-table th, .plans-table td { padding-right: 14px; padding-left: 14px; }
  .modal-overlay {  padding: 12px;     inset: 0 !important; z-index: 9999 !important; }
  .modal-content { max-height: calc(100dvh - 82px); padding: 25px 18px 20px; border-radius: 16px; }
  .form-grid, .form-grid-3 { grid-template-columns: 1fr; gap: 0; }
  .form-group.toggle-group { flex-direction: column !important; align-items: flex-start; margin-top: 0; margin-bottom: 15px; }
  .dynamic-row, .contact-row, .link-input-group { align-items: stretch; flex-wrap: wrap; }
  .dynamic-row > input, .link-input-group input { flex: 1 1 70%; }
  .contact-row input, .contact-row select { flex: 1 1 42%; }
  .modal-actions, .detail-footer { flex-direction: column-reverse; }
  .modal-actions .primary-btn, .modal-actions .secondary-btn, .detail-footer .primary-btn, .detail-footer .secondary-btn { width: 100%; }
  .flex-upload-group { align-items: stretch; flex-direction: column; }
  .upload-btn { width: 100%; justify-content: center; }
  .details-grid, .detail-links { grid-template-columns: 1fr; }
  .details-hero h3 { font-size: 22px !important; }
}

@media (max-width: 390px) {
  .summary-strip { grid-template-columns: 1fr; }
  .sync-status { grid-column: auto; }
  .summary-strip > div { padding: 14px; }
  .plans-table th, .plans-table td { padding-inline: 12px; }
  .modal-content { padding-inline: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn, .secondary-btn, .action, .contact-card, .toast-enter-active, .toast-leave-active { transition: none !important; }
  .spinner { animation-duration: 1.5s; }
}
</style>