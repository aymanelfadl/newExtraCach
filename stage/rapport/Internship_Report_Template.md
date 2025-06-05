<div class="toc-md">

# Table des matières

1. [Remerciements](#remerciements)
2. [Résumé](#résumé)
3. [Figures](#figures)
4. [Introduction](#introduction)
5. [Présentation de l’entreprise / du stage](#)
   - [Présentation de l’entreprise](#présentation-de-lentreprise)
   - [Organisation interne](#organisation-interne)
   - [Objectifs du stage](#objectifs-du-stage)
6. [Contexte et objectifs du projet](#contexte-et-objectifs-du-projet)
7. [Environnement technique](#)
   - [Stack technologique](#1-stack-technologique)
   - [Structure du code](#2-structure-du-code)
   - [Fonctionnalités techniques avancées](#3-fonctionnalités-techniques-avancées)
   - [Outils de développement et de gestion](#4-outils-de-développement-et-de-gestion)
8. [Développement du projet](#)
   - [Conception](#conception)
     - [Analyse du besoin et problématique](#1-analyse-du-besoin-et-problématique)
     - [Analyse fonctionnelle](#2-analyse-fonctionnelle)
     - [Exigences non fonctionnelles](#3-exigences-non-fonctionnelles)
     - [Diagramme de cas d’utilisation](#4-diagramme-de-cas-dutilisation)
     - [Diagrammes de séquence](#5-diagrammes-de-séquence)
     - [Diagramme de classes](#6-diagramme-de-classes)
     - [Diagramme de composants](#7-diagramme-de-composants)
   - [Implémentation](#implémentation)
     - [Authentification](#1-authentification)
     - [Accueil & Dashboard](#2-accueil--dashboard)
     - [Gestion des employés](#3-gestion-des-employés)
     - [Dépenses & Revenus](#4-dépenses--revenus)
     - [Paramètres, partage, export et archivage](#5-paramètres-partage-export-et-archivage)
     - [Modales et vues avancées](#6-modales-et-vues-avancées)
9. [Conclusion générale](#conclusion-générale)
10. [Bibliographie et références techniques](#bibliographie-et-références-techniques)

</div>

<div style="page-break-after: always;"></div>

## Remerciements
<div style="text-align: justify;">


Je souhaite exprimer ma profonde gratitude à l’ensemble de l’équipe d’**ExtraSys Maroc** pour l’accueil chaleureux, la bienveillance et l’esprit d’équipe dont ils ont fait preuve tout au long de mon stage. Je remercie tout particulièrement **M. Azize DAHRAOUI**, mon encadrant professionnel, pour sa disponibilité, ses conseils avisés et son accompagnement constant. Son expertise et sa pédagogie m’ont permis de progresser rapidement, de surmonter les difficultés rencontrées et d’acquérir de nouvelles compétences techniques et humaines.

Je tiens également à remercier **M. EL OGRI OMAR**, mon superviseur académique à l’École Supérieure de **Technologie de Sidi Bennour**, pour son suivi rigoureux, ses recommandations constructives et son soutien tout au long de cette expérience. Sa confiance et ses encouragements ont été déterminants dans la réussite de ce stage.

Je n’oublie pas de remercier l’ensemble des collaborateurs d’ExtraSys Maroc pour leur disponibilité, leur esprit d’entraide et leur partage de connaissances. Leur implication et leur professionnalisme ont contribué à créer un environnement de travail stimulant et enrichissant, propice à l’apprentissage et à l’épanouissement personnel.

Enfin, j’adresse mes remerciements à ma famille et à mes amis pour leur soutien moral et leurs encouragements constants, qui m’ont permis d’aborder ce stage avec sérénité et motivation.
</div>
<div style="page-break-after: always;"></div>

## Résumé
<div style="text-align: justify;">

Ce rapport retrace l’ensemble des travaux réalisés lors de mon stage de fin d’études au sein d’ExtraSys Maroc, du **01 avril** au **01 juin 2025**. L’objectif principal de ce stage était de participer activement à la conception et au développement d’une application mobile interne, *ExtraCash*, destinée à optimiser la gestion de trésorerie des petites et moyennes entreprises.

Au cours de cette expérience, j’ai eu l’opportunité de m’impliquer dans toutes les phases du projet, de l’analyse des besoins à la mise en production, en passant par la conception technique, le développement et les tests. J’ai pu mettre en pratique mes connaissances en développement mobile avec React Native et Firebase, approfondir mes compétences en gestion de projet agile (méthodologie Scrum), et découvrir les enjeux liés à la sécurité et à la fiabilité des solutions informatiques en entreprise.

L’application ExtraCash propose des fonctionnalités innovantes telles que la gestion des employés, l’enregistrement sécurisé des transactions, la visualisation dynamique de statistiques financières et un mode hors ligne pour garantir la continuité du service. Ce projet m’a permis de développer mon autonomie, mon sens de l’organisation et ma capacité à travailler en équipe dans un contexte professionnel exigeant.

Ce stage a constitué une expérience formatrice et déterminante pour mon parcours, en me permettant de consolider mes acquis, d’élargir mon champ de compétences et de m’ouvrir à de nouvelles perspectives professionnelles dans le domaine des technologies de l’information.
</div>
<div style="page-break-after: always;"></div>

## Figures
| Index | Description                                         | Emplacement dans le rapport         |
|-------|-----------------------------------------------------|-------------------------------------|
| 1     | Logo de l'entreprise ExtraSys Maroc                 | Présentation de l’entreprise        |
| 2     | Logo de React Native                                | Stack technologique                 |
| 3     | Logo de Firebase                                    | Stack technologique                 |
| 4     | Logo de JavaScript                                  | Stack technologique                 |
| 5     | Logo d’Expo                                         | Stack technologique                 |
| 6     | Logo de Git                                         | Stack technologique                 |
| 7     | Logo de npm                                         | Stack technologique                 |
| 8     | Logo de Visual Studio Code                          | Stack technologique                 |
| 9     | Diagramme de cas d’utilisation                      | Conception                          |
| 10    | Diagramme de séquence – Ajout d’un employé          | Conception                          |
| 11    | Diagramme de séquence – Ajout d’une dépense         | Conception                          |
| 12    | Diagramme de séquence – Ajout d’un revenu           | Conception                          |
| 13    | Diagramme de séquence – Paiement d’un employé       | Conception                          |
| 14    | Diagramme de séquence – Partage d’accès             | Conception                          |
| 15    | Diagramme de séquence – Authentification            | Conception                          |
| 16    | Diagramme de séquence – Exportation des données     | Conception                          |
| 17    | Diagramme de séquence – Filtrage des données        | Conception                          |
| 18    | Diagramme de séquence – Visualisation du dashboard  | Conception                          |
| 19    | Diagramme de classes                                | Conception                          |
| 20    | Diagramme de composants                             | Conception                          |
| 21    | Écran de connexion               | Implémentation - Authentification   |
| 22    | Écran d’inscription               | Implémentation - Authentification   |
| 23    | Accueil / Home | Implémentation - Accueil            |
| 24    | Tableau de bord | Implémentation - Dashboard          |
| 25    | Liste des employés | Implémentation - Gestion des employés|
| 26    | Ajout d'un employé | Implémentation - Gestion des employés|
| 27    | Liste des paiements à un employé | Implémentation - Gestion des employés|
| 28    | Paiement d'employé | Implémentation - Gestion des employés|
| 29    | Filtre des paiements | Implémentation - Gestion des employés|
| 30    | Liste des dépenses | Implémentation - Dépenses           |
| 31    | Ajout d'une dépense | Implémentation - Dépenses           |
| 32    | Recherche de dépense | Implémentation - Dépenses           |
| 33    | Filtre de dépense par mois | Implémentation - Dépenses           |
| 34    | Suppression/Modification | Implémentation - Dépenses/Revenus   |
| 35    | Liste des revenus | Implémentation - Revenus            |
| 36    | Ajout d'un revenu | Implémentation - Revenus            |
| 37    | Paramètres | Implémentation - Paramètres         |
| 38    | Ajout d'utilisateur partagé | Implémentation - Partage            |
| 39    | Export Excel | Implémentation - Export             |
| 40    | Archivage | Implémentation - Archivage          |
| 41    | Consultation des archives | Implémentation - Archivage          |
| 42    | Filtre par date | Implémentation - Modales/Avancées   |
| 43    | Modal action limitée viewer | Implémentation - Modales/Avancées   |
| 44    | Vue mobile | Implémentation - Modales/Avancées   |
| 45    | Mode viewer Accueil | Implémentation - Vues Viewer        |
| 46    | Mode viewer Dépenses | Implémentation - Vues Viewer        |
| 47    | Mode viewer Revenus | Implémentation - Vues Viewer        |

<div style="page-break-after: always;"></div>

## Introduction
<div style="text-align: justify;">

Dans le cadre de ma formation en *Ingénierie des Systèmes Informatiques et Technologies Web à l’École Supérieure de Technologie de Sidi Bennour*, j’ai eu l’opportunité d’effectuer un stage pratique au sein de l’entreprise **ExtraSys Maroc**, à Casablanca, du 01 avril au 01 juin 2025. Ce stage avait pour objectif principal de me permettre d’appliquer les connaissances acquises durant mon cursus universitaire à un projet concret en entreprise.

L’intégration dans le monde professionnel à travers ce stage a constitué une étape essentielle dans mon parcours académique. Elle m’a permis de découvrir le fonctionnement interne d’une entreprise spécialisée dans les solutions informatiques et la sécurité, d’appréhender les exigences du secteur, et de développer des compétences transversales telles que la gestion du temps, la communication professionnelle et le travail en équipe. Ce stage a également été l’occasion de confronter la théorie à la pratique, d’adopter une démarche de résolution de problèmes et d’acquérir une vision globale du cycle de vie d’un projet informatique.

L’objectif de ce rapport est de présenter le déroulement de ce stage, le contexte de l’entreprise d’accueil, la problématique abordée, ainsi que les différentes étapes de conception et de développement de l’application mobile ExtraCash. Ce document mettra également en avant les compétences techniques et professionnelles développées au cours de cette expérience, ainsi que les enseignements tirés de l’immersion dans le monde professionnel. Enfin, il proposera une réflexion sur les apports de ce stage pour la suite de mon parcours et les perspectives d’évolution dans le domaine des technologies de l’information.
</div>
<div style="page-break-after: always;"></div>

## Présentation de l'entreprise / du stage

<div style="text-align: justify;">
Mon stage s’est déroulé du 01 avril au 01 juin 2025 au sein de l'entreprise ExtraSys Maroc, située à Casablanca. Cette expérience s’inscrit dans le cadre de ma formation en Ingénierie des Systèmes Informatiques et Technologies Web à l’École Supérieure de Technologie de Sidi Bennour.
</div>

### Présentation de l’entreprise
<div style="text-align: center;">
  <img src="images/logo-extrasys-maroc.png" alt="Logo ExtraSys Maroc" style="width:300px; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 1 : Logo de l'entreprise ExtraSys Maroc</div>
</div>
<div style="text-align: justify;">

ExtraSys Maroc est une entreprise marocaine spécialisée dans les technologies de sécurité et les solutions informatiques. 

Elle propose une large gamme de services adaptés à différents secteurs professionnels :

- **Vidéosurveillance** : installation de caméras HD, caméras IP, systèmes NVR et XVR
- **Contrôle d’accès** : pointeuses biométriques, lecteurs de cartes
- **Systèmes d’alarme et sécurité incendie** : détection de fumée, alerte intrusion/incendie
- **Réseaux informatiques** : câblage, configuration de serveurs et équipements réseau
- **Domotique et automatisation** : gestion intelligente des bâtiments, éclairage automatique, volets roulants connectés
- **Téléphonie IP et analogique** : solutions de communication modernes

L’entreprise collabore avec des marques internationales reconnues telles que Hikvision, Dahua, TP-Link, ZKTeco, Sonoff, etc. 

Elle fournit des solutions pour la santé, l’éducation, le BTP, le secteur bancaire et les administrations publiques.
</div>

### Organisation interne
<div style="text-align: justify;">

ExtraSys Maroc est structurée autour de plusieurs pôles principaux :

- **Pôle technique** : installation, configuration et maintenance des systèmes.
- **Pôle informatique** : développement d’applications web et mobiles, gestion des bases de données, veille technologique.
- **Service commercial** : relation client, devis, négociations, suivi des ventes.
- **Service administratif** : gestion RH, finances, logistique.

J’ai été intégré principalement au pôle informatique, au sein de l’équipe de développement, tout en collaborant ponctuellement avec les autres départements. 

Cela m’a permis d’avoir une vision globale du fonctionnement de l’entreprise et de mieux comprendre les interactions entre les services.

</div>

### Objectifs du stage
<div style="text-align: justify;">

L’objectif principal de mon stage était de participer à la conception et au développement d’une application mobile interne nommée ExtraCash, destinée à aider les petites et moyennes entreprises à gérer leur trésorerie de manière efficace, intuitive et sécurisée.

J’ai été encadré par un développeur expérimenté et impliqué dans toutes les phases du projet, de l’analyse des besoins à la démonstration finale, en découvrant les méthodes agiles, la planification en sprints et l’importance de la communication au sein d’une équipe technique.

Ce stage m’a permis de développer mes compétences techniques, de gagner en autonomie et de vivre une première expérience concrète dans le domaine du développement mobile professionnel.
</div>
<div style="page-break-after: always;"></div>

## Contexte et objectifs du projet

<div style="text-align: justify;">

Le projet ExtraCash s’inscrit dans le contexte de la digitalisation de la gestion financière pour les petites et moyennes entreprises (PME). 

De nombreuses PME rencontrent des difficultés à suivre efficacement leurs flux de trésorerie, à gérer les dépenses et les revenus, et à assurer un suivi rigoureux des opérations, surtout lorsqu’elles ne disposent pas d’outils adaptés ou accessibles.

L’objectif principal de ce projet est de concevoir et développer une application mobile moderne permettant :

- La gestion des employés et de leurs paiements.
- L’enregistrement et le suivi des transactions (dépenses et revenus).
- La visualisation de statistiques financières sous forme de graphiques.
- L’exportation des données pour analyse ou archivage.
- L’accès multi-utilisateur avec gestion des droits et partage de comptes.
- Le fonctionnement en mode hors-ligne pour garantir l’accessibilité même sans connexion Internet.

L’architecture de l’application repose sur React Native pour l’interface utilisateur, et Firebase pour l’authentification, la base de données et le stockage.

Le code source est organisé de façon modulaire, avec des services dédiés à la gestion des utilisateurs, des employés et des transactions. L’application met l’accent sur la sécurité, la simplicité d’utilisation et la fiabilité des données.

Ce projet vise ainsi à offrir aux PME un outil intuitif, sécurisé et performant pour optimiser la gestion de leur trésorerie et faciliter la prise de décision au quotidien.
</div>
<div style="page-break-after: always;"></div>

## Environnement technique

<div style="text-align: justify;">
L’application ExtraCash repose sur une architecture moderne et modulaire, adaptée aux besoins des PME en matière de gestion financière. Voici une description détaillée de l’environnement technique :
</div>

### 1. Stack technologique
<div style="text-align: justify;">

- **React Native** : Framework principal pour le développement de l’application mobile multiplateforme (Android/iOS).
  <div style="text-align: center;">
    <img src="images/logo-react-native.png" alt="Logo React Native" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 2 : Logo de React Native</div>
  </div>
- **Firebase** : Utilisé pour l’authentification (Firebase Auth), la base de données temps réel (Firestore), et le stockage des fichiers (Firebase Storage).
  <div style="text-align: center;">
    <img src="images/logo-firebase.png" alt="Logo Firebase" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 3 : Logo de Firebase</div>
  </div>
- **JavaScript/JSX** : Langage principal pour le développement des composants, services et interfaces.
  <div style="text-align: center;">
    <img src="images/logo-javascript.png" alt="Logo JavaScript" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 4 : Logo de JavaScript</div>
  </div>
- **Expo** : Outil facilitant le développement, le test et le déploiement de l’application React Native.
  <div style="text-align: center;">
    <img src="images/logo-expo.png" alt="Logo Expo" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 5 : Logo d’Expo</div>
  </div>
- **Git** : Gestion du versionement du code source.
  <div style="text-align: center;">
    <img src="images/logo-git.png" alt="Logo Git" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 6 : Logo de Git</div>
  </div>
- **npm/yarn** : Gestion des dépendances et scripts de build.
  <div style="text-align: center;">
    <img src="images/logo-npm.png" alt="Logo npm" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 7 : Logo de npm</div>
  </div>
- **VS Code** : Environnement de développement principal.
  <div style="text-align: center;">
    <img src="images/logo-vscode.png" alt="Logo VS Code" style="width:100px; height:auto;"/>
    <div style="font-size: 0.8em; color: #555;">Figure 8 : Logo de Visual Studio Code</div>
  </div>
- **Outils Firebase Console** : Administration des utilisateurs, des bases de données et du stockage.
</div>

### 2. Structure du code
<div style="text-align: justify;">

- **app/screens/** : Contient les écrans principaux (Accueil, Employés, Dépenses, Revenus, Paramètres, etc.).
- **components/** : Composants réutilisables (formulaires, boutons, listes, etc.).
- **services/** : Logique métier et accès aux données (authentification, transactions, employés, utilisateurs).
- **context/** : Gestion du contexte utilisateur et du partage d’état global.
- **styles/** : Thèmes, couleurs et styles globaux de l’application.
- **assets/images/** : Ressources graphiques (logo, icônes, etc.).
</div>

### 3. Fonctionnalités techniques avancées
<div style="text-align: justify;">

- **Authentification sécurisée** : Gestion des comptes utilisateurs, connexion, inscription, partage d’accès, et déconnexion via Firebase Auth.
- **Gestion hors-ligne** : Utilisation d’AsyncStorage pour permettre l’ajout, la modification et la synchronisation des données même sans connexion Internet.
- **Synchronisation et archivage** : Synchronisation automatique des transactions et employés dès le retour de la connexion, possibilité d’archiver les anciennes données.
- **Exportation des données** : Fonctionnalité d’export vers Excel pour l’analyse ou la sauvegarde externe.
- **Visualisation des statistiques** : Affichage de graphiques et de tableaux de bord pour le suivi des finances.
- **Sécurité et intégrité des données** : Contrôles d’accès, gestion des droits utilisateurs, et vérification de la cohérence des données lors des opérations critiques.
</div>

### 4. Outils de développement et de gestion
<div style="text-align: justify;">

- **Git** : Gestion du versionement du code source.
- **VS Code** : Environnement de développement principal.
- **npm/yarn** : Gestion des dépendances et scripts de build.
- **Outils Firebase Console** : Administration des utilisateurs, des bases de données et du stockage.
</div>
<div style="page-break-after: always;"></div>

## Développement du projet
### Conception

<div style="text-align: justify;">

#### 1. Analyse du besoin et problématique

La gestion de trésorerie représente un enjeu majeur pour les petites et moyennes entreprises (PME), qui manquent souvent d’outils adaptés pour suivre efficacement leurs flux financiers, anticiper les besoins de liquidités et sécuriser les opérations.

L’objectif du projet ExtraCash est de répondre à cette problématique en proposant une application mobile intuitive, sécurisée et accessible, permettant de centraliser la gestion des employés, des transactions et des statistiques financières.

#### 2. Analyse fonctionnelle

Les exigences fonctionnelles du projet ont été définies à partir des besoins exprimés par les utilisateurs cibles (gérants de PME, comptables, employés). Les principales fonctionnalités attendues sont :

- Gestion des employés (ajout, modification, suppression, consultation)
- Enregistrement et suivi des transactions (dépenses, revenus)
- Visualisation de statistiques financières (graphiques, tableaux de bord)
- Exportation des données
- Gestion multi-utilisateur et partage d’accès
- Fonctionnement hors-ligne

#### 3. Exigences non fonctionnelles

Le projet doit également répondre à des exigences non fonctionnelles :

- Sécurité des données (authentification, contrôle d’accès, chiffrement)
- Simplicité et ergonomie de l’interface
- Performance et réactivité de l’application
- Fiabilité et intégrité des données
- Compatibilité multiplateforme (Android/iOS)

#### 4. Diagramme de cas d’utilisation

Le diagramme de cas d’utilisation ci-dessous synthétise les interactions principales entre les utilisateurs et le système :

<div style="text-align: center;">
  <img src="../diagrams/use_case" alt="Diagramme de cas d’utilisation" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure : Diagramme de cas d’utilisation de l’application ExtraCash</div>
</div>

#### 5. Diagrammes de séquence

Les diagrammes de séquence suivants illustrent en détail les scénarios clés de l’application ExtraCash. Chaque diagramme met en lumière les interactions entre l’utilisateur, l’interface mobile, et les services backend (Firebase), garantissant la cohérence, la sécurité et la fluidité des processus métier. Voici une explication détaillée de chaque scénario, accompagnée de la figure correspondante :

<div style="text-align: center;">
  <img src="../diagrams/Sequence_Add_Employee.png" alt="Diagramme de séquence - Ajout d’un employé" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 10 : Diagramme de séquence – Ajout d’un employé</div>
</div>
Ajout d’un employé : Ce diagramme montre comment un utilisateur peut ajouter un nouvel employé via l’interface mobile. L’action déclenche une requête vers le service backend qui vérifie la validité des données, enregistre l’employé dans la base de données et met à jour la liste affichée à l’utilisateur.

<div style="text-align: center;">
  <img src="../diagrams/add_expense.png" alt="Diagramme de séquence - Ajout d’une dépense" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 11 : Diagramme de séquence – Ajout d’une dépense</div>
</div>
Ajout d’une dépense : L’utilisateur saisit une nouvelle dépense, qui est validée localement puis envoyée à Firebase. Le système assure la synchronisation et la mise à jour des soldes en temps réel.

<div style="text-align: center;">
  <img src="../diagrams/add_revenue.png" alt="Diagramme de séquence - Ajout d’un revenu" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 12 : Diagramme de séquence – Ajout d’un revenu</div>
</div>
Ajout d’un revenu : Similaire à l’ajout d’une dépense, ce scénario permet d’enregistrer une entrée de revenu, avec les mêmes garanties de validation et de synchronisation.

<div style="text-align: center;">
  <img src="../diagrams/add_payment_emp.png" alt="Diagramme de séquence - Paiement d’un employé" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 13 : Diagramme de séquence – Paiement d’un employé</div>
</div>
Paiement d’un employé : Ce diagramme détaille le processus de paiement d’un employé, incluant la vérification des droits d’accès, la création d’une transaction et la notification de l’employé concerné.

<div style="text-align: center;">
  <img src="../diagrams/share_access.png" alt="Diagramme de séquence - Partage d’accès" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 14 : Diagramme de séquence – Partage d’accès à un autre utilisateur</div>
</div>
Partage d’accès : L’utilisateur principal peut inviter un autre utilisateur à accéder à l’application. Le diagramme illustre la génération d’une invitation, la gestion des droits et l’acceptation du partage.

<div style="text-align: center;">
  <img src="../diagrams/login_register.png" alt="Diagramme de séquence - Authentification" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 15 : Diagramme de séquence – Authentification (connexion/inscription)</div>
</div>
Authentification (connexion/inscription) : Ce scénario décrit le processus d’authentification sécurisé, de la saisie des identifiants à la création de session, en passant par la gestion des erreurs et la redirection vers le tableau de bord.

<div style="text-align: center;">
  <img src="../diagrams/export_data.png" alt="Diagramme de séquence - Exportation des données" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 16 : Diagramme de séquence – Exportation des données</div>
</div>
Exportation des données : L’utilisateur peut exporter ses données financières au format Excel. Le diagramme montre la sélection des données, la génération du fichier et le téléchargement sécurisé.

<div style="text-align: center;">
  <img src="../diagrams/filter_data.png" alt="Diagramme de séquence - Filtrage des données" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 17 : Diagramme de séquence – Filtrage des données</div>
</div>
Filtrage des données : Ce diagramme illustre comment l’utilisateur peut appliquer des filtres sur les transactions pour affiner l’analyse et la visualisation des données.

<div style="text-align: center;">
  <img src="../diagrams/Dashboard.png" alt="Diagramme de séquence - Visualisation du tableau de bord" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 18 : Diagramme de séquence – Visualisation du tableau de bord</div>
</div>
Visualisation du tableau de bord : Ce scénario présente la récupération et l’affichage des statistiques financières sous forme de graphiques et d’indicateurs clés, offrant une vue synthétique de la situation de trésorerie.

#### 6. Diagramme de classes

Le diagramme de classes ci-dessous présente la structure des principales entités de l’application ExtraCash, leurs attributs et les relations entre elles. Il permet de visualiser l’organisation du modèle de données et la logique métier sous-jacente.

<div style="text-align: center;">
  <img src="../diagrams/calss.png" alt="Diagramme de classes" style="width:500px; max-width:100%; height:auto;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 19 : Diagramme de classes de l’application ExtraCash</div>
</div>

Chaque classe est décrite par son nom, ses attributs principaux, et les relations établies avec les autres classes (associations, agrégations, compositions). Ce diagramme constitue une référence essentielle pour comprendre la structure des données et la logique implémentée au sein de l’application.

#### 7. Diagramme de composants

Le diagramme de composants ci-dessous illustre l’architecture logicielle de l’application ExtraCash. Il met en avant l’organisation modulaire du code, la séparation des responsabilités et les interactions entre les différents modules (écrans, services, contextes, etc.).

<div style="text-align: center;">
  <img src="../diagrams/component_Diagrame.png" alt="Diagramme de composants" style="width:600px; max-width:100%; height:300px;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 20 : Diagramme de composants de l’application ExtraCash</div>
</div>

Ce schéma permet de visualiser la structure globale du projet, de comprendre les flux de données et de garantir la maintenabilité et l’évolutivité de l’application.
</div>

### Implémentation
<div style="text-align: justify;">
L'implémentation de l'application ExtraCash a été guidée par une approche modulaire et orientée expérience utilisateur. Cette section présente, de façon structurée et illustrée, l'ensemble des écrans et modales de l'application, regroupés par grandes fonctionnalités. 

Chaque interface est accompagnée d'une brève description de son rôle et de ses principales fonctionnalités, ainsi que d'une capture d'écran pour une meilleure visualisation.

#### 1. Authentification

- **Écran de connexion**  
Permet à l’utilisateur de se connecter à son compte ExtraCash. Champs email/mot de passe, gestion dynamique des erreurs, liens vers inscription/récupération, retour visuel immédiat.
<div style="text-align: center;">
  <img src="../screens/lofing screen.jpg" alt="Écran de connexion" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 21 : Écran de connexion</div>
</div>

- **Écran d’inscription**  
Création d’un nouveau compte utilisateur avec nom, email, mot de passe (confirmation), validation en temps réel, acceptation des conditions, gestion des erreurs explicites.
<div style="text-align: center;">
  <img src="../screens/register screen.jpg" alt="Écran d'inscription" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 22 : Écran d'inscription</div>
</div>

<hr />
#### 2. Accueil & Dashboard

- **Accueil / Home**  
Page d’accueil après connexion, accès rapide aux principales fonctionnalités et liste des transactions récentes.
<div style="text-align: center;">
  <img src="../screens/home screen .jpg" alt="Accueil" style="width:200px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 23 : Accueil</div>
</div>

- **Tableau de bord**  
Centralise les indicateurs financiers clés : solde global, revenus, dépenses, paiements employés.
<div style="text-align: center;">
  <img src="../screens/dashboard screen.jpg" alt="Dashboard" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 24 : Tableau de bord</div>
</div>

<hr />
#### 3. Gestion des employés

- **Liste des employés**  
Affiche la liste complète des employés, recherche, ajout, modification, suppression, consultation historique paiements.
<div style="text-align: center;">
  <img src="../screens/emplyee screen.jpg" alt="Liste des employés" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 25 : Liste des employés</div>
</div>

- **Ajout d’un employé (modal)**  
Formulaire pour ajouter un nouvel employé.
<div style="text-align: center;">
  <img src="../screens/add emplye modal.jpg" alt="Ajout employé" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 26 : Ajout d'un employé</div>
</div>

- **Liste des paiements à un employé**  
Affiche l’historique des paiements pour chaque employé, avec détails et filtres. L’utilisateur peut consulter tous les paiements effectués à un employé donné, trier ou filtrer par date ou montant, et accéder à des informations détaillées sur chaque transaction.
<div style="text-align: center;">
  <img src="../screens/list of payemnt to emplye screen.jpg" alt="Liste des paiements à un employé" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 27 : Liste des paiements à un employé</div>
</div>

- **Paiement d’employé (modal)**  
Permet d’enregistrer un nouveau paiement pour un employé sélectionné. L’utilisateur saisit le montant, la date et éventuellement un justificatif, puis valide l’opération pour ajouter le paiement à l’historique de l’employé.
<div style="text-align: center;">
  <img src="../screens/add payemnt modal.jpg" alt="Paiement employé" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 28 : Paiement d'employé</div>
</div>

- **Filtrer les paiements (modal)**  
Filtrage de l’historique des paiements par période, montant ou type.
<div style="text-align: center;">
  <img src="../screens/fileter by date the payement modal.jpg" alt="Filtre paiement" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 29 : Filtre des paiements</div>
</div>

<hr />
#### 4. Dépenses & Revenus

- **Liste des dépenses**  
Liste toutes les dépenses, recherche, filtrage par mois/catégorie, ajout, modification, suppression.
<div style="text-align: center;">
  <img src="../screens/list of expense screen.jpg" alt="Liste des dépenses" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 30 : Liste des dépenses</div>
</div>

- **Ajout d’une dépense (modal)**  
Formulaire pour saisir une nouvelle dépense : description, montant, catégorie, date, pièce jointe.
<div style="text-align: center;">
  <img src="../screens/add expese modal.jpg" alt="Ajout dépense" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 31 : Ajout d'une dépense</div>
</div>

- **Recherche de dépense**  
Recherche d’une dépense par mot-clé, résultats dynamiques.
<div style="text-align: center;">
  <img src="../screens/srech bar in expense screen.jpg" alt="Recherche dépense" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 32 : Recherche de dépense</div>
</div>

- **Filtre de dépense par mois**  
Filtrage des dépenses par mois pour une analyse rapide.
<div style="text-align: center;">
  <img src="../screens/filter by moth in expense screen.jpg" alt="Filtre dépense par mois" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 33 : Filtre de dépense par mois</div>
</div>

- **Suppression/Modification (modal)**  
Confirmation pour supprimer ou modifier une dépense ou un revenu, détails affichés, validation explicite.
<div style="text-align: center;">
  <img src="../screens/delete update modal .jpg" alt="Suppression/Modification" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 34 : Suppression/Modification</div>
</div>

- **Liste des revenus**  
Affiche tous les revenus enregistrés, filtrage, ajout, modification, suppression. <div style="text-align: center;">
  <img src="../screens/revenue screen.jpg" alt="Liste des revenus" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 35 : Liste des revenus</div>
</div>

- **Ajout d’un revenu (modal)**  
Formulaire pour saisir un nouveau revenu : description, montant, source, date. <div style="text-align: center;">
  <img src="../screens/add revenu modal.jpg" alt="Ajout revenu" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 36 : Ajout d'un revenu</div>
</div>

<hr />
#### 5. Paramètres, partage, export et archivage

- **Paramètres**  
Gestion du profil utilisateur, préférences, sécurité, comptes partagés, actions avancées (export, archivage).
<div style="text-align: center;">
  <img src="../screens/setting screen.jpg" alt="Paramètres" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 37 : Paramètres</div>
</div>

- **Ajout d’utilisateur partagé**  
Invitation d’un autre utilisateur à accéder à son compte, définition des droits, suivi de l’invitation.
<div style="text-align: center;">
  <img src="../screens/add user shared screen.jpg" alt="Ajout utilisateur partagé" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 38 : Ajout d'utilisateur partagé</div>
</div>

- **Export Excel**  
Export des transactions au format Excel, choix de la période, téléchargement ou partage du fichier.
<div style="text-align: center;">
  <img src="../screens/export execl settiings.jpg" alt="Export Excel" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 39 : Export Excel</div>
</div>

- **Archivage**  
Sélection d’une période à archiver, déplacement des transactions dans les archives, résumé avant validation.
<div style="text-align: center;">
  <img src="../screens/archiva selceted date setting .jpg" alt="Archivage" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 40 : Archivage</div>
</div>

- **Consultation des archives**  
Affichage des transactions archivées, consultation par période ou catégorie.
<div style="text-align: center;">
  <img src="../screens/consult archivage screen .jpg" alt="Consultation archive" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 41 : Consultation des archives</div>
</div>

<hr />
#### 6. Modales et vues avancées

- **Filtre par date (modal)**  
Filtrage des transactions/statistiques par période personnalisée (dates de début/fin).
<div style="text-align: center;">
  <img src="../screens/date filter.jpg" alt="Filtre date" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 42 : Filtre par date</div>
</div>

- **Modal d’action limitée (si viewer)**  
Affiche une modale d’avertissement si l’utilisateur invité tente une action non autorisée.
<div style="text-align: center;">
  <img src="../screens/modal of action limite if ur viewr.jpg" alt="Action limitée viewer" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 43 : Action limitée (mode viewer)</div>
</div>

- **Vue mobile (screenshot)**  
Aperçu de l’application sur un appareil mobile, illustrant l’ergonomie et l’adaptabilité de l’interface.
<div style="text-align: center;">
  <img src="../screens/Screenshot_20250604-162412_Expo Go.jpg" alt="Vue mobile" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 44 : Vue mobile</div>
</div>

- **Mode viewer – Accueil**  
Consultation du tableau de bord en lecture seule pour un compte partagé.
<div style="text-align: center;">
  <img src="../screens/mode viwer home screen .jpg" alt="Mode viewer Accueil" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 45 : Accueil (mode viewer)</div>
</div>

- **Mode viewer – Dépenses**  
Consultation des dépenses en lecture seule pour un compte partagé. 
<div style="text-align: center;">
  <img src="../screens/mode viwer in expense screen.jpg" alt="Mode viewer Dépenses" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 46 : Dépenses (mode viewer)</div>
</div>

- **Mode viewer – Revenus**  
Consultation des revenus en lecture seule pour un compte partagé. 
<div style="text-align: center;">
  <img src="../screens/mode viwer in revenue screen.jpg" alt="Mode viewer Revenus" style="width:300px; max-width:100%; height:auto; object-fit:contain;"/>
  <div style="font-size: 0.8em; color: #555;">Figure 47 : Revenus (mode viewer)</div>
</div>

<div style="page-break-after: always;"></div>

## Conclusion générale

Ce stage de fin d’études au sein d’ExtraSys Maroc a constitué une expérience particulièrement riche et formatrice, tant sur le plan technique qu’humain. J’ai eu l’opportunité de participer activement à toutes les étapes du projet ExtraCash, de la phase de conception à la mise en production, en passant par le développement, les tests, la documentation et la présentation finale auprès de l’équipe. 

Sur le plan technique, ce stage m’a permis de consolider mes compétences en développement mobile avec React Native et Firebase, d’approfondir ma compréhension de l’architecture logicielle, de la gestion de projet agile (Scrum), ainsi que des bonnes pratiques en matière de sécurité, de performance et d’ergonomie applicative. J’ai également appris à utiliser des outils professionnels tels que Git, Expo, et à collaborer efficacement via des plateformes de gestion de code et de suivi de projet. 

Au-delà des aspects techniques, cette expérience m’a permis de développer des compétences humaines essentielles : la communication au sein d’une équipe pluridisciplinaire, l’adaptabilité face aux imprévus, la gestion des priorités, l’autonomie et la prise d’initiative. J’ai pu observer l’importance de l’écoute active, du partage de connaissances et de la solidarité entre collègues pour mener à bien un projet ambitieux dans un environnement professionnel exigeant.

Le projet ExtraCash, en répondant à des besoins concrets des PME en matière de gestion de trésorerie, m’a sensibilisé à l’impact réel que peut avoir une solution numérique bien conçue sur l’organisation et la performance d’une entreprise. J’ai pris conscience de la responsabilité du développeur dans la création d’outils fiables, intuitifs et sécurisés, et de la nécessité de toujours placer l’utilisateur final au centre de la démarche de conception.

Enfin, ce stage a été une étape déterminante dans mon parcours, m’ouvrant de nouvelles perspectives professionnelles et personnelles. Il m’a conforté dans mon choix de carrière dans le développement mobile et m’a donné l’envie de continuer à apprendre, à innover et à contribuer à des projets à fort impact. Je ressors de cette expérience grandi, motivé et prêt à relever de nouveaux défis dans le domaine des technologies de l’information.

<div style="page-break-after: always;"></div>

## Bibliographie et références techniques

- Documentation officielle React Native : https://reactnative.dev/docs/getting-started
- Documentation Firebase : https://firebase.google.com/docs
- Expo Documentation : https://docs.expo.dev/
- Guide de style Material Design : https://m3.material.io/
- Documentation Git : https://git-scm.com/doc
- Ressources internes ExtraSys Maroc
- ExtraSys Maroc website : https://extrasysmaroc.com

