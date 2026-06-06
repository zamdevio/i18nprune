import { tryGit } from './git.js';

export function resolveGitHubRepoUrl(): string | null {
  const remote = tryGit(['remote', 'get-url', 'origin']);
  if (!remote) return null;

  const ssh = remote.match(/^git@github\.com:(.+?)(?:\.git)?$/);
  if (ssh) return `https://github.com/${ssh[1]}`;

  const https = remote.match(/^https:\/\/github\.com\/(.+?)(?:\.git)?$/);
  if (https) return `https://github.com/${https[1]}`;

  return null;
}

export function guessGitHubLogin(name: string, username: string): string {
  const handle = name.trim().replace(/\s+/g, '');
  if (/^[a-zA-Z0-9-]+$/.test(handle)) return handle;
  return username;
}

export function githubProfileUrl(name: string, email: string): string {
  return `https://github.com/${guessGitHubLogin(name, authorUsernameFromEmail(name, email))}`;
}

function authorUsernameFromEmail(name: string, email: string): string {
  const handle = name.trim().replace(/\s+/g, '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (handle) return handle;
  return email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'unknown';
}
