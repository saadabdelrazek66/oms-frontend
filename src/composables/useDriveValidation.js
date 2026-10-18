import { validateDriveLink, validatePostDriveLink, isFolderAllowedForPostType } from '../utils/driveValidation';

export function useDriveValidation() {
  return {
    validateDriveLink,
    validatePostDriveLink,
    isFolderAllowedForPostType
  };
}

export { validateDriveLink, validatePostDriveLink, isFolderAllowedForPostType };
