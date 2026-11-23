import { z } from 'zod';

export const createUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  email: z.string().email('E-mail inválido').max(150),
  senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(255),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  telefone: z.string().min(1, 'Telefone é obrigatório').max(20),
  cpf: z.string().max(14).optional(),
  sexo: z.string().max(20).optional(),
  cargo: z.enum(['ALUNO', 'PROFISSIONAL', 'ADMIN']).optional(),
  planoId: z.number().int().positive().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
