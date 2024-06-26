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
