export interface EmployeeBasic {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string | null;
  designation: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED' | 'ARCHIVED';
  businessId: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  businessId: string;
  roleId: string;  // the login Role ID to assign
  joiningDate?: string;
  reportingManager?: string;
}
