export const SYSTEM_ROLES = {
  SUPER_ADMIN:        'Super Admin',
  OWNER:              'Owner',
  BUSINESS_HEAD:      'Business Head',
  DEPARTMENT_MANAGER: 'Department Manager',
  HR:                 'HR',
  ACCOUNTANT:         'Accountant',
  EMPLOYEE:           'Employee',
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

