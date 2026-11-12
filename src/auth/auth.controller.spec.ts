import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: ReturnType<typeof vi.fn>;
    getMe: ReturnType<typeof vi.fn>;
  };
  let responseMock: Partial<Response>;

  const mockLoginResult = {
    token: 'jwt_mock_token',
    access_token: 'jwt_mock_token',
    usuario: {
      id: 1,
      nome: 'Carlos Silva',
      email: 'carlos@example.com',
      cargo: 'ALUNO',
      telefone: '11999999999',
      cpf: '12345678901',
      sexo: 'Masculino',
      dataNascimento: new Date('1990-01-01'),
    },
  };

  beforeEach(() => {
    authService = {
      login: vi.fn().mockResolvedValue(mockLoginResult),
      getMe: vi.fn().mockResolvedValue(mockLoginResult.usuario),
    };

    responseMock = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('deve efetuar login, retornar payload e configurar cookies HttpOnly', async () => {
      const dto = {
        email: 'carlos@example.com',
        senha: 'senha123',
      };

      const result = await controller.login(
        dto,
        responseMock as unknown as Response,
      );

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockLoginResult);
      expect(responseMock.cookie).toHaveBeenCalledWith(
        'token',
        'jwt_mock_token',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
      expect(responseMock.cookie).toHaveBeenCalledWith(
        'auth_token',
        'jwt_mock_token',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
    });
  });

  describe('logout', () => {
    it('deve limpar os cookies de sessão e retornar mensagem de sucesso', () => {
      const result = controller.logout(responseMock as unknown as Response);

      expect(responseMock.clearCookie).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({ path: '/' }),
      );
      expect(responseMock.clearCookie).toHaveBeenCalledWith(
        'auth_token',
        expect.objectContaining({ path: '/' }),
      );
      expect(responseMock.clearCookie).toHaveBeenCalledWith(
        'session',
        expect.objectContaining({ path: '/' }),
      );
      expect(result).toHaveProperty('message', 'Logout realizado com sucesso');
    });
  });

  describe('me', () => {
    it('deve retornar os dados do usuário autenticado a partir do token', async () => {
      const req = {
        user: {
          sub: 1,
          email: 'carlos@example.com',
          nome: 'Carlos Silva',
          cargo: 'ALUNO',
        },
      } as any;

      const result = await controller.me(req);

      expect(authService.getMe).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLoginResult.usuario);
    });
  });
});
