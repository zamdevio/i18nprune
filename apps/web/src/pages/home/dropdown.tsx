import type { DragEvent } from 'react';

type Props = {
  dropDepth: number;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
};

export function Dropdown({ dropDepth, onDragEnter, onDragLeave, onDragOver, onDrop }: Props) {
  return (
    <section
      className={`drop-zone${dropDepth > 0 ? ' drop-zone--active' : ''}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <p className="drop-zone__title">Drop files here</p>
      <p className="muted">Zip archive or a folder selection — opens the process panel.</p>
    </section>
  );
}
