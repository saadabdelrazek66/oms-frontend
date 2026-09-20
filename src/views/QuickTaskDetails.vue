<template>
  <div class="quick-task-details" dir="rtl">
    <!-- القسم الأيمن: تفاصيل المهمة الأساسية -->
    <div class="main-column">
      <!-- الهيدر والحالة -->
      <div class="task-details-header">
        <div class="header-topline">
          <span class="eyebrow">مساحة المهام / تفاصيل التوجيه</span>
          <div class="flex items-center gap-2">
            <!-- أزرار الإجراءات للمدير أو منشئ المهمة -->
            <div v-if="canModify" class="flex items-center gap-1.5 ml-2">
              <button 
                type="button" 
                @click="$emit('editTask', task)" 
                class="action-header-btn edit"
                title="تعديل المهمة"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>تعديل</span>
              </button>
              <button 
                type="button" 
                @click="$emit('deleteTask', task)" 
                class="action-header-btn delete"
                title="حذف المهمة"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>حذف</span>
              </button>
            </div>

            <span class="status-badge" :class="task.status">
              <i class="status-dot"></i>
              {{ getStatusText(task.status) }}
            </span>
          </div>
        </div>
        
        <h2 class="task-title">{{ task.title || 'توجيه سريع بدون عنوان' }}</h2>
        
        <!-- بطاقات أطراف المهمة والموعد -->
        <div class="meta-strip">
          <div class="meta-item">
            <div class="meta-avatar creator">{{ getInitials(task.creator_name) }}</div>
            <div class="meta-info">
              <span class="meta-label">بواسطة</span>
              <strong class="meta-value">{{ task.creator_name || 'غير محدد' }}</strong>
            </div>
          </div>

          <div class="meta-divider"></div>

          <div class="meta-item">
            <div class="meta-avatar assignee">{{ getInitials(task.assignee_name) }}</div>
            <div class="meta-info">
              <span class="meta-label">المُكلَّف بالتنفيذ</span>
              <strong class="meta-value">{{ task.assignee_name || 'غير محدد' }}</strong>
            </div>
          </div>

          <div v-if="task.deadline" class="meta-divider"></div>

          <div v-if="task.deadline" class="meta-item deadline-item">
            <div class="meta-icon deadline">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="meta-info">
              <span class="meta-label">الموعد النهائي</span>
              <strong class="meta-value deadline-val">{{ formatDeadline(task.deadline) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- التفاصيل النصية للمهمة -->
      <div v-if="task.description" class="section-card text-details-card">
        <div class="section-header">
          <div class="section-icon teal">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h4>التفاصيل والتعليمات</h4>
        </div>
        <p class="task-description-text">{{ task.description }}</p>
      </div>

      <!-- التوجيه الصوتي الأساسي -->
      <div v-if="task.voice_record_url" class="section-card voice-details-card">
        <div class="section-header">
          <div class="section-icon purple">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
          <div class="section-header-text">
            <h4>التوجيه الصوتي الأساسي</h4>
            <small>استمع إلى التسجيل الصوتي المرفق من صاحب المهمة</small>
          </div>
        </div>
        <div class="audio-wrap">
          <audio :src="task.voice_record_url" controls class="custom-audio-player"></audio>
        </div>
      </div>

      <!-- بطاقة إرشادية توضح آلية التفاعل في الدردشة -->
      <div class="info-guide-card">
        <div class="flex items-center gap-3">
          <div class="info-guide-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <h5 class="text-xs font-bold text-[#f1f4ff] mb-0.5">دردشة التوجيه والمتابعة المباشرة</h5>
            <p class="text-[11px] text-[#8390be] m-0 leading-relaxed">
              يمكنك متابعة كافة التحديثات، والملاحظات، والتسجيلات الصوتية، واتخاذ الإجراءات في شريط المحادثة التفاعلي على اليسار.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- القسم الأيسر: شريط زمني تفاعلي يشبه الدردشة (Interactive Timeline Chat) -->
    <div class="side-column">
      <div class="chat-timeline-wrapper">
        <!-- هيدر الدردشة -->
        <div class="chat-header">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-3">
              <div class="chat-header-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="chat-title">سجل المتابعة والمناقشة المباشرة</h3>
                <small class="chat-sub">شريط زمني تفاعلي بين المدير والموظف</small>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="chat-counter-badge">
                {{ sortedLogs.length + 1 }} رسائل
              </span>
            </div>
          </div>
        </div>

        <!-- مساحة الرسائل (Scrollable Chat Thread) -->
        <div ref="chatContainerRef" class="chat-thread-container custom-scrollbar">
          <!-- رسالة البداية: إنشاء التكليف من صاحب المهمة -->
          <div 
            class="chat-bubble-row" 
            :class="isMyMessage({ reviewer_id: task.created_by, reviewer_name: task.creator_name }) ? 'chat-me' : 'chat-other'"
          >
            <div 
              class="chat-bubble-avatar" 
              :class="isMyMessage({ reviewer_id: task.created_by, reviewer_name: task.creator_name }) ? 'me' : 'other'"
            >
              {{ getInitials(task.creator_name) }}
            </div>

            <div class="chat-bubble-card">
              <div class="chat-bubble-top">
                <div class="flex items-center gap-2 flex-wrap">
                  <strong class="chat-sender-name">{{ task.creator_name || 'صاحب التوجيه' }}</strong>
                  <span v-if="isMyMessage({ reviewer_id: task.created_by, reviewer_name: task.creator_name })" class="chat-self-badge">أنت</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#8999e2]/15 text-[#a8b5f0] border border-[#8999e2]/25">
                    إنشاء التوجيه والتكليف 🎯
                  </span>
                </div>
                <span class="chat-bubble-time">{{ formatDeadline(task.created_at) || 'البداية' }}</span>
              </div>

              <div v-if="task.description" class="chat-bubble-content">
                {{ task.description }}
              </div>

              <div v-if="task.voice_record_url" class="chat-bubble-audio-box">
                <div class="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-[#b28aff]">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  </svg>
                  <span>التوجيه الصوتي الأصلي</span>
                </div>
                <audio :src="task.voice_record_url" controls class="w-full h-8 rounded-lg outline-none"></audio>
              </div>
            </div>
          </div>

          <!-- قائمة الردود والمتابعات (Logs) -->
          <div 
            v-for="log in sortedLogs" 
            :key="log.id" 
            class="chat-bubble-row"
            :class="isMyMessage(log) ? 'chat-me' : 'chat-other'"
          >
            <div 
              class="chat-bubble-avatar" 
              :class="isMyMessage(log) ? 'me' : 'other'"
            >
              {{ getInitials(log.reviewer_name) }}
            </div>

            <div class="chat-bubble-card">
              <div class="chat-bubble-top">
                <div class="flex items-center gap-2 flex-wrap">
                  <strong class="chat-sender-name">{{ log.reviewer_name || 'مستخدم' }}</strong>
                  <span v-if="isMyMessage(log)" class="chat-self-badge">أنت</span>
                  
                  <!-- شارة الحالة بـ Tailwind -->
                  <span 
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold"
                    :class="getStatusBadgeInfo(log.status_changed_to).badgeClass"
                  >
                    {{ getStatusBadgeInfo(log.status_changed_to).label }}
                  </span>
                </div>
                <span class="chat-bubble-time">{{ formatLogTime(log) }}</span>
              </div>

              <!-- نص الملاحظة إن وجد -->
              <div v-if="log.feedback_text" class="chat-bubble-content">
                {{ log.feedback_text }}
              </div>

              <!-- التسجيل الصوتي إن وجد -->
              <div v-if="log.voice_record_url" class="chat-bubble-audio-box">
                <div 
                  class="flex items-center gap-1.5 mb-1.5 text-xs font-bold" 
                  :class="isMyMessage(log) ? 'text-[#7de8dc]' : 'text-[#b28aff]'"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  </svg>
                  <span>تسجيل صوتي مرفق</span>
                </div>
                <audio :src="log.voice_record_url" controls class="w-full h-8 rounded-lg outline-none"></audio>
              </div>
            </div>
          </div>
        </div>

        <!-- منطقة الإدخال والإجراءات الذكية (Smart Action Area) -->
        <div class="chat-action-composer">
          <!-- 1. حالة اكتمال المهمة (تظهر للجميع) -->
          <div v-if="task.status === 'completed'" class="composer-status-banner completed">
            <div class="banner-icon completed">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div>
              <strong class="block text-sm font-bold text-[#7de8dc]">تم اعتماد المهمة واكتمالها بنجاح 🎉</strong>
              <span class="text-xs text-[#8390be]">جميع الردود والملاحظات محفوظة في سجل المتابعة أعلاه.</span>
            </div>
          </div>

          <!-- 2. الموظف المنفذ: بعد تسليم المهمة وهي قيد مراجعة الإدارة (under_review) -->
          <!-- لا تظهر له أزرار اعتماد أو رفض إطلاقاً، بل رسالة انتظار واضحة -->
          <div v-else-if="isAssignee && task.status === 'under_review'" class="composer-status-banner waiting">
            <div class="banner-icon waiting">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <strong class="block text-sm font-bold text-[#ffc107]">تم تسليم المهمة وهي قيد مراجعة الإدارة حالياً ⏳</strong>
              <span class="text-xs text-[#8390be]">بانتظار قرار المدير بالاعتماد أو طلب تعديل، ستصلك الإشعارات فور المراجعة.</span>
            </div>
          </div>

          <!-- 3. صندوق الموظف المنفذ (isAssignee): تسليم للمراجعة عندما تكون المهمة بانتظار إنجازه -->
          <div v-else-if="isAssignee && ['pending', 'in_progress', 'rejected'].includes(task.status)" class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="status-live-dot pulse-teal"></span>
                <span class="text-xs font-bold text-[#7de8dc]">صندوق التسليم والمتابعة (الموظف)</span>
              </div>
              <span class="text-[11px] text-[#8390be]">أرسل تقريرك للمدير للاعتماد</span>
            </div>

            <!-- حقل النص -->
            <textarea
              v-model="messageText"
              rows="2"
              placeholder="اكتب ملاحظات ما تم إنجازه في المهمة (اختياري)..."
              class="composer-textarea"
            ></textarea>

            <!-- مشغل وتسجيل الصوت بتقنية Web Audio API -->
            <div class="recording-dock">
              <!-- أزرار البدء والرفع -->
              <div v-if="!isRecording && !feedbackAudioUrl" class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  @click="startRecording"
                  class="btn-composer-mic"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" class="text-[#ff4757]">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                  <span>تسجيل صوتي بالمايك</span>
                </button>

                <button
                  type="button"
                  @click="triggerFeedbackFileInput"
                  class="btn-composer-upload"
                  title="رفع ملف صوتي من الجهاز"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>أو رفع ملف صوت</span>
                </button>
                <input
                  type="file"
                  ref="feedbackFileInput"
                  accept="audio/*"
                  @change="handleFeedbackFileUpload"
                  class="hidden"
                />
              </div>

              <!-- شريط التسجيل النشط مع مؤشر الصوت الحقيقي وتحذير المايك الصامت -->
              <div v-else-if="isRecording" class="recording-live-bar">
                <div class="flex items-center gap-2.5">
                  <span class="recording-ping-dot"></span>
                  <span class="text-xs font-bold text-[#ff6b7b]">جاري التسجيل...</span>
                  <span class="rec-timer-badge">{{ formattedDuration }}</span>
                  
                  <!-- موجة مستوى الصوت الحقيقي من Web Audio API -->
                  <div class="sound-wave-meter" :title="`مستوى الصوت: ${audioLevel}%`">
                    <span class="wave-bar" :style="{ height: `${Math.max(4, audioLevel * 0.22)}px` }"></span>
                    <span class="wave-bar" :style="{ height: `${Math.max(6, audioLevel * 0.28)}px` }"></span>
                    <span class="wave-bar" :style="{ height: `${Math.max(4, audioLevel * 0.18)}px` }"></span>
                  </div>

                  <!-- تنبيه إذا كان المايك صامتاً -->
                  <span v-if="isSilentMic" class="mic-silent-pill">
                    ⚠️ المايك لا يلتقط صوتاً
                  </span>
                </div>

                <button type="button" @click="stopRecording" class="btn-rec-stop">
                  <span>إيقاف وحفظ</span>
                </button>
              </div>

              <!-- معاينة الصوت المسجل قبل الإرسال -->
              <div v-else-if="feedbackAudioUrl" class="recording-preview-card">
                <div class="flex items-center justify-between text-xs text-[#7de8dc] font-bold mb-1">
                  <span>{{ feedbackFileName ? `ملف: ${feedbackFileName}` : 'تم حفظ التسجيل بنجاح ✓' }}</span>
                  <button type="button" @click="clearRecording" class="text-[#ff6b7b] hover:underline font-bold text-xs cursor-pointer">
                    حذف وإعادة التسجيل
                  </button>
                </div>
                <audio :src="feedbackAudioUrl" controls class="w-full h-8 outline-none rounded-lg"></audio>
              </div>
            </div>

            <!-- رسالة خطأ إن وجدت -->
            <p v-if="submitError" class="text-xs text-[#ff6b7b] font-bold mt-1">{{ submitError }}</p>

            <!-- زر تسليم المهمة الأساسي -->
            <button
              type="button"
              @click="submitTaskAction"
              :disabled="isSubmitting"
              class="btn-submit-action"
            >
              <span v-if="isSubmitting" class="spinner-sm dark"></span>
              <template v-else>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <span>تسليم للمراجعة 🚀</span>
              </template>
            </button>
          </div>

          <!-- 4. صندوق المدير / المراجع (canReview): اعتماد أو رفض للتعديل عندما تكون المهمة under_review -->
          <div v-else-if="canReview && task.status === 'under_review'" class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="status-live-dot pulse-amber"></span>
                <span class="text-xs font-bold text-[#ffc107]">قرار المراجعة والاعتماد (الإدارة)</span>
              </div>
              <span class="text-[11px] text-[#8390be]">اختر اعتماد المهمة أو طلب تعديلها</span>
            </div>

            <!-- حقل النص -->
            <textarea
              v-model="messageText"
              rows="2"
              placeholder="اكتب ملاحظاتك للموظف، أو أسباب طلب التعديل (اختياري)..."
              class="composer-textarea"
            ></textarea>

            <!-- تسجيل الصوت بتقنية Web Audio API للمدير -->
            <div class="recording-dock">
              <!-- أزرار البدء والرفع -->
              <div v-if="!isRecording && !feedbackAudioUrl" class="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  @click="startRecording"
                  class="btn-composer-mic"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" class="text-[#ff4757]">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                  <span>تسجيل توجيه صوتي بالمايك</span>
                </button>

                <button
                  type="button"
                  @click="triggerFeedbackFileInput"
                  class="btn-composer-upload"
                  title="رفع ملف صوتي من الجهاز"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>أو رفع ملف صوت</span>
                </button>
                <input
                  type="file"
                  ref="feedbackFileInput"
                  accept="audio/*"
                  @change="handleFeedbackFileUpload"
                  class="hidden"
                />
              </div>

              <!-- شريط التسجيل النشط -->
              <div v-else-if="isRecording" class="recording-live-bar">
                <div class="flex items-center gap-2.5">
                  <span class="recording-ping-dot"></span>
                  <span class="text-xs font-bold text-[#ff6b7b]">جاري التسجيل...</span>
                  <span class="rec-timer-badge">{{ formattedDuration }}</span>
                  
                  <div class="sound-wave-meter" :title="`مستوى الصوت: ${audioLevel}%`">
                    <span class="wave-bar" :style="{ height: `${Math.max(4, audioLevel * 0.22)}px` }"></span>
                    <span class="wave-bar" :style="{ height: `${Math.max(6, audioLevel * 0.28)}px` }"></span>
                    <span class="wave-bar" :style="{ height: `${Math.max(4, audioLevel * 0.18)}px` }"></span>
                  </div>

                  <span v-if="isSilentMic" class="mic-silent-pill">
                    ⚠️ المايك لا يلتقط صوتاً
                  </span>
                </div>

                <button type="button" @click="stopRecording" class="btn-rec-stop">
                  <span>إيقاف وحفظ</span>
                </button>
              </div>

              <!-- معاينة الصوت المسجل للمدير -->
              <div v-else-if="feedbackAudioUrl" class="recording-preview-card">
                <div class="flex items-center justify-between text-xs text-[#7de8dc] font-bold mb-1">
                  <span>{{ feedbackFileName ? `ملف: ${feedbackFileName}` : 'تم حفظ التسجيل بنجاح ✓' }}</span>
                  <button type="button" @click="clearRecording" class="text-[#ff6b7b] hover:underline font-bold text-xs cursor-pointer">
                    حذف وإعادة التسجيل
                  </button>
                </div>
                <audio :src="feedbackAudioUrl" controls class="w-full h-8 outline-none rounded-lg"></audio>
              </div>
            </div>

            <!-- رسالة خطأ إن وجدت -->
            <p v-if="submitError" class="text-xs text-[#ff6b7b] font-bold mt-1">{{ submitError }}</p>

            <!-- زرا اتخاذ القرار (اعتماد / رفض) -->
            <div class="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                @click="reviewTaskAction('completed')"
                :disabled="isSubmitting"
                class="btn-decision-approve"
              >
                <span v-if="isSubmitting" class="spinner-sm dark"></span>
                <template v-else>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>اعتماد ✅</span>
                </template>
              </button>

              <button
                type="button"
                @click="reviewTaskAction('rejected')"
                :disabled="isSubmitting"
                class="btn-decision-reject"
              >
                <span v-if="isSubmitting" class="spinner-sm dark"></span>
                <template v-else>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <span>رفض للتعديل ❌</span>
                </template>
              </button>
            </div>
          </div>

          <!-- 5. حالة قيد التنفيذ (للإدارة أثناء انتظار تسليم الموظف) -->
          <div v-else-if="canReview" class="composer-status-banner waiting">
            <div class="banner-icon waiting">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <strong class="block text-sm font-bold text-[#7de8dc]">المهمة قيد التنفيذ لدى المُكلَّف ⏳</strong>
              <span class="text-xs text-[#8390be]">بانتظار تسليم الموظف ({{ task.assignee_name || 'المُكلَّف' }}) للإنجاز والمراجعة.</span>
            </div>
          </div>

          <!-- 6. حالة المشاهدين -->
          <div v-else class="composer-status-banner waiting">
            <div class="banner-icon waiting">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <strong class="block text-sm font-bold text-[#7de8dc]">حالة المهمة: {{ getStatusText(task.status) }}</strong>
              <span class="text-xs text-[#8390be]">سجل المتابعة متاح للمشاهدة فقط.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import api from '@/axios';

const props = defineProps({
  task: { type: Object, required: true },
  currentUser: { type: Object, required: true }
});

const emit = defineEmits(['taskUpdated', 'editTask', 'deleteTask']);

const isSubmitting = ref(false);
const submitError = ref('');
const messageText = ref('');
const chatContainerRef = ref(null);

// تحديد دور المستخدم (هل هو مدير/آدمن أم موظف)
const userRole = computed(() => {
  const role = localStorage.getItem('role') || props.currentUser?.role;
  const roleStr = typeof role === 'object' && role?.value ? role.value : String(role || '');
  return roleStr.toLowerCase();
});

const isManagerUser = computed(() => {
  return userRole.value === 'manager' || userRole.value === 'admin';
});

const isEmployeeUser = computed(() => {
  return !isManagerUser.value;
});

// هل المستخدم الحالي هو الموظف المنفذ لهذه المهمة؟
const isAssignee = computed(() => {
  // إذا كان دور المستخدم موظف، فهو بالتأكيد يمثل طرف التنفيذ
  if (isEmployeeUser.value) {
    return true;
  }

  const currentUserId = Number(props.currentUser?.id || localStorage.getItem('user_id'));
  const taskAssigneeId = Number(props.task?.assigned_to || props.task?.assignee_id || props.task?.assignee?.id);
  if (currentUserId && taskAssigneeId && currentUserId === taskAssigneeId) {
    return true;
  }

  const myName = (props.currentUser?.name || '').trim().toLowerCase();
  const assigneeName = (props.task?.assignee_name || props.task?.assignee?.name || '').trim().toLowerCase();
  if (myName && assigneeName && myName === assigneeName) {
    return true;
  }

  return false;
});

// صلاحية تعديل وحذف المهمة (تظهر فقط للمدير العام بشرط ألا يكون هو نفسه المنفذ)
const canModify = computed(() => {
  if (isEmployeeUser.value || isAssignee.value) {
    return false;
  }
  return isManagerUser.value;
});

// صلاحية مراجعة واعتماد أو رفض المهمة (تظهر فقط للمدير العام بشرط ألا يكون هو نفسه المنفذ)
const canReview = computed(() => {
  if (isEmployeeUser.value || isAssignee.value) {
    return false;
  }
  return isManagerUser.value;
});

// ترتيب السجل زمنيًا من الأقدم للأحدث (مثل الدردشة الحقيقية)
const sortedLogs = computed(() => {
  if (!props.task?.feedback_logs || !Array.isArray(props.task.feedback_logs)) {
    return [];
  }
  return [...props.task.feedback_logs].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : (Number(a.id) || 0);
    const timeB = b.created_at ? new Date(b.created_at).getTime() : (Number(b.id) || 0);
    return timeA - timeB;
  });
});

// التمييز بين رسائلي ورسائل الطرف الآخر
const isMyMessage = (log) => {
  if (!log) return false;
  const myId = Number(props.currentUser?.id);
  const logReviewerId = Number(log.reviewer_id);
  if (myId && logReviewerId) {
    return myId === logReviewerId;
  }
  if (log.reviewer_name && props.currentUser?.name) {
    return log.reviewer_name.trim().toLowerCase() === props.currentUser.name.trim().toLowerCase();
  }
  return false;
};

// شارات الحالة المعبرة لكل رد
const getStatusBadgeInfo = (status) => {
  switch (status) {
    case 'under_review':
      return {
        label: 'قام بالتسليم للمراجعة 🚀',
        badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      };
    case 'completed':
      return {
        label: 'تم الاعتماد بنجاح ✅',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
      };
    case 'rejected':
      return {
        label: 'طلب تعديل وملاحظات ⚠️',
        badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
      };
    case 'in_progress':
      return {
        label: 'بدء التنفيذ ⏳',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
      };
    default:
      return {
        label: status ? `تحديث: ${status}` : 'ملاحظة ومتابعة',
        badgeClass: 'bg-[#8999e2]/15 text-[#a8b5f0] border border-[#8999e2]/25'
      };
  }
};

// --- تسجيل الصوت بالمايك (Web Audio API + Silent Mic Detection) ---
const isRecording = ref(false);
const audioBlob = ref(null);
const feedbackAudioUrl = ref(null);
const feedbackFileName = ref('');
const recordingDuration = ref(0);
const feedbackFileInput = ref(null);
const audioLevel = ref(0);
const isSilentMic = ref(false);

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let timerInterval = null;
let audioContext = null;
let analyser = null;
let animFrameId = null;
let silentCheckTimer = null;
let maxVolumeRecorded = 0;

const formattedDuration = computed(() => {
  const mins = Math.floor(recordingDuration.value / 60);
  const secs = recordingDuration.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

const startRecording = async () => {
  try {
    submitError.value = '';
    clearRecording();
    recordingDuration.value = 0;
    audioChunks = [];
    audioLevel.value = 0;
    isSilentMic.value = false;
    maxVolumeRecorded = 0;

    // 1. طلب الوصول إلى المايك
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // 2. استخدام Web Audio API لتحليل جودة الصوت واكتشاف المايك الصامت
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const source = audioContext.createMediaStreamSource(audioStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          if (!isRecording.value || !analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          audioLevel.value = level;
          if (level > maxVolumeRecorded) {
            maxVolumeRecorded = level;
          }
          animFrameId = requestAnimationFrame(checkAudioLevel);
        };
        animFrameId = requestAnimationFrame(checkAudioLevel);

        // فحص إذا كان المايك صامتاً تماماً بعد ثانيتين ونصف
        silentCheckTimer = setTimeout(() => {
          if (isRecording.value && maxVolumeRecorded < 2) {
            isSilentMic.value = true;
          }
        }, 2500);
      }
    } catch (e) {
      console.warn('Web Audio API analyser not supported, continuing normal recording:', e);
    }

    // 3. تحديد الصيغة المدعومة وتجهيز المسجل
    const supportedMime = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';

    const options = supportedMime ? { mimeType: supportedMime } : {};
    mediaRecorder = new MediaRecorder(audioStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stopAnalysis();
      const mimeType = mediaRecorder?.mimeType || supportedMime || 'audio/webm';
      const blob = new Blob(audioChunks, { type: mimeType });
      audioBlob.value = blob;
      feedbackAudioUrl.value = URL.createObjectURL(blob);
      feedbackFileName.value = '';
      isRecording.value = false;
    };

    mediaRecorder.start(200);
    isRecording.value = true;

    timerInterval = setInterval(() => {
      recordingDuration.value++;
    }, 1000);

  } catch (err) {
    console.error('Mic access error:', err);
    submitError.value = 'تعذر تشغيل الميكروفون. يرجى إعطاء الصلاحية في المتصفح أو رفع ملف صوتي جاهز من جهازك.';
    stopRecordingCleanup();
  }
};

const stopRecording = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (silentCheckTimer) {
    clearTimeout(silentCheckTimer);
    silentCheckTimer = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

const stopAnalysis = () => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    try { audioContext.close(); } catch (e) {}
    audioContext = null;
  }
  analyser = null;
  audioLevel.value = 0;
};

const stopRecordingCleanup = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (silentCheckTimer) {
    clearTimeout(silentCheckTimer);
    silentCheckTimer = null;
  }
  stopAnalysis();
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }
  isRecording.value = false;
};

const clearRecording = () => {
  stopRecordingCleanup();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (e) {}
  }
  mediaRecorder = null;
  audioBlob.value = null;
  feedbackFileName.value = '';
  if (feedbackAudioUrl.value) {
    URL.revokeObjectURL(feedbackAudioUrl.value);
    feedbackAudioUrl.value = null;
  }
  audioChunks = [];
  recordingDuration.value = 0;
  isSilentMic.value = false;
  if (feedbackFileInput.value) {
    feedbackFileInput.value.value = '';
  }
};

const triggerFeedbackFileInput = () => {
  if (feedbackFileInput.value) {
    feedbackFileInput.value.click();
  }
};

const handleFeedbackFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  clearRecording();
  audioBlob.value = file;
  feedbackFileName.value = file.name;
  feedbackAudioUrl.value = URL.createObjectURL(file);
};

const getAudioExtension = (mimeType) => {
  if (!mimeType) return 'webm';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
};

// --- إجراءات التسليم والمراجعة ---

// 1. إجراء تسليم المهمة للموظف
const submitTaskAction = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  submitError.value = '';

  try {
    const formData = new FormData();
    if (messageText.value?.trim()) {
      formData.append('feedback_text', messageText.value.trim());
    }
    if (audioBlob.value) {
      if (audioBlob.value.name) {
        formData.append('voice_record', audioBlob.value, audioBlob.value.name);
      } else {
        const ext = getAudioExtension(audioBlob.value.type);
        formData.append('voice_record', audioBlob.value, `submission_voice.${ext}`);
      }
    }

    const res = await api.post(`/quick-tasks/${props.task.id}/submit`, formData);
    
    // تصفير الصندوق
    messageText.value = '';
    clearRecording();

    // إشعار الأب بالتحديث
    emit('taskUpdated', res.data?.data || res.data);

    // التمرير التلقائي لأسفل المحادثة
    scrollToBottom(true);
  } catch (err) {
    console.error('Submit task error:', err);
    submitError.value = err.response?.data?.message || 'تعذر تسليم المهمة، يرجى المحاولة مرة أخرى.';
  } finally {
    isSubmitting.value = false;
  }
};

// 2. إجراء قرار المراجعة للمدير (اعتماد أو رفض)
const reviewTaskAction = async (decisionStatus) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  submitError.value = '';

  try {
    const formData = new FormData();
    formData.append('status_changed_to', decisionStatus);

    if (messageText.value?.trim()) {
      formData.append('feedback_text', messageText.value.trim());
    }
    if (audioBlob.value) {
      if (audioBlob.value.name) {
        formData.append('voice_record', audioBlob.value, audioBlob.value.name);
      } else {
        const ext = getAudioExtension(audioBlob.value.type);
        formData.append('voice_record', audioBlob.value, `review_voice.${ext}`);
      }
    }

    const res = await api.post(`/quick-tasks/${props.task.id}/review`, formData);

    // تصفير الصندوق
    messageText.value = '';
    clearRecording();

    // إشعار الأب بالتحديث
    emit('taskUpdated', res.data?.data || res.data);

    // التمرير التلقائي لأسفل المحادثة
    scrollToBottom(true);
  } catch (err) {
    console.error('Review task error:', err);
    submitError.value = err.response?.data?.message || 'تعذر حفظ القرار، يرجى المحاولة مرة أخرى.';
  } finally {
    isSubmitting.value = false;
  }
};

// التمرير التلقائي لأسفل الدردشة
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTo({
        top: chatContainerRef.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  });
};

onMounted(() => {
  scrollToBottom(false);
});

watch(
  () => props.task?.feedback_logs,
  () => {
    scrollToBottom(true);
  },
  { deep: true }
);

onUnmounted(() => {
  clearRecording();
});

// الدوال المساعدة للعرض
const getStatusText = (status) => {
  const map = {
    pending: 'قيد الانتظار',
    in_progress: 'جاري التنفيذ',
    under_review: 'قيد المراجعة',
    rejected: 'مرفوضة (تحتاج تعديل)',
    completed: 'مكتملة',
  };
  return map[status] || status;
};

const getInitials = (name) => {
  if (!name) return 'م';
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || name.substring(0, 2);
};

const formatDeadline = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

const formatLogTime = (log) => {
  if (log?.created_at_human) return log.created_at_human;
  if (!log?.created_at) return 'الآن';
  try {
    const d = new Date(log.created_at);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return log.created_at;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

.quick-task-details {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
  padding: 28px;
  background: #10163a;
  border-radius: 24px;
  color: #edf0ff;
  font-family: 'Cairo', sans-serif !important;
  box-sizing: border-box;
}

@media (min-width: 992px) {
  .quick-task-details {
    flex-direction: row;
    align-items: stretch;
  }
  .main-column {
    flex: 1.05;
    min-width: 0;
  }
  .side-column {
    flex: 1.25;
    min-width: 0;
  }
}

.main-column, .side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.task-details-header {
  position: relative;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(137, 153, 226, 0.15);
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.eyebrow {
  color: #76e8de;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.35px;
}

.action-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-header-btn.edit {
  background: rgba(125, 232, 220, 0.12);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.25);
}
.action-header-btn.edit:hover {
  background: rgba(125, 232, 220, 0.22);
}

.action-header-btn.delete {
  background: rgba(255, 71, 87, 0.12);
  color: #ff6b7b;
  border: 1px solid rgba(255, 71, 87, 0.25);
}
.action-header-btn.delete:hover {
  background: rgba(255, 71, 87, 0.22);
}

.task-title {
  margin: 0 0 16px;
  font-size: 21px;
  font-weight: 800;
  line-height: 1.4;
  color: #ffffff;
  letter-spacing: -0.2px;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-badge.pending {
  background: rgba(131, 144, 190, 0.15);
  color: #c9d2f5;
  border: 1px solid rgba(131, 144, 190, 0.3);
}
.status-badge.pending .status-dot { background: #8390be; }

.status-badge.in_progress {
  background: rgba(118, 232, 222, 0.15);
  color: #76e8de;
  border: 1px solid rgba(118, 232, 222, 0.35);
}
.status-badge.in_progress .status-dot { background: #76e8de; box-shadow: 0 0 8px #76e8de; }

.status-badge.under_review {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.35);
}
.status-badge.under_review .status-dot { background: #ffc107; box-shadow: 0 0 8px #ffc107; }

.status-badge.rejected {
  background: rgba(255, 107, 123, 0.15);
  color: #ff6b7b;
  border: 1px solid rgba(255, 107, 123, 0.35);
}
.status-badge.rejected .status-dot { background: #ff6b7b; box-shadow: 0 0 8px #ff6b7b; }

.status-badge.completed {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
  border: 1px solid rgba(46, 213, 115, 0.35);
}
.status-badge.completed .status-dot { background: #2ed573; box-shadow: 0 0 8px #2ed573; }

/* Meta Strip */
.meta-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(6, 11, 37, 0.45);
  padding: 12px 18px;
  border-radius: 14px;
  border: 1px solid rgba(137, 153, 226, 0.12);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
  color: #10163a;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.meta-avatar.creator {
  background: linear-gradient(135deg, #76e8de, #8999e2);
}

.meta-avatar.assignee {
  background: linear-gradient(135deg, #b28aff, #ff8bb2);
}

.meta-icon.deadline {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(255, 193, 7, 0.12);
  border: 1px solid rgba(255, 193, 7, 0.25);
  color: #ffc107;
  display: grid;
  place-items: center;
}

.meta-info {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 11px;
  color: #8390be;
  font-weight: 600;
  line-height: 1.2;
}

.meta-value {
  font-size: 13px;
  color: #f1f4ff;
  font-weight: 700;
}

.meta-value.deadline-val {
  color: #ffc107;
}

.meta-divider {
  width: 1px;
  height: 28px;
  background: rgba(137, 153, 226, 0.18);
}

/* Section Cards */
.section-card {
  background: rgba(15, 22, 61, 0.55);
  border: 1px solid rgba(137, 153, 226, 0.14);
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: 0 10px 30px rgba(4, 7, 27, 0.25);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #f1f4ff;
}

.section-header-text small {
  color: #8390be;
  font-size: 11px;
  display: block;
}

.section-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.section-icon.teal {
  background: rgba(118, 232, 222, 0.12);
  color: #76e8de;
  border: 1px solid rgba(118, 232, 222, 0.25);
}

.section-icon.purple {
  background: rgba(178, 138, 255, 0.12);
  color: #b28aff;
  border: 1px solid rgba(178, 138, 255, 0.25);
}

.task-description-text {
  color: #c9d2f5;
  font-size: 13.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  margin: 0;
}

.audio-wrap {
  margin-top: 6px;
  background: rgba(6, 11, 37, 0.5);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(137, 153, 226, 0.12);
}

.custom-audio-player {
  width: 100%;
  height: 36px;
  outline: none;
}

/* Info Guide Card */
.info-guide-card {
  background: rgba(118, 232, 222, 0.04);
  border: 1px solid rgba(118, 232, 222, 0.14);
  border-radius: 14px;
  padding: 14px 16px;
}

.info-guide-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(118, 232, 222, 0.1);
  color: #76e8de;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

/* --- SIDE COLUMN: CHAT TIMELINE WRAPPER --- */
.chat-timeline-wrapper {
  background: rgba(15, 22, 61, 0.65);
  border: 1px solid rgba(137, 153, 226, 0.18);
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 35px rgba(4, 7, 27, 0.35);
  height: 100%;
  box-sizing: border-box;
}

.chat-header {
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(137, 153, 226, 0.12);
}

.chat-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.12);
  border: 1px solid rgba(125, 232, 220, 0.25);
  flex-shrink: 0;
}

.chat-title {
  margin: 0;
  color: #f1f4ff;
  font-size: 15px;
  font-weight: 800;
}

.chat-sub {
  color: #8390be;
  font-size: 11px;
  display: block;
}

.chat-counter-badge {
  font-size: 11px;
  font-weight: 700;
  color: #7de8dc;
  background: rgba(125, 232, 220, 0.1);
  border: 1px solid rgba(125, 232, 220, 0.2);
  padding: 3px 10px;
  border-radius: 8px;
}

/* Chat Thread Scrollable Area */
.chat-thread-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 8px 16px 4px;
  min-height: 280px;
  max-height: 440px;
  overflow-y: auto;
  box-sizing: border-box;
}

.chat-bubble-row {
  display: flex;
  gap: 10px;
  width: 100%;
  animation: fadeIn 0.25s ease-out;
}

.chat-bubble-row.chat-me {
  flex-direction: row; /* In RTL, row starts from right */
  justify-content: flex-start;
}

.chat-bubble-row.chat-other {
  flex-direction: row-reverse; /* In RTL, starts from left */
  justify-content: flex-start;
}

.chat-bubble-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  color: #12183f;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.chat-bubble-avatar.me {
  background: linear-gradient(135deg, #7de8dc, #10b981);
}

.chat-bubble-avatar.other {
  background: linear-gradient(135deg, #b28aff, #ff8bb2);
}

.chat-bubble-card {
  max-width: 82%;
  padding: 12px 14px;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  position: relative;
}

.chat-bubble-row.chat-me .chat-bubble-card {
  background: linear-gradient(135deg, rgba(14, 40, 75, 0.9), rgba(10, 24, 55, 0.95));
  border: 1px solid rgba(125, 232, 220, 0.35);
  border-top-right-radius: 4px;
}

.chat-bubble-row.chat-other .chat-bubble-card {
  background: linear-gradient(135deg, rgba(30, 22, 65, 0.9), rgba(18, 16, 45, 0.95));
  border: 1px solid rgba(178, 138, 255, 0.28);
  border-top-left-radius: 4px;
}

.chat-bubble-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.chat-sender-name {
  color: #f1f4ff;
  font-size: 12.5px;
  font-weight: 800;
}

.chat-self-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(125, 232, 220, 0.15);
  color: #7de8dc;
  border: 1px solid rgba(125, 232, 220, 0.3);
}

.chat-bubble-time {
  color: #8390be;
  font-size: 10.5px;
  white-space: nowrap;
}

.chat-bubble-content {
  color: #edf0ff;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-bubble-audio-box {
  margin-top: 8px;
  background: rgba(6, 11, 37, 0.6);
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(137, 153, 226, 0.12);
}

/* --- CHAT ACTION COMPOSER AREA --- */
.chat-action-composer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(137, 153, 226, 0.15);
}

.composer-textarea {
  width: 100%;
  padding: 10px 12px;
  background: rgba(6, 11, 37, 0.65);
  border: 1px solid rgba(137, 153, 226, 0.22);
  border-radius: 12px;
  color: #f1f4ff;
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.5;
  outline: none;
  resize: none;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.composer-textarea:focus {
  border-color: #7de8dc;
  box-shadow: 0 0 0 3px rgba(125, 232, 220, 0.15);
}

.recording-dock {
  margin: 6px 0;
}

.btn-composer-mic {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.25);
  color: #ff6b7b;
  border-radius: 9px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-composer-mic:hover {
  background: rgba(255, 71, 87, 0.18);
  border-color: #ff4757;
}

.btn-composer-upload {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(24, 37, 82, 0.5);
  border: 1px solid rgba(137, 153, 226, 0.18);
  color: #8390be;
  border-radius: 9px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-composer-upload:hover {
  background: rgba(24, 37, 82, 0.8);
  color: #f1f4ff;
}

.recording-live-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(16, 22, 58, 0.95);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 71, 87, 0.35);
  flex-wrap: wrap;
}

.recording-ping-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4757;
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.rec-timer-badge {
  font-size: 11px;
  font-family: monospace;
  font-weight: 800;
  color: #ffffff;
  background: #060b25;
  padding: 2px 8px;
  border-radius: 6px;
}

.sound-wave-meter {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 18px;
  padding: 0 4px;
}

.wave-bar {
  width: 3px;
  background: #7de8dc;
  border-radius: 2px;
  transition: height 0.08s ease;
}

.mic-silent-pill {
  font-size: 10px;
  font-weight: 700;
  color: #ffc107;
  background: rgba(255, 193, 7, 0.12);
  border: 1px solid rgba(255, 193, 7, 0.3);
  padding: 2px 6px;
  border-radius: 6px;
}

.btn-rec-stop {
  background: #ff4757;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-rec-stop:hover {
  background: #ff3344;
}

.recording-preview-card {
  background: rgba(16, 22, 58, 0.95);
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(125, 232, 220, 0.25);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Action Buttons */
.btn-submit-action {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(110deg, #7de8dc, #b28aff);
  color: #12183f;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(125, 232, 220, 0.2);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.btn-submit-action:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.btn-decision-approve {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(110deg, #7de8dc, #10b981);
  color: #12183f;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.2);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.btn-decision-approve:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.btn-decision-reject {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(110deg, #ff6b7b, #ff4757);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(255, 71, 87, 0.2);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.btn-decision-reject:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

/* Status Banners */
.composer-status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
}

.composer-status-banner.completed {
  background: rgba(46, 213, 115, 0.08);
  border: 1px solid rgba(46, 213, 115, 0.25);
}

.composer-status-banner.waiting {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.25);
}

.banner-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.banner-icon.completed {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

.banner-icon.waiting {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

/* Live Dots */
.status-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-live-dot.pulse-teal {
  background: #7de8dc;
  box-shadow: 0 0 8px #7de8dc;
}

.status-live-dot.pulse-amber {
  background: #ffc107;
  box-shadow: 0 0 8px #ffc107;
}

/* Utilities */
.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner-sm.dark {
  border-color: rgba(18, 24, 63, 0.3);
  border-top-color: #12183f;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(137, 153, 226, 0.25);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(125, 232, 220, 0.4);
}
</style>