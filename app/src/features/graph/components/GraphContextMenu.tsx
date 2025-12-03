/**
 * KG-Oversight - Menu contextuel du graphe
 * Menu contextuel avec actions copier/coller/dupliquer
 */

import * as ContextMenu from '@radix-ui/react-context-menu';
import { Copy, Clipboard, CopyPlus, Trash2, Link, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphContextMenuProps {
  children: React.ReactNode;
  // États
  hasSelection: boolean;
  hasClipboardContent: boolean;
  canDuplicate: boolean;
  clipboardDescription?: string;
  selectedNodeName?: string;
  // Actions
  onCopy: () => void;
  onCopyWithRelations: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDuplicateWithRelations: () => void;
  onDelete?: () => void;
}

const menuItemClass = cn(
  'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer',
  'outline-none select-none rounded-md',
  'text-slate-300 hover:bg-slate-700 hover:text-white',
  'data-[disabled]:text-slate-600 data-[disabled]:pointer-events-none',
  'data-[highlighted]:bg-slate-700 data-[highlighted]:text-white'
);

const menuSeparatorClass = 'h-px my-1 bg-slate-700';

const shortcutClass = 'ml-auto text-xs text-slate-500';

export function GraphContextMenu({
  children,
  hasSelection,
  hasClipboardContent,
  canDuplicate,
  clipboardDescription,
  selectedNodeName,
  onCopy,
  onCopyWithRelations,
  onPaste,
  onDuplicate,
  onDuplicateWithRelations,
  onDelete,
}: GraphContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className={cn(
            'min-w-[220px] p-1.5 rounded-lg',
            'bg-slate-800/95 backdrop-blur-sm border border-slate-700',
            'shadow-xl shadow-black/30',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
          sideOffset={5}
        >
          {/* Header avec nœud sélectionné */}
          {hasSelection && selectedNodeName && (
            <>
              <div className="px-3 py-2 text-xs text-slate-500 font-medium truncate max-w-[200px]">
                {selectedNodeName}
              </div>
              <ContextMenu.Separator className={menuSeparatorClass} />
            </>
          )}

          {/* Copier */}
          <ContextMenu.Item
            className={menuItemClass}
            disabled={!hasSelection}
            onSelect={onCopy}
          >
            <Copy className="w-4 h-4" />
            <span>Copier</span>
            <span className={shortcutClass}>Ctrl+C</span>
          </ContextMenu.Item>

          {/* Copier avec relations */}
          <ContextMenu.Item
            className={menuItemClass}
            disabled={!hasSelection}
            onSelect={onCopyWithRelations}
          >
            <Link className="w-4 h-4" />
            <span>Copier avec relations</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className={menuSeparatorClass} />

          {/* Coller */}
          <ContextMenu.Item
            className={menuItemClass}
            disabled={!hasClipboardContent}
            onSelect={onPaste}
          >
            <Clipboard className="w-4 h-4" />
            <span>
              {hasClipboardContent && clipboardDescription
                ? `Coller (${clipboardDescription})`
                : 'Coller'}
            </span>
            <span className={shortcutClass}>Ctrl+V</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className={menuSeparatorClass} />

          {/* Dupliquer */}
          <ContextMenu.Item
            className={menuItemClass}
            disabled={!canDuplicate}
            onSelect={onDuplicate}
          >
            <CopyPlus className="w-4 h-4" />
            <span>Dupliquer</span>
            <span className={shortcutClass}>Ctrl+D</span>
          </ContextMenu.Item>

          {/* Dupliquer avec relations */}
          <ContextMenu.Item
            className={menuItemClass}
            disabled={!canDuplicate}
            onSelect={onDuplicateWithRelations}
          >
            <Unlink className="w-4 h-4" />
            <span>Dupliquer avec relations</span>
          </ContextMenu.Item>

          {/* Supprimer */}
          {onDelete && (
            <>
              <ContextMenu.Separator className={menuSeparatorClass} />
              <ContextMenu.Item
                className={cn(menuItemClass, 'text-red-400 hover:bg-red-500/20 hover:text-red-300 data-[highlighted]:bg-red-500/20 data-[highlighted]:text-red-300')}
                disabled={!hasSelection}
                onSelect={onDelete}
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
                <span className={shortcutClass}>Suppr</span>
              </ContextMenu.Item>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

export default GraphContextMenu;
