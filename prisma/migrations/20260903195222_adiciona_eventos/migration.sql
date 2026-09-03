-- CreateTable
CREATE TABLE `eventos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(200) NOT NULL,
    `descricao` TEXT NULL,
    `local` VARCHAR(200) NOT NULL,
    `horario_inicio` DATETIME(3) NOT NULL,
    `horario_fim` DATETIME(3) NOT NULL,
    `capacidade` INTEGER NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participantes_eventos` (
    `usuarios_id` BIGINT NOT NULL,
    `eventos_id` BIGINT NOT NULL,
    `registrado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('INSCRITO', 'CANCELADO', 'PRESENTE', 'AUSENTE') NOT NULL DEFAULT 'INSCRITO',

    INDEX `participantes_eventos_eventos_id_idx`(`eventos_id`),
    INDEX `participantes_eventos_status_idx`(`status`),
    PRIMARY KEY (`usuarios_id`, `eventos_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `participantes_eventos` ADD CONSTRAINT `participantes_eventos_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participantes_eventos` ADD CONSTRAINT `participantes_eventos_eventos_id_fkey` FOREIGN KEY (`eventos_id`) REFERENCES `eventos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
