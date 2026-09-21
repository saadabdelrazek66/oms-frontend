<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-[#080d26]/85 backdrop-blur-md"
        @click.self="closeModal"
        dir="rtl"
      >
        <div
          class="relative w-full max-w-lg rounded-[2rem] bg-[#10163a] border border-[#25D366]/35 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(37,211,102,0.2)] text-[#f1f4ff] overflow-hidden"
          dir="rtl"
        >
          <!-- شريط توهج علوي خفيف -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#25D366] to-transparent opacity-80"></div>

          <!-- زر الإغلاق السريع في الزاوية -->
          <button
            type="button"
            @click="closeModal"
            class="absolute top-5 left-5 text-[#8390be] hover:text-[#f1f4ff] hover:bg-[#1c265c] rounded-full w-9 h-9 flex items-center justify-center transition-colors border border-transparent hover:border-[#8999e2]/30 cursor-pointer"
            title="إغلاق"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <!-- رأس المودال: أيقونة واتساب وعنوان الإجراء -->
          <div class="text-center mb-5">
            <div class="w-16 h-16 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/35 text-[#25D366] flex items-center justify-center mx-auto mb-3.5 shadow-[0_0_25px_rgba(37,211,102,0.25)]">
              <!-- أيقونة واتساب الرسمية -->
              <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </div>
            <h3 class="text-xl font-black text-[#f1f4ff] mb-1">
              {{ payload.title || 'تنبيه عبر واتساب' }}
            </h3>
            <p class="text-[#8390be] text-xs">
              تم تجهيز رسالة تفاعلية لإبلاغ <strong class="text-[#7de8dc]">{{ payload.recipientName }}</strong>، يمكنك قراءتها أو تعديلها قبل الإرسال.
            </p>
          </div>

          <!-- بطاقة بيانات المستلم ورقم الهاتف -->
          <div class="mb-4 bg-[#0a102f]/80 rounded-2xl p-3.5 border border-[#8999e2]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-[#182552] border border-[#8999e2]/30 flex items-center justify-center text-xs font-black text-[#7de8dc]">
                {{ getInitials(payload.recipientName) }}
              </div>
              <div>
                <span class="block text-[11px] text-[#8390be]">{{ payload.recipientRole }}</span>
                <strong class="text-xs sm:text-sm font-bold text-[#f1f4ff] truncate">{{ payload.recipientName }}</strong>
              </div>
            </div>

            <!-- إدخال / عرض رقم الهاتف -->
            <div class="w-full sm:w-auto flex items-center gap-1.5 bg-[#10163a] px-2.5 py-1.5 rounded-xl border border-[#8999e2]/20">
              <span class="text-[11px] text-[#8390be]">الهاتف:</span>
              <input
                v-model="editablePhone"
                type="text"
                placeholder="مثال: 01012345678"
                class="bg-transparent text-xs font-mono font-bold text-[#7de8dc] outline-none border-none w-32"
                dir="ltr"
              />
            </div>
          </div>

          <!-- تحذير في حال كان رقم الهاتف مفقوداً -->
          <div v-if="!editablePhone" class="mb-3 px-3.5 py-2 rounded-xl bg-[#ff4757]/10 border border-[#ff4757]/30 text-[#ff6b7b] text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>لم يتم العثور على رقم هاتف مسجل للمستلم، يرجى كتابة الرقم أعلاه للإرسال.</span>
          </div>

          <!-- صندوق نص الرسالة القابل للتعديل -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-[#8390be]">نص الرسالة المجهزة (يمكنك التعديل بحرية):</label>
              <span class="text-[10px] text-[#8390be]">{{ editableMessage.length }} حرف</span>
            </div>
            <textarea
              v-model="editableMessage"
              rows="4"
              class="w-full rounded-2xl bg-[#0a102f]/90 border border-[#8999e2]/25 p-3.5 text-xs sm:text-sm text-[#f1f4ff] focus:border-[#25D366] focus:shadow-[0_0_15px_rgba(37,211,102,0.2)] focus:outline-none leading-relaxed transition-all resize-none"
              placeholder="اكتب نص الرسالة هنا..."
            ></textarea>
          </div>

          <!-- الأزرار والإجراءات -->
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              @click="closeModal"
              class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#141b48]/70 hover:bg-[#1c265c] text-[#8390be] hover:text-[#f1f4ff] font-bold text-xs sm:text-sm border border-[#8999e2]/20 transition-all cursor-pointer text-center"
            >
              تخطي / لاحقاً
            </button>

            <button
              type="button"
              @click="sendWhatsAppMessage"
              :disabled="!editablePhone || !editableMessage"
              class="w-full flex-1 py-3 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm sm:text-base shadow-[0_4px_20px_rgba(37,211,102,0.38)] flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <!-- أيقونة واتساب الصغيرة داخل الزر -->
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span>إرسال عبر واتساب 🚀</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { getWhatsAppPayload, formatWhatsAppPhone } from '../utils/quickTaskWhatsApp';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  event: {
    type: String, // 'created' | 'submitted' | 'approved' | 'rejected'
    default: 'created'
  },
  task: {
    type: Object,
    default: () => ({})
  },
  users: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:isOpen', 'close', 'sent']);

const editableMessage = ref('');
const editablePhone = ref('');

// تجهيز البيانات الافتراضية
const payload = computed(() => {
  if (!props.task) return {};

  // نسخة من المهمة مع إمكانية استكمال البيانات المفقودة من قائمة المستخدمين
  const enrichedTask = { ...props.task };

  if (props.users && props.users.length > 0) {
    const assigneeId = enrichedTask.assigned_to || enrichedTask.assignee_id || enrichedTask.assignee?.id;
    if (assigneeId) {
      const foundAssignee = props.users.find(u => u.id === assigneeId);
      if (foundAssignee) {
        if (!enrichedTask.assignee_name && !enrichedTask.assignee?.name) {
          enrichedTask.assignee_name = foundAssignee.name;
        }
        if (!enrichedTask.assignee_phone && !enrichedTask.assignee?.phone) {
          enrichedTask.assignee_phone = foundAssignee.phone;
        }
      }
    }

    const creatorId = enrichedTask.created_by || enrichedTask.creator_id || enrichedTask.creator?.id;
    if (creatorId) {
      const foundCreator = props.users.find(u => u.id === creatorId);
      if (foundCreator) {
        if (!enrichedTask.creator_name && !enrichedTask.creator?.name) {
          enrichedTask.creator_name = foundCreator.name;
        }
        if (!enrichedTask.creator_phone && !enrichedTask.creator?.phone) {
          enrichedTask.creator_phone = foundCreator.phone;
        }
      }
    }
  }

  return getWhatsAppPayload(props.event, enrichedTask);
});

// تحديث الحقول عند تغير المهمة أو الحدث أو فتح المودال
watch(
  () => [props.isOpen, props.event, props.task],
  ([open]) => {
    if (open && payload.value) {
      editableMessage.value = payload.value.message || '';
      editablePhone.value = payload.value.phone || '';
    }
  },
  { immediate: true, deep: true }
);

const getInitials = (name = '') => {
  if (!name) return '؟';
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

const closeModal = () => {
  emit('update:isOpen', false);
  emit('close');
};

const sendWhatsAppMessage = () => {
  if (!editablePhone.value) return;

  const formattedPhone = formatWhatsAppPhone(editablePhone.value);
  if (!formattedPhone) {
    alert('رقم الهاتف غير صالح، يرجى كتابة رقم صحيح يتضمن كود الدولة.');
    return;
  }

  const encoded = encodeURIComponent(editableMessage.value);
  const waUrl = `https://wa.me/${formattedPhone}?text=${encoded}`;

  window.open(waUrl, '_blank');
  emit('sent', { phone: formattedPhone, message: editableMessage.value });
  closeModal();
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.94) translateY(12px);
}
</style>
