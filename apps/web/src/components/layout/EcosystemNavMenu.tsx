import { EcosystemNavMenu as UiEcosystemNavMenu } from '@i18nprune/ui/react/nav';
import { ECOSYSTEM_NAV_LINKS } from '../../constants/index.js';

export function EcosystemNavMenu(): JSX.Element {
  return <UiEcosystemNavMenu links={ECOSYSTEM_NAV_LINKS} />;
}
