/**
 * KG-Oversight - Header moderne
 * Design system inspiré Linear/Vercel
 */

import { Network, Circle, GitBranch, AlertTriangle, Building2, Settings, HelpCircle, Sun, Moon, BarChart3, Upload, Play, Calendar, Plus } from 'lucide-react';
import { useAtom, useAtomValue } from 'jotai';
import { cn } from '@/lib/utils';
import { statPillColors, type StatPillColor } from '@/styles/colors';
import { themeAtom, type Theme } from '@shared/stores/themeAtom';
import { timelineSizeAtom } from '@shared/stores/selectionAtoms';
import type { LucideIcon } from 'lucide-react';

interface HeaderProps {
  totalNodes: number;
  filteredNodes: number;
  totalEdges: number;
  stCount: number;
  alertCount: number;
  criticalCount: number;
  onOpenDashboard?: () => void;
  onOpenAlerts?: () => void;
  onOpenImport?: () => void;
  onOpenScenarios?: () => void;
  onOpenCreate?: () => void;
}

interface StatPillProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: StatPillColor;
  pulse?: boolean;
}

function StatPill({ icon: Icon, value, label, color, pulse }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border',
        'transition-all duration-200 hover:scale-105 cursor-default',
        statPillColors[color]
      )}
    >
      <div className="relative">
        <Icon className="w-3.5 h-3.5" />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
      <span className="text-sm font-medium tabular-nums">{value}</span>
      <span className="text-xs opacity-60">{label}</span>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn-ghost p-2 rounded-lg"
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}

export function Header({
  totalNodes,
  filteredNodes,
  totalEdges,
  stCount,
  alertCount,
  criticalCount,
  onOpenDashboard,
  onOpenAlerts,
  onOpenImport,
  onOpenScenarios,
  onOpenCreate,
}: HeaderProps) {
  const [timelineSize, setTimelineSize] = useAtom(timelineSizeAtom);

  const toggleTimeline = () => {
    setTimelineSize((prev) => (prev === 'collapsed' ? 'normal' : 'collapsed'));
  };

  return (
    <header className="app-header px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo avec glow */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Network className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              KG-Oversight
            </h1>
            <p className="text-xs text-slate-500">
              Knowledge Graph Explorer
            </p>
          </div>
        </div>

        {/* Stats avec style pill moderne */}
        <div className="flex items-center gap-2">
          <StatPill
            icon={Circle}
            value={`${filteredNodes}/${totalNodes}`}
            label="noeuds"
            color="emerald"
          />
          <StatPill
            icon={GitBranch}
            value={totalEdges}
            label="relations"
            color="slate"
          />
          <StatPill
            icon={Building2}
            value={stCount}
            label="ST"
            color="indigo"
          />
          {alertCount > 0 && (
            <button
              onClick={onOpenAlerts}
              className="focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-full"
            >
              <StatPill
                icon={AlertTriangle}
                value={alertCount}
                label="alertes"
                color="amber"
              />
            </button>
          )}
          {criticalCount > 0 && (
            <button
              onClick={onOpenAlerts}
              className="focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-full"
            >
              <StatPill
                icon={AlertTriangle}
                value={criticalCount}
                label="critiques"
                color="red"
                pulse
              />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
              title="Créer une entité (Ctrl+N)"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Ajouter</span>
            </button>
          )}
          <button
            onClick={toggleTimeline}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
              timelineSize === 'collapsed'
                ? "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20"
                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
            )}
            title={timelineSize === 'collapsed' ? "Afficher la timeline" : "Masquer la timeline"}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Timeline</span>
          </button>
          {onOpenScenarios && (
            <button
              onClick={onOpenScenarios}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
              title="Scénarios guidés"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Scénarios</span>
            </button>
          )}
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Importer des données"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Import</span>
            </button>
          )}
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              title="Dashboard KQI"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
          )}
          <ThemeToggle />
          <button
            className="btn-ghost p-2 rounded-lg"
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            className="btn-ghost p-2 rounded-lg"
            title="Aide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
