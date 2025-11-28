/**
 * KG-Oversight - Header moderne
 * Design system inspiré Linear/Vercel
 */

import { Network, Circle, GitBranch, AlertTriangle, Building2, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statPillColors, type StatPillColor } from '@/styles/colors';
import type { LucideIcon } from 'lucide-react';

interface HeaderProps {
  totalNodes: number;
  filteredNodes: number;
  totalEdges: number;
  stCount: number;
  alertCount: number;
  criticalCount: number;
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

export function Header({
  totalNodes,
  filteredNodes,
  totalEdges,
  stCount,
  alertCount,
  criticalCount,
}: HeaderProps) {
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
            <StatPill
              icon={AlertTriangle}
              value={alertCount}
              label="alertes"
              color="amber"
            />
          )}
          {criticalCount > 0 && (
            <StatPill
              icon={AlertTriangle}
              value={criticalCount}
              label="critiques"
              color="red"
              pulse
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
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
