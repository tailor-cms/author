import type { Activity } from './activity';
import type { ContentElement } from './content-element';
import type { Repository } from './repository';

export enum Entity {
  Repository = 'REPOSITORY',
  Activity = 'ACTIVITY',
  ContentElement = 'CONTENT_ELEMENT',
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
  operation: string;
  state: ContentElement | Activity | Repository;
  user: User;
  createdAt: string;
  updatedAt: string;
}
