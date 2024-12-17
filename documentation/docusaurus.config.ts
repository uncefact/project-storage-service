import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const url = process.env.DOCS_URL || 'http://localhost';
const baseUrl = process.env.DOCS_BASE_URL || '/';

const config: Config = {
  title: 'Storage Service',
  tagline: 'A secure credential storage solution that complies with UNTP standards.',
  favicon: 'img/favicon.ico',

  url,
  baseUrl,

  organizationName: 'uncefact',
  projectName: 'project-identity-resolver',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/uncefact/project-identity-resolver/tree/next',
        },
        blog: false,
        theme: {
          customCss: [
            require.resolve('./src/css/custom.scss'),
            require.resolve('./src/css/index.scss'),
          ],
        },
      } 
    ],
  ],

  plugins: ['docusaurus-plugin-sass'],

  themes: ['@docusaurus/theme-mermaid'],

  themeConfig: {
    slackLink:
    'https://join.slack.com/t/uncefact/shared_invite/zt-1d7hd0js1-sS1Xgk8DawQD9VgRvy1QHQ',
    repoLink: 'https://github.com/uncefact/project-identity-resolver',
    colorMode: {
      disableSwitch: true,
    },
  image: 'img/un-crm-social-card.png',    
  navbar: {
      title: 'Storage Service',
      logo: {
        alt: 'UNTP Storage Service Logo',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/docs/introduction', label: 'Introduction', position: 'right'},
        {
          to: '/docs/getting-started/',
          label: 'Getting started',
          position: 'right',
        },
        {
          to: '/docs/installation/',
          label: 'Installation',
          position: 'right',
        },
        {to: '/docs/features/', label: 'Features', position: 'right'},
        {
          to: 'https://github.com/uncefact/project-identity-resolver',
          label: 'Contribute',
          position: 'right',
        },
        {
          href: 'https://uncefact.slack.com/archives/C03L1LDU1ED',
          position: 'right',
          html: '<svg class="icon icon-slack"><use xlink:href="#slack"></use></svg><span class="menu-item-name">Slack</span>',
          className: 'navbar-slack-link',
        },
        {
          href: 'https://github.com/uncefact/project-identity-resolver',
          html: '<svg class="icon"><use xlink:href="#github"></use></svg><span class="menu-item-name">Github</span>',
          className: 'navbar-github-link',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  }
};

export default config;
