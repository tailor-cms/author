import type { Activity } from './activity';
import type { ContentElement } from './content-element';
import type { Repository } from './repository';

// Entity kind a revision was recorded against. Mirrors the model's
// ENUM column
export enum Entity {
  Repository = 'REPOSITORY',
  Activity = 'ACTIVITY',
  ContentElement = 'CONTENT_ELEMENT',
}

// Operation captured in the revision row, mirroring the model's ENUM:
export enum Operation {
  Create = 'CREATE',
  Update = 'UPDATE',
  Remove = 'REMOVE',
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
  userId: number;
  repositoryId: number;
  entity: Entity;
  operation: Operation;
  state: ContentElement | Activity | Repository;
  user: User;
  createdAt: string;
  updatedAt: string;
}
