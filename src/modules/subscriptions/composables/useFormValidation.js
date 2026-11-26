import { reactive, ref } from 'vue';
import { normalizeServerErrors } from '../validation/subscriptionValidator.js';

const DEPENDENT_FIELDS = {
  category: ['domain_or_identifier'],
  billing_cycle: ['custom_cycle_days', 'reminder_days_before'],
  custom_cycle_days: ['reminder_days_before'],
  start_date: ['next_expiry_date'],
  status: ['notify_user_ids'],
  channels: ['notify_user_ids'],
  notify_emails: ['notify_user_ids'],
};

/**
 * Reactive Vue composable wrapping pure schema validators with touched-state tracking and 422 mapping.
 */
export function useFormValidation({ fields, validateFieldFn, validateFormFn }) {
  const errors = reactive({});
  const touched = reactive({});
  const serverBanner = ref('');

  const runFieldValidation = (field, form, context) => {
    const msg = validateFieldFn(field, form, context);
    if (msg) {
      errors[field] = msg;
    } else {
      delete errors[field];
    }
  };

  const touchField = (field, form, context = undefined) => {
    touched[field] = true;
    serverBanner.value = '';
    runFieldValidation(field, form, context);

    const dependents = DEPENDENT_FIELDS[field] || [];
    for (const dep of dependents) {
      if (touched[dep] || errors[dep]) {
        runFieldValidation(dep, form, context);
      }
    }
  };

  const validateFieldIfTouched = (field, form, context = undefined) => {
    if (touched[field] || errors[field]) {
      runFieldValidation(field, form, context);
    }
    const dependents = DEPENDENT_FIELDS[field] || [];
    for (const dep of dependents) {
      if (touched[dep] || errors[dep]) {
        runFieldValidation(dep, form, context);
      }
    }
  };

  const validateAll = (form, context = undefined) => {
    serverBanner.value = '';
    fields.forEach((f) => {
      touched[f] = true;
    });

    Object.keys(errors).forEach((k) => delete errors[k]);
    const result = validateFormFn(form, context);
    Object.assign(errors, result.errors);

    return result.valid;
  };

  const applyServerErrors = (serverErrors, fallbackMessage = '') => {
    const normalized = normalizeServerErrors(serverErrors);
    Object.entries(normalized).forEach(([field, msg]) => {
      touched[field] = true;
      errors[field] = msg;
    });
    if (fallbackMessage && Object.keys(normalized).length === 0) {
      serverBanner.value = fallbackMessage;
    } else if (fallbackMessage) {
      serverBanner.value = fallbackMessage;
    }
  };

  const resetValidation = () => {
    Object.keys(errors).forEach((k) => delete errors[k]);
    Object.keys(touched).forEach((k) => delete touched[k]);
    serverBanner.value = '';
  };

  const hasError = (field) => Boolean(errors[field]);
  const getError = (field) => errors[field] || '';

  return {
    errors,
    touched,
    serverBanner,
    touchField,
    validateFieldIfTouched,
    validateAll,
    applyServerErrors,
    resetValidation,
    hasError,
    getError,
  };
}
