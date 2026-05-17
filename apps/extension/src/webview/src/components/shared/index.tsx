import React from 'react';
import { motion } from 'motion/react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'error' | 'success' | 'warn' | 'muted' | 'accent';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'muted', className = '' }) => {
  const styles = {
    error: 'bg-vsc-error shadow-vsc-error/20 text-white',
    success: 'bg-vsc-success shadow-vsc-success/20 text-white',
    warn: 'bg-vsc-warn shadow-vsc-warn/20 text-vsc-bg',
    muted: 'bg-vsc-bg border border-vsc-border text-vsc-text-muted',
    accent: 'bg-vsc-accent shadow-vsc-accent/20 text-white',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'xs';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', loading, ...props }) => {
  const base = "font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-vsc-accent text-white hover:brightness-110 shadow-lg shadow-vsc-accent/10",
    secondary: "bg-vsc-sidebar text-vsc-text-muted border border-vsc-border hover:text-vsc-text-bright",
    danger: "bg-vsc-error text-white hover:brightness-110 shadow-lg shadow-vsc-error/10",
  };

  const sizes = {
    xs: "px-2 py-1 text-[9px] rounded-sm",
    sm: "px-3 py-1.5 text-[10px] rounded-sm",
    md: "px-5 py-2 text-[11px] rounded-sm",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-vsc-sidebar border border-vsc-border shadow-2xl rounded-sm overflow-hidden"
      >
        <div className="h-9 px-4 flex items-center justify-between bg-black/10 border-b border-vsc-border">
          <span className="text-[11px] font-bold uppercase tracking-widest text-vsc-text-muted">{title}</span>
          <button onClick={onClose} className="text-vsc-text-muted hover:text-vsc-text-bright">×</button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="p-3 bg-black/5 border-t border-vsc-border flex justify-end">
          <Button size="sm" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string; headerAction?: React.ReactNode }> = ({ children, title, className = '', headerAction }) => (
  <div className={`vsc-card overflow-hidden flex flex-col ${className}`}>
    {title && (
      <div className="p-2.5 border-b border-vsc-border bg-black/5 flex justify-between items-center px-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-vsc-text-muted">{title}</span>
        {headerAction}
      </div>
    )}
    <div className="p-4 flex-1">
      {children}
    </div>
  </div>
);
