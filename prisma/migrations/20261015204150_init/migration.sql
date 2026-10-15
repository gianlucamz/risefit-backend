-- CreateTable
CREATE TABLE `usuarios` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `senha` VARCHAR(255) NOT NULL,
    `data_nascimento` DATE NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `cargo` ENUM('ALUNO', 'PROFISSIONAL', 'ADMIN') NOT NULL DEFAULT 'ALUNO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_cargo_idx`(`cargo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `profissionais` ADD CONSTRAINT `profissionais_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profissionais_servicos` ADD CONSTRAINT `profissionais_servicos_profissionais_id_fkey` FOREIGN KEY (`profissionais_id`) REFERENCES `profissionais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profissionais_servicos` ADD CONSTRAINT `profissionais_servicos_servicos_id_fkey` FOREIGN KEY (`servicos_id`) REFERENCES `servicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_servicos` ADD CONSTRAINT `planos_servicos_planos_id_fkey` FOREIGN KEY (`planos_id`) REFERENCES `planos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_servicos` ADD CONSTRAINT `planos_servicos_servicos_id_fkey` FOREIGN KEY (`servicos_id`) REFERENCES `servicos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assinaturas` ADD CONSTRAINT `assinaturas_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assinaturas` ADD CONSTRAINT `assinaturas_planos_id_fkey` FOREIGN KEY (`planos_id`) REFERENCES `planos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_produtos` ADD CONSTRAINT `pedidos_produtos_pedidos_id_fkey` FOREIGN KEY (`pedidos_id`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_produtos` ADD CONSTRAINT `pedidos_produtos_produtos_id_fkey` FOREIGN KEY (`produtos_id`) REFERENCES `produtos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participantes_eventos` ADD CONSTRAINT `participantes_eventos_usuarios_id_fkey` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `participantes_eventos` ADD CONSTRAINT `participantes_eventos_eventos_id_fkey` FOREIGN KEY (`eventos_id`) REFERENCES `eventos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
