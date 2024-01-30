export interface Repository {
  id: number;
  uid: string;
  schema: string;
  name: string;
  description: string;
  data: any;
  tags: any[];
  revisions: Revision[];
  lastChange?: Revision;
  repositoryUsers: RepositoryUser[];
  // Current user's repositoryUser
  repositoryUser?: RepositoryUser;
  hasUnpublishedChanges: boolean;
  hasAdminAccess?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RepositoryUser {
  userId: number;
  repositoryId: number;
  role: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Revision {
  id: number;
  uid: string;
  userId: number;
  repositoryId: number;
  entity: string;
  operation: string;
  state: {
    id: number;
    uid: string;
    schema: string;
    name: string;
    description: string;
    data: any;
    hasUnpublishedChanges: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    label: string;
    imgUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}
