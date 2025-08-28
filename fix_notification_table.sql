USE adu_admission2;

-- Ajouter les colonnes manquantes
ALTER TABLE Notification 
ADD COLUMN title VARCHAR(255) AFTER user_id,
ADD COLUMN application_id INT AFTER title,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER type;

-- Ajouter la clé étrangère pour application_id
ALTER TABLE Notification 
ADD CONSTRAINT fk_notification_application 
FOREIGN KEY (application_id) REFERENCES Application(application_id);

-- Mettre à jour le type enum pour inclure 'evaluation' et 'test'
ALTER TABLE Notification 
MODIFY COLUMN type ENUM('status_update', 'system', 'reminder', 'evaluation', 'test', 'info');

-- Vérifier la structure finale
DESCRIBE Notification; 