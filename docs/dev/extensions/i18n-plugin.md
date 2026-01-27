# i18n Plugin

The i18n (internationalization) plugin is Tailor's built-in solution for
multi-language content authoring. It enables content creators to manage
translations for all supported languages within the same repository,
with features like language switching, translation status tracking, and
fallback handling.

:::tip
For general information about the plugin architecture, see the
[Plugins documentation](/dev/extensions/plugins).
:::

## Features

- **Global Language Selector**: A dropdown in the top navigation bar for
  switching the active editing language.
- **Translation Status Badges**: Visual indicators on Meta Input fields
  showing translation completion status (e.g., "2/3" languages translated).
- **Inline Translation Editor**: Click on a translation badge to edit
  translations for all languages in a popup editor.
- **Fallback Display**: When viewing content in a non-default language,
  shows the default language value with a fallback indicator if no
  translation exists.
- **Container Language Filtering**: Content containers can be filtered
  by language, allowing language-specific content organization.

## Schema Configuration

To enable i18n for a repository type, add the `i18n` configuration to
your schema:

```typescript
import type { Schema } from '@tailor-cms/interfaces/schema';

export const SCHEMA: Schema = {
  id: 'MY_COURSE',
  workflowId: 'DEFAULT_WORKFLOW',
  name: 'My Course',
  description: 'A multi-language course.',
  // Enable i18n
  i18n: {
    enabled: true,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
    ],
    defaultLanguage: 'en',
  },
  // ... rest of schema configuration
};
```

### Configuration Options

| Property | Type | Description |
|----------|------|-------------|
| `enabled` | `boolean` | Whether i18n is enabled for this schema |
| `languages` | `Array<{ code: string, name: string }>` | Available languages |
| `defaultLanguage` | `string` | The default/primary language code |

## How It Works

### Data Storage Structure

The i18n plugin uses a nested data structure to store translations:

```javascript
// Entity data object
{
  // Default language values stored at root level
  name: "Introduction to Programming",
  description: "Learn the basics of programming.",

  // Non-default language translations nested under language code
  es: {
    name: "Introduccion a la Programacion",
    description: "Aprende los conceptos basicos de programacion."
  },
  fr: {
    name: "Introduction a la Programmation",
    description: "Apprenez les bases de la programmation."
  }
}
```

This structure ensures:
- Backward compatibility (default language data remains at root)
- Efficient storage (only translated fields are stored per language)
- Easy fallback (missing translations fall back to root values)

### Language Switching

When a user switches languages using the global selector:

1. The i18n store updates `currentLanguage`
2. The plugin registry's `invalidateData()` is called
3. All components re-render with the new language context
4. The `data:value` hook returns appropriate localized values

### Translation Status

For each translatable field, the plugin tracks:
- Which languages have translations
- Whether the current display is a fallback value
- Overall translation completion percentage

## UI Components

### Global Language Selector

Located in the application's top navigation bar, the language selector:
- Shows the currently active language code
- Displays all available languages with their names
- Marks the default language with a star icon
- Indicates the current selection with a checkmark

### Translation Status Badge

Appears next to translatable Meta Input fields:
- Shows completion ratio (e.g., "2/3")
- Color-coded: green (complete), orange (none), secondary (partial)
- Displays fallback indicator when showing default language value
- Click to open the inline translation editor

### Inline Translation Editor

A popup editor that appears when clicking a translation badge:
- Toggle buttons to switch between languages
- Check icons indicate which languages have translations
- Edit translations without leaving the current page
- Real-time validation

## Translatable Meta Inputs

Not all Meta Input types support translation. A Meta Input must explicitly
opt-in to i18n support by setting `i18n: true` in its manifest.

Currently, the following Meta Input types support translation:
- `TEXT_FIELD` - Single-line text input
- `TEXTAREA` - Multi-line text input
- `HTML` - Rich text HTML editor

### Checking Translatability

The i18n plugin checks if a field is translatable before applying hooks:

```typescript
// In AppendComponent.vue
const isTranslatable = computed(() => {
  const metaType = $metaRegistry.get(props.meta.type?.toUpperCase());
  return metaType?.i18n === true;
});
```

## Hooks

The i18n plugin implements the following hooks:

### `repository:change`

Initializes the i18n store when a repository loads:

```typescript
'repository:change': (data, { schema, repository }) => {
  const i18n = useI18nStore();
  i18n.initialize(schema?.i18n);
}
```

### `repository:unload`

Resets the i18n store when leaving a repository:

```typescript
'repository:unload': () => {
  const i18n = useI18nStore();
  i18n.$reset();
}
```

### `container:filter`

Filters content containers by the current language:

```typescript
'container:filter': (containers) => {
  const i18n = useI18nStore();
  if (!i18n.isEnabled) return containers;

  return containers.filter((container) => {
    const containerLang = container.data?._i18n;
    // Containers without _i18n tag belong to default language
    if (!containerLang) return currentLang === defaultLang;
    return containerLang === currentLang;
  });
}
```

### `container:transform`

Tags new containers with the current language:

```typescript
'container:transform': (data) => {
  const i18n = useI18nStore();
  if (!i18n.isEnabled) return data;

  return {
    ...data,
    data: { ...(data.data || {}), _i18n: i18n.currentLanguage },
  };
}
```

### `data:value`

Gets the localized value for display:

```typescript
'data:value': (value, { data, key, lang, type }) => {
  const i18n = useI18nStore();
  if (!i18n.isEnabled) return value;

  // Check if the meta type supports i18n
  if (type && !$metaRegistry.get(type)?.i18n) return value;

  return i18n.getLocalizedValue(data, key, lang);
}
```

### `data:update`

Builds the updated data object with proper localization:

```typescript
'data:update': (data, { value, key, lang, type }) => {
  const i18n = useI18nStore();
  if (!i18n.isEnabled) return { ...data, [key]: value };

  // Check if the meta type supports i18n
  if (type && !$metaRegistry.get(type)?.i18n) {
    return { ...data, [key]: value };
  }

  return i18n.setLocalizedValue(data, key, value, lang);
}
```

## Store API

The i18n store (`useI18nStore`) provides the following API:

### State

| Property | Type | Description |
|----------|------|-------------|
| `currentLanguage` | `string` | Currently active editing language |
| `config` | `I18nConfig \| null` | The i18n configuration from schema |

### Getters

| Property | Type | Description |
|----------|------|-------------|
| `isEnabled` | `boolean` | Whether i18n is enabled |
| `availableLanguages` | `I18nLanguage[]` | List of available languages |
| `defaultLanguage` | `string` | The default language code |
| `language` | `string` | Alias for `currentLanguage` |

### Methods

#### `initialize(config: I18nConfig)`

Initializes the store with schema configuration:

```typescript
const i18n = useI18nStore();
i18n.initialize(schema.i18n);
```

#### `setLanguage(langCode: string)`

Changes the current editing language:

```typescript
i18n.setLanguage('es');
```

#### `getLocalizedValue<T>(data, key, lang?): T`

Gets the value for a field in the specified (or current) language:

```typescript
const title = i18n.getLocalizedValue(activity.data, 'name');
// Returns Spanish title if currentLanguage is 'es'
```

#### `setLocalizedValue(data, key, value, lang?): object`

Returns a new data object with the value set for the specified language:

```typescript
const newData = i18n.setLocalizedValue(data, 'name', 'Hola', 'es');
// Returns: { name: "Hello", es: { name: "Hola" } }
```

#### `getTranslationStatus(data, key): Record<string, boolean>`

Gets translation completion status for all languages:

```typescript
const status = i18n.getTranslationStatus(data, 'name');
// Returns: { en: true, es: true, fr: false }
```

#### `getDisplayedLanguage(data, key): { code: string, isFallback: boolean }`

Gets info about which language value is being displayed:

```typescript
const info = i18n.getDisplayedLanguage(data, 'name');
// If Spanish translation exists: { code: 'es', isFallback: false }
// If falling back to English: { code: 'en', isFallback: true }
```

#### `$reset()`

Resets the store to initial state:

```typescript
i18n.$reset();
```

## Accessing the i18n Store

The i18n store is automatically registered and accessible via Nuxt app context:

```typescript
// In a Vue component or composable
const { $i18n } = useNuxtApp();

// Check if i18n is enabled
if ($i18n.isEnabled) {
  // Get current language
  console.log($i18n.currentLanguage);

  // Switch language
  $i18n.setLanguage('fr');

  // Get available languages
  $i18n.availableLanguages.forEach(lang => {
    console.log(`${lang.name} (${lang.code})`);
  });
}
```

## Best Practices

### 1. Define All Languages Upfront

Define all languages you plan to support when creating the schema. Adding
languages later is possible but may require manual translation work.

### 2. Use Meaningful Language Codes

Use standard ISO 639-1 language codes (e.g., 'en', 'es', 'fr') for
consistency and compatibility with external translation tools.

### 3. Set Appropriate Default Language

Choose the default language based on your primary audience. Default
language content is always available as a fallback.

### 4. Consider Container-Level Translation

For complex content structures, you may want language-specific containers
rather than field-level translation. The i18n plugin supports both patterns
through container filtering.

### 5. Test Translation Workflows

Test the complete translation workflow including:
- Creating content in the default language
- Switching to other languages and adding translations
- Verifying fallback behavior for missing translations
- Publishing multi-language content

## Limitations

- The i18n plugin currently operates client-side only; server-side
  processing may not be language-aware.
- Not all Meta Input types support translation; custom Meta Inputs must
  explicitly enable i18n support.
- Rich content elements (like embedded videos) may require additional
  configuration for multi-language support.
