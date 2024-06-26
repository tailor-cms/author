export interface Meta {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  validate: Record<string, any>;
  defaultValue?: any;
}
