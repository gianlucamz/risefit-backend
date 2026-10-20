
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

const select = {
  id: true,
  nome: true,
  email: true,
  dataNascimento: true,
  telefone: true,
  cargo: true,
  criadoEm: true,
  atualizadoEm: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  private toId(id: string): bigint {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('ID inválido');
    }

    return BigInt(id);
  }

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha: dto.senha,
          dataNascimento: new Date(dto.dataNascimento),
          telefone: dto.telefone,
          ...(dto.cargo !== undefined && {
            cargo: dto.cargo,
          }),
        },
        select,
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

  findAll() {
    return this.prisma.user.findMany({
      select,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: this.toId(id) },
      select,
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async update(id: string, dto: UpdateUserDto) {
    const usuarioId = this.toId(id);

    await this.findOne(id);

    const { dataNascimento, ...dados } = dto;

    try {
      return await this.prisma.user.update({
        where: { id: usuarioId },
        data: {
          ...dados,
          ...(dataNascimento !== undefined && {
            dataNascimento: new Date(dataNascimento),
          }),
        },
        select,
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

  async remove(id: string) {
    const usuarioId = this.toId(id);

    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id: usuarioId },
    });

    return { message: 'Usuário removido com sucesso' };
  }
}
