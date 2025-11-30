/**
 * KG-Oversight - Modal d'aide des raccourcis clavier
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';
import { SHORTCUT_CATEGORIES } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-slate-300 shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutRow({
  shortcut,
}: {
  shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; description: string };
}) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-sm text-slate-400">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.ctrl && <KeyBadge>{isMac ? '⌘' : 'Ctrl'}</KeyBadge>}
        {shortcut.shift && <KeyBadge>⇧</KeyBadge>}
        {shortcut.alt && <KeyBadge>{isMac ? '⌥' : 'Alt'}</KeyBadge>}
        {shortcut.ctrl || shortcut.shift || shortcut.alt ? (
          <span className="text-slate-600 mx-0.5">+</span>
        ) : null}
        <KeyBadge>{shortcut.key}</KeyBadge>
      </div>
    </div>
  );
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg">
                <Keyboard className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-200">Raccourcis clavier</h2>
                <p className="text-xs text-slate-500">
                  Naviguez plus rapidement dans l'application
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SHORTCUT_CATEGORIES.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Command className="w-4 h-4 text-indigo-400" />
                    {category.name}
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    {category.shortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/30">
            <p className="text-xs text-slate-500 text-center">
              Appuyez sur <KeyBadge>?</KeyBadge> pour afficher cette aide à tout moment
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default KeyboardShortcutsHelp;
