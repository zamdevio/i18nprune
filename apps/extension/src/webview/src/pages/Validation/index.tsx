import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCode, 
  CheckCircle2, 
  AlertCircle,
  Code
} from 'lucide-react';
import { KeyObservation } from '../../types';
import { quickFixIssue } from '../../services/api';
import { Card, Button, Badge } from '../../components/shared';

export default function ValidationPage({ observations: initialObservations, onSelect }: { observations: KeyObservation[], onSelect: (obs: KeyObservation) => void }) {
  const [observations, setObservations] = useState(initialObservations);
  const [processing, setProcessing] = useState<number | null>(null);

  const handleFix = async (obs: KeyObservation, index: number) => {
    onSelect(obs);
  };

  const getKindStyles = (kind: KeyObservation['kind']) => {
    switch (kind) {
      case 'literal': return 'success' as const;
      case 'template_resolved': return 'accent' as const;
      case 'template_partial': return 'warn' as const;
      default: return 'muted' as const;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-vsc-text-bright uppercase tracking-wider">Scanner Observations</h3>
          <Badge variant={observations.length > 0 ? "accent" : "success"}>
            {observations.length} DETECTED
          </Badge>
        </div>
        <div className="flex gap-2">
            <Button size="sm">Rescan Source</Button>
        </div>
      </div>

      <Card title="Source Analysis">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-black/10 border-b border-vsc-border">
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px] w-1/3">Resolution</th>
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px]">Source Location</th>
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px]">Type</th>
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vsc-border">
            <AnimatePresence mode="popLayout">
              {observations.length === 0 ? (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="w-10 h-10 text-vsc-success opacity-20 mb-3" />
                      <p className="text-sm font-bold text-vsc-text">CLEAN ANALYSIS</p>
                      <p className="text-xs text-vsc-text-muted">No unresolved keys found in the current workspace.</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                observations.map((obs, i) => (
                  <motion.tr 
                    key={`${obs.kind}-${i}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="group hover:bg-vsc-hover transition-colors"
                  >
                    <td className="px-3 py-2.5">
                       <div className="space-y-1">
                          <span className="font-mono text-vsc-text-bright break-all">
                            {obs.kind === 'template_partial' ? obs.templateRaw : obs.resolvedKey}
                          </span>
                          {obs.kind === 'template_partial' && (
                            <div className="flex flex-wrap gap-1">
                              {obs.unresolvedPlaceholders.map(p => (
                                <Badge key={p} variant="warn" className="text-[8px] bg-vsc-warn/10 border border-vsc-warn/30">
                                   unresolved: {p}
                                </Badge>
                              ))}
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-vsc-text-muted">
                        <FileCode className="w-3.5 h-3.5 opacity-50" />
                        <span className="truncate max-w-[200px]">
                          {obs.span.filePath}:{obs.span.line}{obs.span.column ? `:${obs.span.column}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={getKindStyles(obs.kind)}>
                        {obs.kind.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleFix(obs, i)}
                          className="px-2 py-0.5 text-vsc-accent hover:underline text-[11px] font-bold"
                        >
                          Inspect
                        </button>
                        <button className="px-2 py-0.5 text-vsc-text-muted hover:text-vsc-text-bright text-[11px]">
                          Hide
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </Card>

      <div className="vsc-card p-3 border-l-2 border-l-vsc-accent bg-black/10 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-vsc-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-vsc-text-bright uppercase tracking-tighter">Diagnostic Tip</p>
          <p className="text-[11px] text-vsc-text-muted leading-tight">Interpolated keys reduce runtime visibility. For absolute safety, use static keys or provide JSDoc lookup hints in your source files.</p>
        </div>
      </div>
    </div>
  );
}
