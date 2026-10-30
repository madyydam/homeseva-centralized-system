"use strict";
// All module.action permission strings used in HomeSeva.
// Used by CASL on both frontend and backend.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    // ── Platform / Businesses ──────────────────────────────────────────────────
    BUSINESS_VIEW: 'business.view',
    BUSINESS_CREATE: 'business.create',
    BUSINESS_EDIT: 'business.edit',
    BUSINESS_DELETE: 'business.delete',
    // ── Employees ─────────────────────────────────────────────────────────────
    EMPLOYEE_VIEW: 'employee.view',
    EMPLOYEE_CREATE: 'employee.create',
    EMPLOYEE_EDIT: 'employee.edit',
    EMPLOYEE_DEACTIVATE: 'employee.deactivate',
    EMPLOYEE_EXPORT: 'employee.export',
    // ── Roles & Permissions ───────────────────────────────────────────────────
    ROLE_VIEW: 'role.view',
    ROLE_CREATE: 'role.create',
    ROLE_EDIT: 'role.edit',
    ROLE_DELETE: 'role.delete',
    // ── Tabs ──────────────────────────────────────────────────────────────────
    TAB_ASSIGN: 'tab.assign',
    // ── Finance ───────────────────────────────────────────────────────────────
    FINANCE_VIEW: 'finance.view',
    FINANCE_CREATE: 'finance.create',
    FINANCE_EDIT: 'finance.edit',
    FINANCE_DELETE: 'finance.delete',
    FINANCE_EXPORT: 'finance.export',
    FINANCE_CLOSE_MONTH: 'finance.close_month',
    // ── Dashboard ─────────────────────────────────────────────────────────────
    DASHBOARD_GROUP: 'dashboard.group',
    DASHBOARD_BUSINESS: 'dashboard.business',
    // ── Leaves ────────────────────────────────────────────────────────────────
    LEAVE_VIEW: 'leave.view',
    LEAVE_REQUEST: 'leave.request',
    LEAVE_APPROVE: 'leave.approve',
    // ── Attendance ────────────────────────────────────────────────────────────
    ATTENDANCE_VIEW: 'attendance.view',
    ATTENDANCE_MARK: 'attendance.mark',
    ATTENDANCE_EDIT: 'attendance.edit',
    // ── Tasks ─────────────────────────────────────────────────────────────────
    TASK_VIEW: 'task.view',
    TASK_CREATE: 'task.create',
    TASK_EDIT: 'task.edit',
    TASK_DELETE: 'task.delete',
    // ── Documents ─────────────────────────────────────────────────────────────
    DOCUMENT_VIEW: 'document.view',
    DOCUMENT_UPLOAD: 'document.upload',
    DOCUMENT_DELETE: 'document.delete',
    // ── Payroll ───────────────────────────────────────────────────────────────
    PAYROLL_VIEW: 'payroll.view',
    PAYROLL_RUN: 'payroll.run',
    PAYROLL_APPROVE: 'payroll.approve',
    // ── Audit Log ─────────────────────────────────────────────────────────────
    AUDIT_LOG_VIEW: 'audit_log.view',
    // ── Backup & Restore (Super Admin only — BK-2) ────────────────────────────
    BACKUP_VIEW: 'backup.view',
    BACKUP_CREATE: 'backup.create',
    BACKUP_DOWNLOAD: 'backup.download',
    BACKUP_RESTORE: 'backup.restore',
    BACKUP_DELETE: 'backup.delete',
    BACKUP_SCHEDULE: 'backup.schedule',
};
//# sourceMappingURL=permissions.js.map