/** Baked-in brand mark (not loaded from public/). */
export function ReportBrandIcon(): JSX.Element {
  return (
    <svg
      className="runtime-header__logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={32}
      height={32}
      fill="none"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="hsl(172 66% 36%)" />
      <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.2 8.8H9.2v14.4h3" strokeWidth="2.2" />
        <path d="M14.3 16.4l3.1 3.2 5.4-6.2" strokeWidth="2.2" />
      </g>
    </svg>
  );
}
