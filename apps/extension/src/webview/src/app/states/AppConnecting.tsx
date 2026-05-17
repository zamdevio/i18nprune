import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

export default function AppConnecting() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-vsc-bg space-y-3 px-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="text-vsc-accent"
      >
        <RefreshCw className="w-12 h-12" />
      </motion.div>
      <p className="text-vsc-text font-medium animate-pulse uppercase tracking-widest text-xs text-center">
        Connecting to extension…
      </p>
      <p className="text-vsc-text-muted text-[11px] text-center max-w-xs leading-relaxed">
        If this hangs, reload the window or run <span className="font-mono">i18nprune: Open Dashboard</span> again.
      </p>
    </div>
  );
}
