import type { ThemeDefinition } from 'vuetify';

import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';

const defaultTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#607D8B',
    secondary: '#E91E63',
  },
};

export default defineNuxtPlugin((nuxt) => {
  const vuetify = createVuetify({
    components,
    directives,
    ssr: true,
    theme: {
      defaultTheme: 'default',
      themes: {
        default: defaultTheme,
      },
    },
  });
  nuxt.vueApp.use(vuetify);
});
