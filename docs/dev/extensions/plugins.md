# Plugin Extensions

## Introduction

Plugins are cross-cutting extensions that add platform-wide features to Tailor.
Unlike Content Elements, Content Containers, and Meta Inputs which focus on
specific content types, Plugins can hook into various parts of the application
to modify behavior, transform data, and add UI components globally.

## Built-in Plugins

- **[i18n Plugin](/dev/extensions/i18n-plugin)**: Enables multi-language content
  authoring with language switching, translation status tracking, and localized
  data storage.

## Plugin Architecture

Plugins consist of several optional components that integrate with the
Tailor application:

### Component Slots

Plugins can provide Vue components that are rendered in specific locations:

| Slot | Location | Use Case |
|------|----------|----------|
| `GlobalComponent` | Top navigation bar | Global controls, status indicators |
| `AppendComponent` | After Meta Input fields | Field-level enhancements |
| `PrependComponent` | Before Meta Input fields | Field-level prefixes |
| `ConfigComponent` | Configuration panels | Plugin settings UI |

### State Management

Plugins can provide a Pinia store for managing their state:

- **useStore**: A Pinia store factory function
- **storeKey**: A unique key for injecting the store into the Nuxt app context,
  accessible via `useNuxtApp().$storeKey`

### Hooks

Plugins can register hooks to intercept and transform data at various points.
Hooks are executed as pipelines - data passes through all registered handlers
sequentially.

| Hook | Description | Parameters |
|------|-------------|------------|
| `repository:change` | Called when a repository loads | `(data, { schema, repository })` |
| `repository:unload` | Called when a repository unloads | `(data, {})` |
| `container:filter` | Filters containers before display | `(containers, context)` |
| `container:transform` | Transforms container data before save | `(data, context)` |
| `data:value` | Gets processed value from data object | `(value, { data, key, type? })` |
| `data:update` | Builds updated data object for saving | `(data, { key, value, type? })` |

## Development

### Plugin Manifest Structure

A plugin is a package that exports a default object:

```typescript
// src/index.ts
import AppendComponent from './AppendComponent.vue';
import GlobalComponent from './GlobalComponent.vue';
import { useMyPluginStore } from './store';

export default {
  // Required: Unique plugin type identifier (CONST_CASE)
  type: 'MY_PLUGIN',

  // Required: Plugin version
  version: '1.0',

  // Optional: Component slots (Vue 3 components)
  // Set to null if not used
  AppendComponent,
  GlobalComponent,
  PrependComponent: null,
  ConfigComponent: null,

  // Optional: Pinia store registration
  // The store becomes accessible via useNuxtApp().$myPlugin
  useStore: useMyPluginStore,
  storeKey: 'myPlugin',

  // Optional: Data hooks
  hooks: {
    'repository:change': (data, { schema, repository }) => {
      // Initialize plugin when repository loads
      const store = useMyPluginStore();
      store.initialize(schema?.myPluginConfig);
    },
    'repository:unload': () => {
      // Cleanup when repository unloads
      const store = useMyPluginStore();
      store.$reset();
    },
    'data:value': (value, { data, key, type }) => {
      // Transform value before display
      return value;
    },
    'data:update': (data, { key, value, type }) => {
      // Transform data before save
      return { ...data, [key]: value };
    },
  },
};

// Named exports for direct imports if needed
export { AppendComponent, GlobalComponent, useMyPluginStore };
```

### File Structure

Plugin packages should be placed in the `packages/core-extensions/plugins`
directory:

```
packages/core-extensions/plugins/my-plugin/
├── package.json
└── src/
    ├── index.ts           # Plugin manifest and exports
    ├── store.ts           # Pinia store (optional)
    ├── GlobalComponent.vue    # Global UI component (optional)
    └── AppendComponent.vue    # Field append component (optional)
```

### Package Configuration

```json
{
  "name": "@tailor-cms/tp-my-plugin",
  "version": "0.0.1",
  "description": "Tailor plugin for ...",
  "type": "module",
  "files": ["src"],
  "main": "./src/index.js",
  "devDependencies": {
    "@tailor-cms/interfaces": "workspace:*"
  },
  "peerDependencies": {
    "nuxt": "^4.0.0",
    "pinia": "^3.0.0",
    "vue": "^3.5.0",
    "vuetify": "^3.10.0"
  }
}
```

:::tip Plugin Naming Convention
Plugin packages should be named with the `@tailor-cms/tp-` prefix
(e.g., `@tailor-cms/tp-my-plugin`).
:::

## Installation and Management

Managing plugins within your project is straightforward with the
provided CLI commands.

### Viewing Installed Plugins

```sh
pnpm pl ls
```

### Installing a New Plugin

```sh
pnpm pl i
```

Follow the on-screen instructions to complete the installation.

### Removing a Plugin

```sh
pnpm pl rm
```

This command will prompt you to select a Plugin from the list of currently
installed plugins for removal.

### After Installation

After installing or removing a Plugin, rebuild the codebase:

```sh
pnpm build
```

For plugins that require schema configuration, update your schema file
to include the necessary configuration options.

## Plugin Registry API

The Plugin Registry manages all loaded plugins and provides methods for
accessing plugin components and executing hooks.

### Accessing the Registry

```typescript
const { $pluginRegistry } = useNuxtApp();

// Get all plugins with specific component types
const globalPlugins = $pluginRegistry.getGlobalComponents();
const appendPlugins = $pluginRegistry.getAppendComponents();
const prependPlugins = $pluginRegistry.getPrependComponents();
const configPlugins = $pluginRegistry.getConfigComponents();

// Execute hooks
const filteredData = $pluginRegistry.filter('container:filter', containers, context);
const transformedData = $pluginRegistry.transform('data:update', data, context);
```

### Triggering Re-renders

The Plugin Registry provides a reactive `dataVersion` counter that plugins
can use to trigger UI re-renders when their state changes:

```typescript
// In a plugin store action
const { $pluginRegistry } = useNuxtApp() as any;

function updateState(newValue: string) {
  state.value = newValue;
  // Notify registry to trigger component re-renders
  $pluginRegistry.invalidateData();
}
```

Components can watch this value to react to plugin state changes:

```typescript
const { $pluginRegistry } = useNuxtApp();

// Reactive - updates when any plugin calls invalidateData()
const dataVersion = computed(() => $pluginRegistry.dataVersion);
```
