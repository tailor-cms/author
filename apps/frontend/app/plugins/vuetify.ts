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
    // Surfaces — even MD3 tone steps (100 / 96 / 94 / 92 / 90)
    'surface': '#F9FAFC',
    'on-surface': '#30323B',
    'surface-variant': '#DFE2E7',
    'on-surface-variant': '#5E6470',

    'surface-container-highest': '#DEE2E7',
    'on-surface-container-highest': '#30323B',
    'surface-container-high': '#E6E9ED',
    'on-surface-container-high': '#30323B',
    'surface-container': '#ECEFF3',
    'on-surface-container': '#30323B',
    'surface-container-low': '#F2F4F7',
    'on-surface-container-low': '#30323B',
    'surface-container-lowest': '#FFFFFF',
    'on-surface-container-lowest': '#30323B',

    // Surface add-ons
    'surface-bright': '#F9FAFC',
    'surface-dim': '#D5D8DD',

    'surface-base': '#F9FAFC', // app backdrop; transparent bars composite here
    'on-surface-base': '#30323B',
    'surface-canvas': '#F2F4F7', // recessed content wells / inset panels
    'on-surface-canvas': '#30323B',
    'surface-sunken': '#ECEFF3', // wells within a canvas well (board columns)
    'on-surface-sunken': '#30323B',
    'surface-raised': '#F9FAFC', // cards, list rows (= base; shadow-separated)
    'on-surface-raised': '#30323B',
    'surface-sidebar': '#F9FAFC', // docked side panels (= base; border-separated)
    'on-surface-sidebar': '#30323B',
    'surface-overlay': '#FFFFFF', // menus, dialogs, popovers (+ shadow)
    'on-surface-overlay': '#30323B',

    // Background
    'background': '#F9FAFC',
    'on-background': '#30323B',

    // Primary — jade (contemporary, vibrant; tone-derived)
    'primary': '#1E9659',
    'on-primary': '#FFFFFF',
    'primary-container': '#A6F0C5',
    'on-primary-container': '#00210E',

    // Secondary — ocean (cool supporting accent)
    'secondary': '#2F6F8F',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#C9E6F5',
    'on-secondary-container': '#001E2E',

    // Tertiary — honey gold (warm accent, used sparingly)
    'tertiary': '#A67C00',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#FBE39A',
    'on-tertiary-container': '#241A00',

    // Warning — orange (caution status)
    'warning': '#B85311',
    'on-warning': '#FFFFFF',
    'warning-container': '#FFDBC7',
    'on-warning-container': '#331100',

    // Error — crimson (critical status)
    'error': '#C8112A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDADC',
    'on-error-container': '#45000B',

    // Success — teal-emerald (cooler than jade primary; clear 'confirmation' read)
    'success': '#0F9B85',
    'on-success': '#FFFFFF',
    'success-container': '#9DF1E0',
    'on-success-container': '#00261F',

    // Info — editorial indigo (distinct from secondary ocean and source indigo)
    'info': '#3A4FE0',
    'on-info': '#FFFFFF',
    'info-container': '#DDE1FF',
    'on-info-container': '#00056F',

    // Outline
    'outline': '#7C7F88',
    'outline-variant': '#C7CAD0',

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
    'theme-kbd': '#DFE2E7',
    'theme-on-kbd': '#5E6470',
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // Surfaces — MD3 tone steps (5 / 12 / 15 / 20 / 26)
    'surface': '#15181D',
    'on-surface': '#C5CCDA',
    'surface-variant': '#454A52',
    'on-surface-variant': '#B0B6C2',

    'surface-container-highest': '#393E45',
    'on-surface-container-highest': '#C5CCDA',
    'surface-container-high': '#2C3137',
    'on-surface-container-high': '#C5CCDA',
    'surface-container': '#22262B',
    'on-surface-container': '#C5CCDA',
    'surface-container-low': '#1D2025',
    'on-surface-container-low': '#C5CCDA',
    'surface-container-lowest': '#0F1114',
    'on-surface-container-lowest': '#C5CCDA',

    // Surface add-ons
    'surface-bright': '#404550',
    'surface-dim': '#15181D',

    'surface-base': '#1F2328', // app backdrop; bars composite here    (L* 13.5)
    'on-surface-base': '#C5CCDA',
    'surface-canvas': '#191C21', // recessed content wells (below base) (L* 10)
    'on-surface-canvas': '#C5CCDA',
    'surface-sunken': '#15181D', // wells within a canvas well           (L* 8)
    'on-surface-sunken': '#C5CCDA',
    'surface-raised': '#22262B', // cards, list rows                   (L* 15)
    'on-surface-raised': '#C5CCDA',
    'surface-sidebar': '#262B31', // docked side panels                (L* 17)
    'on-surface-sidebar': '#C5CCDA',
    'surface-overlay': '#2C3137', // menus, dialogs, popovers          (L* 20)
    'on-surface-overlay': '#C5CCDA',

    // Background
    'background': '#1F2328',
    'on-background': '#C5CCDA',

    // Primary — jade (contemporary, vibrant; tone-derived)
    'primary': '#6FD49A',
    'on-primary': '#00391C',
    'primary-container': '#00522A',
    'on-primary-container': '#8FF0B7',

    // Secondary — ocean (cool supporting accent)
    'secondary': '#9CCAE2',
    'on-secondary': '#003549',
    'secondary-container': '#004F69',
    'on-secondary-container': '#CDE6F5',

    // Tertiary — honey gold (warm accent, used sparingly)
    'tertiary': '#EFC64B',
    'on-tertiary': '#3E2E00',
    'tertiary-container': '#574400',
    'on-tertiary-container': '#FBE39A',

    // Warning — orange (caution status)
    'warning': '#FFA766',
    'on-warning': '#4E2400',
    'warning-container': '#7A3B12',
    'on-warning-container': '#FFDBC7',

    // Error — crimson (critical status)
    'error': '#FF9BA3',
    'on-error': '#680016',
    'error-container': '#91002A',
    'on-error-container': '#FFDADC',

    // Success — teal-emerald (cooler than jade primary; clear 'confirmation' read)
    'success': '#65E1CB',
    'on-success': '#003B32',
    'success-container': '#00574A',
    'on-success-container': '#9DF1E0',

    // Info — editorial indigo (distinct from secondary ocean and source indigo)
    'info': '#A8B2FF',
    'on-info': '#08148F',
    'info-container': '#1F32B1',
    'on-info-container': '#DDE1FF',

    // Outline
    'outline': '#6E7585',
    'outline-variant': '#3E4452',

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
    'theme-kbd': '#454A52',
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
        VMenu: {
          // VList rendered inside a menu defaults to this surface; any
          // explicit bg-color on the <v-list> in a template overrides it.
          VList: { bgColor: 'surface-overlay' },
        },
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
      display: {
        thresholds: {
          lg: 1440,
        },
      },
    });
    nuxt.vueApp.use(vuetify);
  },
});
