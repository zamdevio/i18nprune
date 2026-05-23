import { X } from 'lucide-react';
import type { RecentProjectZipEntry } from '../../types/index.js';

type Props = {
  existing: RecentProjectZipEntry;
  droppedName: string;
  onOpenCached: () => void;
  onProcessAgain: () => void;
  onDismiss: () => void;
};

export function DuplicateCachedZipDialog({ existing, droppedName, onOpenCached, onProcessAgain, onDismiss }: Props) {
  const saved = new Date(existing.createdAt).toLocaleString();

  return (
    <div className="modal-backdrop" role="presentation" onClick={onDismiss}>
      <div className="modal-panel" role="dialog" aria-modal aria-labelledby="dup-zip-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel__head">
          <h2 id="dup-zip-title">Matching cached zip</h2>
          <button type="button" className="runtime-header__icon-btn" onClick={onDismiss} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="muted modal-panel__hint">
          <strong>{droppedName}</strong> matches a cached copy (<strong>{existing.name}</strong>, saved {saved}). Choose whether to open the stored
          file or run the upload flow again on this archive.
        </p>
        <div className="modal-panel__foot">
          <button type="button" className="ghost" onClick={onProcessAgain}>
            Process again
          </button>
          <button type="button" className="primary" onClick={onOpenCached}>
            Open cached copy
          </button>
        </div>
      </div>
    </div>
  );
}
