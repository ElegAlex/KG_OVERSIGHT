/**
 * KG-Oversight - Composant TypeSelector
 * Sélecteur de type d'entité groupé par catégorie
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  FileText,
  Shield,
  Layers,
  ClipboardCheck,
  Search,
  AlertTriangle,
  Zap,
  Scale,
  Activity,
  FlaskConical,
  Users,
  Bell,
  Calendar,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NodeType } from '@data/types';
import { getEntitySchema } from '../constants/entitySchemas';

interface TypeSelectorProps {
  selectedType: NodeType | null;
  onSelect: (type: NodeType) => void;
  className?: string;
}

// Configuration des icônes par type
const typeIcons: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  SousTraitant: Building2,
  Contrat: FileText,
  AccordQualite: Shield,
  DomaineService: Layers,
  Audit: ClipboardCheck,
  Inspection: Search,
  Finding: AlertTriangle,
  EvenementQualite: Zap,
  Decision: Scale,
  EvaluationRisque: Activity,
  EtudeClinique: FlaskConical,
  ReunionQualite: Users,
  Alerte: Bell,
  Evenement: Calendar,
  KQI: BarChart3,
  ContexteReglementaire: BookOpen,
  CAPA: FileText,
};

// Groupement des types par catégorie
interface TypeCategory {
  name: string;
  description: string;
  types: NodeType[];
}

const typeCategories: TypeCategory[] = [
  {
    name: 'Organisation',
    description: 'Sous-traitants et structure',
    types: ['SousTraitant', 'Contrat', 'AccordQualite', 'DomaineService'],
  },
  {
    name: 'Événements qualité',
    description: 'Audits, inspections et findings',
    types: ['Audit', 'Inspection', 'Finding', 'EvenementQualite', 'Decision', 'EvaluationRisque', 'CAPA'],
  },
  {
    name: 'Études et réunions',
    description: 'Études cliniques et réunions',
    types: ['EtudeClinique', 'ReunionQualite'],
  },
  {
    name: 'Suivi',
    description: 'Alertes, événements et indicateurs',
    types: ['Alerte', 'Evenement', 'KQI', 'ContexteReglementaire'],
  },
];

export function TypeSelector({ selectedType, onSelect, className }: TypeSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {typeCategories.map((category) => (
        <div key={category.name}>
          <div className="mb-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {category.name}
            </h4>
            <p className="text-[10px] text-slate-600">{category.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {category.types.map((type) => {
              const schema = getEntitySchema(type);
              const Icon = typeIcons[type] || FileText;
              const isSelected = selectedType === type;

              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(type)}
                  className={cn(
                    'relative flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left',
                    isSelected
                      ? 'bg-indigo-500/20 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-indigo-500/30' : 'bg-slate-700/50'
                    )}
                    style={{
                      backgroundColor: isSelected ? undefined : `${schema?.color}20`,
                    }}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isSelected ? 'text-indigo-400' : 'text-slate-400'
                      )}
                      style={{
                        color: isSelected ? undefined : schema?.color,
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        isSelected ? 'text-indigo-300' : 'text-slate-300'
                      )}
                    >
                      {schema?.label || type}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="selectedType"
                      className="absolute inset-0 rounded-lg ring-2 ring-indigo-500/50"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TypeSelector;
