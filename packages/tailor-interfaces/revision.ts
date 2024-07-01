interface User {
  id: number;
  email: string;
  firstName: null | string;
  fullName: null | string;
  lastName: null | string;
  label: string;
}

export interface Revision {
  id: number;
  uid: string;
  userId: number;
  repositoryId: number;
  entity: string;
  operation: string;
  state: Record<string, unknown>;
  user: User;
  createdAt: string;
  updatedAt: string;
}
