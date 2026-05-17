import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Download,
  AlertCircle,
  Activity,
  Terminal,
  CircleCheck,
  CircleDashed,
  Play,
  RotateCw
} from 'lucide-react';
import { DoctorCheck } from '../../types';
import { runDoctor } from '../../services/api';
import { Card, Button, Badge } from '../../components/shared';

export default function DoctorPage() {
  const [checks, setChecks] = useState<DoctorCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecks = async () => {
    setLoading(true);
    const data = await runDoctor();
    setChecks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChecks();
  }, []);

  const getStatusIcon = (status: DoctorCheck['status']) => {
    switch (status) {
      case 'pass': return <CircleCheck className="w-4 h-4 text-vsc-success" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-vsc-warn" />;
      case 'fail': return <AlertCircle className="w-4 h-4 text-vsc-error" />;
      default: return <CircleDashed className="w-4 h-4 text-vsc-text-muted" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-vsc-text-bright uppercase tracking-wider">System Diagnostic</h3>
          {loading && <Badge variant="accent">SCANNING...</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => console.log('Exporting...')}>
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button variant="primary" onClick={fetchChecks} loading={loading}>
            <Play className="w-3.5 h-3.5" />
            Run Doctor
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Environment Integrity">
           <div className="space-y-4">
             {loading ? (
               Array(5).fill(0).map((_, i) => (
                 <div key={i} className="h-10 w-full bg-vsc-bg animate-pulse rounded-sm" />
               ))
             ) : (
               checks.map((check) => (
                 <div key={check.id} className="flex items-center justify-between p-2.5 bg-vsc-bg border border-vsc-border rounded-sm group hover:border-vsc-text-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                       {getStatusIcon(check.status)}
                       <div>
                          <p className="text-xs font-bold text-vsc-text-bright tracking-tight">{check.label}</p>
                          <p className="text-[10px] text-vsc-text-muted font-mono">{check.value}</p>
                       </div>
                    </div>
                    {check.status === 'pass' && <Badge variant="success">READY</Badge>}
                 </div>
               ))
             )}
           </div>
        </Card>

        <div className="space-y-4">
           <Card title="Optimization Status">
              <div className="flex items-center gap-4 py-2">
                 <div className="p-4 bg-vsc-success/5 rounded-2xl border border-vsc-success/20">
                    <Activity className="w-10 h-10 text-vsc-success" />
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-vsc-text-bright tracking-tighter">OPTIMIZED</h4>
                    <p className="text-[11px] text-vsc-text-muted leading-relaxed">
                       Static analysis engine is running with <span className="text-vsc-text-bright">parallel workers</span> enabled. Scanning performance is optimal.
                    </p>
                 </div>
              </div>
           </Card>

           <Card title="Active Configuration">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-vsc-text-muted flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    CLI Alias
                  </span>
                  <span className="font-mono text-vsc-text-bright">i18nprune</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-vsc-text-muted flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Watch Mode
                  </span>
                  <span className="text-vsc-success font-bold">ENABLED</span>
                </div>
              </div>
           </Card>
        </div>
      </div>

      <div className="vsc-card p-4 border-l-2 border-l-vsc-warn bg-vsc-warn/5 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-vsc-warn mt-0.5 shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-vsc-text-bright uppercase tracking-tighter">Proactive Maintenance</p>
          <p className="text-[11px] text-vsc-text-muted leading-tight">We detected 2 locales that haven't been synchronized in over 7 days. We recommend running a full project re-sync to ensure translation parity.</p>
        </div>
      </div>
    </div>
  );
}
