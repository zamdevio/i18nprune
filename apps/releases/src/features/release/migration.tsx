import type { ReleaseRecordV1 } from '@/types';
import { ArrowRight, BookOpen } from 'lucide-react';

type MigrationCalloutProps = {
  migration: ReleaseRecordV1['migration'];
};

export default function MigrationCallout({ migration }: MigrationCalloutProps) {
  if (!migration || (!migration.notes?.length && !migration.docLinks?.length)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <ArrowRight className="h-4 w-4 text-primary" />
        Migration Guide
      </h3>

      {migration.notes?.length > 0 && (
        <ul className="space-y-2 mb-4">
          {migration.notes.map((note, i) => (
            <li key={i} className="text-sm text-foreground/80 leading-relaxed pl-4 border-l-2 border-primary/30">
              {note}
            </li>
          ))}
        </ul>
      )}

      {(migration.docLinks?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {migration.docLinks!.map((link, i) => (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
