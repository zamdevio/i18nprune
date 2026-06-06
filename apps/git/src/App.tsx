import { ThemeProvider } from '@i18nprune/ui/react/theme';
import { Route, Routes } from 'react-router-dom';
import { GitBranch as GitBranchIcon, GitCommit, LayoutDashboard, Tag, Timer, Users } from 'lucide-react';
import authorsData from './data/authors.json';
import branchesData from './data/branches.json';
import commitsData from './data/commits.json';
import phasesData from './data/phases.json';
import summaryData from './data/summary.json';
import tagsData from './data/tags.json';
import { SiteFooter } from './components/layout/footer';
import { Sidebar, type NavItem } from './components/layout/sidebar';
import { useSidebarCollapse } from './hooks/useSidebarCollapse';
import { AuthorDetail, AuthorsPage, BranchDetail, BranchesPage, CommitDetail, Commits, Overview, TagDetail, TagsPage, TimelinePage } from './pages';
import type { Author, Commit, GitBranch, GitTag, Phase, Summary } from './types';
import styles from './App.module.css';

const THEME_STORAGE_KEY = 'i18nprune-git-theme';

const summary = summaryData as Summary;
const phases = phasesData as Phase[];
const commits = commitsData as Commit[];
const authors = authorsData as Author[];
const tags = tagsData as GitTag[];
const branches = branchesData as GitBranch[];

const navItems: NavItem[] = [
  { to: '/', label: 'Overview', end: true, icon: <LayoutDashboard size={18} /> },
  { to: '/timeline', label: 'Timeline', end: false, icon: <Timer size={18} /> },
  { to: '/commits', label: 'Commits', end: false, icon: <GitCommit size={18} /> },
  { to: '/authors', label: 'Authors', end: false, icon: <Users size={18} /> },
  { to: '/tags', label: 'Tags', end: false, icon: <Tag size={18} /> },
  { to: '/branches', label: 'Branches', end: false, icon: <GitBranchIcon size={18} /> },
];

export default function App() {
  const { collapsed, mobileOpen, isCompact, toggle, closeMobile } = useSidebarCollapse();

  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY}>
      <div className={styles.app}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          isCompact={isCompact}
          onToggle={toggle}
          onCloseMobile={closeMobile}
          items={navItems}
        />

        <div className={styles.contentColumn}>
          <main className={styles.main}>
            {isCompact && !mobileOpen ?
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={toggle}
                aria-label="Open navigation"
              >
                ☰
              </button>
            : null}
            <Routes>
              <Route
                path="/"
                element={
                  <Overview
                    summary={summary}
                    phases={phases}
                    commits={commits}
                    tags={tags}
                    branches={branches}
                  />
                }
              />
              <Route
                path="/timeline"
                element={<TimelinePage summary={summary} phases={phases} commits={commits} />}
              />
              <Route path="/commits" element={<Commits commits={commits} />} />
              <Route
                path="/commits/:hash"
                element={
                  <CommitDetail
                    commits={commits}
                    authors={authors}
                    githubRepoUrl={summary.githubRepoUrl}
                  />
                }
              />
              <Route path="/authors" element={<AuthorsPage authors={authors} />} />
              <Route
                path="/authors/:username"
                element={<AuthorDetail authors={authors} commits={commits} />}
              />
              <Route
                path="/tags"
                element={<TagsPage tags={tags} />}
              />
              <Route
                path="/tags/:name"
                element={
                  <TagDetail
                    tags={tags}
                    commits={commits}
                    authors={authors}
                    githubRepoUrl={summary.githubRepoUrl}
                  />
                }
              />
              <Route path="/branches" element={<BranchesPage branches={branches} />} />
              <Route
                path="/branches/:name"
                element={
                  <BranchDetail
                    branches={branches}
                    commits={commits}
                    authors={authors}
                    githubRepoUrl={summary.githubRepoUrl}
                  />
                }
              />
            </Routes>
          </main>
          <SiteFooter syncedAt={summary.syncedAt} />
        </div>
      </div>
    </ThemeProvider>
  );
}
