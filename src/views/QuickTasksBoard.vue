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
              class="executive-task-card group relative flex flex-col justify-between rounded-[1.75rem] p-5 sm:p-5.5 bg-gradient-to-b from-[#141d4f]/85 via-[#0e153f]/90 to-[#080d2a]/95 backdrop-blur-2xl border border-[#8999e2]/18 hover:border-[#7de8dc]/55 shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_35px_rgba(125,232,220,0.18)] transition-all duration-300 overflow-hidden hover:-translate-y-1.5 cursor-pointer select-none"
              @click="openTaskDetails(task)"
            >
              <!-- هالة التوهج المحيطي التفاعلية -->
              <div 
                class="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" 
                :class="getStatusColor(task.status).glowBg || 'bg-[#7de8dc]'"
              ></div>

              <!-- شريط نيون علوي فاخر يتبع حالة المهمة -->
              <div 
                class="absolute top-0 inset-x-0 h-[3px] transition-all duration-300 opacity-90 group-hover:opacity-100" 
                :class="getStatusColor(task.status).border"
              ></div>

              <!-- 1. شريط الرأس: الحالة ورقم المهمة + أدوات الإدارة + العداد التنازلي -->
              <div class="relative flex items-center justify-between gap-2 mb-3.5 z-10">
                <!-- شارة الحالة ورقم المهمة -->
                <div class="flex items-center gap-2 min-w-0">
                  <span 
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all shadow-sm backdrop-blur-md shrink-0" 
                    :class="getStatusColor(task.status).badge"
                  >
                    <span class="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse" :class="getStatusColor(task.status).dot"></span>
                    {{ getStatusColor(task.status).text }}
                  </span>

                  <span class="text-[11px] font-mono font-bold text-[#6a7aa8] group-hover:text-[#91a3db] transition-colors">
                    #{{ task.id }}
                  </span>
                </div>

                <!-- أدوات المدير والعداد التنازلي -->
                <div class="flex items-center gap-2 shrink-0">
                  <!-- أزرار الإجراءات السريعة للمدير (تظهر بسلاسة عند التمرير) -->
                  <div 
                    v-if="canModifyTask(task)" 
                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200" 
                    @click.stop
                  >
                    <button 
                      type="button" 
                      :disabled="task.status === 'completed'"
                      :class="[
                        'w-7 h-7 rounded-xl border flex items-center justify-center transition-all shadow-sm',
                        task.status === 'completed'
                          ? 'opacity-30 cursor-not-allowed bg-[#18235a]/40 border-gray-700/50 text-gray-500'
                          : 'bg-[#18235a]/90 hover:bg-[#7de8dc]/20 text-[#8ea0dc] hover:text-[#7de8dc] border-[#8999e2]/25 cursor-pointer hover:scale-105'
                      ]"
                      @click.stop="task.status !== 'completed' && openShiftQuickTask(task)" 
                      :title="task.status === 'completed' ? 'لا يمكن تشفيت مهمة مكتملة بالفعل' : 'تشفيت ساعات من هذه المهمة'"
                    >
                      ⏱️
                    </button>
                    <button 
                      v-permission="'quick_tasks.edit'"
                      type="button" 
                      @click.stop="openEditModal(task)" 
                      class="w-7 h-7 rounded-xl bg-[#18235a]/90 hover:bg-[#7de8dc]/20 text-[#8ea0dc] hover:text-[#7de8dc] border border-[#8999e2]/25 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      title="تعديل المهمة"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button 
                      v-permission="'quick_tasks.delete'"
                      type="button" 
                      @click.stop="confirmDeleteTask(task)" 
                      class="w-7 h-7 rounded-xl bg-[#18235a]/90 hover:bg-[#ff4757]/20 text-[#8ea0dc] hover:text-[#ff4757] border border-[#8999e2]/25 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                      title="حذف المهمة"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>

                  <!-- شارة الوقت والعداد التنازلي الفاخرة -->
                  <div 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border transition-all backdrop-blur-md shadow-xs shrink-0"
                    :class="getCountdownBadgeStyle(task.deadline)"
                    :title="`الموعد النهائي: ${task.deadline || 'غير محدد'}`"
                  >
                    <svg class="w-3.5 h-3.5 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>{{ getCountdown(task.deadline).text }}</span>
                  </div>
                </div>
              </div>

              <!-- 2. جسم الكارت: العنوان والوصف والوسائط -->
              <div class="relative flex-1 flex flex-col justify-start mb-3.5 z-10">
                <!-- العنوان الرئيسي -->
                <h4 
                  class="text-[16px] sm:text-[17px] font-black text-[#f4f7ff] group-hover:text-[#7de8dc] transition-colors leading-snug mb-1.5 line-clamp-1 tracking-tight" 
                  :title="task.title"
                >
                  {{ task.title || 'توجيه سريع' }}
                </h4>

                <!-- الوصف التوضيحي -->
                <p 
                  v-if="task.description" 
                  class="text-xs sm:text-[13px] text-[#8e9ecb] line-clamp-2 leading-relaxed mb-3 font-medium" 
                  :title="task.description"
                >
                  {{ task.description }}
                </p>

                <!-- مشغل الصوت الفاخر والموجات التفاعلية -->
                <div v-if="task.voice_record_url" class="my-2" @click.stop>
                  <AudioVoicePlayer 
                    :src="task.voice_record_url" 
                    variant="card" 
                    theme="teal" 
                    class="task-card-player"
                  />
                </div>

                <!-- شارات المرفقات والمناقشات -->
                <div v-if="task.attachment_url || (task.feedback_logs && task.feedback_logs.length > 0)" class="flex flex-wrap items-center gap-2 mt-auto pt-1">
                  <!-- شارة الملف المرفق -->
                  <a 
                    v-if="task.attachment_url" 
                    :href="task.attachment_url" 
                    target="_blank" 
                    @click.stop 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#151f54]/90 hover:bg-[#7de8dc]/20 text-[#a0b2ea] hover:text-[#7de8dc] border border-[#8999e2]/20 hover:border-[#7de8dc]/40 text-xs font-bold transition-all shadow-xs"
                    :title="`مرفق: ${task.attachment_name || 'ملف مرفق'}`"
                  >
                    <svg class="w-3.5 h-3.5 text-[#7de8dc] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                    <span class="truncate max-w-[120px]">{{ task.attachment_name || 'مرفق' }}</span>
                  </a>

                  <!-- شارة الساعات التقديرية -->
                  <span 
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-[#0e173d] text-[#7de8dc] border border-[#7de8dc]/25 text-[11px] font-bold shadow-xs"
                    :title="`الساعات المقدرة: ${task.estimated_hours || 1} ساعة`"
                  >
                    ⏱️ {{ task.estimated_hours || 1 }}س
                  </span>

                  <!-- شارة عدد الردود والمراجعات -->
                  <span 
                    v-if="task.feedback_logs && task.feedback_logs.length > 0" 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1c184c]/90 text-[#c89eff] border border-[#b28aff]/25 text-xs font-bold shadow-xs"
                    :title="`${task.feedback_logs.length} مراجعات وردود`"
                  >
                    <svg class="w-3.5 h-3.5 text-[#b28aff] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <span>{{ task.feedback_logs.length }} ردود</span>
                  </span>
                </div>
              </div>

              <!-- 3. فوتر الكارت: هوية الموظف المنفذ + زر فتح المهمة -->
              <div class="relative pt-3 border-t border-[#8999e2]/15 flex items-center justify-between gap-3 z-10 mt-auto">
                <!-- المنفذ: صورة بحلقة نيون + الاسم وتسمية وظيفية مصغرة -->
                <div class="flex items-center gap-2.5 min-w-0" :title="`المُكلَّف: ${task.assignee_name || 'غير محدد'}`">
                  <div class="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1b2763] to-[#0c143d] border border-[#7de8dc]/40 flex items-center justify-center text-xs font-black text-[#7de8dc] shadow-[0_0_12px_rgba(125,232,220,0.18)] group-hover:scale-105 transition-transform shrink-0">
                    {{ getInitials(task.assignee_name) }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[11px] text-[#7180b5] font-semibold leading-none mb-1">المُكلّف بالعمل</span>
                    <span class="text-[13px] font-extrabold text-[#edf1ff] truncate group-hover:text-white transition-colors leading-none">
                      {{ task.assignee_name || 'غير محدد' }}
                    </span>
                  </div>
                </div>

                <!-- زر فتح تفاصيل المهمة التفاعلي -->
                <div class="w-8 h-8 rounded-xl bg-[#141d4c]/90 text-[#8ea0dc] flex items-center justify-center border border-[#8999e2]/25 group-hover:bg-[#7de8dc] group-hover:text-[#0b1131] group-hover:border-[#7de8dc] group-hover:shadow-[0_0_16px_rgba(125,232,220,0.45)] transition-all duration-300 shrink-0">
                  <svg class="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
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

// دالة مظهر شارة الموعد النهائي الفاخرة
const getCountdownBadgeStyle = (dueDate) => {
  if (!dueDate) {
    return 'border-[#8999e2]/20 text-[#8391c4] bg-[#0c133a]/80';
  }
  const due = new Date(dueDate).getTime();
  const diff = due - currentTime.value;
  if (diff < 0) {
    return 'border-[#ff4757]/45 text-[#ff4757] bg-[#ff4757]/15 shadow-[0_0_12px_rgba(255,71,87,0.25)] animate-pulse';
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return 'border-[#ffc107]/45 text-[#ffc107] bg-[#ffc107]/15 shadow-[0_0_12px_rgba(255,193,7,0.2)]';
  }
  return 'border-[#7de8dc]/30 text-[#7de8dc] bg-[#7de8dc]/10 shadow-[0_0_12px_rgba(125,232,220,0.15)]';
};

// دالة ألوان وحالات المهمة (بألوان النيون والزجاج الفاخرة)
const getStatusColor = (status) => {
  const map = {
    pending: { 
      text: 'قيد الانتظار', 
      badge: 'bg-[#151c4a]/90 text-[#96a4d8] border-[#8999e2]/30 shadow-[0_0_10px_rgba(137,153,226,0.15)]', 
      dot: 'bg-[#96a4d8]', 
      border: 'bg-gradient-to-r from-[#96a4d8] to-[#5a6796]', 
      glowBg: 'bg-[#8999e2]' 
    },
    in_progress: { 
      text: 'جاري التنفيذ', 
      badge: 'bg-[#0f245c]/90 text-[#60a5fa] border-[#3b82f6]/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]', 
      dot: 'bg-[#60a5fa]', 
      border: 'bg-gradient-to-r from-[#38bdf8] via-[#3b82f6] to-[#6366f1]', 
      glowBg: 'bg-[#3b82f6]' 
    },
    under_review: { 
      text: 'قيد المراجعة', 
      badge: 'bg-[#211554]/90 text-[#c084fc] border-[#a855f7]/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]', 
      dot: 'bg-[#c084fc]', 
      border: 'bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#ec4899]', 
      glowBg: 'bg-[#a855f7]' 
    },
    rejected: { 
      text: 'مرفوضة', 
      badge: 'bg-[#3b1226]/90 text-[#fb7185] border-[#f43f5e]/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]', 
      dot: 'bg-[#fb7185]', 
      border: 'bg-gradient-to-r from-[#f43f5e] via-[#e11d48] to-[#ea580c]', 
      glowBg: 'bg-[#f43f5e]' 
    },
    completed: { 
      text: 'مكتملة', 
      badge: 'bg-[#092d3b]/90 text-[#2dd4bf] border-[#14b8a6]/40 shadow-[0_0_12px_rgba(20,184,166,0.25)]', 
      dot: 'bg-[#2dd4bf]', 
      border: 'bg-gradient-to-r from-[#2dd4bf] via-[#10b981] to-[#059669]', 
      glowBg: 'bg-[#2dd4bf]' 
    },
  };
  return map[status] || map.pending;
};

const getInitials = (name) => {
  if (!name) return 'م';
  return name.substring(0, 2);
};

onMounted(() => {
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

/* تنسيقات كروت المهام التنفيذية الفاخرة */
.executive-task-card {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, box-shadow;
}

:deep(.task-card-player) {
  padding: 8px 12px !important;
  border-radius: 16px !important;
  background: rgba(10, 16, 48, 0.75) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(137, 153, 226, 0.16) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25) !important;
}

:deep(.task-card-player:hover) {
  border-color: rgba(125, 232, 220, 0.4) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35) !important;
}

:deep(.task-card-player .player-play-btn) {
  width: 34px !important;
  height: 34px !important;
  border-radius: 11px !important;
}

:deep(.task-card-player .player-waveform-track) {
  height: 20px !important;
}

:deep(.task-card-player .player-time) {
  font-size: 11px !important;
}
</style>