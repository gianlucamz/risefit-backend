-- CreateTable
CREATE TABLE `produtos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(9, 2) NOT NULL,
    `estoque` INTEGER NOT NULL DEFAULT 0,
    `url_imagem` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `produtos_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuarios_id` BIGINT NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGUE', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    INDEX `pedidos_usuarios_id_idx`(`usuarios_id`),
    INDEX `pedidos_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos_produtos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pedidos_id` BIGINT NOT NULL,
    `produtos_id` BIGINT NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `preco_unitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    INDEX `pedidos_produtos_produtos_id_idx`(`produtos_id`),
    UNIQUE INDEX `pedidos_produtos_pedidos_id_produtos_id_key`(`pedidos_id`, `produtos_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_produtos` ADD CONSTRAINT `pedidos_produtos_pedidos_id_fkey` FOREIGN KEY (`pedidos_id`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_produtos` ADD CONSTRAINT `pedidos_produtos_produtos_id_fkey` FOREIGN KEY (`produtos_id`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
