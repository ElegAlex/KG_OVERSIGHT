/**
 * KG-Oversight - Scénarios prédéfinis
 * 4 scénarios de navigation pour les cas d'usage métier
 */

import type { Scenario } from '../types/scenario';

// =============================================================================
// Scénario 1 : Préparation inspection par étude
// =============================================================================

export const inspectionPreparationScenario: Scenario = {
  metadata: {
    id: 'inspection-preparation',
    title: 'Préparation inspection par étude',
    description:
      'Navigation guidée pour préparer une inspection réglementaire. Parcourt la chaîne complète : Étude → Sous-traitants N1 → N2 → Audits → Findings → Actions correctives.',
    category: 'inspection',
    icon: 'ClipboardCheck',
    color: '#6366f1',
    estimatedDuration: 15,
    tags: ['inspection', 'étude', 'audit', 'préparation'],
    version: '1.0',
  },
  prerequisites: {
    requiredTypes: ['EtudeClinique', 'SousTraitant', 'Audit'],
    description: 'Ce scénario nécessite au moins une étude clinique avec des sous-traitants associés.',
  },
  steps: [
    {
      id: 'step-1-select-study',
      title: 'Sélectionner l\'étude clinique',
      description:
        'Identifiez l\'étude clinique qui fera l\'objet de l\'inspection. Les études en Phase III sont généralement les plus scrutées.',
      nodeSelector: {
        types: ['EtudeClinique'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: false,
      },
      tips: [
        'Les études en Phase III ont un niveau de surveillance plus élevé',
        'Vérifiez le statut de l\'étude (en cours, terminée)',
      ],
      insights: [
        { label: 'Phase recommandée', value: 'Phase III', severity: 'info' },
      ],
    },
    {
      id: 'step-2-n1-subcontractors',
      title: 'Sous-traitants de niveau 1 (N1)',
      description:
        'Identifiez tous les sous-traitants N1 impliqués dans l\'étude. Ce sont les partenaires directs avec lesquels vous avez un contrat.',
      nodeSelector: {
        types: ['SousTraitant'],
        where: [{ field: 'niveau_actuel', operator: 'eq', value: '1' }],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: '#22c55e',
      },
      tips: [
        'Les ST N1 critiques doivent avoir été audités dans les 3 dernières années',
        'Vérifiez que les contrats et accords qualité sont à jour',
      ],
    },
    {
      id: 'step-3-n2-subcontractors',
      title: 'Sous-traitants de niveau 2 (N2)',
      description:
        'Identifiez les sous-traitants N2 (sous-traitants de vos sous-traitants). Ces entités sont souvent négligées mais peuvent être auditées.',
      nodeSelector: {
        types: ['SousTraitant'],
        where: [{ field: 'niveau_actuel', operator: 'eq', value: '2' }],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: '#f59e0b',
      },
      tips: [
        'Les N2 critiques doivent être déclarés et qualifiés',
        'Vérifiez la traçabilité de la qualification des N2',
      ],
      insights: [
        { label: 'Attention', value: 'ST2 non déclarés = risque majeur', severity: 'warning' },
      ],
    },
    {
      id: 'step-4-audits',
      title: 'Historique des audits',
      description:
        'Consultez l\'historique des audits pour chaque sous-traitant impliqué. Identifiez les audits récents et leurs résultats.',
      nodeSelector: {
        types: ['Audit'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Un audit "For Cause" indique un problème antérieur',
        'Vérifiez que les audits "Non satisfaisant" ont été suivis d\'actions',
      ],
      insights: [
        { label: 'Fréquence recommandée', value: 'Audit tous les 3 ans', severity: 'info' },
      ],
    },
    {
      id: 'step-5-findings',
      title: 'Findings ouverts',
      description:
        'Identifiez tous les findings encore ouverts, particulièrement les critiques et majeurs. Ces points seront scrutés lors de l\'inspection.',
      nodeSelector: {
        types: ['Finding'],
        where: [{ field: 'statut', operator: 'in', value: ['Ouvert', 'En cours'] }],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        highlightColor: '#ef4444',
      },
      tips: [
        'Les findings critiques ouverts > 30 jours sont un red flag',
        'Préparez les justifications pour chaque finding ouvert',
      ],
      insights: [
        { label: 'Risque', value: 'Findings critiques ouverts', severity: 'critical' },
      ],
    },
    {
      id: 'step-6-quality-events',
      title: 'Événements qualité',
      description:
        'Passez en revue les événements qualité survenus sur l\'étude. Vérifiez les actions correctives mises en place.',
      nodeSelector: {
        types: ['EvenementQualite'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Documentez l\'analyse d\'impact de chaque événement',
        'Vérifiez la clôture formelle des événements',
      ],
    },
    {
      id: 'step-7-summary',
      title: 'Synthèse et points d\'attention',
      description:
        'Récapitulatif des éléments identifiés. Préparez votre dossier d\'inspection avec les documents clés.',
      nodeSelector: {
        types: ['SousTraitant', 'Audit', 'Finding', 'EvenementQualite'],
      },
      actions: ['highlight'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Préparez un résumé exécutif pour l\'inspecteur',
        'Identifiez les personnes clés à interviewer',
        'Rassemblez les documents de qualification et contrats',
      ],
    },
  ],
};

// =============================================================================
// Scénario 2 : Analyse panoramique sous-traitant
// =============================================================================

export const subcontractorAnalysisScenario: Scenario = {
  metadata: {
    id: 'subcontractor-analysis',
    title: 'Analyse panoramique sous-traitant',
    description:
      'Vue à 360° d\'un sous-traitant : contrats, accords qualité, audits, KQI, événements qualité et évaluation des risques.',
    category: 'monitoring',
    icon: 'Building2',
    color: '#8b5cf6',
    estimatedDuration: 10,
    tags: ['sous-traitant', 'analyse', '360', 'évaluation'],
    version: '1.0',
  },
  prerequisites: {
    requiredTypes: ['SousTraitant'],
    description: 'Sélectionnez un sous-traitant pour démarrer l\'analyse.',
  },
  steps: [
    {
      id: 'step-1-select-st',
      title: 'Sélection du sous-traitant',
      description:
        'Choisissez le sous-traitant à analyser. Les sous-traitants critiques nécessitent une attention particulière.',
      nodeSelector: {
        types: ['SousTraitant'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
      },
      tips: [
        'Priorisez les ST critiques ou sous surveillance',
        'Vérifiez la date de dernière évaluation',
      ],
    },
    {
      id: 'step-2-contracts',
      title: 'Contrats actifs',
      description:
        'Visualisez tous les contrats liant le sous-traitant au sponsor. Vérifiez les dates de validité et les périmètres.',
      nodeSelector: {
        types: ['Contrat'],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: '#3b82f6',
      },
      tips: [
        'Vérifiez que les contrats couvrent toutes les activités',
        'Identifiez les contrats arrivant à échéance',
      ],
    },
    {
      id: 'step-3-quality-agreements',
      title: 'Accords Qualité',
      description:
        'Les accords qualité définissent les responsabilités et exigences. Assurez-vous qu\'ils sont signés et à jour.',
      nodeSelector: {
        types: ['AccordQualite'],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: '#10b981',
      },
      tips: [
        'Un QA doit accompagner chaque contrat',
        'Vérifiez la cohérence QA/Contrat',
      ],
    },
    {
      id: 'step-4-services',
      title: 'Domaines de service',
      description:
        'Identifiez les domaines de service du sous-traitant. Chaque domaine peut avoir des exigences spécifiques.',
      nodeSelector: {
        types: ['DomaineService'],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Les services GxP nécessitent une qualification',
        'Vérifiez les certifications par domaine',
      ],
    },
    {
      id: 'step-5-audit-history',
      title: 'Historique des audits',
      description:
        'Consultez tous les audits réalisés chez ce sous-traitant. Analysez l\'évolution des résultats.',
      nodeSelector: {
        types: ['Audit'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Comparez les résultats d\'audit sur plusieurs années',
        'Identifiez les tendances (amélioration/dégradation)',
      ],
    },
    {
      id: 'step-6-kqi',
      title: 'Indicateurs qualité (KQI)',
      description:
        'Analysez les KQI du sous-traitant. Les indicateurs en alerte nécessitent un plan d\'action.',
      nodeSelector: {
        types: ['KQI'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        highlightColor: '#f59e0b',
      },
      tips: [
        'Un KQI en alerte depuis > 2 périodes = escalade',
        'Vérifiez les plans d\'amélioration en cours',
      ],
      insights: [
        { label: 'Seuil critique', value: 'KQI < 70%', severity: 'critical' },
      ],
    },
    {
      id: 'step-7-risk-evaluation',
      title: 'Évaluation des risques',
      description:
        'Consultez la dernière évaluation de risque. Le score global détermine le niveau de surveillance.',
      nodeSelector: {
        types: ['EvaluationRisque'],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        highlightColor: '#ef4444',
      },
      tips: [
        'Score High = surveillance renforcée requise',
        'Réévaluation recommandée tous les ans',
      ],
    },
    {
      id: 'step-8-decisions',
      title: 'Décisions et actions',
      description:
        'Historique des décisions prises concernant ce sous-traitant. Préparez les prochaines actions.',
      nodeSelector: {
        types: ['Decision'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Documentez la justification de chaque décision',
        'Planifiez les réévaluations périodiques',
      ],
    },
  ],
};

// =============================================================================
// Scénario 3 : Évaluation risque annuelle
// =============================================================================

export const annualRiskEvaluationScenario: Scenario = {
  metadata: {
    id: 'annual-risk-evaluation',
    title: 'Évaluation risque annuelle',
    description:
      'Processus d\'évaluation annuelle des risques fournisseurs. Analyse des KQI, évolution des scores et prise de décision.',
    category: 'risk',
    icon: 'TrendingUp',
    color: '#ef4444',
    estimatedDuration: 20,
    tags: ['risque', 'évaluation', 'annuel', 'KQI'],
    version: '1.0',
  },
  prerequisites: {
    requiredTypes: ['SousTraitant', 'KQI', 'EvaluationRisque'],
    description: 'Ce scénario nécessite des données KQI et des évaluations de risque.',
  },
  steps: [
    {
      id: 'step-1-critical-st',
      title: 'Sous-traitants critiques',
      description:
        'Commencez par les sous-traitants de criticité élevée. Ils représentent le plus grand risque pour vos études.',
      nodeSelector: {
        types: ['SousTraitant'],
        where: [{ field: 'criticite', operator: 'eq', value: 'Critique' }],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        highlightColor: '#ef4444',
      },
      tips: [
        'Les ST critiques impactent directement la qualité des données',
        'Prévoyez un plan de contingence pour chacun',
      ],
    },
    {
      id: 'step-2-kqi-alerts',
      title: 'KQI en alerte',
      description:
        'Identifiez tous les indicateurs en zone d\'alerte ou critique. Ces KQI nécessitent une action immédiate.',
      nodeSelector: {
        types: ['KQI'],
        where: [{ field: 'statut', operator: 'in', value: ['Alerte', 'Critique'] }],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        highlightColor: '#f59e0b',
      },
      tips: [
        'Analysez la cause racine de chaque alerte',
        'Documentez les plans de remédiation',
      ],
      insights: [
        { label: 'Action requise', value: 'Plan correctif < 30j', severity: 'warning' },
      ],
    },
    {
      id: 'step-3-degradation-trend',
      title: 'Tendances en dégradation',
      description:
        'Identifiez les KQI avec une tendance à la dégradation. Même s\'ils sont encore dans les limites, ils nécessitent une attention.',
      nodeSelector: {
        types: ['KQI'],
        where: [{ field: 'tendance', operator: 'eq', value: 'Dégradation' }],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        highlightColor: '#f97316',
      },
      tips: [
        'Une dégradation sur 3 périodes = risque élevé',
        'Anticipez les actions avant passage en alerte',
      ],
    },
    {
      id: 'step-4-high-risk',
      title: 'Évaluations à risque élevé',
      description:
        'Consultez les sous-traitants avec un score de risque élevé. Ces entités nécessitent une surveillance renforcée.',
      nodeSelector: {
        types: ['EvaluationRisque'],
        where: [{ field: 'score_global', operator: 'eq', value: 'High' }],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        highlightColor: '#dc2626',
      },
      tips: [
        'Risque High = audit dans les 12 mois',
        'Envisagez la recherche d\'alternatives',
      ],
      insights: [
        { label: 'Surveillance', value: 'Mensuelle requise', severity: 'critical' },
      ],
    },
    {
      id: 'step-5-recent-events',
      title: 'Événements qualité récents',
      description:
        'Passez en revue les événements qualité des 12 derniers mois. Ils peuvent impacter le score de risque.',
      nodeSelector: {
        types: ['EvenementQualite'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Les événements critiques augmentent le score de risque',
        'Vérifiez l\'efficacité des actions correctives',
      ],
    },
    {
      id: 'step-6-decisions',
      title: 'Prendre les décisions',
      description:
        'Sur base de l\'analyse, documentez les décisions : maintien, surveillance renforcée, suspension ou retrait.',
      nodeSelector: {
        types: ['Decision'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Chaque décision doit être justifiée et documentée',
        'Impliquez les parties prenantes (QA, Achats, Projet)',
      ],
    },
  ],
};

// =============================================================================
// Scénario 4 : Détection ST2 non déclaré
// =============================================================================

export const undeclaredN2DetectionScenario: Scenario = {
  metadata: {
    id: 'undeclared-n2-detection',
    title: 'Détection ST2 non déclaré',
    description:
      'Identification des sous-traitants de niveau 2 potentiellement non déclarés. Navigation dans la chaîne de sous-traitance.',
    category: 'audit',
    icon: 'Search',
    color: '#f59e0b',
    estimatedDuration: 12,
    tags: ['N2', 'sous-traitance', 'détection', 'conformité'],
    version: '1.0',
  },
  prerequisites: {
    requiredTypes: ['SousTraitant', 'Alerte'],
    description: 'Ce scénario analyse les alertes liées aux sous-traitants non déclarés.',
  },
  steps: [
    {
      id: 'step-1-n2-alerts',
      title: 'Alertes ST2 non déclarés',
      description:
        'Commencez par les alertes système signalant des sous-traitants N2 potentiellement non déclarés ou non qualifiés.',
      nodeSelector: {
        types: ['Alerte'],
        where: [{ field: 'description', operator: 'contains', value: 'N2' }],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        highlightColor: '#f59e0b',
      },
      tips: [
        'Ces alertes sont générées automatiquement par le système',
        'Chaque alerte nécessite une investigation',
      ],
      insights: [
        { label: 'Risque réglementaire', value: 'Élevé', severity: 'critical' },
      ],
    },
    {
      id: 'step-2-n1-chain',
      title: 'Identifier le ST N1 source',
      description:
        'Remontez au sous-traitant N1 à l\'origine de la chaîne. C\'est avec lui que vous avez la relation contractuelle.',
      nodeSelector: {
        types: ['SousTraitant'],
        where: [{ field: 'niveau_actuel', operator: 'eq', value: '1' }],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: '#22c55e',
      },
      tips: [
        'Le N1 est responsable de la qualification de ses propres sous-traitants',
        'Vérifiez les clauses de sous-traitance dans le contrat',
      ],
    },
    {
      id: 'step-3-declared-n2',
      title: 'ST N2 déclarés',
      description:
        'Visualisez les sous-traitants N2 actuellement déclarés et qualifiés pour ce N1.',
      nodeSelector: {
        types: ['SousTraitant'],
        where: [
          { field: 'niveau_actuel', operator: 'eq', value: '2' },
          { field: 'statut', operator: 'in', value: ['Qualifié', 'Approuvé'] },
        ],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        showEdges: true,
        highlightColor: '#10b981',
      },
      tips: [
        'Comparez avec la liste fournie par le N1',
        'Identifiez les écarts',
      ],
    },
    {
      id: 'step-4-suspicious-n2',
      title: 'ST N2 suspects',
      description:
        'Identifiez les N2 en évaluation ou avec un statut non conforme. Ces entités nécessitent une clarification.',
      nodeSelector: {
        types: ['SousTraitant'],
        where: [
          { field: 'niveau_actuel', operator: 'eq', value: '2' },
          { field: 'statut', operator: 'in', value: ['En évaluation', 'Déclaré', 'Non qualifié'] },
        ],
      },
      actions: ['highlight', 'focus'],
      config: {
        autoZoom: true,
        highlightColor: '#ef4444',
      },
      tips: [
        'Demandez la documentation de qualification au N1',
        'Évaluez l\'impact sur les études en cours',
      ],
      insights: [
        { label: 'Action', value: 'Qualification requise', severity: 'warning' },
      ],
    },
    {
      id: 'step-5-contracts-qa',
      title: 'Vérifier contrats et QA',
      description:
        'Assurez-vous que les contrats et accords qualité mentionnent explicitement la possibilité de sous-traitance.',
      nodeSelector: {
        types: ['Contrat', 'AccordQualite'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'La clause de sous-traitance doit prévoir l\'approbation préalable',
        'Mettez à jour les QA si nécessaire',
      ],
    },
    {
      id: 'step-6-action-plan',
      title: 'Plan d\'action',
      description:
        'Définissez les actions correctives : qualification des N2 non déclarés, mise à jour des contrats, ou changement de stratégie.',
      nodeSelector: {
        types: ['Decision', 'Alerte'],
      },
      actions: ['highlight', 'filter'],
      config: {
        autoZoom: true,
        showEdges: true,
      },
      tips: [
        'Documentez toutes les actions dans le système',
        'Définissez des échéances claires',
        'Informez les parties prenantes des risques identifiés',
      ],
    },
  ],
};

// =============================================================================
// Export de tous les scénarios
// =============================================================================

export const predefinedScenarios: Scenario[] = [
  inspectionPreparationScenario,
  subcontractorAnalysisScenario,
  annualRiskEvaluationScenario,
  undeclaredN2DetectionScenario,
];

export const getScenarioById = (id: string): Scenario | undefined => {
  return predefinedScenarios.find((s) => s.metadata.id === id);
};

export const getScenariosByCategory = (category: string): Scenario[] => {
  return predefinedScenarios.filter((s) => s.metadata.category === category);
};

export default predefinedScenarios;
