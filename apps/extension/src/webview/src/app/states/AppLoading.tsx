import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

export default function AppLoading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-vsc-bg space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="text-vsc-accent"
      >
        <RefreshCw className="w-12 h-12" />
      </motion.div>
      <p className="text-vsc-text font-medium animate-pulse uppercase tracking-widest text-xs">
        Initializing i18nprune engine...
      </p>
    </div>
  );
}
