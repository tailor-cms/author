interface State {
  id: number;
  uid: string;
  activityId: number;
  data: any;
  meta: Record<string, unknown>;
  refs: Record<string, unknown>;
  type: string;
  linked: boolean;
  detached: boolean;
  position: number;
  contentId: string;
  repositoryId: number;
  contentSignature: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
}

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
  repositoryId: number;
  userId: number;
  entity: string;
  operation: string;
  state: State;
  user: User;
  createdAt: string;
  updatedAt: string;
}
