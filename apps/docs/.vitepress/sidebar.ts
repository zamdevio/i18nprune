/**
 * Manual VitePress sidebar (srcDir: content, cleanUrls: true).
 * Folder links like /commands/validate map to index.md; leaf pages e.g. /cli/cache.
 */
import type { DefaultTheme } from 'vitepress'

export const sidebar: DefaultTheme.Config['sidebar'] = {
  '/': [
    {
      text: 'Start',
      items: [
        { text: 'Documentation home', link: '/' },
        { text: 'Onboarding', link: '/onboarding' },
        { text: 'Workflow (local dev)', link: '/workflow' },
        { text: 'Contributors', link: '/contributors' },
      ],
    },
    {
      text: 'Product',
      collapsed: false,
      items: [
        { text: 'Vision', link: '/vision' },
        { text: 'Journey', link: '/journey' },
        { text: 'Origin', link: '/origin' },
        { text: 'Roadmap', link: '/roadmap' },
        { text: 'Launch & adoption', link: '/launch' },
      ],
    },
    {
      text: 'CLI',
      collapsed: false,
      items: [
        { text: 'CLI overview', link: '/cli/' },
        { text: 'CLI disk cache', link: '/cli/cache' },
        { text: 'CLI runtime', link: '/cli/runtime' },
        { text: 'Verbosity (quiet / silent)', link: '/cli/verbosity' },
        { text: 'Prompts', link: '/cli/prompts' },
        {
          text: 'Commands',
          collapsed: true,
          items: [
            { text: 'Commands hub', link: '/commands/' },
            { text: 'Orchestration', link: '/commands/orchestration' },
            { text: 'init', link: '/commands/init' },
            { text: 'config', link: '/commands/config' },
            { text: 'doctor', link: '/commands/doctor' },
            { text: 'validate', link: '/commands/validate' },
            { text: 'sync', link: '/commands/sync' },
            { text: 'report', link: '/commands/report' },
            { text: 'missing', link: '/commands/missing' },
            { text: 'generate', link: '/commands/generate' },
            { text: 'locales', link: '/commands/locales/' },
            { text: 'languages', link: '/commands/languages' },
            { text: 'providers', link: '/commands/providers' },
            { text: 'cleanup', link: '/commands/cleanup' },
            { text: 'quality', link: '/commands/quality' },
            { text: 'review', link: '/commands/review' },
            { text: 'version', link: '/commands/version' },
            { text: 'help', link: '/commands/help' },
          ],
        },
      ],
    },
    {
      text: 'Configuration & I/O',
      collapsed: true,
      items: [
        { text: 'Configuration', link: '/config/' },
        { text: 'Translation', link: '/config/translate' },
        { text: 'Exclude (scan scope)', link: '/config/exclude' },
        { text: 'Environment variables', link: '/config/env' },
        { text: 'Policies', link: '/config/policies/' },
        { text: 'JSON output (--json)', link: '/json/' },
        { text: 'Programmatic JSON', link: '/json/programmatic' },
        { text: 'Exit codes & behavior', link: '/behavior/' },
        { text: 'Command behaviors', link: '/behavior/commands' },
      ],
    },
    {
      text: 'Understanding extraction',
      collapsed: true,
      items: [
        { text: 'Dynamic keys', link: '/dynamic/' },
        { text: 'Regex & limits', link: '/regex/' },
        { text: 'Key sites & dynamic', link: '/regex/key-sites-and-dynamic' },
        { text: 'Extraction', link: '/regex/extraction' },
      ],
    },
    {
      text: 'Report & locales',
      collapsed: true,
      items: [
        { text: 'Report (HTML / JSON)', link: '/report/' },
        { text: 'Report payload', link: '/report/payload' },
        { text: 'Locales (metadata)', link: '/locales/' },
      ],
    },
    {
      text: 'Issues reference',
      collapsed: true,
      items: [
        { text: 'Issues hub', link: '/issues/' },
        { text: 'CLI issues', link: '/issues/cli' },
        { text: 'Cleanup issues', link: '/issues/cleanup' },
        { text: 'Config issues', link: '/issues/config' },
        { text: 'Context issues', link: '/issues/context' },
        { text: 'Doctor issues', link: '/issues/doctor' },
        { text: 'Generate issues', link: '/issues/generate' },
        { text: 'I/O issues', link: '/issues/io' },
        { text: 'Languages issues', link: '/issues/languages' },
        { text: 'Locale issues', link: '/issues/locale' },
        { text: 'Locales issues', link: '/issues/locales' },
        { text: 'Missing issues', link: '/issues/missing' },
        { text: 'Patching issues', link: '/issues/patching' },
        { text: 'Quality issues', link: '/issues/quality' },
        { text: 'Report issues', link: '/issues/report' },
        { text: 'Scan issues', link: '/issues/scan' },
        { text: 'Sync issues', link: '/issues/sync' },
        { text: 'Translate issues', link: '/issues/translate' },
        { text: 'Validate issues', link: '/issues/validate' },
      ],
    },
    {
      text: 'Performance',
      collapsed: true,
      items: [
        { text: 'Performance hub', link: '/performance/' },
        { text: 'Next.js case study', link: '/performance/nextjs' },
        { text: 'CepatEdge workflow', link: '/performance/cepatedge' },
      ],
    },
    {
      text: 'Examples',
      collapsed: true,
      items: [
        { text: 'Examples hub', link: '/examples/' },
        { text: 'jq cookbook', link: '/examples/jq-cookbook' },
        { text: 'Command recipes', link: '/examples/commands/' },
      ],
    },
    {
      text: 'Programmatic API',
      collapsed: true,
      items: [
        { text: 'Exports hub', link: '/exports/' },
        { text: 'Config API', link: '/exports/config' },
        { text: 'Core API', link: '/exports/core' },
        { text: 'Usage examples', link: '/exports/examples/' },
      ],
    },
    {
      text: 'Architecture',
      collapsed: true,
      items: [
        { text: 'Architecture hub', link: '/architecture/' },
        { text: 'Project tree layout', link: '/architecture/tree' },
        { text: 'Languages catalog', link: '/architecture/languages' },
        { text: 'Madge dependency graph', link: '/madge' },
      ],
    },
    {
      text: 'Patching & translators',
      collapsed: true,
      items: [
        { text: 'Patching overview', link: '/patching/' },
        { text: 'Loader integration', link: '/patching/loader' },
        { text: 'Patching config', link: '/patching/config' },
        { text: 'Translator engine', link: '/translator/' },
        {
          text: 'Runtime',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/runtime/' },
            { text: 'Node / CLI', link: '/runtime/node' },
            { text: 'Browser (Web)', link: '/runtime/web' },
            { text: 'Worker / edge', link: '/runtime/worker' },
          ],
        },
      ],
    },
    {
      text: 'Agents & maintainers',
      collapsed: true,
      items: [
        { text: 'Agents hub', link: '/agents/' },
        { text: 'Git hygiene', link: '/agents/git' },
        { text: 'Rules', link: '/agents/rules' },
        { text: 'Changelog', link: '/changelog/' },
        { text: 'Versioning / npm checks', link: '/versioning' },
      ],
    },
    {
      text: 'Edge cases & barriers',
      collapsed: true,
      items: [
        { text: 'Edge cases', link: '/edge-cases/' },
        { text: 'Solved', link: '/edge-cases/solved/' },
        { text: 'Unsolved', link: '/edge-cases/unsolved/' },
        { text: 'Barriers', link: '/barriers/' },
        { text: 'Cursor & tooling story', link: '/cursor/' },
      ],
    },
    {
      text: 'Release',
      collapsed: true,
      items: [
        { text: 'Release hub', link: '/release/' },
        { text: 'Parity checklist', link: '/release/parity-checklist/' },
      ],
    },
    {
      text: 'Standards',
      collapsed: true,
      items: [
        { text: 'Standard toolkit', link: '/standard/' },
        { text: 'Progress bar policy', link: '/progress/' },
        { text: 'Prompts (CLI boundaries)', link: '/prompts/' },
      ],
    },
  ],
}
