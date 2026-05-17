import { PanelLeft } from 'lucide-react';

type Props = {
  show: boolean;
  onExpand: () => void;
};

/** Floating expand control when the nav rail is collapsed (original UX). */
export function ExpandFab({ show, onExpand }: Props) {
  if (!show) return null;

  return (
    <div className="fixed bottom-10 left-4 z-[100]">
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center bg-vsc-accent text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        title="Expand sidebar (Ctrl+B)"
        onClick={onExpand}
      >
        <PanelLeft className="w-5 h-5" />
      </button>
    </div>
  );
}
