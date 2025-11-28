#!/usr/bin/env python3
"""
KG-Oversight - Transformation CSV vers format Kuzu
Génère des fichiers CSV séparés par type de nœud et de relation
"""

import csv
import json
import os
from datetime import datetime

INPUT_NODES = '/mnt/user-data/uploads/nodes.csv'
INPUT_RELATIONS = '/mnt/user-data/uploads/relations.csv'
INPUT_KQI = '/mnt/user-data/uploads/kqi.csv'
OUTPUT_DIR = '/home/claude/kuzu_data'

# Mapping des types de nœuds vers les noms de fichiers
NODE_TYPE_MAP = {
    'Sous-Traitant': 'SousTraitant',
    'Contrat': 'Contrat',
    'Accord Qualité': 'AccordQualite',
    'Audit': 'Audit',
    'Inspection': 'Inspection',
    'Finding': 'Finding',
    'Événement Qualité': 'EvenementQualite',
    'Décision': 'Decision',
    'Évaluation Risque': 'EvaluationRisque',
    'Réunion Qualité': 'ReunionQualite',
    'Étude Clinique': 'EtudeClinique',
    'Domaine de Service': 'DomaineService',
    'Contexte Réglementaire': 'ContexteReglementaire',
    'Alerte': 'Alerte',
    'Événement': 'Evenement'
}

# Mapping des types de relations vers les noms de fichiers
REL_TYPE_MAP = {
    'EST_LIE_AU_CONTRAT': 'EST_LIE_AU_CONTRAT',
    'EST_COUVERT_PAR_QA': 'EST_COUVERT_PAR_QA',
    'A_VERSION_SUIVANTE': 'A_VERSION_SUIVANTE',
    'EST_SOUS_TRAITANT_DE': 'EST_SOUS_TRAITANT_DE',
    'A_ETE_AUDITE_PAR': 'A_ETE_AUDITE_PAR',
    'A_ETE_INSPECTE_PAR': 'A_ETE_INSPECTE_PAR',
    'GENERE_FINDING': 'GENERE_FINDING',
    'CONCERNE_ST': 'QE_CONCERNE_ST',
    'SURVENU_DANS': 'SURVENU_DANS_ETUDE',
    'EST_JUSTIFIE_PAR': 'DECISION_JUSTIFIEE_PAR',  # Sera subdivisé selon le type cible
    'RESULTE_DE_EVALUATION': 'RESULTE_DE_EVALUATION',
    'A_POUR_CONTEXTE': 'A_POUR_CONTEXTE',
    'POSSEDE_SERVICE': 'POSSEDE_SERVICE',
    'A_FAIT_OBJET_EVALUATION': 'A_FAIT_OBJET_EVALUATION',
    'A_ETE_SUIVI_PAR': 'A_ETE_SUIVI_PAR',
    'DECLENCHE_ALERTE': 'DECLENCHE_ALERTE',
    'CAUSE_EVENEMENT': 'CAUSE_EVENEMENT',
    'IMPLIQUE_ST': 'IMPLIQUE_ST'
}

def parse_json_safe(json_str):
    """Parse JSON en gérant les cas vides ou malformés"""
    if not json_str or json_str == '{}':
        return {}
    try:
        return json.loads(json_str.replace('""', '"'))
    except:
        return {}

def format_date(date_str):
    """Formate une date pour Kuzu (YYYY-MM-DD)"""
    if not date_str:
        return ''
    return date_str

def process_nodes():
    """Traite le fichier nodes.csv et génère un CSV par type"""
    nodes_by_type = {}
    
    with open(INPUT_NODES, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            node_type = row['Type_Noeud']
            if node_type not in nodes_by_type:
                nodes_by_type[node_type] = []
            
            attrs = parse_json_safe(row['Attributs_JSON'])
            
            # Créer l'enregistrement selon le type
            if node_type == 'Sous-Traitant':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_creation': format_date(row['Date_Creation']),
                    'type_service': attrs.get('type_service', ''),
                    'pays': attrs.get('pays', ''),
                    'niveau_actuel': attrs.get('niveau_actuel', 1),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Contrat':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'date_debut': format_date(row['Date_Creation']),
                    'date_fin': format_date(row['Date_Fin']),
                    'type_contrat': attrs.get('type', ''),
                    'montant_annuel': attrs.get('montant_annuel', ''),
                    'version': attrs.get('version', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Accord Qualité':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'date_debut': format_date(row['Date_Creation']),
                    'date_fin': format_date(row['Date_Fin']),
                    'version': attrs.get('version', ''),
                    'revision_en_cours': str(attrs.get('revision_en_cours', False)).lower(),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Audit':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_debut': format_date(row['Date_Creation']),
                    'date_fin': format_date(row['Date_Fin']),
                    'type_audit': attrs.get('type', ''),
                    'resultat': attrs.get('resultat', ''),
                    'declencheur': attrs.get('declencheur', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Inspection':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_debut': format_date(row['Date_Creation']),
                    'date_fin': format_date(row['Date_Fin']),
                    'autorite': attrs.get('autorite', ''),
                    'type_inspection': attrs.get('type', ''),
                    'resultat': attrs.get('resultat', ''),
                    'nb_observations': attrs.get('nb_observations', ''),
                    'nb_critiques': attrs.get('nb_critiques', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Finding':
                record = {
                    'id': row['ID_Noeud'],
                    'description': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_detection': format_date(row['Date_Creation']),
                    'date_cloture': format_date(row['Date_Fin']),
                    'capa_id': attrs.get('capa', ''),
                    'concerne_st2': attrs.get('concerne_st2', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Événement Qualité':
                record = {
                    'id': row['ID_Noeud'],
                    'description': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_creation': format_date(row['Date_Creation']),
                    'date_cloture': format_date(row['Date_Fin']),
                    'impact': attrs.get('impact', ''),
                    'nb_echantillons_impactes': attrs.get('nb_echantillons_impactes', ''),
                    'retard_jours': attrs.get('retard_jours', ''),
                    'nb_erreurs': attrs.get('nb_erreurs', ''),
                    'delai_detection_mois': attrs.get('delai_detection_mois', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Décision':
                record = {
                    'id': row['ID_Noeud'],
                    'description': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_decision': format_date(row['Date_Creation']),
                    'decideur': attrs.get('decideur', ''),
                    'nature': attrs.get('nature', ''),
                    'duree_mois': attrs.get('duree_mois', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Évaluation Risque':
                criteres = attrs.get('criteres', {})
                record = {
                    'id': row['ID_Noeud'],
                    'description': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_evaluation': format_date(row['Date_Creation']),
                    'score': attrs.get('score', ''),
                    'evolution': attrs.get('evolution', ''),
                    'findings_critiques': criteres.get('findings_critiques', ''),
                    'qe_critiques': criteres.get('qe_critiques', ''),
                    'kqi_alertes': criteres.get('kqi_alertes', ''),
                    'inspection_recente': str(criteres.get('inspection_recente', False)).lower(),
                    'audit_for_cause': str(criteres.get('audit_for_cause', False)).lower(),
                    'prochaine_evaluation': attrs.get('prochaine', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Réunion Qualité':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_reunion': format_date(row['Date_Creation']),
                    'trimestre': attrs.get('trimestre', ''),
                    'semestre': attrs.get('semestre', ''),
                    'periodicite': attrs.get('periodicite', ''),
                    'motif': attrs.get('motif', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Étude Clinique':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_debut': format_date(row['Date_Creation']),
                    'date_fin': format_date(row['Date_Fin']),
                    'phase': attrs.get('phase', ''),
                    'indication': attrs.get('indication', ''),
                    'nb_patients': attrs.get('nb_patients', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Domaine de Service':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_creation': format_date(row['Date_Creation']),
                    'categorie': attrs.get('categorie', ''),
                    'complexite': attrs.get('complexite', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Contexte Réglementaire':
                record = {
                    'id': row['ID_Noeud'],
                    'nom': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_application': format_date(row['Date_Creation']),
                    'reference': attrs.get('reference', ''),
                    'impact': attrs.get('impact', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Alerte':
                record = {
                    'id': row['ID_Noeud'],
                    'description': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_creation': format_date(row['Date_Creation']),
                    'date_resolution': format_date(row['Date_Fin']),
                    'niveau': attrs.get('niveau', ''),
                    'regle_id': attrs.get('regle', ''),
                    'declencheur': attrs.get('declencheur', ''),
                    'st_concerne': attrs.get('st_concerne', ''),
                    'source_donnees': row['Source_Donnees']
                }
            elif node_type == 'Événement':
                record = {
                    'id': row['ID_Noeud'],
                    'description': row['Nom_Description'],
                    'statut': row['Statut'],
                    'criticite': row['Criticite'] if row['Criticite'] != '-' else '',
                    'date_creation': format_date(row['Date_Creation']),
                    'date_cloture': format_date(row['Date_Fin']),
                    'type_evenement': attrs.get('type', ''),
                    'source': attrs.get('source', attrs.get('demandeur', attrs.get('client', ''))),
                    'impact': attrs.get('impact', attrs.get('contexte', '')),
                    'source_donnees': row['Source_Donnees']
                }
            else:
                print(f"Type inconnu: {node_type}")
                continue
            
            nodes_by_type[node_type].append(record)
    
    # Écrire les fichiers CSV
    for node_type, records in nodes_by_type.items():
        if not records:
            continue
        
        filename = NODE_TYPE_MAP.get(node_type, node_type.replace(' ', ''))
        filepath = os.path.join(OUTPUT_DIR, 'nodes', f'{filename}.csv')
        
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=records[0].keys())
            writer.writeheader()
            writer.writerows(records)
        
        print(f"✓ {filepath} ({len(records)} enregistrements)")

def process_relations():
    """Traite le fichier relations.csv et génère un CSV par type"""
    relations_by_type = {}
    
    with open(INPUT_RELATIONS, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rel_type = row['Type_Relation']
            source_type = row['Type_Noeud_Source']
            target_type = row['Type_Noeud_Cible']
            
            # Clé unique pour le type de relation (inclut source et cible pour les relations polymorphes)
            if rel_type == 'EST_JUSTIFIE_PAR':
                if target_type == 'Audit':
                    rel_key = 'DECISION_JUSTIFIEE_PAR_AUDIT'
                elif target_type == 'Événement Qualité':
                    rel_key = 'DECISION_JUSTIFIEE_PAR_QE'
                elif target_type == 'Inspection':
                    rel_key = 'DECISION_JUSTIFIEE_PAR_INSPECTION'
                elif target_type == 'Finding':
                    rel_key = 'DECISION_JUSTIFIEE_PAR_FINDING'
                else:
                    rel_key = f'DECISION_JUSTIFIEE_PAR_{target_type}'
            elif rel_type == 'GENERE_FINDING':
                if source_type == 'Inspection':
                    rel_key = 'INSPECTION_GENERE_FINDING'
                else:
                    rel_key = 'GENERE_FINDING'
            elif rel_type == 'DECLENCHE_ALERTE':
                if source_type == 'Événement Qualité':
                    rel_key = 'QE_DECLENCHE_ALERTE'
                else:
                    rel_key = 'AUDIT_DECLENCHE_ALERTE'
            elif rel_type == 'CONCERNE_ST':
                if source_type == 'Événement Qualité':
                    rel_key = 'QE_CONCERNE_ST'
                else:
                    rel_key = 'EVT_CONCERNE_ST'
            elif rel_type == 'A_VERSION_SUIVANTE':
                if source_type == 'Accord Qualité':
                    rel_key = 'QA_A_VERSION_SUIVANTE'
                else:
                    rel_key = 'A_VERSION_SUIVANTE'
            else:
                rel_key = REL_TYPE_MAP.get(rel_type, rel_type)
            
            if rel_key not in relations_by_type:
                relations_by_type[rel_key] = []
            
            attrs = parse_json_safe(row['Attributs'])
            
            record = {
                'from': row['Noeud_Source'],
                'to': row['Noeud_Cible'],
                'date_lien': format_date(row['Date_Lien']),
                'validite': row.get('Validite', 'Active')
            }
            
            # Ajouter les attributs spécifiques selon le type
            if rel_key == 'EST_SOUS_TRAITANT_DE':
                record['contexte_etudes'] = json.dumps(attrs.get('contexte_etudes', []))
            elif rel_key == 'POSSEDE_SERVICE':
                record['score_evaluation'] = attrs.get('score_evaluation', '')
                record['en_reevaluation'] = str(attrs.get('en_reevaluation', False)).lower()
            elif rel_key == 'IMPLIQUE_ST':
                record['niveau'] = attrs.get('niveau', 1)
                record['role'] = attrs.get('role', '')
                record['via'] = attrs.get('via', '')
            elif rel_key in ['CAUSE_EVENEMENT', 'EVT_CONCERNE_ST']:
                record['impact'] = attrs.get('impact', '')
            
            relations_by_type[rel_key].append(record)
    
    # Écrire les fichiers CSV
    for rel_type, records in relations_by_type.items():
        if not records:
            continue
        
        filepath = os.path.join(OUTPUT_DIR, 'relations', f'{rel_type}.csv')
        
        # Déterminer les colonnes à partir du premier enregistrement
        fieldnames = list(records[0].keys())
        
        with open(filepath, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for record in records:
                # S'assurer que toutes les colonnes sont présentes
                for field in fieldnames:
                    if field not in record:
                        record[field] = ''
                writer.writerow(record)
        
        print(f"✓ {filepath} ({len(records)} enregistrements)")

def process_kqi():
    """Traite le fichier kqi.csv (déjà bien structuré, juste renommer les colonnes)"""
    records = []
    
    with open(INPUT_KQI, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            record = {
                'id': row['ID_KQI'],
                'sous_traitant_id': row['ID_SousTraitant'],
                'sous_traitant_nom': row['Nom_SousTraitant'],
                'indicateur': row['Indicateur'],
                'periode': row['Periode'],
                'valeur': row['Valeur'],
                'seuil_alerte': row['Seuil_Alerte'],
                'seuil_objectif': row['Seuil_Objectif'],
                'statut': row['Statut'],
                'tendance': row['Tendance']
            }
            records.append(record)
    
    filepath = os.path.join(OUTPUT_DIR, 'nodes', 'KQI.csv')
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)
    
    print(f"✓ {filepath} ({len(records)} enregistrements)")
    
    # Créer les relations KQI → SousTraitant
    rel_records = []
    seen = set()
    for row in records:
        key = (row['sous_traitant_id'], row['id'])
        if key not in seen:
            seen.add(key)
            rel_records.append({
                'from': row['id'],
                'to': row['sous_traitant_id'],
                'periode': row['periode']
            })
    
    filepath = os.path.join(OUTPUT_DIR, 'relations', 'KQI_MESURE_ST.csv')
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['from', 'to', 'periode'])
        writer.writeheader()
        writer.writerows(rel_records)
    
    print(f"✓ {filepath} ({len(rel_records)} enregistrements)")

def generate_import_script():
    """Génère le script d'import Kuzu"""
    script = '''-- ============================================================================
-- SCRIPT D'IMPORT KUZU
-- Exécuter après avoir créé le schéma (schema.cypher)
-- ============================================================================

-- Import des nœuds
COPY SousTraitant FROM "nodes/SousTraitant.csv" (HEADER=true);
COPY Contrat FROM "nodes/Contrat.csv" (HEADER=true);
COPY AccordQualite FROM "nodes/AccordQualite.csv" (HEADER=true);
COPY Audit FROM "nodes/Audit.csv" (HEADER=true);
COPY Inspection FROM "nodes/Inspection.csv" (HEADER=true);
COPY Finding FROM "nodes/Finding.csv" (HEADER=true);
COPY EvenementQualite FROM "nodes/EvenementQualite.csv" (HEADER=true);
COPY Decision FROM "nodes/Decision.csv" (HEADER=true);
COPY EvaluationRisque FROM "nodes/EvaluationRisque.csv" (HEADER=true);
COPY ReunionQualite FROM "nodes/ReunionQualite.csv" (HEADER=true);
COPY EtudeClinique FROM "nodes/EtudeClinique.csv" (HEADER=true);
COPY DomaineService FROM "nodes/DomaineService.csv" (HEADER=true);
COPY ContexteReglementaire FROM "nodes/ContexteReglementaire.csv" (HEADER=true);
COPY Alerte FROM "nodes/Alerte.csv" (HEADER=true);
COPY Evenement FROM "nodes/Evenement.csv" (HEADER=true);

-- Import des relations
COPY EST_LIE_AU_CONTRAT FROM "relations/EST_LIE_AU_CONTRAT.csv" (HEADER=true);
COPY EST_COUVERT_PAR_QA FROM "relations/EST_COUVERT_PAR_QA.csv" (HEADER=true);
COPY A_VERSION_SUIVANTE FROM "relations/A_VERSION_SUIVANTE.csv" (HEADER=true);
COPY QA_A_VERSION_SUIVANTE FROM "relations/QA_A_VERSION_SUIVANTE.csv" (HEADER=true);
COPY EST_SOUS_TRAITANT_DE FROM "relations/EST_SOUS_TRAITANT_DE.csv" (HEADER=true);
COPY A_ETE_AUDITE_PAR FROM "relations/A_ETE_AUDITE_PAR.csv" (HEADER=true);
COPY A_ETE_INSPECTE_PAR FROM "relations/A_ETE_INSPECTE_PAR.csv" (HEADER=true);
COPY GENERE_FINDING FROM "relations/GENERE_FINDING.csv" (HEADER=true);
COPY INSPECTION_GENERE_FINDING FROM "relations/INSPECTION_GENERE_FINDING.csv" (HEADER=true);
COPY QE_CONCERNE_ST FROM "relations/QE_CONCERNE_ST.csv" (HEADER=true);
COPY SURVENU_DANS_ETUDE FROM "relations/SURVENU_DANS_ETUDE.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_AUDIT FROM "relations/DECISION_JUSTIFIEE_PAR_AUDIT.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_QE FROM "relations/DECISION_JUSTIFIEE_PAR_QE.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_INSPECTION FROM "relations/DECISION_JUSTIFIEE_PAR_INSPECTION.csv" (HEADER=true);
COPY DECISION_JUSTIFIEE_PAR_FINDING FROM "relations/DECISION_JUSTIFIEE_PAR_FINDING.csv" (HEADER=true);
COPY RESULTE_DE_EVALUATION FROM "relations/RESULTE_DE_EVALUATION.csv" (HEADER=true);
COPY A_POUR_CONTEXTE FROM "relations/A_POUR_CONTEXTE.csv" (HEADER=true);
COPY POSSEDE_SERVICE FROM "relations/POSSEDE_SERVICE.csv" (HEADER=true);
COPY A_FAIT_OBJET_EVALUATION FROM "relations/A_FAIT_OBJET_EVALUATION.csv" (HEADER=true);
COPY A_ETE_SUIVI_PAR FROM "relations/A_ETE_SUIVI_PAR.csv" (HEADER=true);
COPY QE_DECLENCHE_ALERTE FROM "relations/QE_DECLENCHE_ALERTE.csv" (HEADER=true);
COPY AUDIT_DECLENCHE_ALERTE FROM "relations/AUDIT_DECLENCHE_ALERTE.csv" (HEADER=true);
COPY CAUSE_EVENEMENT FROM "relations/CAUSE_EVENEMENT.csv" (HEADER=true);
COPY EVT_CONCERNE_ST FROM "relations/EVT_CONCERNE_ST.csv" (HEADER=true);
COPY IMPLIQUE_ST FROM "relations/IMPLIQUE_ST.csv" (HEADER=true);
'''
    
    filepath = os.path.join(OUTPUT_DIR, 'import.cypher')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(script)
    
    print(f"✓ {filepath}")

def main():
    print("=" * 60)
    print("KG-Oversight - Transformation vers format Kuzu")
    print("=" * 60)
    
    os.makedirs(os.path.join(OUTPUT_DIR, 'nodes'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'relations'), exist_ok=True)
    
    print("\n📦 Traitement des nœuds...")
    process_nodes()
    
    print("\n🔗 Traitement des relations...")
    process_relations()
    
    print("\n📊 Traitement des KQI...")
    process_kqi()
    
    print("\n📝 Génération du script d'import...")
    generate_import_script()
    
    print("\n" + "=" * 60)
    print("✅ Transformation terminée !")
    print(f"   Fichiers générés dans : {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == '__main__':
    main()
