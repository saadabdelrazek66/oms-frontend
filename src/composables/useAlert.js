import alertService, { confirm, alert, toast, success, error, warning, info } from '../services/alertService';

export function useAlert() {
  return {
    confirm,
    alert,
    toast,
    success,
    error,
    warning,
    info,
    alertService
  };
}

export default useAlert;
