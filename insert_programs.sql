-- Script pour insérer les programmes de l'Université ADU
-- Exécutez ce script dans votre base de données MySQL

USE adu_admission2;

-- Supprimer les programmes existants (optionnel)
DELETE FROM Program;

-- Insérer les 4 programmes de l'université
INSERT INTO Program (name, description, requirements, level, duration_years, tuition_fee) VALUES
(
  'Intelligence Artificielle',
  'Formation en Intelligence Artificielle et Machine Learning. Ce programme prépare les étudiants aux défis technologiques du 21ème siècle avec une approche pratique et théorique.',
  'Baccalauréat scientifique (Mathématiques, Physique, Informatique) ou équivalent. Bon niveau en mathématiques et logique.',
  'Licence',
  3,
  150000
),
(
  'Management (gestion de projet)',
  'Formation en management et gestion de projet. Ce programme développe les compétences en leadership, planification stratégique et gestion d\'équipe.',
  'Baccalauréat toutes séries acceptées. Intérêt pour le management et les relations humaines.',
  'Licence',
  3,
  120000
),
(
  'Comptabilité',
  'Formation en comptabilité et finance. Ce programme prépare aux métiers de la comptabilité, de l\'audit et de la finance d\'entreprise.',
  'Baccalauréat toutes séries acceptées. Bon niveau en mathématiques et rigueur.',
  'Licence',
  3,
  100000
),
(
  'Droit',
  'Formation en droit civil, commercial et administratif. Ce programme prépare aux carrières juridiques et administratives.',
  'Baccalauréat toutes séries acceptées. Bon niveau en français et capacité d\'analyse.',
  'Licence',
  3,
  110000
);

-- Vérifier l'insertion
SELECT * FROM Program ORDER BY name; 