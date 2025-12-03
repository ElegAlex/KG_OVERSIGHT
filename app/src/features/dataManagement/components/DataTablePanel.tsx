/**
 * KG-Oversight - DataTablePanel
 * Panneau modal pour afficher le DataTable
 */

import * as Dialog from '@radix-ui/react-dialog';
import { X, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable } from './DataTable';

interface DataTablePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataTablePanel({ isOpen, onClose }: DataTablePanelProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed z-50',
            'top-[5%] left-[5%] right-[5%] bottom-[5%]',
            'rounded-xl',
            'bg-slate-900 border border-slate-700',
            'shadow-2xl shadow-black/50',
            'flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'duration-200'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-white">
                  Vue tabulaire des données
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-400">
                  Parcourir, filtrer et éditer les entités du graphe
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className={cn(
                  'w-8 h-8 rounded-lg',
                  'flex items-center justify-center',
                  'text-slate-400 hover:text-white',
                  'hover:bg-slate-700/50',
                  'transition-colors'
                )}
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            <DataTable />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default DataTablePanel;
