import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { mdi } from 'vuetify/iconsets/mdi';
import type { ThemeDefinition } from 'vuetify';

import outlineIconset from '~/components/repository/Outline/icons/iconset';
import { colorMode } from '~/composables/useColorMode';

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // Surfaces
    'surface': '#FAFBFC',
    'on-surface': '#37474F',
    'surface-variant': '#D0D9DD',
    'on-surface-variant': '#455A64',

    'surface-container-highest': '#D7DEE2',
    'on-surface-container-highest': '#37474F',
    'surface-container-high': '#DCE2E5',
    'on-surface-container-high': '#37474F',
    'surface-container': '#E7EBEE',
    'on-surface-container': '#37474F',
    'surface-container-low': '#F2F5F7',
    'on-surface-container-low': '#37474F',
    'surface-container-lowest': '#FFFFFF',
    'on-surface-container-lowest': '#37474F',

    // Surface add-ons
    'background': '#FAFBFC',
    'on-background': '#37474F',
    'surface-bright': '#FAFBFC',
    'surface-dim': '#C7CFD3',

    // Primary
    'primary': '#607D8B',
    'on-primary': '#FFFFFF',
    'primary-container': '#E3EBEF',
    'on-primary-container': '#263238',

    // Secondary (teal — harmonic complement to blue-grey primary)
    'secondary': '#00897B',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#B2DFDB',
    'on-secondary-container': '#004D40',

    // Tertiary (pink — contrasting accent)
    'tertiary': '#C2185B',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FCE4EC',
    'on-tertiary-container': '#5C0030',

    // Highlight — semantic state color (linked, pinned, recent indicators)
    'highlight': '#C0CA33',
    'on-highlight': '#1A1F00',
    'highlight-container': '#F0F4C3',
    'on-highlight-container': '#33370B',

    // Source — content reuse / lineage indicator (purple)
    'source': '#8E24AA',
    'on-source': '#FFFFFF',
    'source-container': '#F3E5F5',
    'on-source-container': '#38006B',

    // Warning (amber)
    'warning': '#F57C00',
    'on-warning': '#FFFFFF',
    'warning-container': '#FFE0B2',
    'on-warning-container': '#4A2800',

    // Error (red)
    'error': '#BA1A1A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD6',
    'on-error-container': '#410002',

    // Success (green)
    'success': '#2E7D32',
    'on-success': '#FFFFFF',
    'success-container': '#C8E6C9',
    'on-success-container': '#0A3D0E',

    // Info (blue)
    'info': '#0277BD',
    'on-info': '#FFFFFF',
    'info-container': '#B3E5FC',
    'on-info-container': '#013A57',

    // Outline
    'outline': '#6E7B82',
    'outline-variant': '#C7CFD3',

    // Inverse
    'inverse-surface': '#263238',
    'inverse-on-surface': '#ECEFF1',
    'inverse-primary': '#90A4AE',
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // Surfaces
    'surface': '#263238',
    'on-surface': '#E4EAEC',
    'surface-variant': '#313F47',
    'on-surface-variant': '#B0BEC5',

    'surface-container-highest': '#607D8B',
    'on-surface-container-highest': '#E4EAEC',
    'surface-container-high': '#546E7A',
    'on-surface-container-high': '#E4EAEC',
    'surface-container': '#455A64',
    'on-surface-container': '#E4EAEC',
    'surface-container-low': '#37474F',
    'on-surface-container-low': '#E4EAEC',
    'surface-container-lowest': '#1B262B',
    'on-surface-container-lowest': '#E4EAEC',

    // Surface add-ons
    'background': '#263238',
    'on-background': '#E4EAEC',
    'surface-bright': '#78909C',
    'surface-dim': '#1F2A30',

    // Primary
    'primary': '#90A4AE',
    'on-primary': '#263238',
    'primary-container': '#4F6873',
    'on-primary-container': '#D9E3E8',

    // Secondary (teal — harmonic complement to blue-grey primary)
    'secondary': '#4DB6AC',
    'on-secondary': '#003B33',
    'secondary-container': '#00695C',
    'on-secondary-container': '#B2DFDB',

    // Tertiary (pink — contrasting accent)
    'tertiary': '#F48FB1',
    'on-tertiary': '#880E4F',
    'tertiary-container': '#5C1B3D',
    'on-tertiary-container': '#FCE4EC',

    // Highlight — semantic state color (linked, pinned, recent indicators)
    'highlight': '#D4E157',
    'on-highlight': '#1A1F00',
    'highlight-container': '#558B2F',
    'on-highlight-container': '#F0F4C3',

    // Source — content reuse / lineage indicator (purple)
    'source': '#CE93D8',
    'on-source': '#3B0764',
    'source-container': '#4A148C',
    'on-source-container': '#F3E5F5',

    // Warning (amber)
    'warning': '#FFB74D',
    'on-warning': '#4A2800',
    'warning-container': '#B45309',
    'on-warning-container': '#FFE0B2',

    // Error (red)
    'error': '#EF9A9A',
    'on-error': '#690005',
    'error-container': '#93000A',
    'on-error-container': '#FFCDD2',

    // Success (green)
    'success': '#81C784',
    'on-success': '#0A3D0E',
    'success-container': '#2E7D32',
    'on-success-container': '#C8E6C9',

    // Info (blue)
    'info': '#4FC3F7',
    'on-info': '#013A57',
    'info-container': '#0277BD',
    'on-info-container': '#B3E5FC',

    // Outline
    'outline': '#78909C',
    'outline-variant': '#3F525B',

    // Inverse
    'inverse-surface': '#ECEFF1',
    'inverse-on-surface': '#263238',
    'inverse-primary': '#607D8B',
  },
  variables: {
    'medium-emphasis-opacity': 0.7,
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
        // Vuetify's default is `surface-variant` (same tonal family), so we
        // override here. VTooltip has no `color` prop, so style its content.
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
