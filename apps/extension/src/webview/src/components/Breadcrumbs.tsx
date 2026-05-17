import React from 'react';
import { ChevronRight, Folder, FileCode, FileJson } from 'lucide-react';

interface BreadcrumbsProps {
  path: string;
  type: 'file' | 'view';
}

export function Breadcrumbs({ path, type }: BreadcrumbsProps) {
  if (type === 'view') {
    return (
      <div className="flex items-center gap-1.5 px-4 h-6 text-[11px] font-medium text-vsc-text-muted/60 opacity-80 select-none">
        <Folder className="w-3 h-3" />
        <span>Views</span>
        <ChevronRight className="w-3 h-3 opacity-30" />
        <span className="text-vsc-accent font-bold uppercase tracking-wider">{path}</span>
      </div>
    );
  }

  const parts = path.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-1.5 px-4 h-6 text-[11px] font-medium text-vsc-text-muted/60 opacity-80 overflow-x-auto no-scrollbar select-none">
      <Folder className="w-3 h-3" />
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center gap-1.5 group cursor-pointer hover:text-vsc-text-bright transition-colors">
            {index === parts.length - 1 ? (
              part.endsWith('.json') ? <FileJson className="w-3 h-3 text-vsc-warn" /> : <FileCode className="w-3 h-3 text-vsc-accent" />
            ) : null}
            <span className={index === parts.length - 1 ? "text-vsc-text-bright font-semibold" : ""}>{part}</span>
          </div>
          {index < parts.length - 1 && <ChevronRight className="w-3 h-3 opacity-30" />}
        </React.Fragment>
      ))}
    </div>
  );
}
