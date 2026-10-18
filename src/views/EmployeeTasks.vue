<template>
  <section class="tasks-page" dir="rtl">
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة العمل / مهامي الشخصية</span>
        <h2>لوحة المهام</h2>
        <p>تابع مهامك الحالية، حالة المراجعة، ومواعيد التسليم المطلوبة لضمان سير العمل.</p>
      </div>
      
      <!-- قائمة الموظفين (تظهر للمدير فقط) -->
      <div v-if="isManager" class="manager-controls">
        <label for="userSelect">عرض مهام الموظف:</label>
        <select id="userSelect" v-model="selectedUserId" class="custom-select">
          <option value="">-- مهامي الشخصية --</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- شريط الإحصائيات -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-icon teal" aria-hidden="true">◈</span>
        <div>
          <small>إجمالي المهام</small>
          <strong>{{ totalTasks }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon purple" aria-hidden="true">✓</span>
        <div>
          <small>المهام المُسلمة</small>
          <strong>{{ deliveredTasks }}</strong>
        </div>
      </div>
      <div class="summary-item">
        <span class="summary-icon orange" aria-hidden="true">⏳</span>
        <div>
          <small>قيد التنفيذ (المتبقي)</small>
          <strong>{{ pendingTasks }}</strong>
        </div>
      </div>
    </div>

    <!-- شريط سعة العمل اليومية للموظف (من 9 ص إلى 5 م) -->
    <div class="daily-workload-card" v-if="dailyWorkload">
      <div class="workload-header">
        <div class="workload-title-box">
          <span class="workload-icon">⚡</span>
          <div>
            <strong>سعة جدول العمل لليوم</strong>
            <small>دوام رسمي 8 ساعات (9:00 ص - 5:00 م) • الجمعة إجازة رسمية</small>
          </div>
        </div>
        <div class="workload-stats-box">
          <span class="hours-badge" :class="getWorkloadBadgeClass(dailyWorkload.total_hours)">
            {{ dailyWorkload.total_hours }} / {{ dailyWorkload.max_daily_capacity || 8 }} ساعات عمل
          </span>
          <span v-if="dailyWorkload.is_overloaded" class="overload-warning-tag">
            ⚠️ تجاوز السعة (تمت جدولة الفائض تلقائياً)
          </span>
          <span v-else class="balanced-tag">
            ✅ سعة متزنة (المتبقي: {{ dailyWorkload.remaining_hours }} س)
          </span>
        </div>
      </div>
      <div class="workload-progress-bar">
        <div 
          class="workload-progress-fill" 
          :class="getWorkloadFillClass(dailyWorkload.total_hours)"
          :style="{ width: `${Math.min(100, (dailyWorkload.total_hours / (dailyWorkload.max_daily_capacity || 8)) * 100)}%` }"
        ></div>
      </div>

      <!-- تفاصيل توزيع الأعمال وزر مركز الساعات -->
      <div class="workload-breakdown-row" v-if="dailyWorkload">
        <div class="breakdown-chips">
          <span class="breakdown-chip" title="منشورات الخطط المجدولة لليوم">
            📦 {{ dailyWorkload.plan_posts?.length || 0 }} بوستات خطط
          </span>
          <span class="breakdown-chip" title="مهام المشاريع المجدولة لليوم">
            💼 {{ dailyWorkload.tasks?.length || 0 }} مهام مشاريع
          </span>
          <span class="breakdown-chip" title="المهام السريعة المجدولة لليوم">
            ⚡ {{ dailyWorkload.quick_tasks?.length || 0 }} مهام سريعة
          </span>
        </div>
        <button 
          type="button" 
          class="schedule-center-btn"
          @click="showDayScheduleModal = true"
        >
          ⏱️ استعراض وتوزيع ساعات اليوم
        </button>
      </div>
    </div>

    <!-- شريط الفلاتر -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>خطة المحتوى:</label>
        <select v-model="planFilter" class="custom-select small-select">
          <option value="">جميع الخطط</option>
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">
            {{ plan.name || plan.title || 'خطة ' + plan.id }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>نوع المنشور:</label>
        <select v-model="postTypeFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="تصميم">تصميم</option>
          <option value="فيديو">فيديو</option>
          <option value="مقال">مقال</option>
          <option value="أخرى">أخرى</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة النشر:</label>
        <select v-model="publishStatusFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="تم النشر">تم النشر</option>
          <option value="لم يتم">لم يتم</option>
        </select>
      </div>
      <div class="filter-group">
        <label>موقف التسليم:</label>
        <select v-model="deliveryFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="مسلم">مُسلم</option>
          <option value="لم يسلم">لم يُسلم</option>
        </select>
      </div>
      <div class="filter-group">
        <label>حالة القسم:</label>
        <select v-model="reviewFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="قيد الانتظار">قيد الانتظار</option>
          <option value="معتمد">معتمد</option>
          <option value="مرفوض">مرفوض</option>
        </select>
      </div>
      <div class="filter-group">
        <label>اعتماد المدير:</label>
        <select v-model="managerReviewFilter" class="custom-select small-select">
          <option value="">الكل</option>
          <option value="قيد الانتظار">قيد الانتظار</option>
          <option value="معتمد">معتمد</option>
          <option value="مرفوض">مرفوض</option>
        </select>
      </div>
      <div class="filter-group">
        <label>الديدلاين (من):</label>
        <input type="date" v-model="deadlineFromFilter" class="custom-select small-select" />
      </div>
      <div class="filter-group">
        <label>الديدلاين (إلى):</label>
        <input type="date" v-model="deadlineToFilter" class="custom-select small-select" />
      </div>
    </div>

    <div class="tasks-card">
      <div class="card-heading">
        <div>
          <h3>جدول المهام <span>{{ totalTasks }}</span></h3>
          <p>عرض تفصيلي للمهام المطلوبة وحالة مراجعتها</p>
        </div>
      </div>

      <div class="table-responsive" tabindex="0" aria-label="جدول المهام قابل للتمرير أفقيًا">
        <table class="tasks-table" :aria-busy="isLoading">
          <thead>
            <tr>
              <th scope="col" style="width: 50px; text-align: center;">#</th>
              <th scope="col">النوع والمنصة</th>
              <th scope="col">دوري والأطراف</th>
              <th scope="col">الديدلاين</th>
              <th scope="col" class="text-center">موقف التسليم</th>
              <th scope="col" class="text-center">حالة القسم</th>
              <th scope="col" class="text-center">اعتماد المدير</th>
              <th scope="col">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="8" class="state-cell">
                <span class="spinner" aria-hidden="true"></span>
                جارٍ تحميل المهام...
              </td>
            </tr>
            <tr v-else-if="tasks.length === 0">
              <td colspan="8" class="state-cell">🎉 لا توجد مهام مطلوبة حاليًا. استمتع بوقتك!</td>
            </tr>
            <tr v-for="(task, index) in tasks" v-else :key="task.id">
              <td class="text-center row-num-cell" style="font-weight: 700; color: #8792be; width: 50px; vertical-align: middle;">{{ ((currentPage - 1) * perPage) + index + 1 }}</td>
              
              <!-- 1. النوع والمنصة -->
              <td>
                <div class="task-cell">
                  <div class="task-avatar" aria-hidden="true">{{ getInitials(task.post_type || 'مهمة') }}</div>
                  <div class="task-info">
                    <strong>{{ task.post_type || 'غير محدد' }}</strong>
                    <small v-if="task.plan_name" class="plan-name-label">📁 {{ task.plan_name }}</small>
                    <p class="desc-text" v-if="task.publishing_platform">
                      {{ safeJoin(task.publishing_platform) }}
                    </p>
                    <div class="smart-badges-container">
                      <span v-if="task.is_urgent" class="smart-badge badge-urgent-glow" title="منشور عاجل ذو أولوية قصوى">🔥 عاجل</span>
                      <span v-if="task.is_displaced" class="smart-badge badge-displaced-glow" :title="task.displaced_reason || 'تم الترحيل بقرار إداري لإفساح المجال لمنشور طارئ'">🔄 مُرحّل رسمياً</span>
                      <span v-for="badge in task.smart_badges" :key="badge.text" class="smart-badge" :style="{ backgroundColor: badge.color }">
                        {{ badge.text }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- 2. دوري في المهمة والأطراف (العمود الجديد) -->
              <td>
                <div class="role-context">
                  <!-- إذا كان الموظف المعروض هو المنفذ -->
                  <template v-if="task.designer_id == targetUserId">
                    <span class="status-badge role-designer">🎨 المنفذ</span>
                    <div class="parties-info">
                      <small>المراجعون:</small>
                      <span>{{ task.reviewer_names ? safeJoin(task.reviewer_names) : 'لا يوجد مراجعين' }}</span>
                    </div>
                    <div class="parties-info" v-if="task.execution_started_at">
                      <small>تم التكليف:</small>
                      <span style="color: #7de8dc;">{{ formatDate(task.execution_started_at) }}</span>
                    </div>
                  </template>
                  
                  <!-- إذا كان الموظف المعروض هو المراجع -->
                  <template v-else>
                    <span class="status-badge role-reviewer">🧐 المراجع</span>
                    <div class="parties-info">
                      <small>المنفذ:</small>
                      <span style="color: #c994ff;">{{ task.designer_name }}</span>
                    </div>
                  </template>
                </div>
              </td>

              <!-- 3. الديدلاين وساعات العمل -->
              <td>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <span :class="['status-badge', getDeadlineTheme(task.deadline, task.delivered_at)]">
                    🕒 {{ formatDate(task.deadline) }}
                  </span>
                  <div class="task-hours-strip">
                    <span class="hours-tag" :title="`إجمالي ساعات المنشور: ${task.total_estimated_hours || 2} س`">
                      ⏱️ <strong>{{ task.allocated_hours_today ?? task.total_estimated_hours ?? 2 }}</strong> س اليوم
                    </span>
                    <span v-if="task.is_partially_shifted" class="smart-badge badge-partial-glow" :title="`تم تشفيت ${task.shifted_hours_to_future} ساعة من هذا المنشور للغد`">
                      🔄 مشفت {{ task.shifted_hours_to_future }}س
                    </span>
                    <span v-if="task.is_shifted_to_today" class="smart-badge badge-incoming-glow" :title="`ساعات قادمة من ${task.shifted_from_date}`">
                      📥 من {{ task.shifted_from_date }}
                    </span>
                  </div>
                  <small v-if="task.is_displaced && task.original_deadline" style="color: #a78bfa; font-size: 10px; font-weight: bold;" :title="task.displaced_reason || 'تم الترحيل بقرار إداري'">
                    السابق: {{ formatDate(task.original_deadline) }}
                  </small>
                </div>
              </td>

              <!-- 4. موقف التسليم -->
              <td class="text-center">
                <span v-if="task.delivered_at" class="status-badge badge-teal">
                  ✅ مُسلم
                  <small style="display:block; font-size: 10px; margin-top: 3px;">{{ formatDate(task.delivered_at) }}</small>
                </span>
                <span v-else class="status-badge badge-pending">
                  ⏳ لم يُسلم
                </span>
              </td>

              <!-- 5. حالة القسم -->
              <td class="text-center">
                <span :class="['status-badge', getStatusTheme(task.review_status)]">
                  {{ task.review_status || 'قيد الانتظار' }}
                </span>
              </td>

              <!-- 6. اعتماد المدير -->
              <td class="text-center">
                <span :class="['status-badge', getStatusTheme(task.manager_review_status)]">
                  {{ task.manager_review_status || 'قيد الانتظار' }}
                </span>
              </td>

              <!-- 7. الإجراءات -->
              <td>
                <div class="actions-cell">
                  <router-link :to="{ path: `/plan-board/${task.content_plan_id}`, query: { postId: task.id } }" class="primary-btn small-btn" title="عرض الخطة وتفاصيل المنشور">
                    <span aria-hidden="true">📊</span> عرض الخطة
                  </router-link>
                  <button 
                    type="button" 
                    class="action-shift-btn" 
                    :class="{ 'btn-disabled': isTaskCompleted(task, 'plan_post') }"
                    :disabled="isTaskCompleted(task, 'plan_post')"
                    @click="!isTaskCompleted(task, 'plan_post') && openShiftModal(task, 'plan_post')" 
                    :title="isTaskCompleted(task, 'plan_post') ? 'لا يمكن تشفيت مهمة مكتملة بالفعل' : 'تشفيت ساعات من هذه المهمة إلى يوم عمل آخر'"
                  >
                    ⏱️ تشفيت ساعات
                  </button>
                  <button 
                    v-if="task.is_shifted_to_today" 
                    type="button" 
                    class="action-restore-btn" 
                    @click="restoreShiftedHours(task, 'plan_post')" 
                    title="إعادة الساعات المشفتة لتاريخها الأصلي"
                  >
                    ↩️ استرجاع
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="lastPage > 1" class="pagination-controls">
        <button class="secondary-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">السابق</button>
        <span class="page-info">صفحة {{ currentPage }} من {{ lastPage }}</span>
        <button class="secondary-btn" :disabled="currentPage === lastPage" @click="changePage(currentPage + 1)">التالي</button>
      </div>
    </div>
    <!-- نافذة تشفيت ساعات العمل للمهمة -->
    <Teleport to="body">
      <div v-if="showShiftModal" class="modal-overlay" role="presentation" @click.self="closeShiftModal">
        <div class="modal-content shift-modal" role="dialog" style="max-width: 500px;">
          <button class="modal-close" type="button" @click="closeShiftModal">×</button>
          
          <div class="shift-modal-header">
            <div class="shift-icon-box">⏱️</div>
            <div>
              <h3>تشفيت ساعات العمل للمهمة</h3>
              <p>نقل جزء من ساعات هذه المهمة إلى يوم عمل آخر بمرونة</p>
            </div>
          </div>

          <div class="task-summary-box">
            <span class="type-badge">{{ getTaskTypeLabel(shiftTarget.type) }}</span>
            <strong class="target-title">{{ shiftTarget.title }}</strong>
            <div class="target-hours-info">
              <span>المتاح اليوم: <strong>{{ shiftTarget.availableHours }}</strong> ساعة</span>
              <span>إجمالي المهمة: <strong>{{ shiftTarget.totalHours }}</strong> ساعة</span>
            </div>
          </div>

          <form @submit.prevent="submitShiftHours" class="shift-form">
            <!-- اختيار عدد الساعات -->
            <div class="form-group">
              <label>عدد الساعات المراد تشفيتها: <span class="hours-val">{{ shiftForm.hours }} ساعة</span></label>
              <div class="hours-stepper-wrap">
                <button type="button" class="stepper-btn" @click="decrementShiftHours" :disabled="shiftForm.hours <= 0.5">−</button>
                <input 
                  type="number" 
                  v-model.number="shiftForm.hours" 
                  step="0.5" 
                  :min="0.5" 
                  :max="shiftTarget.availableHours" 
                  required 
                  class="stepper-val-input"
                />
                <button type="button" class="stepper-btn" @click="incrementShiftHours" :disabled="shiftForm.hours >= shiftTarget.availableHours">＋</button>
              </div>
              <div class="quick-hours-presets">
                <button type="button" class="preset-btn" @click="setShiftHours(1.0)" :disabled="shiftTarget.availableHours < 1.0">ساعة واحدة</button>
                <button type="button" class="preset-btn" @click="setShiftHours(2.0)" :disabled="shiftTarget.availableHours < 2.0">ساعتان</button>
                <button type="button" class="preset-btn" @click="setShiftHours(Math.round(shiftTarget.availableHours / 2 * 2) / 2)">نصف الساعات</button>
                <button type="button" class="preset-btn" @click="setShiftHours(shiftTarget.availableHours)">كل الساعات</button>
              </div>
              <small class="helper-text">
                💡 سيتبقى اليوم: <strong>{{ Math.max(0, +(shiftTarget.availableHours - shiftForm.hours).toFixed(1)) }}</strong> ساعة، وسيتم تشفيت <strong>{{ shiftForm.hours }}</strong> ساعة.
              </small>
            </div>

            <!-- تاريخ التشفيت إليه -->
            <div class="form-group">
              <label>تاريخ التشفيت إليه (يوم العمل المستهدف):</label>
              <input type="date" v-model="shiftForm.to_date" required class="date-input" :min="todayDateStr" />
            </div>

            <!-- سبب التشفيت -->
            <div class="form-group">
              <label>سبب التشفيت (اختياري):</label>
              <input type="text" v-model="shiftForm.reason" placeholder="مثال: إفساح مجال لمهمة طارئة..." class="text-input" />
            </div>

            <!-- أزرار الإجراء -->
            <div class="modal-actions">
              <button type="button" class="secondary-btn" @click="closeShiftModal">إلغاء</button>
              <button type="submit" class="primary-btn submit-shift-btn" :disabled="isShifting">
                {{ isShifting ? 'جارٍ التشفيت...' : 'تأكيد تشفيت الساعات ⏱️' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- نافذة مركز إدارة وتوزيع ساعات اليوم الموحدة -->
    <Teleport to="body">
      <div v-if="showDayScheduleModal" class="modal-overlay" role="presentation" @click.self="showDayScheduleModal = false">
        <div class="modal-content schedule-hub-modal" role="dialog" style="max-width: 800px;">
          <button class="modal-close" type="button" @click="showDayScheduleModal = false">×</button>
          
          <div class="hub-header">
            <div class="hub-icon">📊</div>
            <div>
              <h3>مركز توزيع ساعات العمل اليومية</h3>
              <p>استعراض كافة المنشورات والمهام المجدولة لليوم وإدارة تشفيتها بالساعات</p>
            </div>
            <div class="hub-total-badge" :class="getWorkloadBadgeClass(dailyWorkload?.total_hours || 0)">
              {{ dailyWorkload?.total_hours || 0 }} / {{ dailyWorkload?.max_daily_capacity || 8 }} ساعات عمل
            </div>
          </div>

          <div class="hub-body">
            <!-- 1. بوستات الخطط اليوم -->
            <div class="hub-section">
              <div class="section-title">
                <span>📦 منشورات الخطط ({{ dailyWorkload?.plan_posts?.length || 0 }})</span>
              </div>
              <div v-if="!dailyWorkload?.plan_posts?.length" class="empty-hub-sec">لا توجد منشورات مجدولة لليوم</div>
              <div v-else class="hub-items-list">
                <div v-for="post in dailyWorkload.plan_posts" :key="post.id" class="hub-item-card">
                  <div class="item-meta">
                    <strong>{{ post.post_type || 'منشور' }} #{{ post.id }}</strong>
                    <small v-if="post.plan?.client?.name">🏢 {{ post.plan.client.name }}</small>
                  </div>
                  <div class="item-hours">
                    <span class="hours-tag">⏱️ {{ post.allocated_hours_today }} س اليوم</span>
                    <span v-if="post.is_partially_shifted" class="smart-badge badge-partial-glow">🔄 مشفت {{ post.shifted_hours_to_future }}س</span>
                    <span v-if="post.is_shifted_to_today" class="smart-badge badge-incoming-glow">📥 من {{ post.shifted_from_date }}</span>
                  </div>
                  <div class="item-actions">
                    <button 
                      type="button" 
                      class="btn-micro-shift" 
                      :class="{ 'btn-disabled': isTaskCompleted(post, 'plan_post') }"
                      :disabled="isTaskCompleted(post, 'plan_post')"
                      @click="!isTaskCompleted(post, 'plan_post') && openShiftModal(post, 'plan_post')"
                      :title="isTaskCompleted(post, 'plan_post') ? 'لا يمكن تشفيت مهمة مكتملة بالفعل' : 'تشفيت ساعات'"
                    >
                      ⏱️ تشفيت
                    </button>
                    <button v-if="post.is_shifted_to_today" type="button" class="btn-micro-restore" @click="restoreShiftedHours(post, 'plan_post')">↩️ استرجاع</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. مهام المشاريع -->
            <div class="hub-section">
              <div class="section-title">
                <span>💼 مهام المشاريع ({{ dailyWorkload?.tasks?.length || 0 }})</span>
              </div>
              <div v-if="!dailyWorkload?.tasks?.length" class="empty-hub-sec">لا توجد مهام مشاريع مجدولة لليوم</div>
              <div v-else class="hub-items-list">
                <div v-for="t in dailyWorkload.tasks" :key="t.id" class="hub-item-card">
                  <div class="item-meta">
                    <strong>{{ t.title || 'مهمة مشروع' }}</strong>
                    <small v-if="t.project?.name">📁 {{ t.project.name }}</small>
                  </div>
                  <div class="item-hours">
                    <span class="hours-tag">⏱️ {{ t.allocated_hours_today }} س اليوم</span>
                    <span v-if="t.is_partially_shifted" class="smart-badge badge-partial-glow">🔄 مشفت {{ t.shifted_hours_to_future }}س</span>
                    <span v-if="t.is_shifted_to_today" class="smart-badge badge-incoming-glow">📥 من {{ t.shifted_from_date }}</span>
                  </div>
                  <div class="item-actions">
                    <button 
                      type="button" 
                      class="btn-micro-shift" 
                      :class="{ 'btn-disabled': isTaskCompleted(t, 'task') }"
                      :disabled="isTaskCompleted(t, 'task')"
                      @click="!isTaskCompleted(t, 'task') && openShiftModal(t, 'task')"
                      :title="isTaskCompleted(t, 'task') ? 'لا يمكن تشفيت مهمة مكتملة بالفعل' : 'تشفيت ساعات'"
                    >
                      ⏱️ تشفيت
                    </button>
                    <button v-if="t.is_shifted_to_today" type="button" class="btn-micro-restore" @click="restoreShiftedHours(t, 'task')">↩️ استرجاع</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. المهام السريعة -->
            <div class="hub-section">
              <div class="section-title">
                <span>⚡ المهام السريعة ({{ dailyWorkload?.quick_tasks?.length || 0 }})</span>
              </div>
              <div v-if="!dailyWorkload?.quick_tasks?.length" class="empty-hub-sec">لا توجد مهام سريعة مجدولة لليوم</div>
              <div v-else class="hub-items-list">
                <div v-for="qt in dailyWorkload.quick_tasks" :key="qt.id" class="hub-item-card">
                  <div class="item-meta">
                    <strong>{{ qt.title || 'مهمة سريعة' }}</strong>
                    <small v-if="qt.creator?.name">👤 بواسطة {{ qt.creator.name }}</small>
                  </div>
                  <div class="item-hours">
                    <span class="hours-tag">⏱️ {{ qt.allocated_hours_today }} س اليوم</span>
                    <span v-if="qt.is_partially_shifted" class="smart-badge badge-partial-glow">🔄 مشفت {{ qt.shifted_hours_to_future }}س</span>
                    <span v-if="qt.is_shifted_to_today" class="smart-badge badge-incoming-glow">📥 من {{ qt.shifted_from_date }}</span>
                  </div>
                  <div class="item-actions">
                    <button 
                      type="button" 
                      class="btn-micro-shift" 
                      :class="{ 'btn-disabled': isTaskCompleted(qt, 'quick_task') }"
                      :disabled="isTaskCompleted(qt, 'quick_task')"
                      @click="!isTaskCompleted(qt, 'quick_task') && openShiftModal(qt, 'quick_task')"
                      :title="isTaskCompleted(qt, 'quick_task') ? 'لا يمكن تشفيت مهمة مكتملة بالفعل' : 'تشفيت ساعات'"
                    >
                      ⏱️ تشفيت
                    </button>
                    <button v-if="qt.is_shifted_to_today" type="button" class="btn-micro-restore" @click="restoreShiftedHours(qt, 'quick_task')">↩️ استرجاع</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import api from '../axios';
import alertService from '../services/alertService';

const tasks = ref([]);
const users = ref([]);
const selectedUserId = ref('');
const isManager = ref(false);
const targetUserId = ref(null); // المتغير الجديد لحفظ الـ ID للموظف المعروض
const isLoading = ref(true);

// Pagination & Filters Variables
const currentPage = ref(1);
const lastPage = ref(1);
const totalItems = ref(0);
const perPage = ref(10);
const deliveryFilter = ref('');
const reviewFilter = ref('');
const managerReviewFilter = ref('');
const publishStatusFilter = ref('');
const postTypeFilter = ref('');
const deadlineFromFilter = ref('');
const deadlineToFilter = ref('');
const planFilter = ref('');

const plans = ref([]);

const totalTasks = computed(() => totalItems.value);
const deliveredTasks = computed(() => tasks.value.filter(t => t.delivered_at).length); // يتم حساب المعروض أو يمكن تعديل الباك إند ليرجعها
const pendingTasks = computed(() => tasks.value.filter(t => !t.delivered_at).length);

const getInitials = (name = '') => name.trim().split(' ').slice(0, 2).map(word => word[0]).join('').toUpperCase();

// دالة آمنة لتحويل المصفوفات أو نصوص JSON إلى نص مقروء
const safeJoin = (arr, sep = '، ') => {
  if (!arr) return '';
  if (Array.isArray(arr)) return arr.join(sep);
  if (typeof arr === 'string') {
    try {
      const parsed = JSON.parse(arr);
      if (Array.isArray(parsed)) return parsed.join(sep);
    } catch (e) {
      return arr;
    }
  }
  return String(arr);
};

const formatDate = (dateString) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleString('ar-EG', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

const getDeadlineTheme = (deadline, deliveredAt) => {
  if (deliveredAt) return 'badge-teal'; 
  if (!deadline) return 'badge-pending';
  
  const now = new Date();
  const taskDate = new Date(deadline);
  const diffHours = (taskDate - now) / (1000 * 60 * 60);

  if (diffHours < 0) return 'badge-danger'; 
  if (diffHours < 24) return 'badge-warning'; 
  return 'badge-teal'; 
};

const getStatusTheme = (status) => {
  if (status === 'معتمد') return 'badge-teal';
  if (status === 'مرفوض') return 'badge-danger';
  return 'badge-pending';
};

const fetchTasks = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      delivery_status: deliveryFilter.value,
      review_status: reviewFilter.value,
      manager_review_status: managerReviewFilter.value,
      publish_status: publishStatusFilter.value,
      post_type: postTypeFilter.value,
      deadline_from: deadlineFromFilter.value,
      deadline_to: deadlineToFilter.value,
      content_plan_id: planFilter.value
    };
    if (selectedUserId.value) params.user_id = selectedUserId.value;
    
    const response = await api.get('/user-tasks', { params });
    
    tasks.value = response.data.tasks.data;
    currentPage.value = response.data.tasks.current_page;
    lastPage.value = response.data.tasks.last_page;
    totalItems.value = response.data.tasks.total;
    perPage.value = response.data.tasks.per_page || 10;
    
    isManager.value = response.data.is_manager;
    targetUserId.value = response.data.target_user_id; // حفظ الـ ID لمعرفة دور الموظف
    
    if (isManager.value && users.value.length === 0) {
      fetchUsers();
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    users.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const fetchPlans = async () => {
  try {
    const response = await api.get('/content-plans');
    plans.value = response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
  }
};

const dailyWorkload = ref(null);

const getWorkloadBadgeClass = (hours) => {
  if (hours > 8) return 'badge-red';
  if (hours >= 7) return 'badge-orange';
  return 'badge-green';
};

const getWorkloadFillClass = (hours) => {
  if (hours > 8) return 'fill-red';
  if (hours >= 7) return 'fill-orange';
  return 'fill-green';
};

const fetchWorkload = async () => {
  try {
    const params = {};
    if (selectedUserId.value) params.user_id = selectedUserId.value;
    const res = await api.get('/workload/daily-capacity', { params });
    if (res.data?.success) {
      dailyWorkload.value = res.data.data;
    }
  } catch (err) {
    console.error('Error fetching workload:', err);
  }
};

watch(selectedUserId, () => {
  currentPage.value = 1;
  fetchTasks();
  fetchWorkload();
});

watch([
  deliveryFilter, reviewFilter, managerReviewFilter, 
  publishStatusFilter, postTypeFilter, deadlineFromFilter, 
  deadlineToFilter, planFilter
], () => {
  currentPage.value = 1;
  fetchTasks();
});

const changePage = (page) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page;
    fetchTasks();
  }
};

const showShiftModal = ref(false);
const showDayScheduleModal = ref(false);
const isShifting = ref(false);

const shiftTarget = reactive({
  type: 'plan_post',
  id: null,
  title: '',
  availableHours: 2.0,
  totalHours: 2.0,
  fromDate: '',
});

const shiftForm = reactive({
  hours: 1.0,
  to_date: '',
  reason: '',
});

const todayDateStr = computed(() => {
  const d = new Date();
  return d.toISOString().split('T')[0];
});

const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const getNextWorkingDayStr = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();

  // جلب أيام العمل للموظف المختار أو الحالي
  let activeUser = null;
  const currentUid = targetUserId.value || selectedUserId.value;
  if (currentUid && Array.isArray(users.value) && users.value.length > 0) {
    activeUser = users.value.find(u => u.id == currentUid);
  }
  if (!activeUser) {
    try {
      activeUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}
  }

  const workingDays = (activeUser && Array.isArray(activeUser.working_days) && activeUser.working_days.length > 0)
    ? activeUser.working_days.map(w => String(w).toLowerCase())
    : ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

  let safety = 0;
  while (safety < 14) {
    d.setDate(d.getDate() + 1);
    safety++;
    const dayName = dayNamesEn[d.getDay()];
    if (workingDays.includes(dayName)) {
      break;
    }
  }

  return d.toISOString().split('T')[0];
};

const getTaskTypeLabel = (type) => {
  if (type === 'plan_post') return 'منشور خطة 📦';
  if (type === 'task') return 'مهمة مشروع 💼';
  if (type === 'quick_task') return 'مهمة سريعة ⚡';
  return 'مهمة';
};

const isTaskCompleted = (item, type = 'plan_post') => {
  if (!item) return false;
  if (item.is_completed !== undefined) return Boolean(item.is_completed);
  if (type === 'plan_post') {
    if (item.manager_review_status === 'مرفوض' || item.review_status === 'مرفوض') return false;
    return Boolean(
      item.delivered_at || 
      item.final_delivered_at || 
      item.manager_review_status === 'معتمد' || 
      item.status === 'completed' || 
      item.status === 'published' || 
      item.actual_publish_status === 'published' || 
      item.actual_publish_status === 'تم النشر'
    );
  }
  return item.status === 'completed' || item.status === 'done' || item.status === 'مكتمل';
};

const openShiftModal = (item, type = 'plan_post') => {
  if (isTaskCompleted(item, type)) {
    alertService.warning('لا يمكن تشفيت مهمة مكتملة بالفعل.');
    return;
  }
  shiftTarget.type = type;
  shiftTarget.id = item.id;
  
  if (type === 'plan_post') {
    shiftTarget.title = item.post_type ? `منشور ${item.post_type} #${item.id}` : `منشور خطة #${item.id}`;
    if (item.plan_name) shiftTarget.title += ` (${item.plan_name})`;
  } else if (type === 'task') {
    shiftTarget.title = item.title || `مهمة مشروع #${item.id}`;
  } else if (type === 'quick_task') {
    shiftTarget.title = item.title || `مهمة سريعة #${item.id}`;
  } else {
    shiftTarget.title = `مهمة #${item.id}`;
  }

  const avail = Number(item.allocated_hours_today !== undefined ? item.allocated_hours_today : (item.total_estimated_hours || item.estimated_hours || 2.0));
  shiftTarget.availableHours = Math.max(0.5, avail);
  shiftTarget.totalHours = Number(item.total_estimated_hours || item.estimated_hours || avail);
  
  const rawDate = item.deadline || item.due_date;
  shiftTarget.fromDate = rawDate ? rawDate.split('T')[0].split(' ')[0] : todayDateStr.value;
  
  shiftForm.hours = Math.min(1.0, shiftTarget.availableHours);
  shiftForm.to_date = getNextWorkingDayStr(shiftTarget.fromDate);
  shiftForm.reason = '';

  showShiftModal.value = true;
};

const closeShiftModal = () => {
  showShiftModal.value = false;
  isShifting.value = false;
};

const incrementShiftHours = () => {
  if (shiftForm.hours + 0.5 <= shiftTarget.availableHours) {
    shiftForm.hours = +(shiftForm.hours + 0.5).toFixed(1);
  }
};

const decrementShiftHours = () => {
  if (shiftForm.hours - 0.5 >= 0.5) {
    shiftForm.hours = +(shiftForm.hours - 0.5).toFixed(1);
  }
};

const setShiftHours = (val) => {
  const h = Math.min(shiftTarget.availableHours, Math.max(0.5, Number(val) || 0.5));
  shiftForm.hours = +h.toFixed(1);
};

const submitShiftHours = async () => {
  if (shiftForm.hours <= 0 || shiftForm.hours > shiftTarget.availableHours) {
    alertService.warning('يرجى تحديد عدد ساعات صحيح ضمن المتاح');
    return;
  }
  if (!shiftForm.to_date) {
    alertService.warning('يرجى تحديد تاريخ التشفيت إليه');
    return;
  }

  isShifting.value = true;
  try {
    const payload = {
      task_type: shiftTarget.type,
      task_id: shiftTarget.id,
      hours: shiftForm.hours,
      from_date: shiftTarget.fromDate,
      to_date: shiftForm.to_date,
      reason: shiftForm.reason || undefined,
      user_id: selectedUserId.value || targetUserId.value || undefined,
    };

    const res = await api.post('/workload/shift-hours', payload);
    if (res.data?.success) {
      alertService.success(res.data.message || 'تم تشفيت الساعات بنجاح ⏱️');
      closeShiftModal();
      await fetchTasks();
      await fetchWorkload();
    }
  } catch (err) {
    console.error('Error shifting hours:', err);
    alertService.error(err.response?.data?.message || 'حدث خطأ أثناء تشفيت الساعات');
  } finally {
    isShifting.value = false;
  }
};

const restoreShiftedHours = async (task, type = 'plan_post') => {
  const isConfirmed = await alertService.confirm({
    title: 'تأكيد استرجاع الساعات المشفتة',
    message: `هل تريد إلغاء التشفيت وإعادة ساعات المهمة إلى تاريخها الأصلي؟`,
    type: 'warning',
    confirmText: 'استرجاع الساعات'
  });

  if (!isConfirmed) return;

  try {
    const payload = {
      task_type: type,
      task_id: task.id,
      target_date: todayDateStr.value,
      user_id: selectedUserId.value || targetUserId.value || undefined,
    };

    const res = await api.post('/workload/restore-shifted-hours', payload);
    if (res.data?.success) {
      alertService.success(res.data.message || 'تم استرجاع الساعات بنجاح ↩️');
      await fetchTasks();
      await fetchWorkload();
    }
  } catch (err) {
    console.error('Error restoring shifted hours:', err);
    alertService.error(err.response?.data?.message || 'حدث خطأ أثناء استرجاع الساعات');
  }
};

onMounted(() => {
  fetchTasks();
  fetchPlans();
  fetchWorkload();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) {
  box-sizing: border-box;
}

.tasks-page {
  min-height: 100%;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
}

.page-topline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 25px;
}

.page-intro { min-width: 0; }

.eyebrow {
  display: inline-block;
  color: #76e8de;
  font-size: 12px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: .35px;
}

.page-topline h2 {
  margin: 8px 0 5px;
  color: #f5f6ff;
  font-size: clamp(26px, 2.5vw, 32px);
  line-height: 1.25;
  font-weight: 800;
}

.page-topline p {
  max-width: 680px;
  margin: 0;
  color: #9aa4cf;
  font-size: 14px;
  line-height: 1.7;
}

.manager-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.manager-controls label {
  color: #c7cde8;
  font-size: 13px;
  font-weight: 600;
}

.custom-select {
  width: 100%;
  border: 1px solid rgba(145, 160, 230, .2);
  border-radius: 10px;
  outline: 0;
  color: #eef0ff;
  background: rgba(6, 11, 37, .46);
  font: inherit;
  font-size: 14px;
  min-height: 48px;
  padding: 0 13px;
  cursor: pointer;
}

.custom-select:focus {
  border-color: #76e8de;
  box-shadow: 0 0 0 3px rgba(118, 232, 222, .1);
}

.custom-select option {
  background: #171d52;
  color: #fff;
}

.primary-btn {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 19px;
  border-radius: 11px;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .2s ease, filter .2s ease;
  border: 0;
  color: #12183f;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  box-shadow: 0 9px 22px rgba(111, 222, 211, .13);
  text-decoration: none;
}

.primary-btn.small-btn {
  min-height: 38px;
  font-size: 13px;
  padding: 0 14px;
}

.primary-btn span {
  font-size: 18px;
  line-height: 0;
}

.primary-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid rgba(137, 153, 226, .13);
  border-radius: 15px;
  background: rgba(137, 153, 226, .13);
}

.summary-strip > div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: rgba(21, 29, 73, .68);
}

.summary-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-size: 19px;
}

.teal { color: #7de8dc; background: rgba(93, 222, 209, .12); }
.purple { color: #c994ff; background: rgba(180, 112, 255, .12); }
.orange { color: #ffd166; background: rgba(255, 209, 102, .12); }

.summary-strip small, .summary-strip strong { display: block; }
.summary-strip small { color: #929dc8; font-size: 12px; line-height: 1.5; }
.summary-strip strong { margin-top: 2px; color: #eef0ff; font-size: 24px; line-height: 1.2; }

/* بطاقة سعة جدول العمل اليومية */
.daily-workload-card {
  background: rgba(15, 23, 61, 0.7);
  border: 1px solid rgba(137, 153, 226, 0.2);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 22px;
  backdrop-filter: blur(10px);
}
.workload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.workload-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.workload-icon {
  font-size: 20px;
  background: rgba(125, 232, 220, 0.15);
  border-radius: 8px;
  padding: 6px 10px;
}
.workload-title-box strong {
  display: block;
  font-size: 14px;
  color: #f1f5f9;
}
.workload-title-box small {
  font-size: 11px;
  color: #94a3b8;
}
.workload-stats-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hours-badge {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}
.hours-badge.badge-green {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.hours-badge.badge-orange {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.hours-badge.badge-red {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.overload-warning-tag {
  font-size: 11px;
  color: #f87171;
  font-weight: 700;
}
.balanced-tag {
  font-size: 11px;
  color: #7de8dc;
  font-weight: 600;
}
.workload-progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  overflow: hidden;
}
.workload-progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease, background-color 0.4s ease;
}
.fill-green {
  background: linear-gradient(90deg, #10b981, #34d399);
}
.fill-orange {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.fill-red {
  background: linear-gradient(90deg, #ef4444, #f87171);
}
.badge-urgent-glow {
  background: rgba(239, 68, 68, 0.2) !important;
  color: #ff8b9f !important;
  border: 1px solid rgba(239, 68, 68, 0.4) !important;
  font-weight: 800;
}
.badge-displaced-glow {
  background: rgba(147, 51, 234, 0.2) !important;
  color: #d8b4fe !important;
  border: 1px solid rgba(168, 85, 247, 0.4) !important;
  font-weight: 700;
}

.tasks-card {
  overflow: hidden;
  border: 1px solid rgba(137, 153, 226, .13);
  border-radius: 18px;
  background: rgba(15, 22, 61, .65);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 18px;
}

.card-heading h3 {
  margin: 0;
  color: #f0f2ff;
  font-size: 18px;
  line-height: 1.4;
}

.card-heading h3 span {
  display: inline-block;
  margin-right: 7px;
  padding: 3px 8px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89, 220, 207, .11);
  font-size: 12px;
  vertical-align: middle;
}

.card-heading p { margin: 5px 0 0; color: #8691bf; font-size: 12px; line-height: 1.6; }

.table-responsive {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}

.tasks-table {
  width: 100%;
  min-width: 960px; /* تم زيادة العرض لاستيعاب العمود الجديد */
  border-collapse: collapse;
  text-align: right;
}

.tasks-table th, .tasks-table td {
  padding: 15px 20px;
  border-top: 1px solid rgba(138, 152, 222, .09);
  vertical-align: middle;
}

.tasks-table th {
  color: #8792be;
  background: rgba(10, 16, 47, .35);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
  white-space: nowrap;
}

.tasks-table td {
  color: #d9ddf5;
  font-size: 14px;
  line-height: 1.6;
}

.row-num-cell {
  text-align: center !important;
  font-weight: 700;
  color: #8792be !important;
  width: 50px;
}

.text-center { text-align: center; }

.task-cell {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 170px;
}

.task-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #252058;
  background: linear-gradient(145deg, #80e8df, #ac84fa);
  font-size: 13px;
  font-weight: 800;
}

.task-info strong {
  display: block;
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
}

.desc-text {
  margin: 0;
  color: #929dc8;
  font-size: 12px;
  line-height: 1.6;
}

/* تنسيقات عمود الأدوار والأطراف */
.role-context {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-width: 180px;
}

.role-designer {
  background: rgba(180, 112, 255, 0.15) !important;
  color: #c994ff !important;
  border-color: rgba(180, 112, 255, 0.2) !important;
}

.role-reviewer {
  background: rgba(93, 222, 209, 0.15) !important;
  color: #7de8dc !important;
  border-color: rgba(93, 222, 209, 0.2) !important;
}

.parties-info {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.parties-info small {
  color: #8490bd;
  font-weight: 600;
}

.parties-info span {
  color: #eef0ff;
}

.status-badge {
  display: inline-block;
  padding: 6px 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-teal {
  color: #7de8dc;
  background: rgba(93, 222, 209, .12);
  border-color: rgba(93, 222, 209, .2);
}

.badge-pending {
  color: #a3add1;
  background: rgba(163, 173, 209, .12);
  border-color: rgba(163, 173, 209, .2);
}

.badge-danger {
  color: #ff94ab;
  background: rgba(255, 103, 139, .12);
  border-color: rgba(255, 103, 139, .2);
}

.badge-warning {
  color: #ffd166;
  background: rgba(255, 209, 102, .12);
  border-color: rgba(255, 209, 102, .2);
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.state-cell {
  height: 160px;
  color: #8e99c3 !important;
  text-align: center !important;
  font-size: 14px !important;
}

.spinner {
  width: 18px;
  height: 18px;
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
  border: 2px solid rgba(125, 232, 220, .25);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ستايلات الفلاتر والباجينيشن (Pagination) */
.filters-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  background: rgba(15, 22, 61, .65);
  padding: 15px 20px;
  border-radius: 12px;
  border: 1px solid rgba(137, 153, 226, .13);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  color: #c7cde8;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.small-select {
  min-height: 38px;
  padding: 0 10px;
  font-size: 13px;
  width: 100%;
}

/* تنسيق حقل التاريخ بشكل خاص داخل الثيم المظلم */
input[type="date"].custom-select::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  opacity: 0.6;
}
input[type="date"].custom-select::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid rgba(138, 152, 222, .09);
}

.pagination-controls .secondary-btn {
  background: rgba(10, 16, 47, .45);
  color: #eef0ff;
  border: 1px solid rgba(137, 153, 226, .2);
  padding: 8px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-controls .secondary-btn:hover:not(:disabled) {
  background: rgba(118, 232, 222, .1);
  border-color: #7de8dc;
}

.pagination-controls .secondary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #9aa4cf;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 980px) {
  .summary-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item:last-child { grid-column: 1 / -1; }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
  .summary-strip { grid-template-columns: 1fr; }
  .summary-item:last-child { grid-column: auto; }
  .card-heading { flex-direction: column; align-items: flex-start; gap: 12px; }
  .manager-controls { width: 100%; }
  .primary-btn { width: 100%; text-align: center; }
  .pagination-controls { flex-wrap: wrap; gap: 10px; }
}

.plan-name-label {
  display: block;
  color: #a7b6ff;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  margin-bottom: 4px;
}

.smart-badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.smart-badge {
  color: #fff;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* --- تنسيقات نظام تشفيت وتوزيع الساعات --- */
.workload-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-wrap: wrap;
}

.breakdown-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.breakdown-chip {
  font-size: 11px;
  font-weight: 700;
  color: #9fb0f8;
  background: rgba(135, 146, 190, 0.12);
  border: 1px solid rgba(135, 146, 190, 0.2);
  padding: 4px 10px;
  border-radius: 8px;
}

.schedule-center-btn {
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.16), rgba(99, 102, 241, 0.16));
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.35);
  border-radius: 9px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.schedule-center-btn:hover {
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.26), rgba(99, 102, 241, 0.26));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(125, 232, 220, 0.2);
}

.task-hours-strip {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.hours-tag {
  font-size: 11px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.25);
  padding: 2px 7px;
  border-radius: 6px;
}

.badge-partial-glow {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #fbbf24 !important;
  border: 1px solid rgba(245, 158, 11, 0.4) !important;
}

.badge-incoming-glow {
  background: rgba(99, 102, 241, 0.2) !important;
  color: #a5b4fc !important;
  border: 1px solid rgba(99, 102, 241, 0.4) !important;
}

.action-shift-btn {
  background: rgba(125, 232, 220, 0.12);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.28);
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-shift-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.22);
  transform: translateY(-1px);
}

.action-shift-btn:disabled,
.action-shift-btn.btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
  border-color: rgba(137, 153, 226, 0.15);
  color: #6977a4;
  background: rgba(22, 32, 88, 0.4);
}

.action-restore-btn {
  background: rgba(168, 85, 247, 0.14);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-restore-btn:hover {
  background: rgba(168, 85, 247, 0.24);
  transform: translateY(-1px);
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0 !important;
  z-index: 9999 !important;
  background: rgba(4, 7, 27, 0.78);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
}

.modal-content.shift-modal,
.modal-content.schedule-hub-modal {
  width: 100%;
  position: relative;
  background: linear-gradient(145deg, #161e56, #0c133a);
  border: 1px solid rgba(146, 160, 233, 0.24);
  border-radius: 20px;
  padding: 24px 26px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.55);
  color: #eef0ff;
}

.modal-close {
  position: absolute;
  top: 14px;
  left: 18px;
  border: 0;
  color: #8994c2;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}

.shift-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.shift-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(125, 232, 220, 0.2), rgba(99, 102, 241, 0.2));
  border: 1px solid rgba(125, 232, 220, 0.4);
  display: grid;
  place-items: center;
  font-size: 22px;
}

.shift-modal-header h3 {
  margin: 0;
  font-size: 17px;
  color: #f1f4ff;
}

.shift-modal-header p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #8997c6;
}

.task-summary-box {
  background: rgba(6, 11, 37, 0.55);
  border: 1px solid rgba(145, 160, 230, 0.16);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 18px;
}

.task-summary-box .type-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  padding: 2px 7px;
  border-radius: 6px;
  margin-bottom: 5px;
}

.task-summary-box .target-title {
  display: block;
  font-size: 13px;
  color: #ffffff;
  margin-bottom: 6px;
}

.target-hours-info {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #9cb0e5;
}

.target-hours-info strong {
  color: #7de8dc;
}

.shift-form .form-group {
  margin-bottom: 15px;
}

.shift-form label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #c3cbf1;
  margin-bottom: 7px;
}

.shift-form .hours-val {
  color: #7de8dc;
  font-weight: 800;
}

.hours-stepper-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 220px;
  margin-bottom: 8px;
}

.stepper-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(125, 232, 220, 0.15);
  border: 1px solid rgba(125, 232, 220, 0.35);
  color: #7de8dc;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
}

.stepper-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.3);
}

.stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper-val-input {
  flex: 1;
  height: 40px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: rgba(6, 11, 37, 0.6);
  border: 1px solid rgba(145, 160, 230, 0.25);
  border-radius: 10px;
  outline: none;
}

.quick-hours-presets {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #a7b6ff;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.preset-btn:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
}

.preset-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.shift-form .helper-text {
  display: block;
  font-size: 11px;
  color: #8da0d6;
}

.shift-form .helper-text strong {
  color: #7de8dc;
}

.shift-form .date-input,
.shift-form .text-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: rgba(6, 11, 37, 0.6);
  border: 1px solid rgba(145, 160, 230, 0.25);
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.submit-shift-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: none;
  font-weight: 800;
}

/* Hub Modal Styles */
.hub-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.hub-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(125, 232, 220, 0.25));
  display: grid;
  place-items: center;
  font-size: 24px;
}

.hub-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f1f4ff;
}

.hub-header p {
  margin: 3px 0 0;
  font-size: 11px;
  color: #8c9ac9;
}

.hub-total-badge {
  margin-right: auto;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
}

.hub-body {
  display: grid;
  gap: 18px;
  max-height: 65vh;
  overflow-y: auto;
  padding-left: 6px;
}

.hub-section {
  background: rgba(6, 11, 37, 0.45);
  border: 1px solid rgba(145, 160, 230, 0.14);
  border-radius: 14px;
  padding: 14px 16px;
}

.hub-section .section-title {
  font-size: 12px;
  font-weight: 800;
  color: #9cb0e5;
  margin-bottom: 10px;
}

.empty-hub-sec {
  font-size: 11px;
  color: #6a77a6;
  text-align: center;
  padding: 12px 0;
}

.hub-items-list {
  display: grid;
  gap: 8px;
}

.hub-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(22, 30, 78, 0.55);
  border: 1px solid rgba(145, 160, 230, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
}

.hub-item-card .item-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
}

.hub-item-card .item-meta strong {
  font-size: 12px;
  color: #f0f3ff;
}

.hub-item-card .item-meta small {
  font-size: 10px;
  color: #8594c4;
}

.hub-item-card .item-hours {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.badge-mini-shift {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
  font-weight: 700;
}

.badge-mini-in {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.35);
  font-weight: 700;
}

.hub-item-card .item-actions {
  display: flex;
  gap: 6px;
}

.btn-micro-shift {
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.3);
  border-radius: 7px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-micro-shift:hover:not(:disabled) {
  background: rgba(125, 232, 220, 0.25);
}

.btn-micro-shift:disabled,
.btn-micro-shift.btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.8);
  border-color: rgba(137, 153, 226, 0.15);
  color: #6977a4;
  background: rgba(22, 32, 88, 0.4);
}

.btn-micro-restore {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 7px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-micro-restore:hover {
  background: rgba(168, 85, 247, 0.25);
}
</style>