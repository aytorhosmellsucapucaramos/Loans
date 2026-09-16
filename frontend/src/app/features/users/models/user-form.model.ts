export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleIds?: string[];
}
