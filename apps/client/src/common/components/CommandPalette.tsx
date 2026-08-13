import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, CornerDownLeft } from 'lucide-react';

interface Command {
  label: string;
  action: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

export default function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filtered[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
        }
      }
    },
    [filtered, selectedIndex, onClose]
  );

  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = (command: Command) => {
    command.action();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-base-content/10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="w-full bg-transparent pl-12 pr-16 py-4 outline-none text-base-content placeholder:text-base-content/40"
              />
              <kbd className="kbd kbd-sm absolute right-3 top-1/2 -translate-y-1/2">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-64 overflow-y-auto p-2 border-t border-base-200">
              {filtered.length === 0 ? (
                <p className="text-sm text-base-content/50 p-4 text-center">
                  No commands found
                </p>
              ) : (
                filtered.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                        idx === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {Icon && (
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-base-200">
                            <Icon className="w-4 h-4" />
                          </span>
                        )}
                        <span className="text-sm font-medium">{cmd.label}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {cmd.shortcut && <kbd className="kbd kbd-xs">{cmd.shortcut}</kbd>}
                        {idx === selectedIndex ? (
                          <CornerDownLeft className="w-4 h-4 text-base-content/40" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-base-content/30" />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}