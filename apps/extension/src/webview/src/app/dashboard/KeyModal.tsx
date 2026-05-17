import { Info, FileCode } from 'lucide-react';
import { Modal, Badge, Button } from '../../components/shared';
import type { KeyObservation, Tab } from '../../types';

type Props = {
  keyObs: KeyObservation | null;
  onClose: () => void;
  openTab: (t: Tab) => void;
};

export function KeyModal({ keyObs, onClose, openTab }: Props) {
  return (
    <Modal isOpen={!!keyObs} onClose={onClose} title="Source Metadata Inspector">
      {keyObs && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-vsc-text-bright uppercase tracking-widest mb-1">Observed Key</h4>
              <p className="text-lg font-mono font-black text-vsc-accent break-all leading-tight">
                {keyObs.kind === 'template_partial' ? keyObs.templateRaw : keyObs.resolvedKey}
              </p>
            </div>
            <Badge variant={keyObs.kind === 'literal' ? 'success' : 'warn'}>
              {keyObs.kind.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-black/20 p-4 border border-white/5">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-vsc-text-muted uppercase font-bold block mb-1">Source File</span>
                <p className="text-[11px] font-mono text-vsc-text-bright truncate">{keyObs.span.filePath}</p>
              </div>
              <div>
                <span className="text-[10px] text-vsc-text-muted uppercase font-bold block mb-1">Location</span>
                <p className="text-[11px] font-mono text-vsc-text-bright">
                  Line {keyObs.span.line}, Col {keyObs.span.column || 'N/A'}
                </p>
              </div>
            </div>
            <div className="space-y-4 px-4 border-l border-white/5">
              {keyObs.kind === 'template_partial' && (
                <div>
                  <span className="text-[10px] text-vsc-text-muted uppercase font-bold block mb-1">Unresolved</span>
                  <div className="flex flex-wrap gap-1">
                    {keyObs.unresolvedPlaceholders.map((p) => (
                      <Badge key={p} variant="error" className="text-[8px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[10px] text-vsc-text-muted uppercase font-bold block mb-1">Resolution</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${keyObs.kind === 'literal' ? 'bg-vsc-success' : 'bg-vsc-warn'}`}
                  />
                  <span className="text-[11px] text-vsc-text-bright">
                    {keyObs.kind === 'literal' ? 'Static / Deterministic' : 'Dynamic / Ambiguous'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-vsc-accent/5 border border-vsc-accent/20 flex gap-3">
            <Info className="w-4 h-4 text-vsc-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-vsc-text-muted leading-relaxed">
              This key was detected using the <span className="text-vsc-text-bright">static-eval</span> engine.
              {keyObs.kind === 'template_partial'
                ? ' Partial templates require manual pruning or JSDoc hints.'
                : ' This key is perfectly resolved and can be safely synced.'}
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={() => {
                openTab({
                  id: keyObs.span.filePath,
                  type: 'file',
                  label: keyObs.span.filePath.split('/').pop() || 'File',
                  data: keyObs.span.filePath,
                });
                onClose();
              }}
            >
              <FileCode className="w-3.5 h-3.5" />
              View in Source
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
