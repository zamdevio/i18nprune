export type EcosystemNavLink = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export type EcosystemNavMenuProps = {
  links: readonly EcosystemNavLink[];
};
