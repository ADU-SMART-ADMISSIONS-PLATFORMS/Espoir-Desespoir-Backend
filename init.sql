-- Supprimer dans le bon ordre (pour éviter erreurs de contraintes)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS users;

-- TABLE users
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role ENUM('student','officer','admin') DEFAULT 'student',
  phone_number VARCHAR(50),
  date_of_birth DATE,
  country_of_birth VARCHAR(100),
  nationality VARCHAR(100),
  address VARCHAR(255),
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  guardian_address VARCHAR(255),
  last_login DATETIME NULL
);

-- TABLE programs
CREATE TABLE IF NOT EXISTS programs (
  program_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  level VARCHAR(100),
  duration_years INT,
  tuition_fee INT
);

-- TABLE applications
CREATE TABLE IF NOT EXISTS applications (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  program_id INT NOT NULL,
  application_number VARCHAR(100) NOT NULL,
  status ENUM('pending','under_review','interview','accepted','rejected') DEFAULT 'pending',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_naissance DATE NULL,
  sexe VARCHAR(20) NULL,
  telephone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  ville_quartier VARCHAR(255) NULL,
  dernier_diplome VARCHAR(255) NULL,
  annee_diplome VARCHAR(10) NULL,
  motivation_letter TEXT NULL,
  previous_education TEXT NULL,
  comment_connu_adu TEXT NULL,
  souhaite_recontact VARCHAR(10) NULL,
  eligibility_score DECIMAL(5,2) NULL,
  admission_decision_date DATETIME NULL,
  CONSTRAINT fk_application_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_application_program FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE CASCADE,
  UNIQUE KEY idx_application_number (application_number),
  INDEX idx_application_user (user_id),
  INDEX idx_application_program (program_id)
);

-- TABLE documents
CREATE TABLE IF NOT EXISTS documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  verification_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_application FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- TABLE notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  application_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('status_update','system','reminder','evaluation','test','info') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_application FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
  INDEX idx_notification_user_id (user_id),
  INDEX idx_notification_created_at (created_at),
  INDEX idx_notification_is_read (is_read)
);
