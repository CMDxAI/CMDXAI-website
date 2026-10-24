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
    // Mirrors the cmdx.ai header: site links and the contact button on row 1, docs links on row 2.
    // Absolute cmdx.ai links open in the same tab (same origin in production).
    navbar: {
      logo: {
        alt: 'CMDX',
        src: 'img/wordmark.svg',
        href: 'https://cmdx.ai/',
        target: '_self',
      },
      items: [
        { href: 'https://cmdx.ai/', label: 'Home', position: 'left', target: '_self' },
        { href: 'https://cmdx.ai/open-source', label: 'Open Source', position: 'left', target: '_self' },
        { href: 'https://cmdx.ai/features', label: 'Features', position: 'left', target: '_self' },
        { href: 'https://cmdx.ai/why-cmdx', label: 'Why CMDX?', position: 'left', target: '_self' },
        // Empty full-width item that wraps the docs links onto a second row (custom.css).
        { type: 'html', value: '<span></span>', position: 'left', className: 'navbar-row-break' },
        {
          to: '/',
          label: 'Docs',
          position: 'left',
          className: 'navbar-docs-home',
          activeBaseRegex: '^/docs/?$',
        },
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
        // The website opens a contact dialog here; mailto is its no-JavaScript fallback.
        {
          href: 'mailto:hello@cmdx.ai?subject=Getting%20started%20with%20CMDX',
          label: 'Get started',
          position: 'right',
          className: 'navbar-cta',
        },
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
              // html items skip baseUrl handling, so the image path includes /docs/.
              html: '<a class="footer-brand" href="https://cmdx.ai/"><img src="/docs/img/wordmark.svg" alt="CMDX" width="132" height="32"></a><p class="footer-tagline">Open source learning, <span class="footer-hl">run on your terms.</span></p><p class="footer-sub">An open source LMS for organizations, with AI built in.</p>',
            },
          ],
        },
        {
          title: 'Platform',
          items: [
            { label: 'Features', href: 'https://cmdx.ai/features', target: '_self' },
            { label: 'AI capabilities', href: 'https://cmdx.ai/features#ai', target: '_self' },
            { label: 'Roadmap', href: 'https://cmdx.ai/features#roadmap', target: '_self' },
            { label: 'Why CMDX?', href: 'https://cmdx.ai/why-cmdx', target: '_self' },
          ],
        },
        {
          title: 'Open Source',
          items: [
            { label: 'Documentation', to: '/' },
            { label: 'Community', href: 'https://cmdx.ai/open-source', target: '_self' },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'About us', href: 'https://cmdx.ai/about', target: '_self' },
            { label: 'Enterprise services', href: 'https://cmdx.ai/download#enterprise', target: '_self' },
            { label: 'Talk to our team', href: 'mailto:hello@cmdx.ai' },
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
