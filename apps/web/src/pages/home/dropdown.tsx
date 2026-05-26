import type { DragEvent } from 'react';
import { FileDropZone } from '@i18nprune/ui/react/surfaces';

type Props = {
  dropDepth: number;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
};

export function Dropdown({ dropDepth, onDragEnter, onDragLeave, onDragOver, onDrop }: Props): JSX.Element {
  return (
    <FileDropZone
      dropDepth={dropDepth}
      title="Drop files here"
      hint="Zip archive or a folder selection — opens the process panel."
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
}
