import { Route, Routes } from 'react-router-dom';
import { GitCommit, LayoutDashboard, Timer } from 'lucide-react';
import commitsData from './data/commits.json';
import phasesData from './data/phases.json';
import summaryData from './data/summary.json';
import { Sidebar, type NavItem } from './components/layout/sidebar';
import { useSidebarCollapse } from './hooks/useSidebarCollapse';
import { CommitDetail, Commits, Overview, TimelinePage } from './pages';
import type { Commit, Phase, Summary } from './types';
import styles from './App.module.css';

const summary = summaryData as Summary;
const phases = phasesData as Phase[];
const commits = commitsData as Commit[];

const navItems: NavItem[] = [
  { to: '/', label: 'Overview', end: true, icon: <LayoutDashboard size={18} /> },
  { to: '/timeline', label: 'Timeline', end: false, icon: <Timer size={18} /> },
  { to: '/commits', label: 'Commits', end: false, icon: <GitCommit size={18} /> },
];

export default function App() {
  const { collapsed, mobileOpen, isCompact, toggle, closeMobile } = useSidebarCollapse();

  return (
    <div className={styles.app}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        isCompact={isCompact}
        onToggle={toggle}
        onCloseMobile={closeMobile}
        items={navItems}
      />

      <main className={styles.main}>
        {isCompact && !mobileOpen ?
          <button type="button" className={styles.mobileMenuBtn} onClick={toggle} aria-label="Open navigation">
            ☰
          </button>
        : null}
        <Routes>
          <Route path="/" element={<Overview summary={summary} phases={phases} commits={commits} />} />
          <Route
            path="/timeline"
            element={<TimelinePage summary={summary} phases={phases} commits={commits} />}
          />
          <Route path="/commits" element={<Commits commits={commits} />} />
          <Route path="/commits/:hash" element={<CommitDetail commits={commits} />} />
        </Routes>
      </main>
    </div>
  );
}
