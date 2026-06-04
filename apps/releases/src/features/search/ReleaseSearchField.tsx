import { Search } from 'lucide-react';
import { forwardRef, type FormEvent } from 'react';

type ReleaseSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  showShortcut?: boolean;
};

const ReleaseSearchField = forwardRef<HTMLInputElement | null, ReleaseSearchFieldProps>(
  function ReleaseSearchField(
    {
      value,
      onChange,
      onSubmit,
      placeholder = 'Search releases… e.g. review, missing, sync, report',
      className = '',
      showShortcut = true,
    },
    ref,
  ) {
    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      onSubmit?.();
    };

    return (
      <form onSubmit={handleSubmit} className={className}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={ref}
            type="search"
            data-release-search="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-border bg-card/80 py-3.5 pl-11 pr-28 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:text-base"
          />
          {showShortcut && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-border bg-muted/80 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              Ctrl+K
            </kbd>
          )}
        </div>
      </form>
    );
  },
);

export default ReleaseSearchField;
