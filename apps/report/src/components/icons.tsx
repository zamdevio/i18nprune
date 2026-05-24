import React from 'react';

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** Inline SVGs only — no network requests. */
export function IconSearch(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg {...svgProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

export function IconChevronLeft(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg {...svgProps} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg {...svgProps} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconChevronsLeft(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg {...svgProps} {...props}>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

export function IconChevronsRight(props: React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg {...svgProps} {...props}>
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </svg>
  );
}

export const paginationNavIcons = {
  first: <IconChevronsLeft />,
  prev: <IconChevronLeft />,
  next: <IconChevronRight />,
  last: <IconChevronsRight />,
} as const;
