import { z } from 'zod';

export const createProfessionalSchema = z
  .object({
    usuarioId: z.coerce.number().int().positive().optional(),
    nome: z.string().trim().min(1, 'Nome é obrigatório').max(100).optional(),
    email: z.string().trim().email('E-mail inválido').max(150).optional(),
    telefone: z.string().trim().max(20).optional(),
    especializacao: z
      .string()
      .trim()
      .min(1, 'Especialização é obrigatória')
      .max(145),
    biografia: z.string().trim().optional().nullable(),
    urlFoto: z
      .string()
      .trim()
      .max(2_000_000, 'A imagem selecionada excede o limite permitido')
      .refine(
        (val) =>
          !val ||
          val.startsWith('/') ||
          /^https?:\/\//i.test(val) ||
          /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(val),
        {
          message:
            'Informe uma URL válida (http/https), caminho relativo (/design/...) ou imagem base64.',
        },
      )
      .optional()
      .nullable(),
    servicos: z.array(z.string().trim().min(1)).optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.usuarioId) || (Boolean(data.nome) && Boolean(data.email)),
    {
      message: 'Informe usuarioId ou nome e e-mail do profissional.',
      path: ['nome'],
    },
  );

export type CreateProfessionalDto = z.infer<typeof createProfessionalSchema>;
