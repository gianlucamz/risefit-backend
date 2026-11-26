import { z } from 'zod';
import {
  CIDADES_VALE_PARAIBA,
  ESTADO_ATENDIMENTO,
} from '../../common/constants/regiao-atendimento.js';

export const createUserAddressSchema = z.object({
  cep: z.string().min(8, 'CEP inválido').max(9),
  estado: z
    .string()
    .trim()
    .toUpperCase()
    .default(ESTADO_ATENDIMENTO)
    .refine((val) => val === ESTADO_ATENDIMENTO, {
      message: 'Atendimento disponível apenas para o estado de São Paulo (SP).',
    }),
  cidade: z
    .string()
    .trim()
    .refine(
      (val) =>
        CIDADES_VALE_PARAIBA.some(
          (c) => c.toLowerCase() === val.toLowerCase(),
        ),
      {
        message:
          'Cidade fora da área de atendimento (Vale do Paraíba e Litoral Norte - SP).',
      },
    )
    .transform(
      (val) =>
        CIDADES_VALE_PARAIBA.find(
          (c) => c.toLowerCase() === val.toLowerCase(),
        ) ?? val,
    ),
  bairro: z.string().min(1, 'Bairro é obrigatório').max(100),
  rua: z.string().min(1, 'Rua é obrigatória').max(150),
  numero: z.string().min(1, 'Número é obrigatório').max(20),
  complemento: z.string().max(100).optional(),
});

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
  endereco: createUserAddressSchema.optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
