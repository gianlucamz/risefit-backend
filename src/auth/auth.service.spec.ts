import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: ReturnType<typeof vi.fn> } };
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };

  const mockHashedPassword = bcrypt.hashSync('senha123', 10);

  const mockUser = {
    id: 1,
    nome: 'Carlos Silva',
    email: 'carlos@example.com',
    senha: mockHashedPassword,
    dataNascimento: new Date('1990-01-01'),
    telefone: '11999999999',
    cpf: '12345678901',
    sexo: 'Masculino',
    cargo: 'ALUNO',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
      },
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('mocked_jwt_token'),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('deve autenticar o usuário com sucesso quando as credenciais forem válidas', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('carlos@example.com', 'senha123');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe('carlos@example.com');
      expect((result as any).senha).toBeUndefined();
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('inexistente@example.com', 'senha123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se a senha for incorreta', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.validateUser('carlos@example.com', 'senhaErrada'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('deve retornar token e dados do usuário ao efetuar login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'carlos@example.com',
        senha: 'senha123',
      });

      expect(result).toHaveProperty('token', 'mocked_jwt_token');
      expect(result).toHaveProperty('access_token', 'mocked_jwt_token');
      expect(result.usuario).toEqual(
        expect.objectContaining({
          id: 1,
          nome: 'Carlos Silva',
          email: 'carlos@example.com',
          cargo: 'ALUNO',
        }),
      );
      expect((result.usuario as any).senha).toBeUndefined();
    });
  });

  describe('getMe', () => {
    it('deve retornar dados do perfil do usuário autenticado', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha, ...userWithoutPassword } = mockUser;
      prisma.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await service.getMe(1);

      expect(result).toEqual(userWithoutPassword);
      expect((result as any).senha).toBeUndefined();
    });

    it('deve lançar UnauthorizedException se o usuário não existir mais', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
