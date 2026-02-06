# Plugin

## Introduction

Plugins are cross-cutting extensions that add platform-wide features to Tailor.
Unlike Content Elements and Meta Inputs which are attached to specific entities,
Plugins operate globally across the application, hooking into various parts of
the system to modify behavior and add functionality.

## Example

Consider a scenario where you need to support multi-language content authoring.
Rather than implementing language handling in every component, a Plugin can:

- Add a language selector to the navigation bar
- Intercept data reads to return the correct language version
- Transform data writes to store translations properly
- Filter content containers to show only the current language

This is exactly what the built-in i18n Plugin provides. When enabled in a
schema, it seamlessly adds multi-language support without modifying existing
components.

## How Plugins Differ from Other Extensions

| Extension Type | Scope | Purpose |
|---------------|-------|---------|
| Content Element | Single content block | Display and edit specific content types |
| Content Container | Group of elements | Organize content elements |
| Meta Input | Single field | Collect metadata for entities |
| **Plugin** | Application-wide | Add cross-cutting features |

Plugins are the right choice when you need functionality that:
- Spans multiple entity types (Repository, Activity, Content Element)
- Requires global UI components (navigation items, overlays)
- Transforms data across the application
- Adds workflow or process enhancements

## Plugin Capabilities

Plugins can provide:

1. **UI Components**: Global controls, field enhancements, configuration panels
2. **State Management**: Pinia stores for managing plugin-specific state
3. **Data Hooks**: Intercept and transform data at various points
4. **Schema Extensions**: Add configuration options to repository schemas

For detailed information on developing and using Plugins, see the
[Plugin Extensions](/dev/extensions/plugins) documentation.
