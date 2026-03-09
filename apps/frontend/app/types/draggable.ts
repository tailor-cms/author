import type {
  MoveEvent as SortableMoveEvent,
  SortableEvent,
} from 'sortablejs';

export type { SortableEvent };

export interface DragContext<T> {
  index: number;
  element: T;
  futureIndex?: number;
}

export interface RelatedContext<T> extends DragContext<T> {
  list: T[];
  component: any;
}

export interface MoveEvent<T = any> extends SortableMoveEvent {
  draggedContext: DragContext<T>;
  relatedContext: RelatedContext<T>;
}

export interface ChangeEvent<T = any> {
  added?: { newIndex: number; element: T };
  removed?: { oldIndex: number; element: T };
  moved?: { newIndex: number; oldIndex: number; element: T };
}
