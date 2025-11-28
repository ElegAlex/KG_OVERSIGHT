# KNOWLEDGE GRAPH OVERSIGHT

## Cahier des Cas d'Usage et Exigences

**Version 1.0** — 28 novembre 2025

---

|Élément|Description|
|---|---|
|**Client**|Industrie Pharmaceutique - Supervision Qualité Fournisseurs|
|**Domaine**|Essais cliniques - Gestion des sous-traitants (CRO, laboratoires, logistique)|
|**Utilisateurs cibles**|Managers Qualité, Auditeurs, Responsables Supervision|
|**Mode déploiement**|Application desktop locale (100% offline, on-premise)|
|**Volume de données**|10 000+ nœuds, 50 000+ relations|

---

## Sommaire

1. [Contexte et Objectifs](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#1-contexte-et-objectifs)
2. [Acteurs et Rôles](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#2-acteurs-et-r%C3%B4les)
3. [Cas d'Usage Métier](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#3-cas-dusage-m%C3%A9tier)
4. [Exigences Fonctionnelles](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#4-exigences-fonctionnelles)
5. [Exigences Non Fonctionnelles](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#5-exigences-non-fonctionnelles)
6. [Modèle de Données](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#6-mod%C3%A8le-de-donn%C3%A9es)
7. [Scénarios de Démonstration](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#7-sc%C3%A9narios-de-d%C3%A9monstration)
8. [Règles d'Inférence](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#8-r%C3%A8gles-dinf%C3%A9rence)
9. [Indicateurs Qualité (KQI)](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#9-indicateurs-qualit%C3%A9-kqi)
10. [Glossaire](https://claude.ai/chat/9a7f9d07-46b1-45a6-8ec9-fcc65c144513#10-glossaire)

---

## 1. Contexte et Objectifs

### 1.1 Contexte métier

Dans le cadre des essais cliniques, les laboratoires pharmaceutiques font appel à de nombreux sous-traitants (CRO, laboratoires de bioanalyse, prestataires logistiques, etc.) qui peuvent eux-mêmes sous-traiter certaines activités. Cette chaîne de sous-traitance multi-niveaux crée des enjeux majeurs de supervision et de traçabilité qualité.

Les nouvelles exigences réglementaires **ICH E6(R3)** renforcent les obligations de surveillance des sous-traitants (« oversight »), imposant une vision globale et historique des relations contractuelles, des audits, des événements qualité et des indicateurs de performance.

### 1.2 Problématique

- Difficulté à visualiser la chaîne complète de sous-traitance (niveaux 1 et 2)
- Absence de vue consolidée par étude clinique ou par sous-traitant
- Manque de traçabilité chronologique des événements qualité
- Évaluation de risque morcelée, non centralisée
- Préparation des inspections réglementaires chronophage

### 1.3 Objectifs de la solution

KG-Oversight vise à fournir un outil de visualisation et d'analyse basé sur un graphe de connaissances permettant de :

- **Centraliser** toutes les informations relatives aux sous-traitants et leurs relations
- **Visualiser** les chaînes de sous-traitance et leurs interdépendances
- **Naviguer** intuitivement par étude, par sous-traitant ou par domaine d'activité
- **Historiser** tous les événements dans une timeline interactive
- **Alerter** automatiquement sur les situations à risque
- **Démontrer** la conformité lors des inspections via des scénarios guidés

---

## 2. Acteurs et Rôles

### 2.1 Utilisateurs principaux

|Acteur|Responsabilités|Besoins clés|
|---|---|---|
|**Manager Qualité**|Supervision globale, évaluation des risques, décisions stratégiques|Vue d'ensemble, alertes critiques, KQI consolidés|
|**Auditeur Qualité**|Audits fournisseurs, suivi des findings, vérification CAPA|Navigation par sous-traitant, historique complet, timeline|
|**Responsable Étude**|Gestion opérationnelle des études cliniques|Vue par étude, chaîne de sous-traitance, événements qualité|
|**Inspecteur (externe)**|Vérification conformité réglementaire|Démonstration via scénarios, export de preuves|

### 2.2 Caractéristiques utilisateurs

- **Profil non technique :** Interface intuitive requise, pas de formation IT préalable
- **Usage mono-utilisateur :** Pas de collaboration simultanée, données locales
- **Contexte sensible :** Données confidentielles, déploiement strictement on-premise

---

## 3. Cas d'Usage Métier

### 3.1 UC-01 : Navigation par étude clinique

**Objectif :** Visualiser tous les sous-traitants impliqués dans une étude donnée

**Acteur principal :** Responsable Étude, Auditeur

**Scénario nominal :**

1. L'utilisateur sélectionne une étude clinique (ex: CARDIO-PHASE3-2023)
2. Le graphe affiche l'étude au centre avec tous les sous-traitants de niveau 1 connectés
3. L'utilisateur clique sur un sous-traitant N1 pour révéler ses sous-traitants N2
4. Chaque nœud affiche son rôle (CRO, Bioanalyse, Logistique...) et son statut

**Critères d'acceptation :** Distinction visuelle N1/N2, affichage du rôle sur chaque relation, drill-down fonctionnel

---

### 3.2 UC-02 : Vue panoramique sous-traitant

**Objectif :** Obtenir une vue 360° d'un sous-traitant donné

**Acteur principal :** Auditeur Qualité, Manager Qualité

**Scénario nominal :**

1. L'utilisateur recherche un sous-traitant (ex: Delta Clinical Logistics)
2. Le graphe centre la vue sur ce sous-traitant et affiche toutes ses connexions
3. L'utilisateur visualise : études associées, contrats, audits, findings, événements qualité, KQI
4. La timeline en bas affiche chronologiquement tous les événements liés

**Critères d'acceptation :** Vue centrée sur le ST, synchronisation timeline/graphe, filtrage par type d'événement

---

### 3.3 UC-03 : Suivi historique et timeline

**Objectif :** Visualiser chronologiquement les événements qualité

**Acteur principal :** Auditeur, Manager

**Scénario nominal :**

1. L'utilisateur sélectionne une plage temporelle (ex: 2024)
2. La timeline affiche : audits, inspections, événements qualité, décisions, évaluations
3. L'utilisateur clique sur un événement dans la timeline
4. Le graphe highlight automatiquement les nœuds concernés

**Critères d'acceptation :** Zoom temporel (jour/semaine/mois/trimestre/année), synchronisation bidirectionnelle, codage couleur par criticité

---

### 3.4 UC-04 : Évaluation de risque périodique

**Objectif :** Consulter et analyser les évaluations de risque des sous-traitants

**Acteur principal :** Manager Qualité

**Scénario nominal :**

1. L'utilisateur accède au dashboard KQI
2. Il visualise le score de risque (Low/Medium/High) de chaque sous-traitant N1
3. Il identifie les évolutions (ex: Low→Medium pour Alpha Clinical)
4. Il consulte les critères : findings critiques, événements qualité, alertes KQI

**Critères d'acceptation :** Calcul automatique du score, visualisation des tendances, lien vers les décisions associées

---

### 3.5 UC-05 : Préparation inspection

**Objectif :** Démontrer la supervision des sous-traitants lors d'une inspection

**Acteur principal :** Manager Qualité, Auditeur (en présence d'inspecteur)

**Scénario nominal :**

1. L'utilisateur lance un scénario guidé « Préparation inspection FDA »
2. Le système présente étape par étape : vue étude → sous-traitants → audits → findings → CAPA
3. À chaque étape, les nœuds concernés sont automatiquement mis en évidence
4. L'utilisateur peut exporter des captures d'écran en PNG/SVG

**Critères d'acceptation :** Mode présentation plein écran, navigation étape par étape, export visuel

---

### 3.6 UC-06 : Gestion des alertes

**Objectif :** Identifier et traiter les situations à risque

**Acteur principal :** Manager Qualité

**Scénario nominal :**

1. Le système génère automatiquement une alerte (ex: ST2 critique non évalué)
2. L'alerte apparaît dans le panneau de notifications avec niveau de sévérité
3. L'utilisateur clique sur l'alerte pour visualiser le contexte dans le graphe
4. Il peut acquitter ou résoudre l'alerte après traitement

**Critères d'acceptation :** Alertes générées par règles d'inférence, navigation contextuelle, gestion du statut

---

## 4. Exigences Fonctionnelles

### 4.1 Visualisation du graphe

|ID|Description|Priorité|Source|
|---|---|---|---|
|**EF-VIS-01**|Afficher un graphe interactif avec 16 types de nœuds distincts visuellement (forme, couleur)|P0|Transcription|
|**EF-VIS-02**|Supporter le zoom (molette), le pan (drag) et le fit-to-view automatique|P0|Architecture|
|**EF-VIS-03**|Permettre la sélection d'un nœud avec affichage du panneau de détails|P0|Transcription|
|**EF-VIS-04**|Implémenter le drill-down : double-clic sur un nœud révèle ses connexions directes|P0|Transcription|
|**EF-VIS-05**|Distinguer visuellement les sous-traitants N1 (contractés) et N2 (déclarés)|P0|Transcription|
|**EF-VIS-06**|Afficher le rôle/type de service sur les relations Étude→Sous-traitant|P1|Transcription|
|**EF-VIS-07**|Proposer plusieurs layouts : hiérarchique, radial, force-directed|P1|Architecture|
|**EF-VIS-08**|Exporter le graphe visible en PNG et SVG haute résolution|P1|Transcription|
|**EF-VIS-09**|Maintenir 60 FPS avec 10 000 nœuds et 50 000 relations|P0|Architecture|

### 4.2 Filtrage et recherche

|ID|Description|Priorité|Source|
|---|---|---|---|
|**EF-FIL-01**|Filtrer par type de nœud (multi-sélection possible)|P0|Dataset|
|**EF-FIL-02**|Filtrer par criticité (Critique, Majeur, Standard, Mineur)|P0|Dataset|
|**EF-FIL-03**|Filtrer par statut (Actif, Archivé, En cours, Planifié...)|P1|Dataset|
|**EF-FIL-04**|Filtrer par plage de dates (date de création/événement)|P1|Transcription|
|**EF-FIL-05**|Recherche textuelle dans les noms/descriptions des nœuds|P0|Architecture|
|**EF-FIL-06**|Recherche par identifiant unique (ex: ST-001, AUD-2024-001)|P1|Dataset|

### 4.3 Timeline

|ID|Description|Priorité|Source|
|---|---|---|---|
|**EF-TIM-01**|Afficher les événements datés sur une timeline interactive|P0|Transcription|
|**EF-TIM-02**|Synchronisation bidirectionnelle : sélection timeline ↔ highlight graphe|P0|Transcription|
|**EF-TIM-03**|Zoom temporel multi-échelles : jour, semaine, mois, trimestre, année|P1|Transcription|
|**EF-TIM-04**|Grouper les événements par type (Audits, Inspections, QE, Décisions...)|P1|Dataset|
|**EF-TIM-05**|Afficher les événements avec durée (date début/fin) sous forme de barres|P1|Transcription|
|**EF-TIM-06**|Codage couleur selon la criticité de l'événement|P1|Dataset|

### 4.4 Dashboard KQI

|ID|Description|Priorité|Source|
|---|---|---|---|
|**EF-KQI-01**|Afficher les KQI par sous-traitant sous forme de graphiques d'évolution|P1|Dataset KQI|
|**EF-KQI-02**|Visualiser les seuils d'alerte et d'objectif sur les graphiques|P1|Dataset KQI|
|**EF-KQI-03**|Afficher la tendance (amélioration/dégradation/stable) par indicateur|P1|Dataset KQI|
|**EF-KQI-04**|Permettre la comparaison de KQI entre plusieurs sous-traitants|P2|Architecture|
|**EF-KQI-05**|Générer une alerte automatique si KQI en dégradation 3 périodes consécutives|P1|Transcription|
|**EF-KQI-06**|Exporter les données KQI en CSV|P2|Architecture|

### 4.5 Scénarios guidés

|ID|Description|Priorité|Source|
|---|---|---|---|
|**EF-SCN-01**|Charger des scénarios prédéfinis depuis une configuration JSON|P1|Architecture|
|**EF-SCN-02**|Navigation étape par étape avec boutons Précédent/Suivant|P0|Transcription|
|**EF-SCN-03**|Highlight automatique des nœuds concernés à chaque étape|P0|Transcription|
|**EF-SCN-04**|Centrage automatique de la vue sur les nœuds actifs|P1|Architecture|
|**EF-SCN-05**|Mode présentation plein écran|P1|Transcription|
|**EF-SCN-06**|Permettre la création/modification de scénarios par l'utilisateur|P2|Transcription|

### 4.6 Import de données

|ID|Description|Priorité|Source|
|---|---|---|---|
|**EF-IMP-01**|Importer des nœuds depuis un fichier CSV (structure nodes.csv)|P0|Dataset|
|**EF-IMP-02**|Importer des relations depuis un fichier CSV (structure relations.csv)|P0|Dataset|
|**EF-IMP-03**|Importer des KQI depuis un fichier CSV (structure kqi.csv)|P0|Dataset KQI|
|**EF-IMP-04**|Importer depuis un fichier Excel multi-onglets (.xlsx, .ods)|P1|Transcription|
|**EF-IMP-05**|Valider les données importées avec rapport d'erreurs détaillé|P0|Architecture|
|**EF-IMP-06**|Parser le champ Attributs_JSON pour extraire les propriétés dynamiques|P1|Dataset|

---

## 5. Exigences Non Fonctionnelles

### 5.1 Performance

|ID|Description|Cible|
|---|---|---|
|**ENF-PER-01**|Temps de chargement initial du graphe (10k nœuds)|< 3 secondes|
|**ENF-PER-02**|Fluidité d'interaction (zoom, pan, sélection)|60 FPS constants|
|**ENF-PER-03**|Temps de réponse au filtrage|< 500 ms|
|**ENF-PER-04**|Temps de calcul du layout (10k nœuds)|< 5 secondes|
|**ENF-PER-05**|Temps de démarrage de l'application|< 2 secondes|

### 5.2 Sécurité et confidentialité

|ID|Description|Mesure|
|---|---|---|
|**ENF-SEC-01**|Fonctionnement 100% offline sans connexion internet|Aucune requête externe|
|**ENF-SEC-02**|Stockage local des données uniquement|Base embarquée|
|**ENF-SEC-03**|Pas de télémétrie ni de collecte de données|Audit du code|
|**ENF-SEC-04**|Données persistées de manière sécurisée|Fichier unique chiffrable|

### 5.3 Utilisabilité

|ID|Description|Critère|
|---|---|---|
|**ENF-USA-01**|Interface utilisable sans formation technique préalable|Test utilisateur < 30 min|
|**ENF-USA-02**|Labels et icônes explicites (pas d'icône seule)|100% des actions labellisées|
|**ENF-USA-03**|Messages d'erreur en langage métier (non technique)|Validation UX|
|**ENF-USA-04**|Support des thèmes clair et sombre|Toggle accessible|
|**ENF-USA-05**|Accessibilité WCAG AA (contraste, focus visible)|Ratio contraste ≥ 4.5:1|

### 5.4 Portabilité et déploiement

|ID|Description|Contrainte|
|---|---|---|
|**ENF-POR-01**|Application desktop disponible sur Windows 10/11|Installateur NSIS|
|**ENF-POR-02**|Application desktop disponible sur macOS 12+|Bundle DMG|
|**ENF-POR-03**|Application desktop disponible sur Linux (Ubuntu 22.04+)|AppImage|
|**ENF-POR-04**|Taille du bundle d'installation|< 50 MB|
|**ENF-POR-05**|Aucune dépendance externe à installer|Standalone|

---

## 6. Modèle de Données

### 6.1 Types de nœuds (16 types)

|Type|Code|Description|Propriétés clés|
|---|---|---|---|
|**Sous-Traitant**|N_ST|Prestataire externe (CRO, labo, logistique...)|niveau_actuel, type_service, pays|
|**Contrat**|N_CTR|Accord contractuel avec un sous-traitant|type, montant_annuel, version|
|**Accord Qualité**|N_QA|Quality Agreement régissant les obligations|version, date validité|
|**Audit**|N_AUD|Audit qualité réalisé chez un sous-traitant|type, résultat, score|
|**Inspection**|N_INS|Inspection par une autorité réglementaire|autorité, type, nb_observations|
|**Finding**|N_FND|Écart ou observation issue d'un audit/inspection|type, source, CAPA associé|
|**Événement Qualité**|N_QE|Déviation, incident, événement impactant qualité|étude, impact, nb_échantillons|
|**Décision**|N_DEC|Décision managériale suite à un événement|décideur, nature, durée|
|**Évaluation Risque**|N_EVA|Évaluation périodique du risque sous-traitant|score (Low/Medium/High), critères|
|**Réunion Qualité**|N_QOM|Réunion de suivi qualité (QOM)|trimestre, périodicité, points_clés|
|**Étude Clinique**|N_ETU|Essai clinique en cours ou planifié|phase, indication, nb_patients|
|**Domaine de Service**|N_DOM|Domaine d'activité/compétence d'un sous-traitant|catégorie, complexité|
|**Contexte Réglementaire**|N_CTX|Référence réglementaire applicable|référence, impact|
|**Alerte**|N_ALR|Alerte générée automatiquement par le système|niveau, règle, déclencheur|
|**Événement**|N_EVT|Événement externe (réglementaire, demande client...)|type, source, impact|
|**KQI**|N_KQI|Mesure d'indicateur qualité|valeur, seuil_objectif, seuil_alerte|

### 6.2 Types de relations (18 types)

Les relations du graphe sont typées et peuvent porter des attributs :

|Relation|Source → Cible|Attributs|
|---|---|---|
|**EST_LIE_AU_CONTRAT**|Sous-Traitant → Contrat|date_lien, validité|
|**EST_COUVERT_PAR_QA**|Sous-Traitant → Accord Qualité|date_lien, validité|
|**EST_SOUS_TRAITANT_DE**|Sous-Traitant N2 → Sous-Traitant N1|contexte_etudes[]|
|**A_ETE_AUDITE_PAR**|Sous-Traitant → Audit|date_lien|
|**A_ETE_INSPECTE_PAR**|Sous-Traitant → Inspection|date_lien|
|**GENERE_FINDING**|Audit/Inspection → Finding|date_lien|
|**CONCERNE_ST**|Événement Qualité → Sous-Traitant|date_lien|
|**SURVENU_DANS**|Événement Qualité → Étude|date_lien|
|**IMPLIQUE_ST**|Étude → Sous-Traitant|**niveau** (1 ou 2), **rôle**, **via** (ST N1 pour N2)|
|**EST_JUSTIFIE_PAR**|Décision → Audit/QE/Inspection|date_lien|
|**RESULTE_DE_EVALUATION**|Décision → Évaluation Risque|date_lien|
|**A_POUR_CONTEXTE**|Décision → Contexte Réglementaire|date_lien|
|**POSSEDE_SERVICE**|Sous-Traitant → Domaine de Service|score_evaluation, en_réévaluation|
|**A_FAIT_OBJET_EVALUATION**|Sous-Traitant → Évaluation Risque|date_lien|
|**A_ETE_SUIVI_PAR**|Sous-Traitant → Réunion Qualité|date_lien|
|**DECLENCHE_ALERTE**|QE/Audit → Alerte|date_lien|
|**CAUSE_EVENEMENT**|Contexte Réglementaire → Événement|impact|
|**EVT_CONCERNE_ST**|Événement → Sous-Traitant|impact|

---

## 7. Scénarios de Démonstration

Les scénarios suivants ont été identifiés avec le client pour démontrer les capacités de l'outil lors d'inspections ou de formations.

### Scénario 1 : Préparation inspection par étude

**Contexte :** Une inspection est annoncée pour l'étude CARDIO-PHASE3-2023. Le manager doit démontrer la supervision de tous les sous-traitants impliqués.

**Étapes :**

1. Sélectionner l'étude CARDIO-PHASE3-2023 → Visualiser les 4 sous-traitants N1
2. Étendre pour voir les sous-traitants N2 (ST-006 Omega Sample Storage)
3. Pour chaque ST : afficher timeline des audits, inspections, événements qualité
4. Identifier l'événement critique QE-2024-001 (excursion température)
5. Montrer la chaîne : QE → Décision (audit for cause) → Audit → Findings → CAPA

---

### Scénario 2 : Analyse panoramique sous-traitant

**Contexte :** Le manager souhaite une vue complète de Delta Clinical Logistics suite à sa mise sous surveillance.

**Étapes :**

1. Rechercher « Delta » → Centrer sur ST-004
2. Visualiser : contrat actif, accord qualité en révision, études associées
3. Timeline : QE-2024-001 → DEC-2024-002 → AUD-2024-001 → INS-2024-001
4. Consulter l'évaluation de risque EVA-2024-002 (score High)
5. Montrer la réévaluation en cours EVA-2024-004 (amélioration High→Medium)

---

### Scénario 3 : Évaluation de risque annuelle

**Contexte :** Évaluation périodique d'Alpha Clinical Services passée de Low à Medium.

**Étapes :**

1. Accéder au dashboard KQI → Sélectionner Alpha Clinical
2. Visualiser l'évolution des KQI sur 2023-2024
3. Identifier les critères de passage à Medium : inspection récente, alertes KQI
4. Montrer la décision DEC-2024-005 (renforcement supervision)

---

### Scénario 4 : Détection sous-traitant N2 non déclaré

**Contexte :** L'alerte ALR-2024-003 signale un sous-traitant de niveau 2 critique non évalué.

**Étapes :**

1. Consulter les alertes actives → Cliquer sur ALR-2024-003
2. Naviguer vers ST-008 (Kappa Transport Solutions)
3. Visualiser la chaîne : Kappa → sous-traite pour Delta → études impactées
4. Identifier le finding FND-2024-001-03 (documentation ST2 incomplète)
5. Montrer la décision DEC-2024-003 (évaluation ST2 obligatoire)

---

## 8. Règles d'Inférence

Le moteur d'inférence génère automatiquement des alertes et calcule des scores de risque selon les règles suivantes :

|ID Règle|Nom|Condition|Action|
|---|---|---|---|
|**RGL-001**|Alerte NC Critique|Finding critique non clôturé depuis > 30 jours|Alerte **HAUTE**|
|**RGL-002**|Finding > 90j|Finding (tout niveau) non clôturé depuis > 90 jours|Alerte **MOYENNE**|
|**RGL-003**|ST2 critique non évalué|Sous-traitant N2 avec criticité ≥ Majeur sans évaluation|Alerte **HAUTE**|
|**RGL-004**|KQI dégradation 3P|KQI en dégradation sur 3 périodes consécutives|Alerte **MOYENNE**|
|**RGL-005**|Audit routine retard|Aucun audit réalisé depuis > 18 mois pour ST N1 critique|Alerte **MOYENNE**|
|**RGL-006**|QA non signé|Quality Agreement en statut « En révision » depuis > 60 jours|Alerte **BASSE**|

### 8.1 Calcul du score de risque

Le score de risque d'un sous-traitant N1 est calculé selon les critères suivants (issus de la transcription client) :

|Critère|Seuil|Impact|
|---|---|---|
|Nombre de findings critiques d'audit|> 0|À surveiller|
|Nombre de findings critiques d'inspection|> 0|À surveiller|
|Nombre d'événements qualité critiques|> 0|À surveiller|
|Nombre de domaines de service|Multi-compétences|Risque accru|
|Complexité du domaine|Haute/Très haute|Facteur aggravant|
|Nombre d'alertes KQI actives|> 0|À surveiller|

**Résultat :** Score **Low** / **Medium** / **High** déterminant la fréquence de supervision

---

## 9. Indicateurs Qualité (KQI)

Le jeu de données fourni inclut **264 mesures KQI** réparties sur **4 sous-traitants** et **11 trimestres** (2023-Q1 à 2025-Q3).

### 9.1 KQI opérationnels par sous-traitant

|Sous-traitant|Indicateur|Seuil objectif|Seuil alerte|
|---|---|---|---|
|**Alpha Clinical (CRO)**|Taux conformité documentaire|≥ 95%|< 90%|
|**Alpha Clinical (CRO)**|Délai livraison rapports|≤ 10 jours|> 15 jours|
|**Alpha Clinical (CRO)**|Taux queries résolus J+5|≥ 92%|< 85%|
|**Beta Bioanalytics (Labo)**|Taux conformité méthodes|≥ 98%|< 95%|
|**Beta Bioanalytics (Labo)**|Délai résultats bioanalyse|≤ 18 jours|> 25 jours|
|**Beta Bioanalytics (Labo)**|Taux échantillons valides|≥ 99%|< 98%|
|**Gamma Data (IT/Data)**|Taux erreur saisie CRF|≤ 1.5%|> 3%|
|**Delta Logistics**|Taux livraison à temps|≥ 98%|< 95%|
|**Delta Logistics**|Nb excursions température|= 0|> 0|

### 9.2 KQI critiques (utilisés pour l'évaluation de risque)

|Indicateur|Seuil objectif|Seuil alerte|
|---|---|---|
|Nombre de findings critiques d'inspection|= 0|> 0|
|Nombre de findings critiques d'audit|= 0|> 0|
|Nombre d'événements qualité critiques|= 0|> 0|

---

## 10. Glossaire

|Terme|Définition|
|---|---|
|**CRO**|Contract Research Organization - Organisation sous-traitante pour la gestion des essais cliniques|
|**CAPA**|Corrective And Preventive Action - Action corrective et préventive suite à un écart|
|**Finding**|Écart ou observation identifié lors d'un audit ou d'une inspection|
|**GCP**|Good Clinical Practice - Bonnes Pratiques Cliniques (ICH E6)|
|**ICH E6(R3)**|Dernière version des guidelines GCP renforçant l'oversight des sous-traitants|
|**KQI**|Key Quality Indicator - Indicateur clé de qualité permettant le suivi de performance|
|**N1 / N2**|Niveau de sous-traitance : N1 = contracté directement, N2 = sous-traitant d'un sous-traitant|
|**Oversight**|Surveillance et supervision des activités sous-traitées|
|**QA (Quality Agreement)**|Accord qualité définissant les responsabilités entre le sponsor et le sous-traitant|
|**QE (Quality Event)**|Événement qualité - Déviation, incident ou anomalie impactant la qualité|
|**QOM**|Quality Oversight Meeting - Réunion de suivi qualité périodique avec un sous-traitant|
|**ST**|Sous-Traitant - Prestataire externe réalisant des activités pour le compte du sponsor|

---

_— Fin du document —_

**Document généré le 28 novembre 2025**  
**Version 1.0**