import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { LoginDto } from './dto/login.dto.js';

const SALT_ROUNDS = 10;

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

      return await this.prisma.user.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha: hashedPassword,
          dataNascimento: new Date(dto.dataNascimento),
          telefone: dto.telefone,
          ...(dto.cpf !== undefined && {
            cpf: dto.cpf,
          }),
          ...(dto.sexo !== undefined && {
            sexo: dto.sexo,
          }),
          ...(dto.cargo !== undefined && {
            cargo: dto.cargo,
          }),
        },
        omit: {
          senha: true,
        },
      });
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

    await this.findOne(usuarioId);

    const { dataNascimento, senha, ...dados } = dto;

    const data: Prisma.UserUpdateInput = {
      ...dados,
      ...(dataNascimento !== undefined && {
        dataNascimento: new Date(dataNascimento),
      }),
      ...(senha !== undefined && {
        senha: await bcrypt.hash(senha, SALT_ROUNDS),
      }),
    };

    try {
      return await this.prisma.user.update({
        where: { id: usuarioId },
        data,
        omit: {
          senha: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
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

