import React from 'react';
import { motion } from 'motion/react';
import { 
  Key, 
  Globe, 
  Activity, 
  ShieldCheck,
  Zap,
  Info,
  RefreshCcw
} from 'lucide-react';
import { ProjectHealth } from '../../types';
import { Card } from '../../components/shared';

export default function Dashboard({ health }: { health: ProjectHealth }) {
  const stats = [
    { label: 'Source Keys detected', value: health.totalSourceKeys, icon: Key, color: 'text-vsc-text-bright' },
    { label: 'Active Locales', value: health.locales.length, icon: Globe, color: 'text-vsc-accent' },
    { label: 'Scanner Observations', value: health.observations.length, icon: ShieldCheck, color: 'text-vsc-error' },
    { label: 'English Parity', value: '98.4%', icon: Activity, color: 'text-vsc-success' },
  ];

  const totalMissing = health.stats.reduce((acc, s) => acc + s.missingTranslations, 0);

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="vsc-card p-4 hover:border-vsc-text-muted/50 transition-colors cursor-default"
          >
            <div className="text-[10px] uppercase tracking-wider text-vsc-text-muted mb-1 font-bold">{stat.label}</div>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-mono ${stat.color}`}>{stat.value}</div>
              <stat.icon className="w-4 h-4 text-vsc-text-muted opacity-30" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Scanner Summary */}
        <Card title="Scanner Diagnostic" className="lg:col-span-3">
          <div className="flex flex-1 items-center justify-between gap-8 py-2">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4">
                 <div className="text-4xl font-mono text-vsc-text-bright tracking-tighter">
                   {Math.round((health.observations.filter(o => o.kind !== 'template_partial').length / (health.observations.length || 1)) * 100)}%
                 </div>
                 <div className="text-xs text-vsc-text-muted leading-tight">
                    Static resolution index<br/>
                    <span className="text-vsc-success">+0.8% accuracy gain</span>
                 </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-vsc-text-muted">Template Partials</span>
                  <span className="font-mono text-vsc-warn">
                    {health.observations.filter(o => o.kind === 'template_partial').length}
                  </span>
                </div>
                <div className="h-1 w-full bg-vsc-bg rounded-none">
                  <div className="h-full bg-vsc-warn w-[20%]"></div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-vsc-text-muted">Total Observations</span>
                  <span className="font-mono text-vsc-text-bright">{health.observations.length}</span>
                </div>
                <div className="h-1 w-full bg-vsc-bg rounded-none">
                  <div className="h-full bg-vsc-accent w-[40%]"></div>
                </div>
              </div>
            </div>

            <div className="vsc-card p-4 bg-vsc-bg/50 max-w-[200px] border-dashed border-vsc-accent/30 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-16 h-16 bg-vsc-accent/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-vsc-accent/10 transition-colors" />
               <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3 h-3 text-vsc-accent" />
                  <span className="text-[10px] font-bold text-vsc-accent uppercase tracking-tighter">AI Translation Hint</span>
               </div>
               <p className="text-[10px] text-vsc-text-muted leading-relaxed">
                  Detected <span className="text-vsc-text-bright">{totalMissing} missing keys</span> across support locales. Run Sync to automate.
               </p>
               <button className="w-full mt-3 py-1 bg-vsc-accent text-white text-[10px] uppercase font-bold rounded-sm hover:shadow-[0_0_12px_var(--color-vsc-accent)] transition-all">Sync All</button>
            </div>
          </div>
        </Card>

        {/* Sync Summary */}
        <Card title="Locales Drift" className="lg:col-span-2" headerAction={<RefreshCcw className="w-3 h-3 text-vsc-text-muted" />}>
          <div className="space-y-4">
            {health.stats.map((stat) => (
              <div key={stat.locale} className="space-y-1">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-mono text-vsc-text-bright">{stat.locale}</span>
                   <span className={`text-[10px] font-mono ${stat.missingTranslations === 0 ? 'text-vsc-success' : 'text-vsc-error'}`}>
                     {stat.missingTranslations > 0 ? `-${stat.missingTranslations} keys` : 'synced'}
                   </span>
                </div>
                <div className="w-full bg-vsc-bg h-1.5 rounded-none border border-vsc-border/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - (stat.missingTranslations / (stat.stringPaths || 1)) * 100}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-none ${
                        stat.missingTranslations > 10 ? 'bg-vsc-error' : 
                        stat.missingTranslations > 0 ? 'bg-vsc-warn' : 'bg-vsc-success'
                    }`}
                  ></motion.div>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-vsc-border mt-2">
               <div className="flex items-center gap-2 text-[10px] text-vsc-text-muted leading-tight">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Showing translation parity across detected locales.</span>
               </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Log / Footer Info */}
      <div className="h-8 border border-vsc-border bg-black/5 flex items-center px-4 gap-6 text-[10px] text-vsc-text-muted">
         <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-vsc-success rounded-full animate-pulse shadow-[0_0_8px_var(--color-vsc-success)]"></span> Daemon: Active</span>
         <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Integrity Check Passed</span>
         <span className="flex-1"></span>
         <span className="font-mono text-vsc-text">Scan took 142ms</span>
         <span className="text-vsc-accent hover:underline cursor-pointer">View JSON Structure</span>
      </div>
    </div>
  );
}
