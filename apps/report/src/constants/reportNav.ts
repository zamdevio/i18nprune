export const reportSectionNav = [
  { to: '/overview', label: 'Overview', end: true as const },
  { to: '/missing', label: 'Missing' },
  { to: '/dynamic', label: 'Dynamic' },
  { to: '/observations', label: 'Observations' },
  { to: '/heatmap', label: 'Hotspots' },
  { to: '/namespaces', label: 'Namespaces' },
] as const;

export function activeReportSectionPath(pathname: string): string {
  const hit = reportSectionNav.find((item) =>
    'end' in item && item.end ? pathname === '/overview' : pathname === item.to,
  );
  return hit?.to ?? '/overview';
}

export function activeReportSectionLabel(pathname: string): string {
  const path = activeReportSectionPath(pathname);
  const hit = reportSectionNav.find((item) => item.to === path);
  return hit?.label ?? 'Overview';
}

/** ToolbarDropdown options for report section nav (wide header). */
export const reportSectionDropdownOptions = reportSectionNav.map((item) => ({
  value: item.to,
  label: item.label,
}));
