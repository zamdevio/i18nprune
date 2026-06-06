import type { SVGProps } from 'react';

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
  'aria-hidden': true as const,
};

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconChevronsLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...svgProps} {...props}>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

export function IconChevronsRight(props: SVGProps<SVGSVGElement>) {
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

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
