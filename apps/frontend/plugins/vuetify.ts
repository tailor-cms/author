import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { mdi } from 'vuetify/iconsets/mdi';
import type { ThemeDefinition } from 'vuetify';

import outlineIconset from '~/components/repository/Outline/icons/iconset';

const defaultTheme: ThemeDefinition = {
  colors: {
    'primary': '#607D8B',
    'primary-darken-1': '#546E7A',
    'primary-darken-2': '#455A64',
    'primary-darken-3': '#37474F',
    'primary-darken-4': '#263238',
    'primary-lighten-1': '#78909C',
    'primary-lighten-2': '#90A4AE',
    'primary-lighten-3': '#B0BEC5',
    'primary-lighten-4': '#CFD8DC',
    'primary-lighten-5': '#ECEFF1',
    'secondary': '#E91E63',
    'secondary-darken-1': '#D81B60',
    'secondary-darken-2': '#C2185B',
    'secondary-darken-3': '#AD1457',
    'secondary-darken-4': '#880E4F',
    'secondary-lighten-1': '#EC407A',
    'secondary-lighten-2': '#F06292',
    'secondary-lighten-3': '#F48FB1',
    'secondary-lighten-4': '#F8BBD0',
    'secondary-lighten-5': '#FCE4EC',
    'success': '#4CAF50',
    'success-darken-1': '#43A047',
    'success-darken-2': '#2E7D32',
    'success-darken-3': '#2E7D32',
    'success-darken-4': '#1B5E20',
    'success-lighten-1': '#66BB6A',
    'success-lighten-2': '#81C784',
    'success-lighten-3': '#A5D6A7',
    'success-lighten-4': '#C8E6C9',
    'success-lighten-5': '#E8F5E9',
  },
};

export default defineNuxtPlugin((nuxt) => {
  const vuetify = createVuetify({
    ssr: true,
    blueprint: md3,
    components,
    directives,
    theme: {
      defaultTheme: 'default',
      themes: {
        default: defaultTheme,
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
});
