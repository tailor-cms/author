export interface UpdateEvent {
  item: HTMLElement;
  to: HTMLElement;
  from: HTMLElement;
  clone: HTMLElement;
  oldIndex: number;
  newIndex: number;
  oldDraggableIndex: number;
  newDraggableIndex: number;
  pullMode: 'clone' | boolean;
}

export interface ChangeEvent {
  added?: { newIndex: number; element: StoreActivity };
  moved?: { newIndex: number; oldIndex: number; element: StoreActivity };
  removed?: { oldIndex: number; element: StoreActivity };
}
