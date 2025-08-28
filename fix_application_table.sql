-- Ensure Application table has detailed applicant fields used by the frontend
-- Safe to run multiple times on MySQL 8+ thanks to IF NOT EXISTS

ALTER TABLE `Application`
  ADD COLUMN IF NOT EXISTS `date_naissance` DATE NULL AFTER `submitted_at`,
  ADD COLUMN IF NOT EXISTS `sexe` VARCHAR(20) NULL AFTER `date_naissance`,
  ADD COLUMN IF NOT EXISTS `telephone` VARCHAR(50) NULL AFTER `sexe`,
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(255) NULL AFTER `telephone`,
  ADD COLUMN IF NOT EXISTS `ville_quartier` VARCHAR(255) NULL AFTER `email`,
  ADD COLUMN IF NOT EXISTS `dernier_diplome` VARCHAR(255) NULL AFTER `ville_quartier`,
  ADD COLUMN IF NOT EXISTS `annee_diplome` VARCHAR(10) NULL AFTER `dernier_diplome`,
  ADD COLUMN IF NOT EXISTS `motivation_letter` TEXT NULL AFTER `annee_diplome`,
  ADD COLUMN IF NOT EXISTS `previous_education` TEXT NULL AFTER `motivation_letter`,
  ADD COLUMN IF NOT EXISTS `comment_connu_adu` TEXT NULL AFTER `previous_education`,
  ADD COLUMN IF NOT EXISTS `souhaite_recontact` VARCHAR(10) NULL AFTER `comment_connu_adu`;


