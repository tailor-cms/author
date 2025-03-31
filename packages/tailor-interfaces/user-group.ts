export interface UserGroup {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface UserGroupWithRole extends UserGroup {
  role: string;
}
