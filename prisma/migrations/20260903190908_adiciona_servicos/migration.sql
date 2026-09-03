/*
  Warnings:

  - You are about to drop the column `dataNascimento` on the `usuarios` table. All the data in the column will be lost.
  - Added the required column `data_nascimento` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `dataNascimento`,
    ADD COLUMN `data_nascimento` DATE NOT NULL;

-- CreateTable
CREATE TABLE `servicos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(200) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profissionais_servicos` (
    `profissionais_id` BIGINT NOT NULL,
    `servicos_id` BIGINT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`profissionais_id`, `servicos_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profissionais_servicos` ADD CONSTRAINT `profissionais_servicos_profissionais_id_fkey` FOREIGN KEY (`profissionais_id`) REFERENCES `profissionais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profissionais_servicos` ADD CONSTRAINT `profissionais_servicos_servicos_id_fkey` FOREIGN KEY (`servicos_id`) REFERENCES `servicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
