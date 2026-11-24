<template>
  <section class="quick-tasks-page" dir="rtl">
    <!-- الهيدر وأزرار الإجراءات -->
    <div class="page-topline">
      <div class="page-intro">
        <span class="eyebrow">مساحة العمل / المهام السريعة</span>
        <h2>المهام السريعة</h2>
        <p>تابع، استمع، وأنجز مهام فريقك السريعة والتوجيهات الصوتية بكل سهولة.</p>
      </div>
      <button v-permission="'quick_tasks.create'" class="primary-btn" type="button" @click="openCreateModal">
        <span aria-hidden="true">＋</span>
        إضافة مهمة جديدة
      </button>
    </div>

    <!-- شبكة الإحصائيات -->
    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon teal" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span>إجمالي المهام</span>
          <strong>{{ tasks.length }}</strong>
        </div>
        <small>مهمة مسجلة</small>
      </article>

      <article class="stat-card">
        <div class="stat-icon purple" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span>المهام النشطة</span>
          <strong>{{ activeTasksCount }}</strong>
        </div>
        <small>قيد التنفيذ والمراجعة</small>
      </article>

      <article class="stat-card">
        <div class="stat-icon orange" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span>المهام المكتملة</span>
          <strong>{{ completedTasksCount }}</strong>
        </div>
        <small>تم إنجازها بنجاح</small>
      </article>
    </div>

    <!-- كارت التحكم وفلترة وعرض المهام -->
    <div class="tasks-card">
      <div class="card-heading">
        <div>
          <h3>كل المهام <span>{{ filteredTasks.length }}</span></h3>
          <p>قائمة المهام والتوجيهات الصوتية الحالية</p>
        </div>
        <div class="live-state" role="status"><i aria-hidden="true"></i> محدث الآن</div>
      </div>

      <div class="filters-section" :class="{ 'two-cols': !isManagerUser }" role="search" aria-label="تصفية المهام السريعة">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input v-model="filters.search" type="search" placeholder="ابحث بالعنوان أو الوصف أو اسم المنفذ..." aria-label="البحث عن مهمة" />
        </div>
        <select v-model="filters.status" aria-label="تصفية حسب الحالة">
          <option value="">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="in_progress">جاري التنفيذ</option>
          <option value="under_review">قيد المراجعة</option>
          <option value="rejected">مرفوضة (تحتاج تعديل)</option>
          <option value="completed">مكتملة</option>
        </select>
        <select v-if="isManagerUser" v-model="filters.assignee" aria-label="تصفية حسب المنفذ">
          <option value="">كل المنفذين</option>
          <option v-for="user in usersList" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>
      </div>

      <!-- محتوى المهام (التحميل / الكروت / الحالة الفارغة) -->
      <div class="tasks-body">
        <!-- حالة التحميل -->
        <div v-if="isLoading" class="tasks-loading">
          <span class="spinner" aria-hidden="true"></span>
          <span>جارٍ تحميل المهام...</span>
        </div>

        <!-- شبكة كروت المهام -->
        <div v-else-if="filteredTasks.length > 0" class="tasks-grid-wrapper">
          <TransitionGroup 
            name="task-list" 
            tag="div" 
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6"
          >
            <div 
              v-for="task in filteredTasks" 
              :key="task.id" 
              class="executive-task-card group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer select-none overflow-hidden"
              @click="openTaskDetails(task)"
            >
              <!-- مؤشر لوني علوي فائق الدقة يتبع حالة المهمة -->
              <div 
                class="absolute top-0 inset-x-0 h-[2.5px] transition-all duration-300 opacity-90 group-hover:opacity-100" 
                :class="getStatusColor(task.status).accentBar"
              ></div>

              <!-- طبقة توهج خافتة فاخرة عند التحويم -->
              <div class="card-ambient-glow" :class="getStatusColor(task.status).glow"></div>

              <!-- محتوى الكارت العلوي والأوسط -->
              <div class="relative z-10 flex-1 flex flex-col">
                <!-- 1. شريط الرأس: المعرف والحالة + أدوات الإدارة السريعة -->
                <div class="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800/60">
                  <!-- رقم المهمة وشارة الحالة (جهة اليمين دائماً) -->
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-[11px] font-mono font-bold text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/60">
                      #{{ task.id }}
                    </span>

                    <span 
                      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all" 
                      :class="getStatusColor(task.status).badge"
                    >
                      <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getStatusColor(task.status).dot"></span>
                      <span>{{ getStatusColor(task.status).text }}</span>
                    </span>
                  </div>

                  <!-- أدوات المدير السريعة (تظهر بنعومة جهة اليسار) -->
                  <div 
                    v-if="canModifyTask(task)" 
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
                    @click.stop
                  >
                    <!-- تشفيت الساعات -->
                    <button 
                      type="button" 
                      :disabled="task.status === 'completed'"
                      :class="[
                        'w-7 h-7 rounded-lg border flex items-center justify-center transition-all',
                        task.status === 'completed'
                          ? 'opacity-30 cursor-not-allowed bg-slate-800/40 border-slate-700/40 text-slate-500'
                          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border-slate-700/60 shadow-xs cursor-pointer'
                      ]"
                      @click.stop="task.status !== 'completed' && openShiftQuickTask(task)" 
                      :title="task.status === 'completed' ? 'لا يمكن تشفيت مهمة مكتملة' : 'تشفيت ساعات المهمة'"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>

                    <!-- تعديل المهمة -->
                    <button 
                      v-permission="'quick_tasks.edit'"
                      type="button" 
                      @click.stop="openEditModal(task)" 
                      class="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      title="تعديل المهمة"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <!-- حذف المهمة -->
                    <button 
                      v-permission="'quick_tasks.delete'"
                      type="button" 
                      @click.stop="confirmDeleteTask(task)" 
                      class="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      title="حذف المهمة"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- 2. جسم الكارت: العنوان والوصف -->
                <div class="mb-3">
                  <h4 
                    class="text-[15px] sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2" 
                    :title="task.title"
                  >
                    {{ task.title || 'توجيه سريع' }}
                  </h4>

                  <p 
                    v-if="task.description" 
                    class="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1.5 font-normal" 
                    :title="task.description"
                  >
                    {{ task.description }}
                  </p>
                </div>

                <!-- 3. مشغل الصوت العصري (إن وجد) -->
                <div v-if="task.voice_record_url" class="my-2" @click.stop>
                  <AudioVoicePlayer 
                    :src="task.voice_record_url" 
                    variant="card" 
                    theme="teal" 
                    class="task-card-player"
                  />
                </div>

                <!-- 4. شارات البيانات المنظمة (الموعد النهائي، الساعات، التكلفة، المرفقات، الردود) -->
                <div class="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
                  <!-- الموعد النهائي والعداد التنازلي -->
                  <span 
                    v-if="task.deadline"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors shrink-0"
                    :class="getCountdownBadgeStyle(task.deadline)"
                    :title="`الموعد النهائي: ${task.deadline}`"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ getCountdown(task.deadline).text }}</span>
                  </span>

                  <!-- الساعات المقدرة -->
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px] font-medium shrink-0"
                    :title="`الساعات المقدرة: ${task.estimated_hours || 1} ساعة`"
                  >
                    <svg class="w-3 h-3 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ task.estimated_hours || 1 }} س</span>
                  </span>

                  <!-- تكلفة المهمة (إن وجدت) -->
                  <span 
                    v-if="task.task_cost" 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold shrink-0"
                    :title="`أتعاب المهمة: ${Number(task.task_cost).toLocaleString()} ج.م`"
                  >
                    <svg class="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ Number(task.task_cost).toLocaleString() }} ج.م</span>
                  </span>

                  <!-- المرفق (إن وجد) -->
                  <a 
                    v-if="task.attachment_url" 
                    :href="task.attachment_url" 
                    target="_blank" 
                    @click.stop 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white border border-sky-500/20 text-[11px] font-medium transition-colors max-w-[130px] shrink-0"
                    :title="`مرفق: ${task.attachment_name || 'ملف مرفق'}`"
                  >
                    <svg class="w-3 h-3 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span class="truncate">{{ task.attachment_name || 'مرفق' }}</span>
                  </a>

                  <!-- الملاحظات والردود (إن وجدت) -->
                  <span 
                    v-if="task.feedback_logs && task.feedback_logs.length > 0" 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-medium shrink-0"
                    :title="`${task.feedback_logs.length} ملاحظات وردود`"
                  >
                    <svg class="w-3 h-3 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{{ task.feedback_logs.length }}</span>
                  </span>
                </div>
              </div>

              <!-- 5. فوتر الكارت: بيانات المنفذ ومؤشر التفاصيل -->
              <div class="relative z-10 mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <!-- هوية المنفذ -->
                <div class="flex items-center gap-2 min-w-0" :title="`المكلف: ${task.assignee_name || 'غير محدد'}`">
                  <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-950 border border-indigo-400/30 flex items-center justify-center text-[11px] font-bold text-indigo-300 shrink-0 shadow-xs">
                    {{ getInitials(task.assignee_name) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[10px] text-slate-400 font-medium leading-tight">المكلف</span>
                    <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors leading-tight">
                      {{ task.assignee_name || 'غير محدد' }}
                    </span>
                  </div>
                </div>

                <!-- مؤشر فتح التفاصيل -->
                <div class="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-cyan-300 transition-colors shrink-0">
                  <span>التفاصيل</span>
                  <svg class="w-3.5 h-3.5 rtl:rotate-180 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- حالة لا توجد بيانات -->
        <div v-else class="tasks-empty-state">
          <div class="empty-icon-box">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>لا توجد مهام سريعة!</h3>
          <p>لم يتم العثور على أي مهام تطابق الفلاتر المحددة حاليًا.</p>
          <button v-if="filters.status || filters.assignee || filters.search" @click="clearFilters" class="clear-filter-btn" type="button">
            مسح الفلاتر
          </button>
        </div>
      </div>
    </div>

    <!-- نافذة إضافة مهمة سريعة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isManagerUser && showCreateModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md" @click.self="showCreateModal = false">
          <div class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] border border-[#8999e2]/20 bg-[#10163a]">
            <CreateQuickTask 
              :users="usersList" 
              @taskCreated="onTaskCreated" 
              @cancel="showCreateModal = false" 
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- نافذة تفاصيل ومتابعة المهمة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDetailsModal && selectedTask" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md" @click.self="closeDetailsModal">
          <div class="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2rem] bg-[#10163a] border border-[#8999e2]/20 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)]">
            <button 
              type="button"
              @click="closeDetailsModal" 
              class="absolute top-6 left-6 z-50 text-[#8390be] hover:text-[#f1f4ff] hover:bg-[#1c265c] rounded-full w-10 h-10 flex items-center justify-center transition-colors font-bold text-xl border border-transparent hover:border-[#8999e2]/30"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <QuickTaskDetails 
              :task="selectedTask" 
              :currentUser="currentUser" 
              :users="usersList"
              @taskUpdated="onTaskUpdated" 
              @editTask="openEditModal"
              @deleteTask="confirmDeleteTask"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- نافذة تعديل مهمة سريعة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEditModal && taskToEdit" class="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md" @click.self="showEditModal = false">
          <div class="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] border border-[#8999e2]/20 bg-[#10163a]">
            <EditQuickTask 
              :task="taskToEdit"
              :users="usersList" 
              @taskUpdated="onTaskEdited" 
              @cancel="showEditModal = false" 
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- مودال تنبيهات الواتساب التفاعلية -->
    <WhatsAppNotificationModal 
      v-model:is-open="showWaModal"
      :event="waModalEvent"
      :task="waModalTask"
      :users="usersList"
    />

    <!-- مودال تشفيت ساعات المهمة السريعة -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showShiftModal && shiftTask" class="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md" @click.self="showShiftModal = false">
          <div class="relative w-full max-w-md rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] border border-[#8999e2]/20 bg-[#10163a] p-6 text-[#f1f4ff]">
            <button type="button" @click="showShiftModal = false" class="absolute top-5 left-5 text-[#8390be] hover:text-[#fff] text-xl font-bold">×</button>
            
            <div class="flex items-center gap-3 mb-4">
              <span class="text-2xl p-2 rounded-xl bg-[#7de8dc]/15 border border-[#7de8dc]/30">⏱️</span>
              <div>
                <h3 class="text-lg font-black text-white">تشفيت ساعات المهمة</h3>
                <p class="text-xs text-[#8390be]">نقل جزء من ساعات المهمة السريعة ليوم عمل آخر</p>
              </div>
            </div>

            <div class="bg-[#0a102f]/80 p-3.5 rounded-xl border border-[#8999e2]/15 mb-4 text-xs">
              <span class="text-[#7de8dc] font-bold block mb-1">المهمة: {{ shiftTask.title }}</span>
              <span class="text-[#8390be]">إجمالي الساعات: <strong>{{ shiftTask.estimated_hours || 1 }}</strong> ساعة</span>
            </div>

            <form @submit.prevent="submitShiftQuickTask" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-[#8390be] mb-1.5">عدد الساعات المراد تشفيتها: <span class="text-[#7de8dc] font-black">{{ shiftForm.hours }} س</span></label>
                <input type="number" step="0.5" min="0.5" :max="shiftTask.estimated_hours || 1" v-model.number="shiftForm.hours" required class="w-full bg-[#0a102f]/90 text-white p-2.5 rounded-xl border border-[#8999e2]/25 text-center font-bold text-sm outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-[#8390be] mb-1.5">تاريخ التشفيت إليه:</label>
                <input type="date" v-model="shiftForm.to_date" required class="w-full bg-[#0a102f]/90 text-white p-2.5 rounded-xl border border-[#8999e2]/25 text-sm outline-none">
              </div>

              <div>
                <label class="block text-xs font-bold text-[#8390be] mb-1.5">سبب التشفيت (اختياري):</label>
                <input type="text" v-model="shiftForm.reason" placeholder="سبب التشفيت..." class="w-full bg-[#0a102f]/90 text-white p-2.5 rounded-xl border border-[#8999e2]/25 text-sm outline-none">
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button type="button" class="px-4 py-2 text-xs rounded-xl border border-[#8999e2]/20 text-[#8390be]" @click="showShiftModal = false">إلغاء</button>
                <button type="submit" class="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-[#7de8dc] to-[#10b981] text-[#080d26] font-extrabold" :disabled="isShifting">
                  {{ isShifting ? 'جارٍ التشفيت...' : 'تأكيد التشفيت ⏱️' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/axios';
import alertService from '@/services/alertService';
import CreateQuickTask from '@/components/CreateQuickTask.vue';
import EditQuickTask from '@/components/EditQuickTask.vue';
import QuickTaskDetails from '@/views/QuickTaskDetails.vue';
import WhatsAppNotificationModal from '@/components/WhatsAppNotificationModal.vue';
import AudioVoicePlayer from '@/components/AudioVoicePlayer.vue';
import { getWhatsAppPayload } from '@/utils/quickTaskWhatsApp';
import { useNotificationTemplates } from '@/composables/useNotificationTemplates';

const { fetchTemplates: fetchNotificationTemplates } = useNotificationTemplates();

const props = defineProps({
  users: { type: Array, default: () => [] },
  isAdminOrManager: { type: Boolean, default: true }
});

const emit = defineEmits(['openCreateModal', 'viewTimeline', 'taskCreated', 'taskUpdated', 'taskDeleted']);

const route = useRoute();
const tasks = ref([]);
const isLoading = ref(true);
const internalUsers = ref([]);
const currentUser = ref(JSON.parse(localStorage.getItem('user') || '{}'));

const isManagerUser = computed(() => {
  const role = localStorage.getItem('role') || currentUser.value?.role;
  const roleStr = typeof role === 'object' && role?.value ? role.value : String(role || '');
  return roleStr.toLowerCase() === 'manager' || roleStr.toLowerCase() === 'admin';
});

const canModifyTask = (task) => {
  if (!task) return false;
  // فقط المدير العام أو الآدمن يملك صلاحية تعديل وحذف المهام (الموظف لا يرى أزرار التعديل والحذف إطلاقاً)
  if (!isManagerUser.value) {
    return false;
  }
  // إذا كان المدير نفسه هو المُكلَّف بتنفيذ هذه المهمة، لا يعدل ولا يحذف
  const currentUserId = Number(currentUser.value?.id || localStorage.getItem('user_id'));
  const taskAssigneeId = Number(task.assigned_to || task.assignee_id || task.assignee?.id);
  if (currentUserId && taskAssigneeId && currentUserId === taskAssigneeId) {
    return false;
  }
  return true;
};

const usersList = computed(() => (props.users && props.users.length > 0) ? props.users : internalUsers.value);

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const showEditModal = ref(false);
const taskToEdit = ref(null);
const selectedTask = ref(null);

// حالة مودال تشفيت الساعات
const showShiftModal = ref(false);
const isShifting = ref(false);
const shiftTask = ref(null);
const shiftForm = ref({
  hours: 1,
  to_date: '',
  reason: ''
});

const openShiftQuickTask = (task) => {
  if (task.status === 'completed') {
    alertService.warning('لا يمكن تشفيت مهمة مكتملة بالفعل.');
    return;
  }
  shiftTask.value = task;
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrowStr = d.toISOString().split('T')[0];
  shiftForm.value = {
    hours: task.estimated_hours || 1,
    to_date: tomorrowStr,
    reason: ''
  };
  showShiftModal.value = true;
};

const submitShiftQuickTask = async () => {
  if (!shiftTask.value) return;
  const task = shiftTask.value;
  const assigneeId = task.assigned_to || task.assignee_id || task.assignee?.id;
  if (!assigneeId) {
    alertService.error('لا يمكن التشفيت لمهمة غير مسندة لموظف محدد.');
    return;
  }

  isShifting.value = true;
  try {
    const fromDate = task.deadline ? task.deadline.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0];
    const res = await api.post('/workload/shift-hours', {
      user_id: assigneeId,
      task_type: 'quick_task',
      task_id: task.id,
      hours: Number(shiftForm.value.hours),
      from_date: fromDate,
      to_date: shiftForm.value.to_date,
      reason: shiftForm.value.reason || 'تشفيت يدوي من لوحة المهام السريعة'
    });

    if (res.data.status) {
      alertService.success(res.data.message || 'تم تشفيت الساعات بنجاح! ⏱️');
      showShiftModal.value = false;
      fetchTasks();
    }
  } catch (err) {
    console.error('Error shifting quick task hours:', err);
    alertService.error(err.response?.data?.message || 'حدث خطأ أثناء تشفيت الساعات.');
  } finally {
    isShifting.value = false;
  }
};

// حالة مودال الواتساب
const showWaModal = ref(false);
const waModalEvent = ref('created');
const waModalTask = ref(null);

const triggerWhatsApp = (event, task) => {
  if (!task) return;
  const p = getWhatsAppPayload(event, task);
  if (p?.disabled) {
    return; // القالب معطل من الإدارة
  }
  waModalTask.value = task;
  waModalEvent.value = event;
  showWaModal.value = true;
};

const openCreateModal = () => {
  if (!isManagerUser.value) return;
  showCreateModal.value = true;
  emit('openCreateModal');
};

const openEditModal = (task) => {
  taskToEdit.value = task;
  showEditModal.value = true;
};

const onTaskEdited = (updatedTask) => {
  showEditModal.value = false;
  taskToEdit.value = null;
  if (updatedTask) {
    const idx = tasks.value.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) {
      tasks.value[idx] = updatedTask;
    }
    if (selectedTask.value && selectedTask.value.id === updatedTask.id) {
      Object.assign(selectedTask.value, updatedTask);
    }
  } else {
    fetchTasks();
  }
  emit('taskUpdated', updatedTask);
};

const confirmDeleteTask = async (task) => {
  if (!task) return;
  const isConfirmed = await alertService.confirm({
    title: 'تأكيد حذف المهمة السريعة',
    message: `هل أنت متأكد من رغبتك في حذف مهمة "${task.title || 'توجيه سريع'}"؟ سيتم حذف جميع التسجيلات الصوتية والملاحظات نهائياً ولا يمكن التراجع.`,
    confirmText: 'نعم، احذف المهمة',
    cancelText: 'إلغاء',
    type: 'danger'
  });

  if (!isConfirmed) return;

  try {
    const deletedId = task.id;
    await api.delete(`/quick-tasks/${deletedId}`);
    tasks.value = tasks.value.filter(t => t.id !== deletedId);
    if (selectedTask.value && selectedTask.value.id === deletedId) {
      closeDetailsModal();
    }
    emit('taskDeleted', deletedId);
    alertService.success('تم حذف المهمة بنجاح 🗑️');
  } catch (error) {
    console.error('Error deleting task:', error);
    alertService.error(error.response?.data?.message || 'تعذر حذف المهمة.');
  }
};

const openTaskDetails = (task) => {
  selectedTask.value = task;
  showDetailsModal.value = true;
  emit('viewTimeline', task);
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedTask.value = null;
};

const onTaskCreated = (newTask) => {
  showCreateModal.value = false;
  if (newTask) {
    tasks.value.unshift(newTask);
    triggerWhatsApp('created', newTask);
  } else {
    fetchTasks();
  }
  emit('taskCreated', newTask);
};

const onTaskUpdated = (updatedTask) => {
  if (updatedTask && selectedTask.value) {
    Object.assign(selectedTask.value, updatedTask);
    const idx = tasks.value.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) tasks.value[idx] = updatedTask;
  } else {
    fetchTasks();
  }
  emit('taskUpdated', updatedTask);
};

// الفلاتر
const filters = ref({
  search: '',
  status: '',
  assignee: ''
});

const clearFilters = () => {
  filters.value.search = '';
  filters.value.status = '';
  filters.value.assignee = '';
};

// الإحصائيات
const activeTasksCount = computed(() => {
  return tasks.value.filter(t => t.status === 'in_progress' || t.status === 'pending' || t.status === 'under_review').length;
});

const completedTasksCount = computed(() => {
  return tasks.value.filter(t => t.status === 'completed').length;
});

// متغير الوقت المركزي للعداد
const currentTime = ref(new Date().getTime());
let timerInterval = null;

// جلب البيانات من الباك إند
const fetchTasks = async () => {
  isLoading.value = true;
  try {
    const response = await api.get('/quick-tasks');
    const payload = response.data?.data;
    if (Array.isArray(payload)) {
      tasks.value = payload;
    } else if (payload && Array.isArray(payload.data)) {
      tasks.value = payload.data;
    } else if (Array.isArray(response.data)) {
      tasks.value = response.data;
    } else {
      tasks.value = [];
    }
  } catch (error) {
    console.warn('Could not fetch quick tasks from backend:', error);
    tasks.value = [];
  } finally {
    isLoading.value = false;
    checkUrlForTask();
  }
};

const checkUrlForTask = () => {
  const targetId = Number(route.query?.task_id);
  if (targetId && tasks.value.length > 0) {
    const task = tasks.value.find(t => t.id === targetId);
    if (task) {
      openTaskDetails(task);
    }
  }
};

watch(
  () => route.query?.task_id,
  () => {
    checkUrlForTask();
  }
);

const fetchUsers = async () => {
  try {
    const res = await api.get('/users?per_page=100');
    internalUsers.value = res.data?.data || res.data || [];
  } catch (e) {
    console.error('Error fetching users:', e);
  }
};

// الفلترة في الفرونت إند
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    const matchStatus = filters.value.status ? task.status === filters.value.status : true;
    const matchAssignee = filters.value.assignee ? task.assigned_to === filters.value.assignee : true;
    const searchLower = filters.value.search ? filters.value.search.trim().toLowerCase() : '';
    const matchSearch = searchLower
      ? ((task.title && task.title.toLowerCase().includes(searchLower)) ||
         (task.description && task.description.toLowerCase().includes(searchLower)) ||
         (task.assignee_name && task.assignee_name.toLowerCase().includes(searchLower)))
      : true;
    return matchStatus && matchAssignee && matchSearch;
  });
});

// دالة العداد التنازلي
const getCountdown = (dueDate) => {
  if (!dueDate) return { text: 'غير محدد', colorClass: 'text-[#6e79a9]' };

  const due = new Date(dueDate).getTime();
  const diff = due - currentTime.value;

  if (diff < 0) return { text: 'متأخر', colorClass: 'text-[#ff4757] font-extrabold' };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let text = '';
  if (days > 0) text += `${days} يوم `;
  if (hours > 0) text += `${hours} ساعة `;
  if (days === 0 && minutes > 0) text += `${minutes} دقيقة`;
  if (text === '') text = 'أقل من دقيقة';

  let colorClass = 'text-[#7de8dc]';
  if (days === 0) colorClass = 'text-[#ffc107]';

  return { text: text.trim(), colorClass };
};

// دالة مظهر شارة الموعد النهائي (بتنسيق عصري راقٍ)
const getCountdownBadgeStyle = (dueDate) => {
  if (!dueDate) {
    return 'border-slate-800 text-slate-500 bg-slate-900/60';
  }
  const due = new Date(dueDate).getTime();
  const diff = due - currentTime.value;
  if (diff < 0) {
    return 'border-rose-500/30 text-rose-400 bg-rose-500/10 font-bold animate-pulse';
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return 'border-amber-500/30 text-amber-400 bg-amber-500/10 font-bold';
  }
  return 'border-slate-700/60 text-slate-300 bg-slate-800/70 font-medium';
};

// دالة ألوان وحالات المهمة (بتنسيق تنفيذي عالمي فائق الاحترافية)
const getStatusColor = (status) => {
  const map = {
    pending: { 
      text: 'قيد الانتظار', 
      badge: 'bg-slate-800/90 text-slate-300 border-slate-700/70', 
      dot: 'bg-slate-400', 
      accentBar: 'bg-slate-500/60',
      glow: 'bg-slate-500/5'
    },
    in_progress: { 
      text: 'جاري التنفيذ', 
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/25', 
      dot: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)] animate-pulse', 
      accentBar: 'bg-sky-500',
      glow: 'bg-sky-500/10'
    },
    under_review: { 
      text: 'قيد المراجعة', 
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25', 
      dot: 'bg-amber-400', 
      accentBar: 'bg-amber-500',
      glow: 'bg-amber-500/10'
    },
    rejected: { 
      text: 'مرفوضة', 
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25', 
      dot: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]', 
      accentBar: 'bg-rose-500',
      glow: 'bg-rose-500/10'
    },
    completed: { 
      text: 'مكتملة', 
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', 
      dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]', 
      accentBar: 'bg-emerald-500',
      glow: 'bg-emerald-500/10'
    },
  };
  return map[status] || map.pending;
};

const getInitials = (name) => {
  if (!name) return 'م';
  return name.substring(0, 2);
};

onMounted(() => {
  fetchNotificationTemplates(true);
  fetchTasks();
  fetchUsers();
  timerInterval = setInterval(() => {
    currentTime.value = new Date().getTime();
  }, 60000);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.quick-tasks-page {
  min-height: 100%;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif;
}

.page-intro {
  min-width: 0;
}

.page-topline {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

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
  margin: 0;
  color: #9aa4cf;
  font-size: 14px;
  line-height: 1.7;
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
  flex: 0 0 auto;
  border: 0;
  color: #12183f;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  box-shadow: 0 9px 22px rgba(111,222,211,.13);
}

.primary-btn span {
  font-size: 20px;
  line-height: 0;
}

.primary-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 18px;
}

.stat-card {
  min-width: 0;
  min-height: 108px;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(137,153,226,.13);
  border-radius: 16px;
  background: rgba(21,29,73,.65);
}

.stat-card::after {
  content: '';
  position: absolute;
  width: 100px;
  height: 100px;
  left: -55px;
  bottom: -65px;
  border-radius: 50%;
  background: #72e6da;
  opacity: .08;
  filter: blur(10px);
}

.stat-content {
  min-width: 0;
}

.stat-card span {
  display: block;
  color: #929dc8;
  font-size: 13px;
  line-height: 1.5;
}

.stat-card strong {
  display: block;
  margin-top: 3px;
  color: #f3f4ff;
  font-size: 27px;
  line-height: 1.2;
}

.stat-card small {
  margin-right: auto;
  align-self: flex-end;
  color: #7e8ab9;
  font-size: 11px;
  white-space: nowrap;
}

.stat-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
}

.teal {
  color: #7de8dc;
  background: rgba(93,222,209,.12);
}

.purple {
  color: #c994ff;
  background: rgba(180,112,255,.12);
}

.orange {
  color: #ffc480;
  background: rgba(255,186,86,.12);
}

.tasks-card {
  overflow: hidden;
  border: 1px solid rgba(137,153,226,.13);
  border-radius: 18px;
  background: rgba(15,22,61,.65);
  box-shadow: 0 18px 45px rgba(2,6,25,.12);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 18px;
}

.card-heading h3 {
  margin: 0;
  color: #f0f2ff;
  font-size: 19px;
  line-height: 1.4;
}

.card-heading h3 span {
  display: inline-block;
  margin-right: 7px;
  padding: 3px 8px;
  border-radius: 7px;
  color: #7de8dc;
  background: rgba(89,220,207,.11);
  font-size: 12px;
  vertical-align: middle;
}

.card-heading p {
  margin: 5px 0 0;
  color: #8691bf;
  font-size: 13px;
  line-height: 1.6;
}

.live-state {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  color: #8995c2;
  font-size: 12px;
  white-space: nowrap;
}

.live-state i {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #6fe2d7;
  box-shadow: 0 0 8px #6fe2d7;
}

.filters-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  padding: 0 24px 20px;
}

.filters-section.two-cols {
  grid-template-columns: 2fr 1fr;
}

.search-wrap {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 13px;
  border: 1px solid rgba(138,152,222,.18);
  border-radius: 10px;
  background: rgba(7,13,42,.44);
}

.search-wrap svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin-left: 9px;
  fill: none;
  stroke: #7f8bb8;
  stroke-width: 1.7;
  stroke-linecap: round;
}

.search-wrap input,
.filters-section select {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #dfe3fa;
  background: transparent;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.filters-section select {
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid rgba(138,152,222,.18);
  border-radius: 10px;
  background-color: rgba(7,13,42,.44);
}

.filters-section option {
  color: #e7e9ff;
  background: #161c4d;
}

.tasks-body {
  border-top: 1px solid rgba(138,152,222,.09);
  padding: 24px;
}

.tasks-loading {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #8e99c3;
  font-size: 14px;
}

.tasks-loading .spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(125,232,220,.2);
  border-top-color: #7de8dc;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.tasks-empty-state {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-icon-box {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: rgba(137,153,226,.08);
  border: 1px solid rgba(137,153,226,.15);
  display: grid;
  place-items: center;
  color: #7f8bb8;
  margin-bottom: 16px;
}

.tasks-empty-state h3 {
  margin: 0;
  color: #f1f4ff;
  font-size: 18px;
  font-weight: 700;
}

.tasks-empty-state p {
  margin: 6px 0 16px;
  color: #8390be;
  font-size: 14px;
}

.clear-filter-btn {
  background: transparent;
  color: #7de8dc;
  font-weight: 700;
  font-size: 13px;
  border: 1px solid rgba(125,232,220,.3);
  padding: 8px 18px;
  border-radius: 9px;
  cursor: pointer;
  transition: all .2s ease;
}

.clear-filter-btn:hover {
  background: rgba(125,232,220,.1);
  border-color: #7de8dc;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 980px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat-card:last-child { grid-column: 1 / -1; }
  .filters-section { grid-template-columns: 1.5fr 1fr 1fr; }
  .filters-section.two-cols { grid-template-columns: 1.5fr 1fr; }
}

@media (max-width: 720px) {
  .page-topline { align-items: stretch; flex-direction: column; gap: 18px; }
  .page-topline h2 { font-size: clamp(25px, 8vw, 30px); }
  .page-topline p { font-size: 14px; }
  .primary-btn { width: 100%; }
  .stats-grid { grid-template-columns: 1fr; }
  .stat-card:last-child { grid-column: auto; }
  .stat-card { min-height: 92px; }
  .card-heading { align-items: flex-start; flex-direction: column; padding: 20px 18px 17px; }
  .live-state { align-self: flex-start; }
  .filters-section { grid-template-columns: 1fr; padding: 0 15px 19px; }
  .filters-section.two-cols { grid-template-columns: 1fr; }
  .tasks-body { padding: 16px; }
}

.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

/* أنيميشن دخول وخروج الكروت */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.task-list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
.task-list-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}
.task-list-leave-active {
  position: absolute;
}

/* Modal Fade Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.92) translateY(15px);
}

/* تنسيقات كروت المهام التنفيذية العصرية الراقية (Linear / Stripe SaaS Style) */
.executive-task-card {
  background: linear-gradient(180deg, rgba(16, 23, 50, 0.78) 0%, rgba(10, 15, 36, 0.94) 100%);
  border-color: rgba(137, 153, 226, 0.14);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.35);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, box-shadow, border-color;
}

.executive-task-card:hover {
  border-color: rgba(125, 232, 220, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.55), 0 0 18px rgba(125, 232, 220, 0.08);
}

.card-ambient-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.executive-task-card:hover .card-ambient-glow {
  opacity: 1;
}

:deep(.task-card-player) {
  padding: 6px 10px !important;
  border-radius: 12px !important;
  background: rgba(8, 12, 32, 0.6) !important;
  border: 1px solid rgba(137, 153, 226, 0.12) !important;
}

:deep(.task-card-player:hover) {
  border-color: rgba(125, 232, 220, 0.3) !important;
}

:deep(.task-card-player .player-play-btn) {
  width: 30px !important;
  height: 30px !important;
  border-radius: 9px !important;
}

:deep(.task-card-player .player-waveform-track) {
  height: 18px !important;
}

:deep(.task-card-player .player-time) {
  font-size: 11px !important;
}
</style>