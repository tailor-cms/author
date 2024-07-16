import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Tailor',
  base: '/',
  description: 'Tailor docs',
  // In order to avoid errors for localhost:8080
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: 'logo.png',
    search: { provider: 'local' },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Content Element Kit', link: 'https://tailor-cms.github.io/xt/' },
    ],
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
          {
            text: 'Content configuration',
            items: [
              {
                text: 'Introduction',
                link: '/dev/configuration/introduction',
              },
              {
                text: 'Adding new schema',
                link: '/dev/configuration/schema',
              },
              {
                text: 'Repository structure',
                link: '/dev/configuration/structure',
              },
            ],
          },
          {
            text: 'Publishing',
            items: [
              {
                text: 'Introduction',
                link: '/dev/publishing/introduction',
              },
              {
                text: 'Repository catalog',
                link: '/dev/publishing/catalog',
              },
              {
                text: 'Repository manifest',
                link: '/dev/publishing/repository-manifest',
              },
              {
                text: 'Content Containers',
                link: '/dev/publishing/content-containers',
              },
              {
                text: 'SDK',
                link: 'https://github.com/underscope/garment',
              },
            ],
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tailor-cms/author' },
    ],
  },
});
