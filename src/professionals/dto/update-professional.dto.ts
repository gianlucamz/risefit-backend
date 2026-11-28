import { z } from 'zod';

export const updateProfessionalSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100).optional(),
  email: z.string().trim().email('E-mail inválido').max(150).optional(),
  especializacao: z
    .string()
    .trim()
    .min(1, 'Especialização é obrigatória')
    .max(145)
    .optional(),
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
});

export type UpdateProfessionalDto = z.infer<typeof updateProfessionalSchema>;
