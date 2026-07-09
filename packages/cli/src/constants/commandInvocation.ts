/** Commander invocation path → JSON command id (nested subcommands). */
export const CLI_INVOCATION_COMMAND_IDS: Record<string, string> = {
  'share upload': 'share',
  'share list': 'share-list',
  'share view': 'share-view',
  'share delete': 'share-delete',
  'locales list': 'list',
  'locales dynamic': 'dynamic',
  'locales delete': 'delete',
  'kits dynamic': 'kits-dynamic',
  'kits identical': 'kits-identical',
  'kits honest': 'kits-honest',
  'kits baseline': 'kits-baseline',
  'kits pr': 'kits-pr',
};

export type KitsCommandId =
  | 'kits-dynamic'
  | 'kits-identical'
  | 'kits-honest'
  | 'kits-baseline'
  | 'kits-pr';

export function kitsCommandLabel(id: KitsCommandId): string {
  return id.replace('kits-', 'kits ');
}
