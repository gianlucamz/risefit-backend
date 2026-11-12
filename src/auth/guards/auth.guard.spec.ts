import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };

  const createMockContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtService = {
      verifyAsync: vi.fn(),
    };
    guard = new AuthGuard(jwtService as unknown as JwtService);
  });

  it('deve autorizar quando Authorization Bearer for fornecido e válido', async () => {
    const payload = { sub: 1, email: 'teste@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const request: any = {
      headers: {
        authorization: 'Bearer valid_token',
      },
    };

    const result = await guard.canActivate(createMockContext(request));

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid_token');
    expect(request.user).toEqual(payload);
  });

  it('deve autorizar quando o token estiver nos cookies', async () => {
    const payload = { sub: 1, email: 'teste@example.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    const request: any = {
      headers: {},
      cookies: {
        token: 'cookie_token',
      },
    };

    const result = await guard.canActivate(createMockContext(request));

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie_token');
    expect(request.user).toEqual(payload);
  });

  it('deve lançar UnauthorizedException se nenhum token for fornecido', async () => {
    const request: any = {
      headers: {},
      cookies: {},
    };

    await expect(guard.canActivate(createMockContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('deve lançar UnauthorizedException se o token for inválido ou expirado', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const request: any = {
      headers: {
        authorization: 'Bearer token_invalido',
      },
    };

    await expect(guard.canActivate(createMockContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
