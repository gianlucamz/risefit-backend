import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('E-mail informado é inválido')
    .max(150, 'E-mail deve ter no máximo 150 caracteres'),
  senha: z
    .string()
    .min(1, 'A senha é obrigatória')
    .max(255, 'A senha deve ter no máximo 255 caracteres'),
});

export type LoginDto = z.infer<typeof loginSchema>;
