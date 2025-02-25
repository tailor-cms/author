export interface UserGroup {
  id: number;
  name: string;
}

export interface UserGroupWithRole extends UserGroup {
  role: string;
}
