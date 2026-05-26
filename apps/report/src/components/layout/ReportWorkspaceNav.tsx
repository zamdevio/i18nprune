import { LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolbarDropdown } from '@i18nprune/ui/react/toolbar';
import {
  activeReportSectionLabel,
  activeReportSectionPath,
  reportSectionDropdownOptions,
  reportSectionNav,
} from '../../constants/reportNav.js';

type Props = {
  hasDoc: boolean;
  layout?: 'header' | 'sidebar';
};

export function ReportWorkspaceNav({ hasDoc, layout = 'header' }: Props): JSX.Element {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const value = activeReportSectionPath(pathname);
  const sectionLabel = activeReportSectionLabel(pathname);
  const workspaceActive = reportSectionNav.some((item) => pathname === item.to);
  const navClass =
    layout === 'sidebar' ? 'toolbar-dropdown--sidebar-nav' : 'toolbar-dropdown--header-nav';

  return (
    <ToolbarDropdown
      className={`${navClass}${workspaceActive ? ' is-active' : ''}`}
      triggerLabel="Workspace"
      suffixLabel={sectionLabel}
      showChevron
      icon={<LayoutDashboard size={16} aria-hidden />}
      options={reportSectionDropdownOptions}
      value={value}
      disabled={!hasDoc}
      ariaLabel="Report workspace sections"
      onChange={(to) => navigate(to)}
    />
  );
}
