import { validateDriveLink, validatePostDriveLink } from '../utils/driveValidation';

export function useDriveValidation() {
  return {
    validateDriveLink,
    validatePostDriveLink
  };
}

export { validateDriveLink, validatePostDriveLink };
