import { z } from 'zod';
import { createUserSchema } from './create-user.dto.js';

export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    senhaAtual: z.string().min(1).optional(),
    novaSenha: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres').max(255).optional(),
  });

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
