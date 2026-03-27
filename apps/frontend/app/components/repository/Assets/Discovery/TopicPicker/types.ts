export interface TopicItem {
  id: number;
  name: string;
  parentName?: string;
  isGroup: boolean;
  isLeaf: boolean;
  depth: number;
  // Full context path for building search queries.
  context: string[];
}
