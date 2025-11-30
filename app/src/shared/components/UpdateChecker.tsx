/**
 * KG-Oversight - Composant de vérification des mises à jour
 * Utilise le plugin Tauri updater pour vérifier et installer les mises à jour
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types pour l'updater
interface Update {
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error' | 'up-to-date';

interface UpdateCheckerProps {
  className?: string;
  autoCheck?: boolean;
  checkInterval?: number; // en minutes
}

export function UpdateChecker({
  className = '',
  autoCheck = true,
  checkInterval = 60, // vérifier toutes les heures par défaut
}: UpdateCheckerProps) {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [update, setUpdate] = useState<Update | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Vérification de la disponibilité de Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  const checkForUpdates = useCallback(async () => {
    if (!isTauri) {
      console.log('[Updater] Mode navigateur - mises à jour non disponibles');
      return;
    }

    try {
      setStatus('checking');
      setError(null);

      // Import dynamique du plugin updater
      const { check } = await import('@tauri-apps/plugin-updater');
      const updateResult = await check();

      if (updateResult) {
        setUpdate({
          version: updateResult.version,
          currentVersion: updateResult.currentVersion,
          body: updateResult.body ?? undefined,
          date: updateResult.date ?? undefined,
        });
        setStatus('available');
        setShowBanner(true);
      } else {
        setStatus('up-to-date');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('[Updater] Erreur lors de la vérification:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }, [isTauri]);

  const downloadAndInstall = useCallback(async () => {
    if (!isTauri || !update) return;

    try {
      setStatus('downloading');
      setDownloadProgress(0);

      const { check } = await import('@tauri-apps/plugin-updater');
      const updateResult = await check();

      if (updateResult) {
        // Télécharger et installer avec suivi de progression
        await updateResult.downloadAndInstall((event) => {
          if (event.event === 'Started' && event.data.contentLength) {
            console.log(`[Updater] Téléchargement démarré: ${event.data.contentLength} bytes`);
          } else if (event.event === 'Progress') {
            const progress = (event.data.chunkLength / (event.data.contentLength ?? 1)) * 100;
            setDownloadProgress((prev) => Math.min(prev + progress, 100));
          } else if (event.event === 'Finished') {
            console.log('[Updater] Téléchargement terminé');
            setDownloadProgress(100);
          }
        });

        setStatus('ready');
        // L'application va redémarrer automatiquement
      }
    } catch (err) {
      console.error('[Updater] Erreur lors du téléchargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur de téléchargement');
      setStatus('error');
    }
  }, [isTauri, update]);

  // Vérification automatique au démarrage et périodiquement
  useEffect(() => {
    if (!autoCheck || !isTauri) return;

    // Vérifier au démarrage (après un délai pour laisser l'app se charger)
    const startupTimeout = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // Vérification périodique
    const interval = setInterval(() => {
      checkForUpdates();
    }, checkInterval * 60 * 1000);

    return () => {
      clearTimeout(startupTimeout);
      clearInterval(interval);
    };
  }, [autoCheck, checkInterval, checkForUpdates, isTauri]);

  // Ne rien afficher en mode navigateur
  if (!isTauri) {
    return null;
  }

  return (
    <>
      {/* Bannière de mise à jour disponible */}
      <AnimatePresence>
        {showBanner && status === 'available' && update && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn(
              'fixed top-4 right-4 z-50 max-w-md',
              'bg-gradient-to-r from-indigo-600 to-purple-600',
              'rounded-xl shadow-2xl border border-white/20',
              'backdrop-blur-xl',
              className
            )}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">
                    Mise à jour disponible
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    Version {update.version} est disponible (actuelle: {update.currentVersion})
                  </p>
                  {update.body && (
                    <p className="mt-2 text-xs text-white/60 line-clamp-2">
                      {update.body}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowBanner(false)}
                  className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={downloadAndInstall}
                  className="flex-1 px-4 py-2 text-sm font-medium text-indigo-600 bg-white rounded-lg hover:bg-white/90 transition-colors"
                >
                  Installer maintenant
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière de téléchargement en cours */}
      <AnimatePresence>
        {status === 'downloading' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md bg-slate-800 rounded-xl shadow-2xl border border-white/10"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Téléchargement en cours...
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification mise à jour prête */}
      <AnimatePresence>
        {status === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md bg-emerald-600 rounded-xl shadow-2xl"
          >
            <div className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <p className="text-sm font-medium text-white">
                Mise à jour installée ! Redémarrage en cours...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification erreur */}
      <AnimatePresence>
        {status === 'error' && error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md bg-red-600 rounded-xl shadow-2xl"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    Erreur de mise à jour
                  </p>
                  <p className="mt-1 text-xs text-white/80">{error}</p>
                </div>
                <button
                  onClick={() => setStatus('idle')}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification à jour */}
      <AnimatePresence>
        {status === 'up-to-date' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 max-w-md bg-slate-800 rounded-xl shadow-2xl border border-white/10"
          >
            <div className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <p className="text-sm font-medium text-white">
                L'application est à jour
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default UpdateChecker;
