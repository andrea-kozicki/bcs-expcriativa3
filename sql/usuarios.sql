-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS login
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Seleciona o banco de dados
USE login;

-- Criação da tabela `usuarios`
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mfa_enabled` TINYINT(1) NOT NULL DEFAULT '0',
  `mfa_secret` VARCHAR(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB
  AUTO_INCREMENT=3
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
