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
        // Versioned instance (docs/): developers/, administrators/.
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/CMDxAI/CMDXAI-website/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: [
            './src/css/tokens/fonts.css',
            './src/css/tokens/fig-tokens.css',
            './src/css/tokens/semantic.css',
            './src/css/custom.css',
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  // Unversioned instances: these audiences always track the current release. Each needs its own
  // routeBasePath; a second instance at '/' is shadowed by the versioned one and builds as 404.
  // No sidebarPath: Docusaurus autogenerates 'defaultSidebar' from the folder.
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'getting-started',
        path: 'docs-current/getting-started',
        routeBasePath: 'getting-started',
        editUrl: 'https://github.com/CMDxAI/CMDXAI-website/tree/main/docs-site/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'users',
        path: 'docs-current/users',
        routeBasePath: 'users',
        editUrl: 'https://github.com/CMDxAI/CMDXAI-website/tree/main/docs-site/',
      },
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
        {
          type: 'docSidebar',
          sidebarId: 'defaultSidebar',
          docsPluginId: 'getting-started',
          position: 'left',
          label: 'Get started',
        },
        { type: 'docSidebar', sidebarId: 'developers', position: 'left', label: 'Developers' },
        {
          type: 'docSidebar',
          sidebarId: 'administrators',
          position: 'left',
          label: 'Administrators',
        },
        {
          type: 'docSidebar',
          sidebarId: 'defaultSidebar',
          docsPluginId: 'users',
          position: 'left',
          label: 'Users',
        },
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
