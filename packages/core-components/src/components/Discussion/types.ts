// One row of the composer's `@` / `#` / `:` autocomplete
export interface SuggestionItem {
  value: string;
  label: string;
  subtitle?: string;
  icon?: string;
  avatar?: string;
  entityType?: string;
}

export type SuggestionFetcher = (
  query: string,
) => SuggestionItem[] | Promise<SuggestionItem[]>;

// A file uploaded from the composer, referenced in the message by its
// asset id and name
export interface UploadedFile {
  id: string | number;
  label: string;
}

export interface CustomEmoji {
  name: string;
  url: string;
}
