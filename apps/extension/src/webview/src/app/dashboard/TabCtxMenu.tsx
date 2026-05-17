type Props = {
  menu: { x: number; y: number; tabId: string } | null;
  onDismiss: () => void;
  closeOtherTabs: (id?: string) => void;
  closeAllTabs: () => void;
};

export function TabCtxMenu({ menu, onDismiss, closeOtherTabs, closeAllTabs }: Props) {
  if (!menu) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        onClick={onDismiss}
        onContextMenu={(e) => {
          e.preventDefault();
          onDismiss();
        }}
      />
      <div
        className="fixed bg-vsc-sidebar border border-vsc-border shadow-2xl rounded-sm py-1 z-[70] min-w-[120px]"
        style={{ left: menu.x, top: menu.y }}
      >
        <button
          type="button"
          onClick={() => closeOtherTabs(menu.tabId)}
          className="w-full text-left px-3 py-1.5 text-[10px] uppercase font-bold text-vsc-text-muted hover:bg-vsc-hover hover:text-vsc-text-bright transition-colors"
        >
          Close Others
        </button>
        <button
          type="button"
          onClick={closeAllTabs}
          className="w-full text-left px-3 py-1.5 text-[10px] uppercase font-bold text-vsc-text-muted hover:bg-vsc-hover hover:text-vsc-text-bright transition-colors"
        >
          Close All
        </button>
      </div>
    </>
  );
}
