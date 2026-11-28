import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Cargo, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProfessionalDto } from './dto/create-professional.dto.js';
import type { UpdateProfessionalDto } from './dto/update-professional.dto.js';

const SALT_ROUNDS = 10;

// Traz nome e e-mail do usuário (sem senha) e os serviços vinculados.
const include = {
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  servicos: {
    include: {
      servico: true,
    },
  },
};

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateId(id: number): number {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    return id;
  }

  private async syncServices(
    tx: Prisma.TransactionClient,
    profissionalId: number,
    servicos?: string[],
  ) {
    if (!servicos) return;

    await tx.professionalService.deleteMany({
      where: { profissionalId },
    });

    const nomesUnicos = Array.from(
      new Set(servicos.map((s) => s.trim()).filter(Boolean)),
    );

    for (const nome of nomesUnicos) {
      const existente = await tx.service.findFirst({
        where: { nome },
      });

      const servico = existente
        ? existente
        : await tx.service.create({
            data: { nome, ativo: true },
          });

      await tx.professionalService.create({
        data: {
          profissionalId,
          servicoId: servico.id,
        },
      });
    }
  }

  async create(dto: CreateProfessionalDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let usuarioId = dto.usuarioId ? Number(dto.usuarioId) : undefined;

        if (usuarioId !== undefined) {
          if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
            throw new BadRequestException('ID de usuário inválido');
          }

          const user = await tx.user.findUnique({
            where: { id: usuarioId },
          });

          if (!user) {
            throw new NotFoundException('Usuário não encontrado');
          }
        } else if (dto.email && dto.nome) {
          const emailNormalizado = dto.email.toLowerCase();
          const existentePorEmail = await tx.user.findUnique({
            where: { email: emailNormalizado },
          });

          if (existentePorEmail) {
            usuarioId = existentePorEmail.id;
            await tx.user.update({
              where: { id: usuarioId },
              data: {
                nome: dto.nome,
                cargo: Cargo.PROFISSIONAL,
              },
            });
          } else {
            const senhaHash = await bcrypt.hash('RiseFit@123', SALT_ROUNDS);
            const novoUsuario = await tx.user.create({
              data: {
                nome: dto.nome,
                email: emailNormalizado,
                senha: senhaHash,
                dataNascimento: new Date('1990-01-01'),
                telefone: dto.telefone || '12999999999',
                cargo: Cargo.PROFISSIONAL,
              },
            });
            usuarioId = novoUsuario.id;
          }
        } else {
          throw new BadRequestException(
            'Informe usuarioId ou nome e e-mail do profissional',
          );
        }

        const exists = await tx.professional.findUnique({
          where: { usuarioId },
        });

        if (exists) {
          throw new ConflictException('Este usuário já é profissional');
        }

        const created = await tx.professional.create({
          data: {
            usuarioId,
            especializacao: dto.especializacao,
            biografia: dto.biografia || null,
            urlFoto: dto.urlFoto || null,
            ativo: dto.ativo ?? true,
          },
        });

        await this.syncServices(tx, created.id, dto.servicos);

        return tx.professional.findUniqueOrThrow({
          where: { id: created.id },
          include,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um profissional ou usuário com este e-mail',
        );
      }
      throw error;
    }
  }

  findAll(incluirInativos = false) {
    return this.prisma.professional.findMany({
      where: incluirInativos ? undefined : { ativo: true },
      include,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const professionalId = this.validateId(id);

    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include,
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado');
    }

    return professional;
  }

  async update(id: number, dto: UpdateProfessionalDto) {
    const professionalId = this.validateId(id);
    const atual = await this.findOne(professionalId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.nome !== undefined || dto.email !== undefined) {
          await tx.user.update({
            where: { id: atual.usuarioId },
            data: {
              ...(dto.nome !== undefined && { nome: dto.nome }),
              ...(dto.email !== undefined && {
                email: dto.email.toLowerCase(),
              }),
            },
          });
        }

        await this.syncServices(tx, professionalId, dto.servicos);

        return tx.professional.update({
          where: { id: professionalId },
          data: {
            ...(dto.especializacao !== undefined && {
              especializacao: dto.especializacao,
            }),
            ...(dto.biografia !== undefined && {
              biografia: dto.biografia || null,
            }),
            ...(dto.urlFoto !== undefined && {
              urlFoto: dto.urlFoto || null,
            }),
            ...(dto.ativo !== undefined && { ativo: dto.ativo }),
          },
          include,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já está em uso');
      }
      throw error;
    }
  }

  // Desativação lógica (RN004).
  async remove(id: number) {
    const professionalId = this.validateId(id);

    await this.findOne(professionalId);

    return this.prisma.professional.update({
      where: { id: professionalId },
      data: { ativo: false },
      include,
    });
  }
}
