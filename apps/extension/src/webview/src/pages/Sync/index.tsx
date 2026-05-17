import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ProjectHealth, ReviewLocaleStats } from '../../types';
import { runMachineTranslation } from '../../services/api';
import { Card, Button, Badge } from '../../components/shared';

export default function SyncPage({ health }: { health: ProjectHealth }) {
  const [stats, setStats] = useState<ReviewLocaleStats[]>(health.stats);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['all']);

  const handleSync = async (locale: string) => {
    setSyncing(locale);
    const result = await runMachineTranslation(locale);
    
    if (result.success) {
      setSuccessMessage(`Automated sync complete for ${locale}. ${result.keysFilled} keys updated.`);
      setStats(prev => prev.map(s => s.locale === locale ? { ...s, missingTranslations: 0, needsReviewTrue: 0 } : s));
      
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    setSyncing(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-vsc-text-bright uppercase tracking-wider">Review & Localization Stats</h3>
        </div>
        <button 
           className="text-[10px] uppercase font-bold text-vsc-accent hover:underline flex items-center gap-1.5"
           onClick={() => setStats(health.stats)}
        >
          <RefreshCw className="w-3 h-3" /> Reset Cache
        </button>
      </header>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-2.5 vsc-card bg-vsc-success/5 border-vsc-success/30 text-vsc-success text-[11px] font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.locale}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="vsc-card flex flex-col group"
          >
            <div className="p-3 flex items-center justify-between border-b border-vsc-border bg-black/10">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-vsc-accent" />
                <span className="text-xs font-bold text-vsc-text-bright font-mono">{stat.locale}</span>
              </div>
              <div className="flex gap-1.5 items-center">
                {stat.needsReviewTrue > 0 && (
                  <span className="text-[9px] font-bold bg-vsc-warn/20 text-vsc-warn px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                    {stat.needsReviewTrue} REVIEW
                  </span>
                )}
                {stat.missingTranslations > 0 ? (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm bg-vsc-error/20 text-vsc-error border border-vsc-error/30 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {stat.missingTranslations} MISSING
                  </span>
                ) : (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-sm bg-vsc-success/20 text-vsc-success border border-vsc-success/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    SYNCED
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
               <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-vsc-text-muted flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Legacy JSON
                    </span>
                    <span className="text-vsc-text-bright font-bold font-mono">{stat.legacyLeaves}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-vsc-text-muted flex items-center gap-1.5 text-vsc-accent">
                      <Layers className="w-3 h-3" /> Structured
                    </span>
                    <span className="text-vsc-accent font-bold font-mono">{stat.structuredLeaves}</span>
                  </div>
               </div>

               <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter text-vsc-text-muted">
                    <span>Engine Modernization</span>
                    <span>{Math.round((stat.structuredLeaves / (stat.legacyLeaves + stat.structuredLeaves)) * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-vsc-bg rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-vsc-accent transition-all duration-500" 
                      style={{ width: `${(stat.structuredLeaves / (stat.legacyLeaves + stat.structuredLeaves)) * 100}%` }}
                    />
                  </div>
               </div>
               
               <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-vsc-text-muted">English Parity</span>
                  <span className={stat.englishIdentical > 5 ? 'text-vsc-warn' : 'text-vsc-success'}>
                    {stat.englishIdentical} keys identical
                  </span>
               </div>
            </div>

            <div className="p-3 bg-vsc-sidebar border-t border-vsc-border mt-auto flex items-center justify-between">
              <button className="text-[10px] text-vsc-text-muted hover:text-vsc-text-bright flex items-center gap-1 group/l">
                View Drift <ChevronRight className="w-3 h-3 group-hover/l:translate-x-0.5 transition-transform" />
              </button>
              
              <Button 
                size="xs"
                loading={syncing === stat.locale}
                disabled={(stat.missingTranslations === 0 && stat.needsReviewTrue === 0)}
                onClick={() => handleSync(stat.locale)}
                className={stat.missingTranslations === 0 && stat.needsReviewTrue === 0 ? 'bg-vsc-bg text-vsc-text-muted opacity-40 cursor-default shadow-none border border-vsc-border' : ''}
              >
                {stat.missingTranslations === 0 && stat.needsReviewTrue === 0 ? (
                  <span>SYNCED</span>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>AI AUTO-SYNC</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="vsc-card p-4 border-l-2 border-l-vsc-accent bg-vsc-accent/5 flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-vsc-text-bright uppercase tracking-widest">Global Machine Synchronization</h4>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-mono text-vsc-text-muted">Targets:</span>
               <select 
                 className="bg-vsc-sidebar border border-vsc-border text-[9px] font-bold text-vsc-text-muted px-2 py-0.5 rounded-sm outline-none focus:border-vsc-accent"
                 value={selectedLangs[0]}
                 onChange={(e) => setSelectedLangs([e.target.value])}
               >
                 <option value="all">--lang all</option>
                 {health.locales.filter(l => l !== 'en-US').map(l => (
                   <option key={l} value={l}>{l}</option>
                 ))}
               </select>
            </div>
         </div>
         <p className="text-[11px] text-vsc-text-muted leading-tight">This engine will iterate through all detected translation drifts and attempt to reconstruct the target JSON values while preserving semantic intent and developer-defined constraints.</p>
         <div className="flex gap-2 justify-end pt-2">
             <Button variant="secondary" size="sm">Export Drift Log</Button>
             <Button variant="primary" size="sm" className="px-8 shadow-xl shadow-vsc-accent/20">Execute Global Sync</Button>
         </div>
      </section>
    </div>
  );
}
