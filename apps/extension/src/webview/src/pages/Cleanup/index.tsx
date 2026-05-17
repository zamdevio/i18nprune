import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  CheckCircle2, 
  FileCode,
  AlertCircle,
  SearchCode
} from 'lucide-react';
import { KeyObservation } from '../../types';
import { pruneKeys } from '../../services/api';
import { Card, Button, Badge } from '../../components/shared';

export default function CleanupPage({ observations: initialObservations, onSelect }: { observations: KeyObservation[], onSelect: (obs: KeyObservation) => void }) {
  const [items, setItems] = useState(initialObservations.filter(o => o.kind === 'template_partial'));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pruning, setPruning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleSelect = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((_, i) => i)));
  };

  const handlePrune = async () => {
    if (selected.size === 0) return;
    setPruning(true);
    const result = await pruneKeys(Array.from(selected).map(i => i.toString()));
    if (result.success) {
      setSuccess(`Successfully flagged ${result.keysRemoved} ambiguous keys for exclusion.`);
      setItems(prev => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
      setTimeout(() => setSuccess(null), 5000);
    }
    setPruning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-vsc-text-bright uppercase tracking-wider">Dynamic Key Cleanup</h3>
          <Badge variant="warn">{items.length} AMBIGUOUS</Badge>
        </div>
        <div className="flex gap-2">
            <Button 
              variant="danger" 
              disabled={selected.size === 0}
              loading={pruning}
              onClick={handlePrune}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Exclude Selected ({selected.size})
            </Button>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-vsc-success/10 border border-vsc-success/30 text-vsc-success text-xs font-medium rounded-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <Card title="Ambiguous Template Analysis">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-black/10 border-b border-vsc-border">
              <th className="px-3 py-2 w-10">
                <input 
                  type="checkbox" 
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleSelectAll}
                  className="accent-vsc-accent"
                />
              </th>
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px]">Template Raw</th>
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px]">Placeholders</th>
              <th className="px-3 py-2 font-bold uppercase tracking-widest text-vsc-text-muted text-[10px] text-right">Source File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vsc-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-vsc-success opacity-20 mb-3" />
                    <p className="text-sm font-bold text-vsc-text uppercase tracking-tighter">Perfectly Static</p>
                    <p className="text-xs text-vsc-text-muted">No unresolved dynamic templates found in source code.</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((obs, i) => (
                <motion.tr 
                  key={i}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`${selected.has(i) ? 'bg-vsc-accent/5' : 'hover:bg-vsc-hover'} transition-colors`}
                >
                  <td className="px-3 py-2.5">
                    <input 
                      type="checkbox" 
                      checked={selected.has(i)}
                      onChange={() => toggleSelect(i)}
                      className="accent-vsc-accent"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                     <button 
                       onClick={() => onSelect(obs)}
                       className="font-mono text-vsc-text-bright break-all hover:text-vsc-accent transition-colors text-left"
                     >
                       {obs.kind === 'template_partial' ? obs.templateRaw : ''}
                     </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {obs.kind === 'template_partial' && obs.unresolvedPlaceholders.map(p => (
                        <Badge key={p} variant="muted" className="text-[8px]">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-vsc-text-muted font-mono flex items-center justify-end gap-1.5">
                    <span className="truncate max-w-[150px]">{obs.span.filePath}</span>
                    <SearchCode className="w-3.5 h-3.5 opacity-30" />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <div className="vsc-card p-3 border-l-2 border-l-vsc-accent bg-black/10 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-vsc-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-vsc-text-bright uppercase tracking-tighter">Pruning Safety</p>
          <p className="text-[11px] text-vsc-text-muted leading-tight">These keys were not detected via static analysis of your source code. Deleting them is safe unless you access them using dynamic string construction at runtime.</p>
        </div>
      </div>
    </div>
  );
}
