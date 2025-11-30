/**
 * KG-Oversight - Wizard d'import de données
 * Interface de mapping colonnes pour CSV/Excel
 * Validation avant import avec rapport d'erreurs
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  Download,
  Table2,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  parseExcelFile,
  detectSheetType,
  detectColumnMappings,
  importFromExcel,
  type ExcelSheet,
  type ExcelParseResult,
  type SheetMapping,
  type ColumnMapping,
} from '../parsers/excelParser';
import {
  validateData,
  generateValidationReport,
  type ValidationResult,
  type ValidationSeverity,
} from '../services/validationService';
import { allNodesAtom, allEdgesAtom } from '@shared/stores/selectionAtoms';
import type { NodeType, EdgeType } from '@data/types';

// =============================================================================
// Types
// =============================================================================

type WizardStep = 'upload' | 'mapping' | 'validation' | 'import' | 'complete';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SheetConfig {
  sheet: ExcelSheet;
  enabled: boolean;
  targetType: NodeType | EdgeType | null;
  isRelation: boolean;
  confidence: number;
  columnMappings: ColumnMapping[];
}

// =============================================================================
// Constantes
// =============================================================================

const NODE_TYPES: NodeType[] = [
  'SousTraitant',
  'Contrat',
  'AccordQualite',
  'Audit',
  'Inspection',
  'Finding',
  'EvenementQualite',
  'Decision',
  'EvaluationRisque',
  'ReunionQualite',
  'EtudeClinique',
  'DomaineService',
  'ContexteReglementaire',
  'Alerte',
  'Evenement',
  'KQI',
];

const EDGE_TYPES: EdgeType[] = [
  'EST_LIE_AU_CONTRAT',
  'EST_COUVERT_PAR_QA',
  'EST_SOUS_TRAITANT_DE',
  'A_ETE_AUDITE_PAR',
  'A_ETE_INSPECTE_PAR',
  'GENERE_FINDING',
  'IMPLIQUE_ST',
  'KQI_MESURE_ST',
];

const STEP_LABELS: Record<WizardStep, string> = {
  upload: 'Sélection du fichier',
  mapping: 'Configuration du mapping',
  validation: 'Validation des données',
  import: 'Import en cours',
  complete: 'Import terminé',
};

// =============================================================================
// Sous-composants
// =============================================================================

function StepIndicator({ currentStep, steps }: { currentStep: WizardStep; steps: WizardStep[] }) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${isActive ? 'bg-indigo-500 text-white' : ''}
                ${isCompleted ? 'bg-emerald-500 text-white' : ''}
                ${!isActive && !isCompleted ? 'bg-slate-700 text-slate-400' : ''}
              `}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            {!isLast && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: ValidationSeverity }) {
  switch (severity) {
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-400" />;
    case 'info':
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

function FileDropZone({
  onFileSelect,
  isLoading,
}: {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-200
        ${isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        className="hidden"
      />

      {isLoading ? (
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
      ) : (
        <>
          <div className="flex gap-4 mb-4">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
            <FileText className="w-10 h-10 text-blue-400" />
          </div>
          <Upload className="w-8 h-8 text-slate-400 mb-3" />
        </>
      )}

      <p className="text-slate-300 font-medium mb-1">
        {isLoading ? 'Analyse en cours...' : 'Déposez un fichier ou cliquez pour sélectionner'}
      </p>
      <p className="text-slate-500 text-sm">
        Formats supportés : Excel (.xlsx, .xls) ou CSV
      </p>
    </div>
  );
}

function SheetConfigPanel({
  config,
  onChange,
}: {
  config: SheetConfig;
  onChange: (config: SheetConfig) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-colors
        ${config.enabled ? 'border-slate-600 bg-slate-800/50' : 'border-slate-700 bg-slate-900/30 opacity-60'}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
        />

        <Table2 className="w-5 h-5 text-slate-400" />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-200 truncate">{config.sheet.name}</p>
          <p className="text-xs text-slate-500">
            {config.sheet.rowCount} lignes • {config.sheet.headers.length} colonnes
          </p>
        </div>

        {config.confidence > 0 && (
          <span
            className={`
              px-2 py-0.5 text-xs font-medium rounded
              ${config.confidence >= 0.8 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}
            `}
          >
            {Math.round(config.confidence * 100)}% match
          </span>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-slate-700"
        >
          <ChevronRight
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* Type selector */}
      {config.enabled && (
        <div className="px-3 pb-3 flex items-center gap-3">
          <ArrowRight className="w-4 h-4 text-slate-500" />

          <select
            value={config.isRelation ? 'relation' : 'node'}
            onChange={(e) => {
              const isRel = e.target.value === 'relation';
              onChange({
                ...config,
                isRelation: isRel,
                targetType: null,
              });
            }}
            className="px-2 py-1 text-sm rounded bg-slate-700 border border-slate-600 text-slate-200"
          >
            <option value="node">Noeud</option>
            <option value="relation">Relation</option>
          </select>

          <select
            value={config.targetType || ''}
            onChange={(e) =>
              onChange({
                ...config,
                targetType: (e.target.value as NodeType | EdgeType) || null,
              })
            }
            className="flex-1 px-2 py-1 text-sm rounded bg-slate-700 border border-slate-600 text-slate-200"
          >
            <option value="">-- Sélectionner le type --</option>
            {(config.isRelation ? EDGE_TYPES : NODE_TYPES).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Column mappings (expanded) */}
      <AnimatePresence>
        {isExpanded && config.enabled && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Mapping des colonnes :</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {config.columnMappings.map((mapping, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 truncate w-32">{mapping.sourceColumn}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={mapping.targetField}
                      onChange={(e) => {
                        const newMappings = [...config.columnMappings];
                        newMappings[idx] = { ...mapping, targetField: e.target.value };
                        onChange({ ...config, columnMappings: newMappings });
                      }}
                      className="flex-1 px-2 py-0.5 text-sm rounded bg-slate-700 border border-slate-600 text-slate-200"
                    />
                    {mapping.required && (
                      <span className="text-red-400 text-xs">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ValidationResultPanel({ result }: { result: ValidationResult }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div
        className={`
          p-4 rounded-lg border
          ${result.isValid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}
        `}
      >
        <div className="flex items-center gap-3 mb-2">
          {result.isValid ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-red-400" />
          )}
          <span className={`font-medium ${result.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.isValid ? 'Validation réussie' : 'Erreurs détectées'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
          <div className="text-center p-2 bg-slate-800/50 rounded">
            <p className="text-lg font-semibold text-slate-200">{result.stats.totalNodes}</p>
            <p className="text-slate-500">Noeuds</p>
          </div>
          <div className="text-center p-2 bg-slate-800/50 rounded">
            <p className="text-lg font-semibold text-slate-200">{result.stats.totalEdges}</p>
            <p className="text-slate-500">Relations</p>
          </div>
          <div className="text-center p-2 bg-slate-800/50 rounded">
            <p className="text-lg font-semibold text-red-400">{result.stats.errorCount}</p>
            <p className="text-slate-500">Erreurs</p>
          </div>
        </div>
      </div>

      {/* Issue counts */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-slate-300">{result.stats.errorCount} erreurs</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">{result.stats.warningCount} avertissements</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-slate-300">{result.stats.infoCount} infos</span>
        </div>
      </div>

      {/* Toggle details */}
      {result.issues.length > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {showDetails ? 'Masquer les détails' : `Afficher les ${result.issues.length} problèmes`}
        </button>
      )}

      {/* Details list */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.issues.slice(0, 100).map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-slate-800/50 rounded text-sm"
                >
                  <SeverityIcon severity={issue.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300">{issue.message}</p>
                    {issue.nodeId && (
                      <p className="text-slate-500 text-xs">Noeud: {issue.nodeId}</p>
                    )}
                    {issue.suggestion && (
                      <p className="text-indigo-400 text-xs mt-1">{issue.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
              {result.issues.length > 100 && (
                <p className="text-slate-500 text-sm text-center py-2">
                  ... et {result.issues.length - 100} autres problèmes
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Composant principal
// =============================================================================

export function ImportWizard({ isOpen, onClose }: ImportWizardProps) {
  const setAllNodes = useSetAtom(allNodesAtom);
  const setAllEdges = useSetAtom(allEdgesAtom);

  // États du wizard
  const [step, setStep] = useState<WizardStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Données du fichier
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [sheetConfigs, setSheetConfigs] = useState<SheetConfig[]>([]);

  // Résultats
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importStats, setImportStats] = useState<{
    nodes: number;
    edges: number;
    errors: number;
  } | null>(null);

  // Steps à afficher
  const steps: WizardStep[] = ['upload', 'mapping', 'validation', 'complete'];

  // Reset
  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setSheetConfigs([]);
    setValidationResult(null);
    setImportStats(null);
    setError(null);
  }, []);

  // Gestion de la fermeture
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  // Sélection du fichier
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const result = await parseExcelFile(selectedFile);
      setParseResult(result);

      // Configurer automatiquement les onglets
      const configs: SheetConfig[] = result.sheets.map((sheet) => {
        const detection = detectSheetType(sheet.name);
        const columnMappings =
          detection.type && !detection.isRelation
            ? detectColumnMappings(sheet.headers, detection.type, detection.isRelation)
            : sheet.headers.map((h) => ({
                sourceColumn: h,
                targetField: h.toLowerCase().replace(/\s+/g, '_'),
              }));

        return {
          sheet,
          enabled: detection.type !== null,
          targetType: detection.type,
          isRelation: detection.isRelation,
          confidence: detection.confidence,
          columnMappings,
        };
      });

      setSheetConfigs(configs);
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validation
  const handleValidate = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      // Convertir les configs en mappings
      const mappings: SheetMapping[] = sheetConfigs
        .filter((c) => c.enabled && c.targetType)
        .map((c) => ({
          sheetName: c.sheet.name,
          targetType: c.targetType!,
          isRelation: c.isRelation,
          columnMappings: c.columnMappings,
        }));

      // Importer les données
      const importResult = await importFromExcel(file, mappings);

      // Valider
      const validation = validateData(importResult.nodes, importResult.edges);
      setValidationResult(validation);
      setStep('validation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setIsLoading(false);
    }
  }, [file, sheetConfigs]);

  // Import final
  const handleImport = useCallback(async () => {
    if (!file || !validationResult) return;
    setIsLoading(true);
    setStep('import');

    try {
      // Convertir les configs en mappings
      const mappings: SheetMapping[] = sheetConfigs
        .filter((c) => c.enabled && c.targetType)
        .map((c) => ({
          sheetName: c.sheet.name,
          targetType: c.targetType!,
          isRelation: c.isRelation,
          columnMappings: c.columnMappings,
        }));

      // Importer les données
      const result = await importFromExcel(file, mappings);

      // Mettre à jour le store
      setAllNodes(result.nodes);
      setAllEdges(result.edges);

      setImportStats({
        nodes: result.nodes.size,
        edges: result.edges.size,
        errors: result.errors.length,
      });
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import");
      setStep('validation');
    } finally {
      setIsLoading(false);
    }
  }, [file, validationResult, sheetConfigs, setAllNodes, setAllEdges]);

  // Télécharger le rapport
  const handleDownloadReport = useCallback(() => {
    if (!validationResult) return;
    const report = generateValidationReport(validationResult);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [validationResult]);

  // Nombre de sheets activées
  const enabledSheets = useMemo(
    () => sheetConfigs.filter((c) => c.enabled && c.targetType).length,
    [sheetConfigs]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
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
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Upload className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-200">Import de données</h2>
                <p className="text-xs text-slate-500">{STEP_LABELS[step]}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
            <StepIndicator currentStep={step} steps={steps} />

            {/* Erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Step: Upload */}
            {step === 'upload' && (
              <FileDropZone onFileSelect={handleFileSelect} isLoading={isLoading} />
            )}

            {/* Step: Mapping */}
            {step === 'mapping' && parseResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-sm">
                    {parseResult.sheets.length} onglet(s) détecté(s) dans{' '}
                    <span className="text-slate-200">{parseResult.filename}</span>
                  </p>
                  <button
                    onClick={reset}
                    className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Changer de fichier
                  </button>
                </div>

                <div className="space-y-3">
                  {sheetConfigs.map((config, idx) => (
                    <SheetConfigPanel
                      key={config.sheet.name}
                      config={config}
                      onChange={(newConfig) => {
                        const newConfigs = [...sheetConfigs];
                        newConfigs[idx] = newConfig;
                        setSheetConfigs(newConfigs);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step: Validation */}
            {step === 'validation' && validationResult && (
              <ValidationResultPanel result={validationResult} />
            )}

            {/* Step: Import */}
            {step === 'import' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                <p className="text-slate-300">Import des données en cours...</p>
              </div>
            )}

            {/* Step: Complete */}
            {step === 'complete' && importStats && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">Import terminé !</h3>
                <p className="text-slate-400 mb-6">
                  {importStats.nodes} noeuds et {importStats.edges} relations importés
                </p>
                {importStats.errors > 0 && (
                  <p className="text-amber-400 text-sm mb-4">
                    {importStats.errors} erreur(s) rencontrée(s)
                  </p>
                )}
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'complete' && step !== 'import' && (
            <div className="flex items-center justify-between p-4 border-t border-slate-700">
              <div>
                {step === 'validation' && validationResult && (
                  <button
                    onClick={handleDownloadReport}
                    className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le rapport
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                {step !== 'upload' && (
                  <button
                    onClick={() => {
                      if (step === 'mapping') setStep('upload');
                      if (step === 'validation') setStep('mapping');
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-slate-300 hover:text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                )}

                {step === 'mapping' && (
                  <button
                    onClick={handleValidate}
                    disabled={isLoading || enabledSheets === 0}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Valider
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {step === 'validation' && validationResult && (
                  <button
                    onClick={handleImport}
                    disabled={isLoading || !validationResult.isValid}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Importer
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ImportWizard;
