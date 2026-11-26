import { computed } from 'vue'
import { useNotificationTemplates } from '@/composables/useNotificationTemplates'
import { useAuthStore } from '@/stores/authStore'
import alertService from '@/services/alertService'
import { getExecutors, getPlanDisplayName, getPlanFileLink } from '../utils/planHelpers'

/**
 * Shared WhatsApp & notification message builder composable for Content Plans.
 */
export function useContentPlansNotifications(allUsersRef) {
  const authStore = useAuthStore()
  const { fetchTemplates: fetchNotificationTemplates, renderTemplate } = useNotificationTemplates()

  const currentUser = computed(() => authStore.user || {})

  const formatPhone = (phone) => {
    if (!phone) return null
    let cleaned = String(phone).replace(/[^0-9]/g, '')
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = `20${cleaned.substring(1)}`
    } else if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2)
    }
    return cleaned
  }

  const getManagersList = () =>
    (allUsersRef.value || []).filter((u) => u.role === 'manager')

  const getPlanTemplatePayload = (plan, targetUser = null, extra = {}) => {
    const clientName = plan?.client?.name || ''
    const planName = getPlanDisplayName(plan)
    const targetUserName = targetUser?.name || ''
    const finalLink = plan?.final_link || plan?.plan_file_link || ''
    const sysLink = plan?.id
      ? `${window.location.origin}/content-plans?plan=${plan.id}`
      : window.location.href
    const currentUserName = currentUser.value?.name || ''
    const notesText = plan?.notes || extra.notes || ''

    return {
      employee_name: targetUserName,
      assignee_name: targetUserName,
      user_name: targetUserName,
      target_user: targetUserName,
      contact_name: targetUserName,
      reviewer_name: targetUserName,
      submitter_name: currentUserName,
      manager_name: currentUserName || 'الإدارة',
      executor_name: targetUserName || 'فريق العمل',
      client_name: clientName || 'عميلنا العزيز',
      plan_name: planName,
      start_date: plan?.start_date || '',
      delivery_date: plan?.planned_delivery_date || '',
      delay_duration: extra.delay_duration || 'مستحق الآن',
      link: sysLink,
      plan_link: sysLink,
      system_link: sysLink,
      final_link: finalLink || sysLink,
      drive_link: finalLink || sysLink,
      file_link: finalLink || sysLink,
      notes: notesText,
      rejection_notes: notesText || 'يرجى مراجعة الملاحظات بالنظام',
      rejection_reason: notesText || 'يرجى مراجعة الملاحظات بالنظام',
      ...extra,
    }
  }

  const generateWaLink = (type, plan, specificUser = null) => {
    if (!plan) return '#'
    let phone = ''
    let message = ''
    let targetUser = specificUser
    const planName = getPlanDisplayName(plan)
    const clientName = plan.client?.name || ''
    const finalLink = plan.final_link || plan.plan_file_link || ''

    switch (type) {
      case 'plan_assigned':
        targetUser = targetUser || plan.users?.find((u) => u.pivot?.task_role === 'responsible')
        message = renderTemplate(
          'plan_assigned',
          getPlanTemplatePayload(plan, targetUser),
          () =>
            `مرحباً ${targetUser?.name || ''}،\nتم إسناد خطة جديدة لك لعميل (*${clientName}*).\n📌 الخطة: ${planName}\nيرجى الدخول للنظام والبدء في الإنجاز.`,
        )
        break

      case 'review_needed':
        targetUser = targetUser || plan.users?.find((u) => u.pivot?.task_role === 'reviewer')
        message = renderTemplate(
          'plan_review_needed',
          getPlanTemplatePayload(plan, targetUser),
          () =>
            `مرحباً ${targetUser?.name || ''}،\nيوجد خطة لعميل (*${clientName}*) بانتظار مراجعتك الداخلية الآن.\n📌 الخطة: ${planName}\n🔗 الرابط: ${finalLink}`,
        )
        break

      case 'plan_rejected':
        targetUser = targetUser || plan.users?.find((u) => u.pivot?.task_role === 'responsible')
        message = renderTemplate(
          'plan_rejected',
          getPlanTemplatePayload(plan, targetUser),
          () =>
            `مرحباً ${targetUser?.name || ''}،\nتم رفض خطة العميل (*${clientName}*).\n📌 الخطة: ${planName}\nيرجى الدخول للنظام لقراءة الملاحظات وتعديلها.`,
        )
        break

      case 'plan_approved':
        targetUser = targetUser || plan.users?.find((u) => u.pivot?.task_role === 'responsible')
        message = renderTemplate(
          'plan_approved_internal',
          getPlanTemplatePayload(plan, targetUser),
          () =>
            `مرحباً ${targetUser?.name || ''}،\nتمت الموافقة على خطة العميل (*${clientName}*).\n📌 الخطة: ${planName}\nالخطة جاهزة الآن للتسليم النهائي، يرجى المتابعة وتسليمها.`,
        )
        break

      case 'plan_delayed': {
        const roleToBlame = plan.status === 'under_review' ? 'reviewer' : 'responsible'
        targetUser = targetUser || plan.users?.find((u) => u.pivot?.task_role === roleToBlame)
        message = renderTemplate(
          'plan_delayed_alert',
          getPlanTemplatePayload(plan, targetUser, { delay_duration: 'مستحق الآن' }),
          () =>
            `مرحباً ${targetUser?.name || ''}،\n-- تنبيه بتأخير إنجاز خطة العميل (*${clientName}*) عن الموعد المحدد.\nيرجى سرعة الإنجاز لتجنب تعطيل العمل.`,
        )
        break
      }

      case 'client_delivery':
        phone = plan.client?.phone
        message = renderTemplate(
          'client_final_delivery',
          getPlanTemplatePayload(plan, null, {
            client_name: clientName || 'عميلنا العزيز',
            notes: plan.notes ? `\n📝 ملاحظات: ${plan.notes}` : '',
          }),
          () =>
            `مرحباً بك عميلنا العزيز (*${clientName}*)،\nتم اعتماد خطة العمل الخاصة بك بنجاح.\nيمكنك الاطلاع عليها من الرابط التالي:\n${finalLink}\n\nنسعد بخدمتكم.`,
        )
        break

      case 'manager_delivery':
      case 'manager_details_updated':
        targetUser = targetUser || getManagersList()[0]
        message = renderTemplate(
          'manager_delivery',
          getPlanTemplatePayload(plan, targetUser, {
            manager_name: targetUser?.name || 'يا مدير',
            notes: plan.notes ? `📝 الملاحظات: ${plan.notes}` : '',
          }),
          () =>
            `مرحباً ${targetUser?.name || 'يا مدير'}،\n✅ تم التسليم النهائي لخطة العميل (*${clientName}*) بنجاح.\n\n📌 *اسم الخطة:* ${planName}\n🔗 *رابط التسليم النهائي:* ${finalLink || 'لم يُحدد'}\n` +
            (plan.notes ? `📝 *الملاحظات:* ${plan.notes}\n` : '') +
            `\nتم اعتماد الخطة وتسليمها للعميل بنجاح.`,
        )
        break

      case 'executors_start':
        targetUser = targetUser || getExecutors(plan)[0] || null
        message = renderTemplate(
          'executors_start',
          getPlanTemplatePayload(plan, targetUser, {
            executor_name: targetUser?.name || 'فريق العمل',
          }),
          () =>
            `مرحباً ${targetUser?.name || ''}،\nتم اعتماد وتسليم خطة العميل (*${clientName}*).\nيرجى البدء في مهام التنفيذ الخاصة بك.\nرابط الخطة: ${finalLink}`,
        )
        break
    }

    if (type !== 'client_delivery' && targetUser) phone = targetUser.phone
    const formattedPhone = formatPhone(phone)
    if (!formattedPhone) return null
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
  }

  const getClientDeliveryMessage = (plan) => {
    if (!plan) return ''
    const clientName = plan.client?.name || ''
    const planName = getPlanDisplayName(plan)
    const finalLink = plan.final_link || plan.plan_file_link || ''
    const notes = plan.notes || ''
    const sysLink = plan.id ? `${window.location.origin}/content-plans?plan=${plan.id}` : ''

    const fallback = () => {
      let msg = `-- *تنبيه من فريق العمل - نظام Octo Space*\n\nمرحباً بكم فريق عمل (*${clientName || 'عميلنا العزيز'}*)،\n`
      msg += `يسعدنا إبلاغكم بأنه قد تم الاعتماد والتسليم النهائي لخطة العمل (*${planName}*) بنجاح 🎉✅.\n\n`
      if (finalLink) msg += `🔗 *رابط الاطلاع على الخطة المعتمدة:* ${finalLink}\n`
      if (notes) msg += `📝 *ملاحظات مرفقة:* ${notes}\n`
      msg += `\nجاهزون للبدء والتنفيذ ونسعد بتواصلكم دائماً. 🙏`
      return msg
    }

    return renderTemplate(
      'client_final_delivery',
      {
        client_name: clientName || 'العميل',
        plan_name: planName,
        final_link: finalLink || 'رابط الخطة المعتمدة',
        drive_link: finalLink || '',
        file_link: finalLink || '',
        link: finalLink || sysLink,
        notes: notes || 'لا توجد ملاحظات إضافية',
      },
      fallback,
      false,
    )
  }

  const getClientReviewMessage = (plan, contactName = '') => {
    if (!plan) return ''
    const clientName = plan.client?.name || ''
    const planName = getPlanDisplayName(plan)
    const fileLink = getPlanFileLink(plan) || plan.final_link || ''
    const namePart = contactName
      ? `أستاذ/ة ${contactName}`
      : clientName
        ? `فريق عمل ${clientName}`
        : 'عميلنا العزيز'
    const notes = plan.notes || ''
    const sysLink = plan.id ? `${window.location.origin}/content-plans?plan=${plan.id}` : ''

    const fallback = () => {
      let msg = `-- *تنبيه من فريق العمل - نظام Octo Space*\n\nمرحباً ${namePart}،\n`
      msg += `يسعدنا إبلاغكم بأنه قد تمت المراجعة الداخلية لخطة العمل (*${planName}*) بنجاح ✅.\n\n`
      msg += `الخطة الآن جاهزة وبانتظار مراجعتكم الكريمة وملاحظاتكم للبدء في النشر أو التعديل حسب توجيهاتكم.\n`
      if (fileLink) msg += `\n🔗 *رابط الاطلاع على الخطة:* ${fileLink}\n`
      if (notes) msg += `📝 *ملاحظات مرفقة:* ${notes}\n`
      msg += `\nنسعد بملاحظاتكم وتواصلكم دائماً. 🙏`
      return msg
    }

    return renderTemplate(
      'client_review_done',
      {
        contact_name: namePart,
        employee_name: namePart,
        user_name: namePart,
        client_name: clientName || 'العميل',
        plan_name: planName,
        file_link: fileLink || 'رابط الخطة غير متاح',
        drive_link: fileLink || 'رابط الخطة غير متاح',
        final_link: fileLink || 'رابط الخطة غير متاح',
        link: fileLink || sysLink,
        notes: notes || 'لا توجد ملاحظات إضافية',
      },
      fallback,
      false,
    )
  }

  const getClientContactWaLink = (plan, phone, contactName = '') => {
    if (!plan || !phone) return '#'
    const digits = String(phone).replace(/[^0-9+]/g, '').replace(/^00/, '+')
    const normalized = digits.startsWith('+')
      ? digits.slice(1)
      : digits.startsWith('0')
        ? `20${digits.slice(1)}`
        : digits
    const message = getClientReviewMessage(plan, contactName)
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
  }

  const notifyClientGroup = async (grp, plan, type = 'review_done') => {
    if (!grp || !grp.url) {
      alertService.smartToast('رابط الجروب غير متاح')
      return
    }
    const message =
      type === 'delivery' ? getClientDeliveryMessage(plan) : getClientReviewMessage(plan)
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message)
        alertService.smartToast(
          `تم نسخ رسالة ${type === 'delivery' ? 'التسليم' : 'المراجعة'} بنجاح! جاري فتح الجروب للصقها 📋✅`,
        )
      } else {
        alertService.smartToast('جاري فتح الجروب...')
      }
    } catch {
      alertService.smartToast('جاري فتح الجروب...')
    }
    window.open(grp.url, '_blank', 'noopener,noreferrer')
  }

  return {
    fetchNotificationTemplates,
    getManagersList,
    generateWaLink,
    getClientDeliveryMessage,
    getClientReviewMessage,
    getClientContactWaLink,
    notifyClientGroup,
  }
}
