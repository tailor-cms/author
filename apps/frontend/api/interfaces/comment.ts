interface Author {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  label: string;
  imgUrl: string;
}

export interface Comment {
  id: number;
  uid: string;
  authorId: number;
  repositoryId: number;
  activityId: number;
  contentElementId: number | null;
  content: string;
  author: Author;
  contentElement: any | null;
  resolvedAt: string | null;
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
}
