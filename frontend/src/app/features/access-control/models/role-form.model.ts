export interface RolePayload {
  code: string;
  name: string;
  description?: string;
  permissionIds: string[];
}
