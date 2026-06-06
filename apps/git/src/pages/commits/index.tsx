import { CommitTable } from '../../components';
import type { Commit } from '../../types';

interface CommitsProps {
  commits: Commit[];
}

export function Commits({ commits }: CommitsProps) {
  return (
    <div>
      <h1 className="pageTitle">Commits</h1>
      <CommitTable commits={commits} />
    </div>
  );
}
