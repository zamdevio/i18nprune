/**
 * Manual VitePress sidebar (srcDir: content, cleanUrls: true).
 * Folder links like /commands/validate map to index.md; leaf pages e.g. /cli/cache.
 */
import type { DefaultTheme } from 'vitepress'

export const sidebar: DefaultTheme.Config['sidebar'] = {
  '/': [
    {
      text: 'Start Here',
      items: [
        { text: 'Documentation home', link: '/' },
        { text: 'Onboarding hub', link: '/onboarding/' },
        { text: 'CLI path', link: '/onboarding/cli' },
        { text: 'SDK path', link: '/onboarding/sdk' },
        { text: 'CI path', link: '/onboarding/ci' },
        { text: 'Hosted surfaces', link: '/onboarding/hosted' },
        { text: 'Contributors', link: '/contributors/' },
        { text: 'Workflow (local dev)', link: '/workflow' },
      ],
    },
    {
      text: 'CLI',
      collapsed: true,
      items: [
        { text: 'CLI overview', link: '/cli/' },        
        { text: 'CLI disk cache', link: '/cli/cache' },
        { text: 'Runtime overview', link: '/runtime/' },
        { text: 'Verbosity (quiet / silent)', link: '/cli/verbosity' },
        { text: 'Prompts', link: '/cli/prompts' },
        { text: 'JSON output (--json)', link: '/cli/json' },
        {
          text: 'Commands',
          collapsed: true,
          items: [
            { text: 'Commands hub', link: '/commands/' },
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
        { text: 'Cache config', link: '/config/cache' },
        { text: 'Patching config', link: '/config/patching' },
        { text: 'Policies', link: '/config/policies' },
      ],
    },
    {
      text: 'Architecture',
      collapsed: true,
      items: [
        { text: 'Architecture hub', link: '/architecture/' },
        { text: 'Project tree layout', link: '/architecture/tree' },
        { text: 'Extractor overview', link: '/architecture/extraction/' },
        { text: 'Dynamic keys', link: '/architecture/extraction/dynamic' },
        { text: 'Regex & limits', link: '/architecture/extraction/regex' },
      ],
    },
    {
      text: 'Runtime, SDK, and translators',
      collapsed: true,
      items: [
        { text: 'Runtime overview', link: '/runtime/' },
        { text: 'Node / CLI runtime', link: '/runtime/node' },
        { text: 'Browser runtime', link: '/runtime/web' },
        { text: 'Worker / edge runtime', link: '/runtime/worker' },
        { text: 'SDK operations', link: '/sdk/operations' },
        { text: 'Translator engine', link: '/translator/' },
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
        { text: 'Path issues', link: '/issues/paths' },
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
      items: [{ text: 'Performance guide', link: '/performance' }],
    },
    {
      text: 'Examples',
      collapsed: true,
      items: [
        { text: 'Examples hub', link: '/examples/' },
        { text: 'jq cookbook', link: '/examples/jq-cookbook' },
        { text: 'SDK examples', link: '/examples/sdk' },
      ],
    },
    {
      text: 'Patching & translators',
      collapsed: true,
      items: [
        { text: 'Patching overview', link: '/patching/' },
        { text: 'Loader integration', link: '/patching/loader' },
        { text: 'Patching config', link: '/patching/config' },
      ],
    },
    {
      text: 'Release & maintenance',
      collapsed: true,
      items: [
        { text: 'Changelog', link: '/changelog' },
        { text: 'Update checks & version throttle', link: '/cli/cache' },
      ],
    },
    {
      text: 'Edge cases & barriers',
      collapsed: true,
      items: [
        { text: 'Edge cases', link: '/edge-cases/' },
        { text: 'Solved', link: '/edge-cases/solved/' },
        { text: 'Unsolved', link: '/edge-cases/unsolved/' },
        { text: 'Extraction limits', link: '/architecture/extraction/' },
        { text: 'Contributors', link: '/contributors/' },
      ],
    },
  ],
}
