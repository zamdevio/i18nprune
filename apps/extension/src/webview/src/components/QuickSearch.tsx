import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileCode, FileJson, Layout, Command } from 'lucide-react';

interface Result {
  id: string;
  type: 'view' | 'file';
  label: string;
  category: string;
}

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: Result) => void;
  items: Result[];
}

export function QuickSearch({ isOpen, onClose, onSelect, items }: QuickSearchProps) {
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      if (filteredItems[activeIndex]) {
        onSelect(filteredItems[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-vsc-sidebar border border-vsc-border shadow-2xl rounded-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-vsc-border bg-vsc-bg">
          <Search className="w-4 h-4 text-vsc-accent" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search views, files, or actions..." 
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-vsc-text-bright"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-vsc-border bg-vsc-sidebar text-[10px] text-vsc-text-muted">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-vsc-text-muted text-[12px]">
              No results found for "{search}"
            </div>
          ) : (
            filteredItems.map((item, i) => (
              <button
                key={`${item.type}-${item.id}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${i === activeIndex ? 'bg-vsc-accent text-white' : 'hover:bg-vsc-hover text-vsc-text'}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => onSelect(item)}
              >
                <div className="flex items-center gap-3">
                  {item.type === 'view' ? <Layout className="w-4 h-4 opacity-70" /> : (item.id.endsWith('.json') ? <FileJson className="w-4 h-4 opacity-70" /> : <FileCode className="w-4 h-4 opacity-70" />)}
                  <div className="flex flex-col items-start translate-y-[1px]">
                     <span className="text-[12px] font-medium leading-none mb-1">{item.label}</span>
                     <span className={`text-[9px] uppercase tracking-widest font-bold opacity-60 ${i === activeIndex ? 'text-white' : 'text-vsc-text-muted'}`}>
                       {item.category}
                     </span>
                  </div>
                </div>
                {i === activeIndex && (
                  <span className="text-[10px] opacity-70">Select</span>
                )}
              </button>
            ))
          )}
        </div>
        
        <div className="px-4 py-2 bg-vsc-bg border-t border-vsc-border flex items-center justify-end gap-4 text-[10px] text-vsc-text-muted uppercase font-bold tracking-tighter">
           <div className="flex items-center gap-1">
             <span className="px-1 py-0.5 rounded border border-vsc-border">↑↓</span>
             <span>Navigate</span>
           </div>
           <div className="flex items-center gap-1">
             <span className="px-1 py-0.5 rounded border border-vsc-border">Enter</span>
             <span>Open</span>
           </div>
           <div className="flex items-center gap-1">
             <span className="px-1 py-0.5 rounded border border-vsc-border">Esc</span>
             <span>Close</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
