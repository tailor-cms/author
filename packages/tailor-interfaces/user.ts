export interface User {
  id: number;
  email: string;
  role: string;
  fullName: null | string;
  firstName: null | string;
  lastName: null | string;
  label: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Slim user projection eager-loaded onto records that reference a user
// without needing the full row
export interface UserSummary {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  label: string;
  imgUrl: string;
}
