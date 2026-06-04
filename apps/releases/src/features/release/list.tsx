import type { ReleaseSections } from '@/types';
import { Plus, RefreshCw, Bug, Trash2, AlertTriangle, Shield, Zap } from 'lucide-react';

const SECTION_CONFIG: Record<
  keyof ReleaseSections,
  { label: string; icon: typeof Plus; color: string }
> = {
  added: { label: "Added", icon: Plus, color: "text-primary" },
  changed: { label: "Changed", icon: RefreshCw, color: "text-stream-core" },
  fixed: { label: "Fixed", icon: Bug, color: "text-amber-500" },
  removed: { label: "Removed", icon: Trash2, color: "text-muted-foreground" },
  breaking: { label: "Breaking Changes", icon: AlertTriangle, color: "text-destructive" },
  security: { label: "Security", icon: Shield, color: "text-stream-extension" },
  performance: { label: "Performance", icon: Zap, color: "text-amber-500" },
};

type ReleaseSectionListProps = {
  sections: ReleaseSections;
};

/** Renders Added / Changed / Fixed / … blocks for a release detail page. */
export default function ReleaseSectionList({ sections }: ReleaseSectionListProps) {
  const nonEmptySections = (Object.entries(sections) as [keyof ReleaseSections, string[]][]).filter(
    ([, items]) => items.length > 0,
  );

  if (nonEmptySections.length === 0) return null;

  return (
    <div className="space-y-6">
      {nonEmptySections.map(([key, items]) => {
        const config = SECTION_CONFIG[key];
        if (!config) return null;
        const Icon = config.icon;

        return (
          <div key={key}>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span>{config.label}</span>
              <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
            </h3>
            <ul className="space-y-1.5 ml-6">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-card-foreground/90 leading-relaxed relative before:absolute before:left-[-1rem] before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground/40">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

