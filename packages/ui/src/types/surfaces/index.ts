export type SurfaceLink = {
  id: string;
  label: string;
  href: string;
  description?: string;
  external?: boolean;
};

export type SurfacesStripProps = {
  surfaces: readonly SurfaceLink[];
  activeSurfaceId: string;
  /** Label on the active surface card button (e.g. "Hosted workspace"). */
  activeHereLabel?: string;
  title?: string;
  lead?: string;
};
