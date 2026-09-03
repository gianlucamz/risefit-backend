-- CreateTable
CREATE TABLE `profissionais` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuarios_id` BIGINT NOT NULL,
    `especializacao` VARCHAR(145) NOT NULL,
    `biografia` TEXT NULL,
    `urlFoto` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profissionais_usuarios_id_key`(`usuarios_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
