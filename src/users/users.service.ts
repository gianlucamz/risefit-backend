import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserDto) {
    try {
      const senha = await bcrypt.hash(dto.senha, 10);
      return await this.prisma.user.create({
        data: { ...dto, senha },
        omit: { senha: true },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      omit: { senha: true },
    });
  }

  async findOne(id: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { senha: true },
    });
    if (!user) throw new NotFoundException(`Usuário ${id} não encontrado`);
    return user;
  }

  async update(id: bigint, dto: UpdateUserDto) {
    try {
      const data = { ...dto };
      if (data.senha) data.senha = await bcrypt.hash(data.senha, 10);

      return await this.prisma.user.update({
        where: { id },
        data,
        omit: { senha: true },
      });
    } catch (error) {
      this.handleError(error, id);
    }
  }

  async remove(id: bigint) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.handleError(error, id);
    }
  }

  private handleError(error: unknown, id?: bigint): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Usuário ${id} não encontrado`);
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Não é possível excluir: usuário possui registros relacionados',
        );
      }
    }
    throw error;
  }
}