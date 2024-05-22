import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Tailor",
  base: '/author/',
  description: "Tailor docs",
  // In order to avoid errors for localhost:8080
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "logo.png",
    search: { provider: 'local' },
    nav: [{ text: "Home", link: "/" }],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Installation", link: "/installation" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/tailor-cms/author" },
    ],
  },
});
