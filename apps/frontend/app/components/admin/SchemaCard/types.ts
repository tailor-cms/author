export interface TreeItem {
  id: string;
  label: string;
  color?: string;
  recursive?: boolean;
  children?: TreeItem[];
}

export interface Languages {
  codes: string;
  names: string;
}

export interface SchemaCardData {
  label: string;
  description?: string;
  collection?: boolean;
  languages: Languages | null;
  children: TreeItem[];
}
