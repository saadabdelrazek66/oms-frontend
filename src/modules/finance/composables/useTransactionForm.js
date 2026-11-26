import { computed, reactive, ref, watch } from 'vue'
import api from '@/axios'
import alertService from '@/services/alertService'
import { formatLocalDate, formatLocalMonth } from '../utils/financeHelpers'

const mapAccountToPaymentMethod = (account) => {
  if (!account) return 'cash'
  const type = account.type?.value || account.type || ''
  const name = (account.name || '').toLowerCase()
  if (name.includes('insta') || name.includes('إنستا')) return 'instapay'
  if (name.includes('voda') || name.includes('فودافون') || name.includes('كاش')) return 'vodafone_cash'
  if (type === 'bank' || name.includes('بنك') || name.includes('bank')) return 'bank_transfer'
  if (type === 'pos' || name.includes('فيزا') || name.includes('visa') || name.includes('card')) return 'credit_card'
  if (type === 'cash') return 'cash'
  if (type === 'wallet') return 'vodafone_cash'
  return 'other'
}

const TECHNICAL_ERROR_MARKERS = [
  'SQLSTATE',
  'QueryException',
  'syntax error',
  'The given data was invalid',
  'The selected revenue nature is invalid',
  'The revenue nature field is invalid',
  'App\\',
  'vendor/',
  '.php',
  'at line',
  'Stack trace',
]

/**
 * Form state, duplicate salary/retainer checks, balance validation,
 * and multipart FormData submission for TransactionModal.
 */
export function useTransactionForm(props, emit) {
  const isEditing = computed(() => Boolean(props.transaction?.id))
  const submitting = ref(false)
  const amountError = ref('')
  const fileInputRef = ref(null)
  const attachmentFile = ref(null)

  const salaryEntityType = ref('system')
  const clientEntityType = ref('system')
  const selectedUserId = ref('')
  const selectedClientId = ref('')
  const salaryDuplicateWarning = ref('')
  const isSalaryDuplicate = ref(false)
  const salaryDuplicateDetails = ref(null)

  const retainerDuplicateWarning = ref('')
  const hasRetainerDuplicate = ref(false)
  const retainerDuplicateDetails = ref(null)
  const retainerConfirmedByUser = ref(false)
  const isCheckingRetainer = ref(false)

  const form = reactive({
    type: 'expense',
    amount: '',
    currency: 'EGP',
    account_id: '',
    category_id: '',
    payment_method: 'cash',
    transaction_date: formatLocalDate(),
    reference_number: '',
    notes: '',
    beneficiary_name: '',
    entity_type: null,
    entity_id: null,
    revenue_nature: 'recurring_retainer',
    salary_month: formatLocalMonth(),
    existing_attachment_name: '',
  })

  const activeAccounts = computed(() => props.accounts.filter((a) => a.is_active !== false))
  const selectedAccount = computed(() => props.accounts.find((a) => a.id == form.account_id))

  const availableBalance = computed(() => {
    if (!selectedAccount.value) return 0
    let bal = Number(selectedAccount.value.current_balance ?? selectedAccount.value.balance ?? 0)
    if (
      isEditing.value &&
      props.transaction &&
      props.transaction.account_id == form.account_id &&
      props.transaction.status === 'completed'
    ) {
      bal +=
        props.transaction.type === 'expense'
          ? Number(props.transaction.amount || 0)
          : -Number(props.transaction.amount || 0)
    }
    return bal
  })

  const isInsufficientBalance = computed(() => {
    if (form.type !== 'expense' || !form.account_id || !form.amount) return false
    const amt = Number(form.amount)
    return !isNaN(amt) && amt > 0 && amt > availableBalance.value
  })

  watch(
    () => form.account_id,
    (newId) => {
      const acc = props.accounts.find((a) => a.id == newId)
      if (acc) form.payment_method = mapAccountToPaymentMethod(acc)
    },
    { immediate: true },
  )

  const filteredCategories = computed(() =>
    props.categories.filter((c) => c.type === form.type && c.is_active !== false),
  )
  const selectedCategory = computed(() => props.categories.find((c) => c.id == form.category_id))

  const isFixedCategory = computed(() => {
    if (form.type !== 'expense' || !selectedCategory.value) return false
    const cat = selectedCategory.value
    const isCostFixed = cat.cost_type === 'fixed' || cat.slug === 'office_rent'
    return isCostFixed && cat.fixed_amount != null && Number(cat.fixed_amount) > 0
  })

  const isSalaryCategory = computed(() => {
    const cat = selectedCategory.value
    return Boolean(cat && (cat.slug === 'salaries' || cat.name?.includes('رواتب') || cat.name?.includes('أجور')))
  })

  const isRetainerCategory = computed(() => {
    const cat = selectedCategory.value
    if (!cat) return false
    const slug = (cat.slug || '').toLowerCase()
    const name = (cat.name || '').toLowerCase()
    return (
      slug === 'client_monthly_retainers' ||
      slug.includes('retainer') ||
      name.includes('عقود شهرية') ||
      name.includes('عقد شهري') ||
      name.includes('retainer')
    )
  })

  const validateAmount = (touched = false) => {
    if (!form.amount || Number(form.amount) <= 0) {
      amountError.value =
        touched || (form.amount !== '' && form.amount !== null && form.amount !== undefined)
          ? 'يرجى إدخال مبلغ مالي أكبر من صفر.'
          : ''
    } else if (Number(form.amount) > 999999999.99) {
      amountError.value = 'المبلغ يتجاوز الحد الأقصى المسموح به.'
    } else if (isInsufficientBalance.value) {
      amountError.value = `رصيد (${selectedAccount.value?.name || 'وسيلة الدفع'}) غير كافٍ! المتاح: ${Number(availableBalance.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedAccount.value?.currency || 'EGP'}`
    } else {
      amountError.value = ''
    }
  }

  const onCategoryChanged = () => {
    if (isSalaryCategory.value && !form.salary_month) {
      form.salary_month = formatLocalMonth()
    }
    if (isFixedCategory.value && selectedCategory.value?.fixed_amount) {
      form.amount = String(selectedCategory.value.fixed_amount)
      validateAmount(false)
    }
  }

  const setType = (type) => {
    form.type = type
    const matchingCat = props.categories.find((c) => c.type === type && c.is_active !== false)
    form.category_id = matchingCat ? matchingCat.id : ''
    if (isFixedCategory.value && selectedCategory.value?.fixed_amount) {
      form.amount = String(selectedCategory.value.fixed_amount)
      validateAmount(false)
    }
  }

  watch(() => form.category_id, onCategoryChanged)
  watch([() => form.type, () => form.amount, () => form.account_id], () => validateAmount(false))

  const selectedUserSalaryInfo = computed(() => {
    if (salaryEntityType.value !== 'system' || !selectedUserId.value) return null
    const u = props.users.find((usr) => Number(usr.id) === Number(selectedUserId.value))
    if (!u) return null
    const sal = u.salary ?? u.base_salary
    if (sal != null && sal !== '' && Number(sal) > 0) {
      return `${Number(sal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`
    }
    return null
  })

  const checkSalaryDuplicate = async () => {
    if (
      !props.show ||
      form.type !== 'expense' ||
      !isSalaryCategory.value ||
      salaryEntityType.value !== 'system' ||
      !selectedUserId.value ||
      !form.salary_month
    ) {
      salaryDuplicateWarning.value = ''
      isSalaryDuplicate.value = false
      salaryDuplicateDetails.value = null
      return
    }
    try {
      const params = { user_id: selectedUserId.value, salary_month: form.salary_month }
      if (isEditing.value && props.transaction?.id) params.transaction_id = props.transaction.id

      const res = await api.get('/finance/salaries/check-status', { params })
      const data = res.data?.data
      if (data?.is_paid) {
        isSalaryDuplicate.value = true
        const existing = data.existing_transaction || data
        salaryDuplicateDetails.value = existing
        const amountFormatted = Number(existing.amount || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        salaryDuplicateWarning.value = `تم بالفعل صرف وتسجيل راتب هذا الموظف لشهر (${form.salary_month}) مسبقاً بموجب المعاملة رقم [${existing.transaction_number || ''}] بمبلغ ${amountFormatted} ج.م. يمنع النظام صرف الراتب مرتين لنفس الشهر منعاً للازدواجية المالية.`
      } else {
        isSalaryDuplicate.value = false
        salaryDuplicateDetails.value = null
        salaryDuplicateWarning.value = ''
      }
    } catch (err) {
      console.error('Error checking salary status:', err)
    }
  }

  const onUserSelected = () => {
    const u = props.users.find((usr) => Number(usr.id) === Number(selectedUserId.value))
    if (!u) return
    form.entity_type = 'App\\Models\\User'
    form.entity_id = u.id
    form.beneficiary_name = u.name
    const userSalary = u.salary ?? u.base_salary
    form.amount = userSalary != null && userSalary !== '' && Number(userSalary) > 0 ? String(userSalary) : ''
    validateAmount(false)
    checkSalaryDuplicate()
  }

  const onClientSelected = () => {
    if (!selectedClientId.value) {
      form.entity_type = null
      form.entity_id = null
      form.beneficiary_name = ''
      return
    }
    const c = props.clients.find((cl) => Number(cl.id) === Number(selectedClientId.value))
    if (c) {
      form.entity_type = 'App\\Models\\Client'
      form.entity_id = c.id
      form.beneficiary_name = c.name
    } else if (
      props.prefilledClient &&
      Number(props.prefilledClient.id || props.prefilledClient.client_id) === Number(selectedClientId.value)
    ) {
      form.entity_type = 'App\\Models\\Client'
      form.entity_id = props.prefilledClient.id || props.prefilledClient.client_id
      form.beneficiary_name = props.prefilledClient.name || props.prefilledClient.client_name || ''
    }
  }

  watch([salaryEntityType, () => form.salary_month, selectedUserId], checkSalaryDuplicate)

  const checkClientRetainer = async () => {
    if (!props.show) return
    const isRetainer = form.revenue_nature === 'recurring_retainer' || isRetainerCategory.value
    if (
      form.type !== 'income' ||
      clientEntityType.value !== 'system' ||
      !selectedClientId.value ||
      !isRetainer ||
      !form.transaction_date
    ) {
      hasRetainerDuplicate.value = false
      retainerDuplicateWarning.value = ''
      retainerDuplicateDetails.value = null
      retainerConfirmedByUser.value = false
      return
    }

    const month = form.transaction_date.slice(0, 7)
    try {
      isCheckingRetainer.value = true
      const params = { month }
      if (isEditing.value && props.transaction?.id) params.transaction_id = props.transaction.id

      const res = await api.get(`/finance/clients/${selectedClientId.value}/check-retainer`, { params })
      const data = res.data?.data
      if (data?.has_paid_retainer && data?.existing_transaction) {
        hasRetainerDuplicate.value = true
        retainerDuplicateDetails.value = data.existing_transaction
        const amt = Number(data.existing_transaction.amount || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        retainerDuplicateWarning.value = `تم سداد إيراد العقد الشهري المستمر لهذا العميل مسبقاً لشهر (${month}) بموجب المعاملة رقم [${data.existing_transaction.transaction_number}] بمبلغ ${amt} ج.م بتاريخ ${data.existing_transaction.transaction_date}.`
      } else {
        hasRetainerDuplicate.value = false
        retainerDuplicateWarning.value = ''
        retainerDuplicateDetails.value = null
        retainerConfirmedByUser.value = false
      }
    } catch (err) {
      console.error('Error checking client retainer status:', err)
    } finally {
      isCheckingRetainer.value = false
    }
  }

  const confirmRetainerDuplicate = () => {
    retainerConfirmedByUser.value = true
    alertService.toast('✓ تم تأكيد رغبتك في إضافة دفعة ثانية، يمكنك الآن حفظ المعاملة.', 'info')
  }

  const cancelAndCloseModal = () => {
    hasRetainerDuplicate.value = false
    retainerConfirmedByUser.value = false
    retainerDuplicateWarning.value = ''
    retainerDuplicateDetails.value = null
    emit('close')
  }

  watch(
    [() => form.type, clientEntityType, selectedClientId, () => form.revenue_nature, () => form.category_id, () => form.transaction_date],
    () => {
      if (!props.show) return
      retainerConfirmedByUser.value = false
      checkClientRetainer()
    },
  )

  const triggerFileInput = () => fileInputRef.value?.click()

  const onFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alertService.toast('⚠️ حجم الملف يجب ألا يتجاوز 10 ميجابايت', 'warning')
      return
    }
    attachmentFile.value = file
  }

  const clearFile = () => {
    attachmentFile.value = null
    form.existing_attachment_name = ''
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  const initForm = () => {
    amountError.value = ''
    attachmentFile.value = null
    salaryDuplicateWarning.value = ''
    isSalaryDuplicate.value = false
    salaryDuplicateDetails.value = null
    retainerDuplicateWarning.value = ''
    hasRetainerDuplicate.value = false
    retainerDuplicateDetails.value = null
    retainerConfirmedByUser.value = false
    isCheckingRetainer.value = false
    selectedClientId.value = ''
    clientEntityType.value = 'system'
    selectedUserId.value = ''
    salaryEntityType.value = 'system'

    if (props.transaction) {
      const t = props.transaction
      form.type = t.type || 'expense'
      form.amount = t.amount || ''
      form.currency = t.currency || 'EGP'
      form.account_id = t.account_id || ''
      form.category_id = t.category_id || ''
      form.payment_method = t.payment_method || 'cash'
      form.transaction_date = t.transaction_date || formatLocalDate()
      form.reference_number = t.reference_number || ''
      form.notes = t.notes || ''
      form.beneficiary_name = t.beneficiary_name || ''
      form.entity_type = t.entity_type || null
      form.entity_id = t.entity_id || null
      form.revenue_nature = t.revenue_nature || 'recurring_retainer'
      form.salary_month = t.salary_month || formatLocalMonth()
      form.existing_attachment_name = t.attachment_name || ''

      if (t.entity_type?.includes('User')) {
        salaryEntityType.value = 'system'
        selectedUserId.value = t.entity_id
      } else if (t.entity_type?.includes('Client')) {
        clientEntityType.value = 'system'
        selectedClientId.value = t.entity_id
      } else {
        salaryEntityType.value = 'external'
        clientEntityType.value = 'external'
      }
      return
    }

    form.type = props.defaultType || 'expense'
    const preSal = props.prefilledUser?.salary || props.prefilledUser?.base_salary
    form.amount = preSal ? String(preSal) : ''
    form.currency = 'EGP'

    if (props.prefilledAccount) {
      const acc =
        typeof props.prefilledAccount === 'object'
          ? props.prefilledAccount
          : props.accounts.find((a) => a.id == props.prefilledAccount)
      form.account_id = acc ? acc.id : props.accounts[0]?.id || ''
    } else if (props.prefilledUser) {
      const bankAcc = props.accounts.find(
        (a) =>
          a.is_active !== false &&
          ((a.type?.value || a.type) === 'bank' ||
            (a.name || '').includes('بنك') ||
            (a.name || '').toLowerCase().includes('bank')),
      )
      form.account_id = bankAcc ? bankAcc.id : props.accounts[0]?.id || ''
    } else {
      form.account_id = props.accounts[0]?.id || ''
    }

    if (props.prefilledCategory) {
      const cat =
        typeof props.prefilledCategory === 'object'
          ? props.prefilledCategory
          : props.categories.find((c) => c.id == props.prefilledCategory)
      form.category_id = cat ? cat.id : ''
    } else if (props.prefilledUser) {
      const salCat = props.categories.find(
        (c) => c.type === 'expense' && (c.slug === 'salaries' || (c.name || '').includes('رواتب') || (c.name || '').includes('أجور')),
      )
      form.category_id = salCat ? salCat.id : ''
    } else {
      const defaultCat = props.categories.find((c) => c.type === form.type && c.is_active !== false)
      form.category_id = defaultCat ? defaultCat.id : ''
    }

    const currentAcc = props.accounts.find((a) => a.id == form.account_id) || props.accounts[0]
    form.payment_method = mapAccountToPaymentMethod(currentAcc)
    form.transaction_date = formatLocalDate()
    form.reference_number = ''
    form.notes = ''
    form.beneficiary_name = ''
    form.entity_type = null
    form.entity_id = null
    form.revenue_nature = 'recurring_retainer'
    form.salary_month = props.prefilledMonth || formatLocalMonth()
    form.existing_attachment_name = ''

    if (props.prefilledUser) {
      salaryEntityType.value = 'system'
      const matchedUser = props.users.find((u) => Number(u.id) === Number(props.prefilledUser.id))
      selectedUserId.value = matchedUser ? matchedUser.id : props.prefilledUser.id
      form.entity_type = 'App\\Models\\User'
      form.entity_id = selectedUserId.value
      form.beneficiary_name = matchedUser?.name || props.prefilledUser.name || ''
      const effectiveSalary =
        props.prefilledUser.salary ?? props.prefilledUser.base_salary ?? matchedUser?.salary ?? matchedUser?.base_salary
      if (effectiveSalary != null && effectiveSalary !== '' && Number(effectiveSalary) > 0) {
        form.amount = String(effectiveSalary)
      }
      checkSalaryDuplicate()
    } else if (props.prefilledClient) {
      clientEntityType.value = 'system'
      const cId = props.prefilledClient.id || props.prefilledClient.client_id
      selectedClientId.value = cId
      form.entity_type = 'App\\Models\\Client'
      form.entity_id = cId
      const matchedClient = props.clients.find((c) => Number(c.id) === Number(cId))
      form.beneficiary_name =
        matchedClient?.name || props.prefilledClient.name || props.prefilledClient.client_name || ''
      checkClientRetainer()
    }

    onCategoryChanged()
  }

  watch(
    () => props.show,
    (val) => {
      if (val) initForm()
    },
  )

  const submitForm = async () => {
    validateAmount(true)
    if (amountError.value || isInsufficientBalance.value) {
      alertService.toast(
        `❌ رصيد (${selectedAccount.value?.name || 'وسيلة الدفع'}) غير كافٍ لإتمام عملية الصرف، وغير مسموح بأن يصبح الرصيد سالباً!`,
        'error',
      )
      return
    }
    if (isSalaryDuplicate.value) {
      alertService.toast(
        `❌ محظور: تم صرف راتب شهر (${form.salary_month}) لهذا الموظف مسبقاً، ويمنع النظام ازدواجية صرف الراتب!`,
        'error',
      )
      return
    }

    if (isCheckingRetainer.value) {
      let waitCount = 0
      while (isCheckingRetainer.value && waitCount < 30) {
        await new Promise((r) => setTimeout(r, 100))
        waitCount++
      }
    }

    const isRetainer = form.revenue_nature === 'recurring_retainer' || isRetainerCategory.value
    if (
      form.type === 'income' &&
      clientEntityType.value === 'system' &&
      selectedClientId.value &&
      isRetainer &&
      !retainerConfirmedByUser.value &&
      !hasRetainerDuplicate.value
    ) {
      await checkClientRetainer()
    }

    if (hasRetainerDuplicate.value && !retainerConfirmedByUser.value) {
      const month = form.transaction_date ? form.transaction_date.slice(0, 7) : ''
      const existingNum = retainerDuplicateDetails.value?.transaction_number || ''
      const existingAmt = Number(retainerDuplicateDetails.value?.amount || 0).toLocaleString()
      const existingDate = retainerDuplicateDetails.value?.transaction_date || ''
      const confirmed = await alertService.confirm({
        title: 'تنبيه مالي: سداد العقد الشهري مسبقاً',
        message: `تم سداد إيراد العقد الشهري المستمر لهذا العميل مسبقاً لشهر (${month})${existingNum ? ` بموجب المعاملة رقم [${existingNum}]` : ''}${existingAmt ? ` بمبلغ ${existingAmt} ج.م` : ''}${existingDate ? ` بتاريخ ${existingDate}` : ''}.\n\nهل أنت متأكد من رغبتك في إضافة دفعة أخرى لهذا العميل عن نفس الشهر؟`,
        type: 'warning',
        confirmText: 'نعم، متأكد وأرغب في الإضافة',
        cancelText: 'لا، تراجع وإغلاق',
      })
      if (!confirmed) {
        emit('close')
        return
      }
      retainerConfirmedByUser.value = true
    }

    submitting.value = true
    try {
      const formData = new FormData()
      formData.append('type', form.type)
      formData.append('amount', form.amount)
      formData.append('currency', form.currency)
      formData.append('account_id', form.account_id)
      formData.append('category_id', form.category_id)
      formData.append('payment_method', form.payment_method || mapAccountToPaymentMethod(selectedAccount.value) || 'cash')
      formData.append('transaction_date', form.transaction_date)
      if (form.reference_number) formData.append('reference_number', form.reference_number)
      if (form.notes) formData.append('notes', form.notes)

      if (form.type === 'expense' && isSalaryCategory.value) {
        formData.append('salary_month', form.salary_month)
        if (salaryEntityType.value === 'system') {
          formData.append('entity_type', 'App\\Models\\User')
          formData.append('entity_id', selectedUserId.value)
          formData.append('user_id', selectedUserId.value)
        }
        if (form.beneficiary_name) formData.append('beneficiary_name', form.beneficiary_name)
      } else if (form.type === 'income') {
        formData.append('revenue_nature', form.revenue_nature)
        if (retainerConfirmedByUser.value) formData.append('allow_duplicate_retainer', '1')
        if (clientEntityType.value === 'system' && selectedClientId.value) {
          formData.append('entity_type', 'App\\Models\\Client')
          formData.append('entity_id', selectedClientId.value)
          formData.append('client_id', selectedClientId.value)
        }
        if (form.beneficiary_name) formData.append('beneficiary_name', form.beneficiary_name)
      } else if (form.beneficiary_name) {
        formData.append('beneficiary_name', form.beneficiary_name)
      }

      if (attachmentFile.value) formData.append('attachment', attachmentFile.value)

      const url = isEditing.value ? `/finance/transactions/${props.transaction.id}` : '/finance/transactions'
      const res = await api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      alertService.toast(
        isEditing.value ? '✅ تم تحديث المعاملة بنجاح' : '✅ تم تسجيل المعاملة المالية بنجاح',
        'success',
      )
      emit('saved', res.data?.data)
      emit('close')
    } catch (err) {
      const errorData = err.response?.data
      let msg = ''
      if (errorData?.errors && typeof errorData.errors === 'object') {
        if (errorData.errors.revenue_nature) {
          hasRetainerDuplicate.value = true
          msg = Array.isArray(errorData.errors.revenue_nature)
            ? errorData.errors.revenue_nature[0]
            : errorData.errors.revenue_nature
        } else {
          const firstErr = Object.values(errorData.errors).flat()[0]
          if (firstErr) msg = firstErr
        }
      }
      if (!msg && errorData?.message) msg = errorData.message
      const isTechnical = !msg || TECHNICAL_ERROR_MARKERS.some((marker) => msg.includes(marker))
      if (isTechnical) msg = 'تعذر إتمام العملية المالية، يرجى مراجعة البيانات المدخلة والمحاولة مجدداً.'
      alertService.toast(`❌ ${msg}`, 'error', 4500)
    } finally {
      submitting.value = false
    }
  }

  return {
    form,
    isEditing,
    submitting,
    amountError,
    fileInputRef,
    attachmentFile,
    salaryEntityType,
    clientEntityType,
    selectedUserId,
    selectedClientId,
    salaryDuplicateWarning,
    isSalaryDuplicate,
    salaryDuplicateDetails,
    retainerDuplicateWarning,
    hasRetainerDuplicate,
    retainerDuplicateDetails,
    retainerConfirmedByUser,
    activeAccounts,
    selectedAccount,
    availableBalance,
    isInsufficientBalance,
    filteredCategories,
    selectedCategory,
    isFixedCategory,
    isSalaryCategory,
    selectedUserSalaryInfo,
    setType,
    onCategoryChanged,
    onUserSelected,
    onClientSelected,
    checkSalaryDuplicate,
    confirmRetainerDuplicate,
    cancelAndCloseModal,
    validateAmount,
    triggerFileInput,
    onFileSelected,
    clearFile,
    submitForm,
  }
}
