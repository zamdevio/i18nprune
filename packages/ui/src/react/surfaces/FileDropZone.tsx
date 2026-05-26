import type { DragEvent, ReactNode } from 'react';

export type FileDropZoneProps = {
  dropDepth: number;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  title?: string;
  hint?: ReactNode;
  id?: string;
  children?: ReactNode;
};

export function FileDropZone({
  dropDepth,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  title = 'Drop files here',
  hint,
  id,
  children,
}: FileDropZoneProps): JSX.Element {
  return (
    <section
      id={id}
      className={`drop-zone${dropDepth > 0 ? ' drop-zone--active' : ''}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <p className="drop-zone__title">{title}</p>
      {hint ? <p className="muted drop-zone__hint">{hint}</p> : null}
      {children}
    </section>
  );
}
