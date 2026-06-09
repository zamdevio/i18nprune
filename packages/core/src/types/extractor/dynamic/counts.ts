/** Active vs commented roll-up for dynamic site inventories. */
export type DynamicSiteCountSplit = {
  /** All dynamic inventory rows (includes commented). */
  total: number;
  /** Runtime-relevant sites (excludes commented / inactive). */
  active: number;
  /** Call sites inside comments (`kind: 'commented'` or `isCommented`). */
  commented: number;
};
