import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Tailor',
  base: '/author/',
  description: 'Tailor docs',
  // In order to avoid errors for localhost:8080
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'logo.png',
    search: { provider: 'local' },
    nav: [{ text: 'Home', link: '/' }],
    sidebar: [
      {
        text: 'Introduction',
        items: [{ text: 'Overview', link: '/overview' }],
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Repository', link: '/concepts/repository' },
          { text: 'Activity', link: '/concepts/activity' },
          { text: 'Content Element', link: '/concepts/content-element' },
          { text: 'Content Container', link: '/concepts/content-container' },
          { text: 'Meta Input', link: '/concepts/meta-input' },
          { text: 'Schema', link: '/concepts/schema' },
        ],
      },
      {
        text: 'Development',
        items: [
          {
            text: 'Installation',
            link: '/installation',
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tailor-cms/author' },
    ],
  },
});
