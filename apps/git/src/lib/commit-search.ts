export function matchesCommitSearch(commit: {
  date: string;
  type: string;
  scope: string;
  subject: string;
  body: string;
  author: string;
  email: string;
}, query: string): boolean {
  if (!query) return true;
  const haystack = [
    commit.date,
    commit.type,
    commit.scope,
    commit.subject,
    commit.body,
    commit.author,
    commit.email,
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(query);
}
