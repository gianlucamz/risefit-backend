import { z } from 'zod';

export const loginSchema = z.object({
  identificador: z.string().min(1, 'Informe seu e-mail ou CPF'),
  senha: z.string().min(1, 'Informe sua senha'),
});

export type LoginDto = z.infer<typeof loginSchema>;
