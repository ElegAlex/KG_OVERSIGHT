/**
 * KG-Oversight - Dialogue d'export du graphe
 * Permet de configurer et lancer l'export en PNG ou SVG
 */

import { useState } from 'react';
import { X, Download, Image, FileCode, Check } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import type { ExportOptions } from '../services/exportService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export function ExportDialog({ isOpen, onClose, onExport }: ExportDialogProps) {
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [scale, setScale] = useState(2);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#0f172a');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        scale,
        includeLabels,
        backgroundColor,
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md p-6',
            'bg-slate-900 border border-white/10 rounded-2xl',
            'shadow-2xl shadow-black/40',
            'z-50',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              Exporter le graphe
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Format selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat('png')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    format === 'png'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                      : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <Image className={cn('w-5 h-5', format === 'png' ? 'text-indigo-400' : 'text-slate-400')} />
                  <div className="text-left">
                    <div className="font-medium">PNG</div>
                    <div className="text-xs text-slate-500">Image haute qualité</div>
                  </div>
                  {format === 'png' && <Check className="w-4 h-4 text-indigo-400 ml-auto" />}
                </button>

                <button
                  onClick={() => setFormat('svg')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    format === 'svg'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                      : 'bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <FileCode className={cn('w-5 h-5', format === 'svg' ? 'text-indigo-400' : 'text-slate-400')} />
                  <div className="text-left">
                    <div className="font-medium">SVG</div>
                    <div className="text-xs text-slate-500">Vectoriel éditable</div>
                  </div>
                  {format === 'svg' && <Check className="w-4 h-4 text-indigo-400 ml-auto" />}
                </button>
              </div>
            </div>

            {/* Scale (PNG only) */}
            {format === 'png' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Résolution
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                        scale === s
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Plus élevé = meilleure qualité, fichier plus gros
                </p>
              </div>
            )}

            {/* Background color */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Couleur de fond
              </label>
              <div className="flex gap-2">
                {[
                  { color: '#0f172a', name: 'Sombre' },
                  { color: '#1e293b', name: 'Gris' },
                  { color: '#ffffff', name: 'Blanc' },
                  { color: 'transparent', name: 'Transparent' },
                ].map((opt) => (
                  <button
                    key={opt.color}
                    onClick={() => setBackgroundColor(opt.color)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all',
                      backgroundColor === opt.color
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'
                    )}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Include labels */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">
                Inclure les labels
              </label>
              <button
                onClick={() => setIncludeLabels(!includeLabels)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  includeLabels ? 'bg-indigo-500' : 'bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                    includeLabels && 'translate-x-5'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg',
                'bg-indigo-500 text-white font-medium',
                'hover:bg-indigo-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default ExportDialog;
