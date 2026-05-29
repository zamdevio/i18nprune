import { t } from './i18n.js';
import { bannerText } from './widgets/banner.js';
import { statsLine } from './widgets/stats.js';
import { helpLinks } from './views/help.js';
import { settingsLabels } from './views/settings.js';

const NS = 'app';

export function main(): string {
  // Simple string key usage
  const title = t(`${NS}.title`);
  // Dynamic key selection
  const navPage = 'about';
  const navLabel = t(`${NS}.nav.${navPage}`);

  // Using template literal for a footer key
  const copyright = t(`${NS}.footer.${'copyright'}`);

  // Conditional access to translation keys
  const isLoggedIn = Math.random() > 0.5;
  const greetingKey = isLoggedIn ? `${NS}.greeting` : 'notifications.logout';
  const greeting = t(greetingKey);

  // Access a user area with interpolated NS prefix (demo: register username)
  const userNS = 'user';
  const registerUsername = t(`${userNS}.register.username`);

  // Fallback if translation missing (simulate with not found key)
  const notFound = t(`${NS}.does_not_exist`) || '[MISSING TRANSLATION]';

  // Use several notification messages
  const notifyKeys = ['notifications.success', 'notifications.error', 'notifications.logout'];
  const notifications = notifyKeys.map(key => t(key)).join(' | ');

  // Return a combined string illustrating varied translation usages
  return [
    title,
    navLabel,
    copyright,
    greeting,
    registerUsername,
    notFound,
    notifications,
    statsLine(),
    bannerText(),
    helpLinks(),
    settingsLabels(),
  ].join('\n');
}
