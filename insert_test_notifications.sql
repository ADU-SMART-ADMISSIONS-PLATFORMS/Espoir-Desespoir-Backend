-- Insérer des notifications de test
-- Assurez-vous d'avoir d'abord créé la table Notification et d'avoir des utilisateurs et applications

-- Notification 1: Candidature acceptée
INSERT INTO Notification (user_id, application_id, title, message, type, is_read, created_at) 
VALUES (
  (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1),
  (SELECT application_id FROM Application WHERE user_id = (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1) LIMIT 1),
  'Candidature acceptée !',
  'Félicitations ! Votre candidature pour le programme Intelligence Artificielle a été acceptée. Vous recevrez bientôt les instructions pour finaliser votre inscription.',
  'success',
  FALSE,
  NOW() - INTERVAL 2 HOUR
);

-- Notification 2: Documents manquants
INSERT INTO Notification (user_id, application_id, title, message, type, is_read, created_at) 
VALUES (
  (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1),
  (SELECT application_id FROM Application WHERE user_id = (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1) LIMIT 1),
  'Documents manquants',
  'Veuillez fournir votre certificat de nationalité pour compléter votre dossier de candidature.',
  'warning',
  FALSE,
  NOW() - INTERVAL 1 DAY
);

-- Notification 3: Entretien programmé
INSERT INTO Notification (user_id, application_id, title, message, type, is_read, created_at) 
VALUES (
  (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1),
  (SELECT application_id FROM Application WHERE user_id = (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1) LIMIT 1),
  'Entretien programmé',
  'Vous êtes convoqué pour un entretien le 20 janvier 2024 à 14h00. Veuillez vous présenter 15 minutes à l\'avance.',
  'info',
  TRUE,
  NOW() - INTERVAL 3 DAY
);

-- Notification 4: Candidature en cours d'examen
INSERT INTO Notification (user_id, application_id, title, message, type, is_read, created_at) 
VALUES (
  (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1),
  (SELECT application_id FROM Application WHERE user_id = (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1) LIMIT 1),
  'Candidature en cours d\'examen',
  'Votre candidature pour Management est actuellement en cours d\'examen par notre équipe. Nous vous tiendrons informé de l\'avancement.',
  'info',
  TRUE,
  NOW() - INTERVAL 5 DAY
);

-- Notification 5: Rappel de paiement
INSERT INTO Notification (user_id, application_id, title, message, type, is_read, created_at) 
VALUES (
  (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1),
  (SELECT application_id FROM Application WHERE user_id = (SELECT user_id FROM Users WHERE email = 'student@adu.com' LIMIT 1) LIMIT 1),
  'Rappel de paiement',
  'N\'oubliez pas de régler les frais de dossier de 10.000 FCFA pour finaliser votre candidature.',
  'warning',
  FALSE,
  NOW() - INTERVAL 1 HOUR
); 