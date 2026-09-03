/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `dataNascimento` DATE NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `cargo` ENUM('ALUNO', 'PROFISSIONAL', 'ADMIN') NOT NULL DEFAULT 'ALUNO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_cargo_idx`(`cargo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
