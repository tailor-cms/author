import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { mdi } from 'vuetify/iconsets/mdi';
import type { ThemeDefinition } from 'vuetify';

import outlineIconset from '~/components/repository/Outline/icons/iconset';
import { colorMode } from '~/composables/useColorMode';

/**
 * MD3 theme — "One Dark / One Light".
 *
 * An MD3 adaptation of the One Dark Pro Darker editor theme (Atom / VS Code),
 * with a matching cool One Light counterpart. Surfaces are anchored to One
 * Dark's real values (#23272E family); the accent trio is One Dark Pro's own
 * green / teal / purple. Light uses the same hues at darker tones for legibility.
 *
 * Tonal ramps were generated with Material Color Utilities. Every on-color /
 * surface pair meets WCAG AA (text ≥ 4.5:1, UI/outline ≥ 3:1) in both modes.
 * To re-tune, regenerate via MCU and remap tones rather than hand-picking hexes.
 */
const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // Surfaces — One Light off-white ramp. Cards = surface; tray/toolbars =
    // surface-container-low; dialogs/menus = surface-container and up.
    'surface': '#F8F9FB',
    'on-surface': '#383A42',
    'surface-variant': '#E2E5EA',
    'on-surface-variant': '#62656F',

    'surface-container-highest': '#D2D7DE',
    'on-surface-container-highest': '#383A42',
    'surface-container-high': '#DADEE4',
    'on-surface-container-high': '#383A42',
    'surface-container': '#E2E5EA',
    'on-surface-container': '#383A42',
    'surface-container-low': '#F0F1F3',
    'on-surface-container-low': '#383A42',
    'surface-container-lowest': '#FFFFFF',
    'on-surface-container-lowest': '#383A42',

    // Surface add-ons
    'background': '#F8F9FB',
    'on-background': '#383A42',
    'surface-bright': '#F8F9FB',
    'surface-dim': '#D6D9E0',

    // Primary — grass green (One Dark green)
    'primary': '#228336',
    'on-primary': '#FFFFFF',
    'primary-container': '#98F89C',
    'on-primary-container': '#0A2100',

    // Secondary — teal (One Dark cyan)
    'secondary': '#007E89',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#93F1FE',
    'on-secondary-container': '#001F23',

    // Tertiary — purple (One Dark; contrast accent)
    'tertiary': '#BD3DB9',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FFD7F5',
    'on-tertiary-container': '#380038',

    // Highlight — linked / pinned / recent state (gold)
    'highlight': '#976D00',
    'on-highlight': '#FFFFFF',
    'highlight-container': '#F8E46C',
    'on-highlight-container': '#201C00',

    // Source — content reuse / lineage (indigo)
    'source': '#4D75B3',
    'on-source': '#FFFFFF',
    'source-container': '#D6E3FF',
    'on-source-container': '#001B3D',

    // Warning — amber
    'warning': '#AF6003',
    'on-warning': '#FFFFFF',
    'warning-container': '#FFDCC2',
    'on-warning-container': '#2E1500',

    // Error — red
    'error': '#CD453A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD5',
    'on-error-container': '#410001',

    // Success — emerald
    'success': '#008561',
    'on-success': '#FFFFFF',
    'success-container': '#8DF7CA',
    'on-success-container': '#002115',

    // Info — blue
    'info': '#1D7AB7',
    'on-info': '#FFFFFF',
    'info-container': '#CDE5FF',
    'on-info-container': '#001D32',

    // Outline
    'outline': '#7C7F88',
    'outline-variant': '#C7CAD0',

    // Inverse
    'inverse-surface': '#2C313A',
    'inverse-on-surface': '#E8E9EB',
    'inverse-primary': '#98C379',
  },
  variables: {
    'medium-emphasis-opacity': 0.7,
    // v-kbd key — mirrors surface-variant / on-surface-variant.
    'theme-kbd': '#E2E5EA',
    'theme-on-kbd': '#62656F',
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // Surfaces — One Dark Pro Darker ramp. Cards = surface (editor #23272E);
    // tray/toolbars = surface-container-low; dialogs/menus = surface-container
    // and up. Card borders provide the crisp edge, as in One Dark Pro.
    'surface': '#23272E',
    'on-surface': '#ABB2BF',
    'surface-variant': '#3E4452',
    'on-surface-variant': '#9098A6',

    'surface-container-highest': '#3D4350',
    'on-surface-container-highest': '#ABB2BF',
    'surface-container-high': '#343A44',
    'on-surface-container-high': '#ABB2BF',
    'surface-container': '#2C313A',
    'on-surface-container': '#ABB2BF',
    'surface-container-low': '#1C2025',
    'on-surface-container-low': '#ABB2BF',
    'surface-container-lowest': '#181A1F',
    'on-surface-container-lowest': '#ABB2BF',

    // Surface add-ons
    'background': '#23272E',
    'on-background': '#ABB2BF',
    'surface-bright': '#434A57',
    'surface-dim': '#1A1C21',

    // Primary — grass green (One Dark green #98C379)
    'primary': '#98C379',
    'on-primary': '#163800',
    'primary-container': '#2B5013',
    'on-primary-container': '#C3F0A1',

    // Secondary — teal (One Dark cyan)
    'secondary': '#56B6C2',
    'on-secondary': '#003B41',
    'secondary-container': '#004F56',
    'on-secondary-container': '#93F1FE',

    // Tertiary — purple (One Dark; contrast accent)
    'tertiary': '#C678DD',
    'on-tertiary': '#4D0065',
    'tertiary-container': '#6D2486',
    'on-tertiary-container': '#FAD7FF',

    // Highlight — linked / pinned / recent state (gold)
    'highlight': '#E5C07B',
    'on-highlight': '#463100',
    'highlight-container': '#5C4308',
    'on-highlight-container': '#FFDEA4',

    // Source — content reuse / lineage (indigo)
    'source': '#96BDFF',
    'on-source': '#00346A',
    'source-container': '#174782',
    'on-source-container': '#D6E3FF',

    // Warning — amber
    'warning': '#D19A66',
    'on-warning': '#502C01',
    'warning-container': '#663E12',
    'on-warning-container': '#FFDCBF',

    // Error — red
    'error': '#E06C75',
    'on-error': '#570214',
    'error-container': '#822430',
    'on-error-container': '#FFDADA',

    // Success — emerald
    'success': '#65CFA4',
    'on-success': '#003827',
    'success-container': '#00513A',
    'on-success-container': '#8DF7CA',

    // Info — blue
    'info': '#61AFEF',
    'on-info': '#003859',
    'info-container': '#004A75',
    'on-info-container': '#CDE5FF',

    // Outline
    'outline': '#6E7585',
    'outline-variant': '#3E4452',

    // Inverse
    'inverse-surface': '#E8E9EB',
    'inverse-on-surface': '#2C313A',
    'inverse-primary': '#228336',
  },
  variables: {
    'medium-emphasis-opacity': 0.7,
    // v-kbd key — mirrors surface-variant / on-surface-variant.
    'theme-kbd': '#3E4452',
    'theme-on-kbd': '#9098A6',
  },
};

export default defineNuxtPlugin({
  name: 'vuetify',
  setup(nuxt) {
    const defaultTheme = colorMode.value;

    const vuetify = createVuetify({
      blueprint: md3,
      components,
      directives,
      defaults: {
        VBtn: { color: undefined },
        // MD3 spec: snackbars/tooltips use the inverse surface so they
        // contrast with the page (dark on light theme, light on dark theme).
        VSnackbar: { color: 'inverse-surface' },
        VTooltip: { contentClass: 'bg-inverse-surface' },
      },
      theme: {
        defaultTheme,
        themes: {
          light: lightTheme,
          dark: darkTheme,
        },
      },
      icons: {
        defaultSet: 'mdi',
        sets: {
          mdi,
          add: outlineIconset,
        },
      },
      display: {
        thresholds: {
          lg: 1440,
        },
      },
    });
    nuxt.vueApp.use(vuetify);
  },
});
