-- CreateTable
CREATE TABLE `planos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(8, 2) NOT NULL,
    `duracao_meses` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planos_servicos` (
    `planos_id` BIGINT NOT NULL,
    `servicos_id` BIGINT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`planos_id`, `servicos_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assinaturas` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuarios_id` BIGINT NOT NULL,
    `planos_id` BIGINT NOT NULL,
    `data_inicio` DATE NOT NULL,
    `data_fim` DATE NULL,
    `status` ENUM('ATIVA', 'CANCELADA', 'EXPIRADA', 'PENDENTE') NOT NULL DEFAULT 'PENDENTE',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `assinaturas_usuarios_id_idx`(`usuarios_id`),
    INDEX `assinaturas_planos_id_idx`(`planos_id`),
    INDEX `assinaturas_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `planos_servicos` ADD CONSTRAINT `planos_servicos_planos_id_fkey` FOREIGN KEY (`planos_id`) REFERENCES `planos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_servicos` ADD CONSTRAINT `planos_servicos_servicos_id_fkey` FOREIGN KEY (`servicos_id`) REFERENCES `servicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assinaturas` ADD CONSTRAINT `assinaturas_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assinaturas` ADD CONSTRAINT `assinaturas_planos_id_fkey` FOREIGN KEY (`planos_id`) REFERENCES `planos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
