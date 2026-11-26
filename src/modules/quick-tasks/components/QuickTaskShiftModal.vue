<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue && task"
        class="quick-tasks-modal-root fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-[#080d26]/80 backdrop-blur-md"
        dir="rtl"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="relative w-full max-w-md rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(125,232,220,0.1)] border border-[#8999e2]/20 bg-[#10163a] p-6 text-[#f1f4ff]">
          <button
            type="button"
            class="absolute top-5 left-5 text-[#8390be] hover:text-[#fff] text-xl font-bold"
            @click="$emit('update:modelValue', false)"
          >
            ×
          </button>

          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl p-2 rounded-xl bg-[#7de8dc]/15 border border-[#7de8dc]/30">⏱️</span>
            <div>
              <h3 class="text-lg font-black text-white">تشفيت ساعات المهمة</h3>
              <p class="text-xs text-[#8390be]">نقل جزء من ساعات المهمة السريعة ليوم عمل آخر</p>
            </div>
          </div>

          <div class="bg-[#0a102f]/80 p-3.5 rounded-xl border border-[#8999e2]/15 mb-4 text-xs space-y-1">
            <span class="text-[#7de8dc] font-bold block">المهمة: {{ task.title }}</span>
            <div class="flex flex-wrap items-center justify-between gap-2 text-[#8390be]">
              <span>
                المتاح للترحيل من يوم <strong class="text-white">{{ shiftForm.from_date }}</strong>:
                <strong class="text-[#7de8dc]">{{ maxShiftHours }} س</strong>
              </span>
              <router-link
                :to="{
                  path: '/today-board',
                  query: {
                    ...(task.assigned_to ? { user_id: task.assigned_to } : {}),
                    date: shiftForm.from_date,
                  },
                }"
                class="text-[#7de8dc] hover:underline font-bold"
                @click="$emit('update:modelValue', false)"
              >
                عرض جدول الساعات ↗
              </router-link>
            </div>
          </div>

          <form class="space-y-4" @submit.prevent="submitShift">
            <div>
              <label class="block text-xs font-bold text-[#8390be] mb-1.5">
                عدد الساعات المراد ترحيلها:
                <span class="text-[#7de8dc] font-black">{{ shiftForm.hours }} س</span>
              </label>
              <input
                v-model.number="shiftForm.hours"
                type="number"
                step="0.5"
                min="0.5"
                :max="maxShiftHours"
                required
                class="w-full bg-[#0a102f]/90 text-white p-2.5 rounded-xl border border-[#8999e2]/25 text-center font-bold text-sm outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#8390be] mb-1.5">تاريخ التشفيت إليه:</label>
              <input
                v-model="shiftForm.to_date"
                type="date"
                required
                class="w-full bg-[#0a102f]/90 text-white p-2.5 rounded-xl border border-[#8999e2]/25 text-sm outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#8390be] mb-1.5">سبب التشفيت (اختياري):</label>
              <input
                v-model="shiftForm.reason"
                type="text"
                placeholder="سبب التشفيت..."
                class="w-full bg-[#0a102f]/90 text-white p-2.5 rounded-xl border border-[#8999e2]/25 text-sm outline-none"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="px-4 py-2 text-xs rounded-xl border border-[#8999e2]/20 text-[#8390be]"
                @click="$emit('update:modelValue', false)"
              >
                إلغاء
              </button>
              <button
                type="submit"
                class="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-[#7de8dc] to-[#10b981] text-[#080d26] font-extrabold"
                :disabled="isShifting"
              >
                {{ isShifting ? 'جارٍ التشفيت...' : 'تأكيد التشفيت ⏱️' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  task: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'shifted'])

const isShifting = ref(false)
const shiftForm = ref({
  hours: 1,
  from_date: '',
  to_date: '',
  reason: '',
})

const maxShiftHours = computed(() => {
  if (!props.task) return 1
  const avail = Number(props.task.available_shift_hours ?? props.task.estimated_hours ?? 1)
  return avail > 0 ? avail : Number(props.task.estimated_hours || 1)
})

watch(
  [() => props.modelValue, () => props.task],
  ([open, task]) => {
    if (!open || !task) return
    const available = Number(task.available_shift_hours ?? task.estimated_hours ?? 1)
    const fallbackDate = task.deadline
      ? task.deadline.split('T')[0].split(' ')[0]
      : new Date().toISOString().split('T')[0]
    const fromDate = task.shift_source_date || fallbackDate
    const nextDay = new Date(`${fromDate}T12:00:00`)
    nextDay.setDate(nextDay.getDate() + 1)
    const nextDayStr = Number.isNaN(nextDay.getTime())
      ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
      : nextDay.toISOString().split('T')[0]

    shiftForm.value = {
      hours: Math.min(available, Number(task.estimated_hours || available || 1)),
      from_date: fromDate,
      to_date: nextDayStr,
      reason: '',
    }
  },
  { immediate: true },
)

const submitShift = async () => {
  if (!props.task) return
  const task = props.task
  const assigneeId = task.assigned_to || task.assignee_id || task.assignee?.id
  if (!assigneeId) {
    alertService.error('لا يمكن الترحيل لمهمة غير مسندة لموظف محدد.')
    return
  }
  if (!shiftForm.value.to_date || shiftForm.value.to_date === shiftForm.value.from_date) {
    alertService.error('يرجى اختيار تاريخ مختلف عن تاريخ المصدر.')
    return
  }

  isShifting.value = true
  try {
    const res = await api.post('/workload/shift-hours', {
      user_id: assigneeId,
      task_type: 'quick_task',
      task_id: task.id,
      hours: Number(shiftForm.value.hours),
      from_date: shiftForm.value.from_date,
      to_date: shiftForm.value.to_date,
      reason: shiftForm.value.reason || 'ترحيل يدوي من لوحة المهام السريعة',
    })

    if (res.data?.success || res.data?.status) {
      alertService.success(res.data.message || 'تم ترحيل الساعات بنجاح! ⏱️')
      emit('update:modelValue', false)
      emit('shifted')
    }
  } catch (err) {
    console.error('Error shifting quick task hours:', err)
    alertService.error(err.response?.data?.message || 'حدث خطأ أثناء ترحيل الساعات.')
  } finally {
    isShifting.value = false
  }
}
</script>
