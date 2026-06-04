import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STREAM_IDS, STREAM_META } from '@/features/catalog/streams';
import { ChevronDown, GitCompare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function CompareNavMenu() {
  const location = useLocation();
  const onCompare = location.pathname.startsWith('/compare/');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-8 gap-1 px-2.5 text-sm font-medium ${
            onCompare
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitCompare className="h-4 w-4" />
          <span className="hidden lg:inline">Compare</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        <p className="px-2 py-1.5 text-xs text-muted-foreground">Compare changelog</p>
        <DropdownMenuSeparator />
        {STREAM_IDS.map((id) => (
          <DropdownMenuItem key={id} asChild>
            <Link to={`/compare/${id}`} className="cursor-pointer">
              {STREAM_META[id].label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
