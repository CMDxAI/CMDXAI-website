import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// Served at https://cmdx.ai/docs/ beside the Vite site; deploy.yml copies build/ into dist/docs.
const baseUrl = '/docs/';

// Plain anchors for links to cmdx.ai: Docusaurus treats them as external and would add
// rel="noopener noreferrer" (hiding the docs as referrer), an external-link icon and, for
// mailto, target="_blank".
const siteLink = (label: string, href: string) => ({
  html: `<a class="footer__link-item" href="${href}">${label}</a>`,
});
const config: Config = {
  title: 'CMDX Docs',
  tagline: 'Documentation for the CMDX learning management system',
  favicon: 'img/wordmark.svg',

  future: {
    v4: true,
  },

  url: 'https://cmdx.ai',
  baseUrl,
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
  // Local search until Algolia DocSearch is approved (Phase 1 search item). One entry per docs
  // instance: the versioned one at '/' and the two unversioned ones.
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: ['/', 'getting-started', 'users'],
        docsDir: ['docs', 'docs-current/getting-started', 'docs-current/users'],
        indexBlog: false,
      },
    ],
  ],

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
        { href: 'https://cmdx.ai/', label: 'cmdx.ai', position: 'right', target: '_self', rel: 'noopener' },
      ],
    },
    // Mirrors the cmdx.ai footer. Links to the private GitHub repo and the placeholder Blog link are left out.
    footer: {
      style: 'light',
      links: [
        {
          title: null,
          items: [
            {
              // html items skip baseUrl handling, so the path is built here.
              html: `<a class="footer-brand" href="https://cmdx.ai/"><img src="${baseUrl}img/wordmark.svg" alt="CMDX" width="132" height="32"></a><p class="footer-tagline">Open source learning, <span class="footer-hl">run on your terms.</span></p><p class="footer-sub">An open source LMS for organizations, with AI built in.</p>`,
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            siteLink('Features', 'https://cmdx.ai/features'),
            siteLink('AI capabilities', 'https://cmdx.ai/features#ai'),
            siteLink('Roadmap', 'https://cmdx.ai/features#roadmap'),
            siteLink('Why CMDX?', 'https://cmdx.ai/why-cmdx'),
          ],
        },
        {
          title: 'Open Source',
          items: [
            { label: 'Documentation', to: '/' },
            siteLink('Community', 'https://cmdx.ai/open-source'),
          ],
        },
        {
          title: 'Company',
          items: [
            siteLink('About us', 'https://cmdx.ai/about'),
            siteLink('Enterprise services', 'https://cmdx.ai/download#enterprise'),
            siteLink('Talk to our team', 'mailto:hello@cmdx.ai'),
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} CMDX. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
