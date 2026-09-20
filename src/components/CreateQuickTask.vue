<template>
  <div class="create-quick-task-card bg-[#10163a] p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] max-w-2xl mx-auto border border-[#8999e2]/20 w-full text-[#f1f4ff]" dir="rtl">
    <div class="mb-6 border-b border-[#8999e2]/15 pb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-[#7de8dc]/20 text-[#7de8dc] rounded-xl border border-[#7de8dc]/30">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </div>
        <div>
          <h2 class="text-2xl font-extrabold text-[#f1f4ff]">إنشاء مهمة سريعة</h2>
          <p class="text-[#8390be] text-sm mt-1 font-medium">أرسل توجيهاتك الصوتية أو النصية في ثوانٍ</p>
        </div>
      </div>

      <!-- زر إغلاق المودال X -->
      <button 
        type="button" 
        @click="$emit('cancel')" 
        class="w-10 h-10 rounded-xl bg-[#141b48]/60 hover:bg-[#ff4757]/20 text-[#8390be] hover:text-[#ff4757] border border-[#8999e2]/20 hover:border-[#ff4757]/40 flex items-center justify-center transition-all duration-200 group cursor-pointer shrink-0"
        title="إغلاق النافذة"
      >
        <svg class="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <form @submit.prevent="submitTask" class="space-y-5">
      
      <!-- رسالة الخطأ إن وجدت -->
      <div v-if="errorMessage" class="bg-[#ff4757]/10 text-[#ff4757] p-4 rounded-xl text-sm mb-4 border border-[#ff4757]/20 flex items-center gap-2 font-bold">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {{ errorMessage }}
      </div>

      <!-- اختيار الموظف والديدلاين -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-bold text-[#8390be] mb-2">إسناد إلى (الموظف) <span class="text-[#ff4757]">*</span></label>
          <select v-model="form.assigned_to" required class="w-full bg-[#0a102f]/80 text-[#f1f4ff] border-[#8999e2]/20 rounded-xl shadow-inner focus:ring-2 focus:ring-[#7de8dc]/30 focus:border-[#7de8dc] p-3 border outline-none transition-all">
            <option value="" disabled class="bg-[#10163a]">اختر الموظف...</option>
            <option v-for="user in users" :key="user.id" :value="user.id" class="bg-[#10163a]">
              {{ user.name }} ({{ user.job_title }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-[#8390be] mb-2">وقت التسليم (الديدلاين) <span class="text-[#ff4757]">*</span></label>
          <input type="datetime-local" v-model="form.deadline" required class="w-full bg-[#0a102f]/80 text-[#f1f4ff] border-[#8999e2]/20 rounded-xl shadow-inner focus:ring-2 focus:ring-[#7de8dc]/30 focus:border-[#7de8dc] p-3 border outline-none transition-all [color-scheme:dark]">
        </div>
      </div>

      <!-- العنوان (اختياري) -->
      <div>
        <label class="block text-sm font-bold text-[#8390be] mb-2">عنوان المهمة (اختياري)</label>
        <input type="text" v-model="form.title" placeholder="مثال: تعديل لوجو العميل الجديد" class="w-full bg-[#0a102f]/80 text-[#f1f4ff] placeholder-[#6e79a9] border-[#8999e2]/20 rounded-xl shadow-inner focus:ring-2 focus:ring-[#7de8dc]/30 focus:border-[#7de8dc] p-3 border outline-none transition-all">
      </div>

      <!-- 🎤 قسم التسجيل الصوتي (الميزة الأساسية) -->
      <div class="bg-[#0a102f]/40 p-6 rounded-2xl border border-[#8999e2]/15 text-center flex flex-col items-center justify-center space-y-4 min-h-[170px] shadow-sm relative overflow-hidden">
        <div class="absolute -right-10 top-0 w-32 h-32 bg-[#7de8dc] rounded-full mix-blend-screen filter blur-3xl opacity-[0.05] pointer-events-none"></div>
        <div class="absolute -left-10 bottom-0 w-32 h-32 bg-[#b28aff] rounded-full mix-blend-screen filter blur-3xl opacity-[0.05] pointer-events-none"></div>
        
        <label class="relative z-10 block text-sm font-black text-[#7de8dc] mb-1 w-full text-right tracking-wider uppercase">التوجيه الصوتي (مفضل)</label>
        
        <!-- في حالة عدم وجود تسجيل (idle) -->
        <div v-if="recordingState === 'idle'" class="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <!-- زر بدء التسجيل بالمايك -->
          <button @click="startRecording" type="button" class="flex items-center justify-center space-x-2 space-x-reverse bg-[#7de8dc]/10 text-[#7de8dc] hover:bg-[#7de8dc]/20 border border-[#7de8dc]/30 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(125,232,220,0.1)] hover:shadow-[0_8px_25px_rgba(125,232,220,0.2)] hover:scale-[1.02]">
            <svg class="w-5 h-5 text-[#ff4757] animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            <span>بدء التسجيل بالمايك</span>
          </button>

          <!-- زر بديل: اختيار ملف صوتي مسجل مسبقاً -->
          <button @click="triggerFileInput" type="button" class="flex items-center justify-center space-x-2 space-x-reverse bg-[#141b48]/60 text-[#8390be] hover:text-[#f1f4ff] hover:bg-[#1c265c] border border-[#8999e2]/25 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300">
            <svg class="w-5 h-5 text-[#b28aff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            <span>أو اختيار ملف صوتي من الجهاز</span>
          </button>
          
          <input 
            type="file" 
            ref="audioFileInput" 
            accept="audio/*" 
            @change="handleFileUpload" 
            class="hidden" 
          />
        </div>

        <!-- واجهة التسجيل الجارية البسيطة والمباشرة -->
        <div v-if="recordingState === 'recording'" class="relative z-10 w-full flex flex-col items-center space-y-4">
          <div class="flex items-center gap-3 bg-[#10163a]/90 px-6 py-3 rounded-2xl border border-[#ff4757]/40 shadow-lg">
            <span class="w-3 h-3 rounded-full bg-[#ff4757] animate-ping"></span>
            <span class="text-sm font-extrabold text-[#ff6b7b]">جاري التسجيل بالمايك...</span>
            <span class="text-base font-extrabold text-[#f1f4ff] font-mono tracking-wider bg-[#060b25] px-3 py-1 rounded-lg border border-[#8999e2]/20">{{ formattedDuration }}</span>
          </div>

          <!-- زر إيقاف وحفظ التسجيل -->
          <button @click="stopRecording" type="button" class="flex items-center justify-center space-x-2 space-x-reverse bg-[#ff4757] text-white hover:bg-[#ff3344] px-8 py-3 rounded-xl font-extrabold transition-all duration-300 shadow-[0_4px_15px_rgba(255,71,87,0.35)] hover:scale-105 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
            <span>إيقاف وحفظ الصوت</span>
          </button>
        </div>

        <!-- مشغل الصوت بعد التسجيل/الرفع للاستماع والمعاينة -->
        <div v-if="recordingState === 'recorded'" class="relative z-10 w-full flex flex-col items-center space-y-3 mt-1">
          <div class="bg-[#10163a]/90 p-4 rounded-2xl w-full max-w-lg border border-[#7de8dc]/30 shadow-lg flex flex-col gap-3">
            <div class="flex items-center justify-between text-xs text-[#7de8dc] font-bold px-1">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4 text-[#7de8dc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                {{ audioFileName ? `الملف: ${audioFileName}` : 'تم حفظ الصوت بنجاح ✓' }}
              </span>
              <span v-if="!audioFileName" class="text-[#8390be] font-mono">{{ formattedDuration }}</span>
            </div>
            
            <audio :src="audioUrl" controls class="w-full h-10 outline-none rounded-lg"></audio>
          </div>
          
          <button @click="clearRecording" type="button" class="text-sm font-bold text-[#ff4757] hover:text-[#ff6b7b] flex items-center space-x-1.5 space-x-reverse transition-colors bg-[#ff4757]/10 hover:bg-[#ff4757]/20 px-4 py-2 rounded-xl border border-[#ff4757]/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            <span>حذف وإعادة التسجيل</span>
          </button>
        </div>
      </div>

      <!-- التفاصيل النصية (اختياري) -->
      <div>
        <label class="block text-sm font-bold text-[#8390be] mb-2">تفاصيل إضافية (نصية - اختياري)</label>
        <textarea v-model="form.description" rows="3" placeholder="إذا أردت إضافة ملاحظات مكتوبة بجانب الصوت..." class="w-full bg-[#0a102f]/80 text-[#f1f4ff] placeholder-[#6e79a9] border-[#8999e2]/20 rounded-xl shadow-inner focus:ring-2 focus:ring-[#7de8dc]/30 focus:border-[#7de8dc] p-3 border outline-none transition-all resize-none"></textarea>
      </div>

      <!-- أزرار الإجراءات -->
      <div class="flex justify-end space-x-3 space-x-reverse border-t border-[#8999e2]/15 pt-5 mt-6">
        <button type="button" @click="$emit('cancel')" class="px-6 py-3 text-[#8390be] bg-[#141b48]/50 hover:bg-[#1c265c] hover:text-[#f1f4ff] border border-[#8999e2]/20 rounded-xl font-bold transition-all duration-300">
          إلغاء
        </button>
        <button type="submit" :disabled="isSubmitting" class="px-8 py-3 text-[#12183f] bg-gradient-to-r from-[#7de8dc] to-[#b28aff] hover:brightness-110 rounded-xl font-extrabold flex items-center disabled:opacity-70 transition-all duration-300 shadow-[0_4px_15px_rgba(125,232,220,0.25)] hover:shadow-[0_8px_25px_rgba(125,232,220,0.4)]">
          <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-[#12183f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span v-if="!isSubmitting" class="ml-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </span>
          {{ isSubmitting ? 'جاري الإرسال...' : 'إرسال المهمة' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import api from '@/axios';

const props = defineProps({
  users: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['taskCreated', 'cancel']);

const form = ref({
  assigned_to: '',
  title: '',
  description: '',
  deadline: ''
});
const isSubmitting = ref(false);
const errorMessage = ref('');

// --- تسجيل الصوت بالمتصفح بأبسط شكل ممكن ---
const recordingState = ref('idle'); // idle | recording | recorded
const audioBlob = ref(null);
const audioUrl = ref(null);
const audioFileName = ref('');
const recordingDuration = ref(0);
const audioFileInput = ref(null);

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let timerInterval = null;

const formattedDuration = computed(() => {
  const mins = Math.floor(recordingDuration.value / 60);
  const secs = recordingDuration.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// بدء التسجيل عبر الميكروفون
const startRecording = async () => {
  try {
    errorMessage.value = '';
    recordingDuration.value = 0;
    audioChunks = [];

    // طلب الوصول للمايك مباشرة وبأبسط شكل مدعوم من المتصفح
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // إنشاء مسجل الصوت الافتراضي للمتصفح بدون قيود معقدة
    mediaRecorder = new MediaRecorder(audioStream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      // إيقاف مسار المايك فوراً لتحريره للنظام
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }

      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(audioChunks, { type: mimeType });
      audioBlob.value = blob;
      audioUrl.value = URL.createObjectURL(blob);
      audioFileName.value = '';
      recordingState.value = 'recorded';
    };

    mediaRecorder.start();
    recordingState.value = 'recording';

    // عداد الثواني للتسجيل
    timerInterval = setInterval(() => {
      recordingDuration.value++;
    }, 1000);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    errorMessage.value = 'تعذر تشغيل الميكروفون. يرجى التأكد من إعطاء الصلاحية في المتصفح، أو يمكنك اختيار ملف صوتي جاهز من جهازك مباشرة.';
    stopRecordingCleanup();
  }
};

// إيقاف التسجيل العادي
const stopRecording = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

const stopRecordingCleanup = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }
};

// فتح اختيار الملف الصوتي من الجهاز كبديل للمايك
const triggerFileInput = () => {
  if (audioFileInput.value) {
    audioFileInput.value.click();
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  clearRecording();
  audioBlob.value = file;
  audioFileName.value = file.name;
  audioUrl.value = URL.createObjectURL(file);
  recordingState.value = 'recorded';
};

// مسح وإعادة التسجيل
const clearRecording = () => {
  stopRecordingCleanup();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (e) {}
  }
  audioBlob.value = null;
  audioFileName.value = '';
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
  }
  audioChunks = [];
  recordingDuration.value = 0;
  recordingState.value = 'idle';
  if (audioFileInput.value) {
    audioFileInput.value.value = '';
  }
};

// --- إرسال البيانات للباك إند (Submit) ---
const submitTask = async () => {
  if (!form.value.assigned_to || !form.value.deadline) {
    errorMessage.value = 'يرجى تحديد الموظف ووقت التسليم.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  const formData = new FormData();
  formData.append('assigned_to', form.value.assigned_to);
  formData.append('deadline', form.value.deadline);
  
  if (form.value.title) formData.append('title', form.value.title);
  if (form.value.description) formData.append('description', form.value.description);
  
  if (audioBlob.value) {
    if (audioBlob.value.name) {
      // ملف مرفوع من الجهاز
      formData.append('voice_record', audioBlob.value, audioBlob.value.name);
    } else {
      // صوت مسجل من المتصفح
      let ext = 'webm';
      if (audioBlob.value.type.includes('mp4')) ext = 'mp4';
      else if (audioBlob.value.type.includes('ogg')) ext = 'ogg';
      else if (audioBlob.value.type.includes('mpeg') || audioBlob.value.type.includes('mp3')) ext = 'mp3';
      else if (audioBlob.value.type.includes('wav')) ext = 'wav';

      formData.append('voice_record', audioBlob.value, `record.${ext}`);
    }
  }

  try {
    const response = await api.post('/quick-tasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    emit('taskCreated', response.data.data);
    form.value = { assigned_to: '', title: '', description: '', deadline: '' };
    clearRecording();
  } catch (error) {
    console.error(error);
    errorMessage.value = error.response?.data?.message || 'حدث خطأ غير متوقع أثناء إرسال المهمة.';
  } finally {
    isSubmitting.value = false;
  }
};

onUnmounted(() => {
  clearRecording();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

.create-quick-task-card,
.create-quick-task-card * {
  font-family: 'Cairo', sans-serif !important;
}
</style>