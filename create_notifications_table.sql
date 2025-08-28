-- Création de la table des notifications
CREATE TABLE IF NOT EXISTS Notification (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  application_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES Application(application_id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_notification_user_id ON Notification(user_id);
CREATE INDEX idx_notification_created_at ON Notification(created_at);
CREATE INDEX idx_notification_is_read ON Notification(is_read); 