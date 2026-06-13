import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { mdi } from 'vuetify/iconsets/mdi';
import type { ThemeDefinition } from 'vuetify';

import outlineIconset from '~/components/repository/Outline/icons/iconset';
import { colorMode, resolveTheme } from '~/composables/useColorMode';

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    // Surfaces — cool-tinted MD3 neutral ramp
    'surface': '#F6F9FE',
    'on-surface': '#30323B',
    'surface-variant': '#DDE3EA',
    'on-surface-variant': '#5E6470',

    'surface-container-highest': '#DFE3E8',
    'on-surface-container-highest': '#30323B',
    'surface-container-high': '#E5E8ED',
    'on-surface-container-high': '#30323B',
    'surface-container': '#EBEEF3',
    'on-surface-container': '#30323B',
    'surface-container-low': '#F1F4F9',
    'on-surface-container-low': '#30323B',
    'surface-container-lowest': '#FFFFFF',
    'on-surface-container-lowest': '#30323B',

    // Surface add-ons
    'background': '#F6F9FE',
    'on-background': '#30323B',
    'surface-bright': '#F6F9FE',
    'surface-dim': '#D7DADF',

    // Primary — jade brand seed
    'primary': '#1E9659',
    'on-primary': '#FFFFFF',
    'primary-container': '#A6F0C5',
    'on-primary-container': '#00210E',

    // Secondary — ocean
    'secondary': '#2F6F8F',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#C9E6F5',
    'on-secondary-container': '#001E2E',

    // Tertiary — rose-pink
    'tertiary': '#B4216B',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FFD9E5',
    'on-tertiary-container': '#3E0021',

    // Warning — amber
    'warning': '#C57A00',
    'on-warning': '#FFFFFF',
    'warning-container': '#FFDEB0',
    'on-warning-container': '#2A1800',

    // Error — crimson
    'error': '#C8112A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDADC',
    'on-error-container': '#45000B',

    // Success — teal (distinct from jade primary)
    'success': '#0F9B85',
    'on-success': '#FFFFFF',
    'success-container': '#9DF1E0',
    'on-success-container': '#00261F',

    // Info — indigo
    'info': '#3A4FE0',
    'on-info': '#FFFFFF',
    'info-container': '#DDE1FF',
    'on-info-container': '#00056F',

    // Outline
    'outline': '#71787E',
    'outline-variant': '#C1C7CE',

    // Asset types — categorical only; decoupled from semantic roles.
    // Lower-chroma so they read as labels, not action/error states.
    'asset-image': '#B85C8E',
    'asset-video': '#7E57C2',
    'asset-audio': '#2BA597',
    'asset-document': '#3A6EA5',
    'asset-article': '#A6772D',
    'asset-research': '#2E8FA8',
    'asset-link': '#4B8B3B',
    'asset-other': '#6B7280',

    // Inverse
    'inverse-surface': '#2C313A',
    'inverse-on-surface': '#E8E9EB',
    'inverse-primary': '#6FD49A',
  },
  variables: {
    'medium-emphasis-opacity': 0.7,
    // v-kbd key — mirrors surface-variant / on-surface-variant.
    'theme-kbd': '#DDE3EA',
    'theme-on-kbd': '#5E6470',
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // Surfaces — cool-tinted MD3 neutral ramp
    'surface': '#101417',
    'on-surface': '#C5CCDA',
    'surface-variant': '#41484D',
    'on-surface-variant': '#B0B6C2',

    'surface-container-highest': '#313539',
    'on-surface-container-highest': '#C5CCDA',
    'surface-container-high': '#262A2E',
    'on-surface-container-high': '#C5CCDA',
    'surface-container': '#1C2024',
    'on-surface-container': '#C5CCDA',
    'surface-container-low': '#181C20',
    'on-surface-container-low': '#C5CCDA',
    'surface-container-lowest': '#0A0F12',
    'on-surface-container-lowest': '#C5CCDA',

    // Surface add-ons
    'background': '#101417',
    'on-background': '#C5CCDA',
    'surface-bright': '#353A3E',
    'surface-dim': '#101417',

    // Primary — jade brand seed
    'primary': '#6FD49A',
    'on-primary': '#00391C',
    'primary-container': '#00522A',
    'on-primary-container': '#8FF0B7',

    // Secondary — ocean
    'secondary': '#9CCAE2',
    'on-secondary': '#003549',
    'secondary-container': '#004F69',
    'on-secondary-container': '#CDE6F5',

    // Tertiary — rose-pink
    'tertiary': '#FFB0CC',
    'on-tertiary': '#5E1138',
    'tertiary-container': '#7C2950',
    'on-tertiary-container': '#FFD9E5',

    // Warning — amber
    'warning': '#FFC080',
    'on-warning': '#452B00',
    'warning-container': '#634300',
    'on-warning-container': '#FFDEB0',

    // Error — crimson
    'error': '#FFB1B7',
    'on-error': '#680016',
    'error-container': '#91002A',
    'on-error-container': '#FFDADC',

    // Success — teal (distinct from jade primary)
    'success': '#65E1CB',
    'on-success': '#003B32',
    'success-container': '#00574A',
    'on-success-container': '#9DF1E0',

    // Info — indigo
    'info': '#BAC3FF',
    'on-info': '#08148F',
    'info-container': '#1F32B1',
    'on-info-container': '#DDE1FF',

    // Outline
    'outline': '#8B9198',
    'outline-variant': '#41484D',

    // Asset types — categorical only; decoupled from semantic roles.
    // Lifted ~30 tone steps for dark surfaces, same hues as light.
    'asset-image': '#E48BB8',
    'asset-video': '#B79EE6',
    'asset-audio': '#6FD4C5',
    'asset-document': '#84B0E0',
    'asset-article': '#DCBA6E',
    'asset-research': '#79C5DB',
    'asset-link': '#8FC97D',
    'asset-other': '#B0B6C2',

    // Inverse
    'inverse-surface': '#E8E9EB',
    'inverse-on-surface': '#2C313A',
    'inverse-primary': '#1E9659',
  },
  variables: {
    // v-kbd key — mirrors surface-variant / on-surface-variant.
    'theme-kbd': '#41484D',
    'theme-on-kbd': '#B0B6C2',
  },
};

export default defineNuxtPlugin({
  name: 'vuetify',
  setup(nuxt) {
    const prefersDark = import.meta.client
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
    const defaultTheme = resolveTheme(colorMode.value, prefersDark);

    const vuetify = createVuetify({
      blueprint: md3,
      components,
      directives,
      defaults: {
        VBtn: { color: undefined },
        // MD3 spec: snackbars/tooltips use the inverse surface so they
        // contrast with the page (dark on light theme, light on dark theme).
        VSnackbar: { color: 'inverse-surface' },
        VTooltip: { color: 'inverse-surface' },
        VSwitch: {
          color: 'primary',
          inset: 'material',
        },
        VCheckbox: { color: 'primary' },
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
    });
    nuxt.vueApp.use(vuetify);
  },
});
