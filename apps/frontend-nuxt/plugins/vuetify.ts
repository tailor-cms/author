import type { ThemeDefinition } from 'vuetify';

import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';

const defaultTheme: ThemeDefinition = {
  colors: {
    primary: '#607d8b',
    secondary: '#e91e63',
  },
};

export default defineNuxtPlugin((nuxt) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: 'default',
      themes: {
        default: defaultTheme,
      },
    },
  });
  nuxt.vueApp.use(vuetify);
});
