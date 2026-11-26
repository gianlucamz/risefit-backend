import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Prisma, SubscriptionStatus } from '../generated/prisma/client.js';
import { ESTADO_ATENDIMENTO } from '../common/constants/regiao-atendimento.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { LoginDto } from './dto/login.dto.js';

const SALT_ROUNDS = 10;

const userInclude = {
  assinaturas: {
    include: { plano: true },
    orderBy: { id: 'desc' as const },
  },
  enderecos: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  private validateId(id: number): number {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    return id;
  }

  async create(dto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(dto.senha, SALT_ROUNDS);

      let plan = null;
      if (dto.planoId !== undefined) {
        plan = await this.prisma.plan.findUnique({
          where: { id: dto.planoId },
        });
        if (!plan || !plan.ativo) {
          throw new BadRequestException('Plano não encontrado ou inativo');
        }
      }

      const cpfLimpo = dto.cpf?.trim() ? dto.cpf.trim() : undefined;
      const sexoLimpo = dto.sexo?.trim() ? dto.sexo.trim() : undefined;

      const createdUser = await this.prisma.user.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha: hashedPassword,
          dataNascimento: new Date(dto.dataNascimento),
          telefone: dto.telefone,
          ...(cpfLimpo !== undefined && { cpf: cpfLimpo }),
          ...(sexoLimpo !== undefined && { sexo: sexoLimpo }),
          ...(dto.cargo !== undefined && { cargo: dto.cargo }),
          ...(dto.endereco && {
            enderecos: {
              create: {
                cep: dto.endereco.cep,
                estado: dto.endereco.estado || ESTADO_ATENDIMENTO,
                cidade: dto.endereco.cidade,
                bairro: dto.endereco.bairro,
                rua: dto.endereco.rua,
                numero: dto.endereco.numero,
                ...(dto.endereco.complemento !== undefined && {
                  complemento: dto.endereco.complemento,
                }),
              },
            },
          }),
        },
        include: userInclude,
        omit: {
          senha: true,
        },
      });

      if (plan) {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);

        await this.prisma.subscription.create({
          data: {
            usuarioId: createdUser.id,
            planoId: plan.id,
            dataInicio: hoje,
            dataFim: null,
            status: SubscriptionStatus.PENDENTE,
          },
        });

        return await this.findOne(createdUser.id);
      }

      return createdUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target;
          if (
            (Array.isArray(target) && target.includes('cpf')) ||
            (typeof target === 'string' && target.includes('cpf'))
          ) {
            throw new ConflictException('Este CPF já está cadastrado');
          }
          throw new ConflictException('Este e-mail já está cadastrado');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Usuário não encontrado');
        }
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const identificador = dto.identificador.trim();
    let usuario;

    if (identificador.includes('@')) {
      usuario = await this.prisma.user.findUnique({
        where: { email: identificador.toLowerCase() },
        include: userInclude,
      });
    } else {
      const cpfLimpo = identificador.replace(/\D/g, '');
      usuario = await this.prisma.user.findFirst({
        where: {
          OR: [
            { cpf: identificador },
            { cpf: cpfLimpo },
            { email: identificador },
          ],
        },
        include: userInclude,
      });
    }

    if (!usuario) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const { senha: _, ...usuarioSemSenha } = usuario;
    return {
      usuario: usuarioSemSenha,
      token: `risefit_token_${usuario.id}_${Date.now()}`,
    };
  }

  findAll() {
    return this.prisma.user.findMany({
      include: userInclude,
      omit: {
        senha: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const usuarioId = this.validateId(id);

    const usuario = await this.prisma.user.findUnique({
      where: { id: usuarioId },
      include: userInclude,
      omit: {
        senha: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async update(id: number, dto: UpdateUserDto) {
    const usuarioId = this.validateId(id);

    const usuarioExistente = await this.prisma.user.findUnique({
      where: { id: usuarioId },
    });

    if (!usuarioExistente) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const {
      dataNascimento,
      senha,
      senhaAtual,
      novaSenha,
      planoId,
      endereco,
      ...dados
    } = dto;

    let senhaFinalHash: string | undefined = undefined;

    if (senhaAtual && novaSenha) {
      const senhaValida = await bcrypt.compare(
        senhaAtual,
        usuarioExistente.senha,
      );
      if (!senhaValida) {
        throw new BadRequestException('A senha atual informada está incorreta');
      }
      senhaFinalHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    } else if (senha) {
      senhaFinalHash = await bcrypt.hash(senha, SALT_ROUNDS);
    }

    const data: Prisma.UserUpdateInput = {
      ...dados,
      ...(dataNascimento !== undefined && {
        dataNascimento: new Date(dataNascimento),
      }),
      ...(senhaFinalHash !== undefined && {
        senha: senhaFinalHash,
      }),
      ...(endereco && {
        enderecos: {
          create: {
            cep: endereco.cep,
            estado: endereco.estado || ESTADO_ATENDIMENTO,
            cidade: endereco.cidade,
            bairro: endereco.bairro,
            rua: endereco.rua,
            numero: endereco.numero,
            ...(endereco.complemento !== undefined && {
              complemento: endereco.complemento,
            }),
          },
        },
      }),
    };

    if (planoId !== undefined) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: planoId },
      });
      if (!plan || !plan.ativo) {
        throw new BadRequestException('Plano não encontrado ou inativo');
      }

      const hoje = new Date();
      hoje.setUTCHours(0, 0, 0, 0);
      const dataFim = new Date(hoje);
      dataFim.setUTCMonth(dataFim.getUTCMonth() + plan.duracaoMeses);

      await this.prisma.subscription.updateMany({
        where: {
          usuarioId,
          status: { not: SubscriptionStatus.CANCELADA },
        },
        data: { status: SubscriptionStatus.CANCELADA },
      });

      await this.prisma.subscription.create({
        data: {
          usuarioId,
          planoId: plan.id,
          dataInicio: hoje,
          dataFim,
          status: SubscriptionStatus.ATIVA,
        },
      });
    }

    try {
      return await this.prisma.user.update({
        where: { id: usuarioId },
        data,
        include: userInclude,
        omit: {
          senha: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;
        if (
          (Array.isArray(target) && target.includes('cpf')) ||
          (typeof target === 'string' && target.includes('cpf'))
        ) {
          throw new ConflictException('Este CPF já está cadastrado');
        }
        throw new ConflictException('Este e-mail já está cadastrado');
      }

      throw error;
    }
  }

  async remove(id: number) {
    const usuarioId = this.validateId(id);

    await this.findOne(usuarioId);

    await this.prisma.user.delete({
      where: { id: usuarioId },
    });

    return { message: 'Usuário removido com sucesso' };
  }
}