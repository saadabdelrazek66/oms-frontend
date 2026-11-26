import alertService, { confirm, alert, toast, smartToast, success, error, warning, info } from '../services/alertService';

export function useAlert() {
  return {
    confirm,
    alert,
    toast,
    smartToast,
    success,
    error,
    warning,
    info,
    alertService
  };
}

export default useAlert;
