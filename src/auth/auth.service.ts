import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
    const trimmedEmail = email.trim();

    let user = await this.prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: trimmedEmail.toLowerCase() },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _, ...usuarioSemSenha } = user;
    return usuarioSemSenha;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.senha);

    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      access_token: token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        telefone: user.telefone,
        cpf: user.cpf,
        sexo: user.sexo,
        dataNascimento: user.dataNascimento,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: {
        senha: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }
}
