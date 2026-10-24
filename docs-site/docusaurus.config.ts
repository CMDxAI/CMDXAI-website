import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// Served at https://cmdx.ai/docs/ beside the Vite site; deploy.yml copies build/ into dist/docs.
const config: Config = {
  title: 'CMDX Docs',
  tagline: 'Documentation for the CMDX learning management system',
  favicon: 'img/wordmark.svg',

  future: {
    v4: true,
  },

  url: 'https://cmdx.ai',
  baseUrl: '/docs/',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/CMDxAI/CMDXAI-website/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: [
            './src/css/fonts.css',
            './src/css/fig-tokens.css',
            './src/css/semantic.css',
            './src/css/custom.css',
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Design system has no dark-mode tokens yet.
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      logo: {
        alt: 'CMDX',
        src: 'img/wordmark.svg',
        href: '/',
      },
      items: [
        { type: 'docSidebar', sidebarId: 'developers', position: 'left', label: 'Developers' },
        {
          type: 'docSidebar',
          sidebarId: 'administrators',
          position: 'left',
          label: 'Administrators',
        },
        { type: 'docSidebar', sidebarId: 'users', position: 'left', label: 'Users' },
        { href: 'https://cmdx.ai', label: 'cmdx.ai', position: 'right', target: '_self' },
      ],
    },
    footer: {
      style: 'light',
      copyright: `© ${new Date().getFullYear()} CMDX`,
    },
    prism: {
      theme: prismThemes.github,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
