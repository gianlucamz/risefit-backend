import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Cargo } from '../src/generated/prisma/client.js';

const SALT_ROUNDS = 10;

interface ProfissionalSeedItem {
  nome: string;
  email: string;
  dataNascimento: Date;
  telefone: string;
  especializacao: string;
  biografia: string;
  urlFoto: string;
  servicos: { nome: string; descricao: string }[];
}

const PROFISSIONAIS_SEED: ProfissionalSeedItem[] = [
  {
    nome: 'Lucas Andrade',
    email: 'lucas.andrade@risefit.com',
    dataNascimento: new Date('1992-04-18'),
    telefone: '12991112233',
    especializacao: 'Personal Trainer • CREF 123456-G/SP',
    biografia:
      'Bacharel em Educação Física e pós-graduado em Fisiologia do Exercício. Foco em treinos progressivos de hipertrofia e condicionamento físico com técnica segura e acompanhamento próximo.',
    urlFoto: '/design/prof-lucas.jpg',
    servicos: [
      {
        nome: 'Hipertrofia',
        descricao: 'Treinamento voltado ao ganho de massa muscular e força.',
      },
      {
        nome: 'Condicionamento físico',
        descricao: 'Melhora da capacidade cardiorrespiratória e resistência.',
      },
      {
        nome: 'Treino de força',
        descricao: 'Periodização para aumento de carga e desempenho.',
      },
    ],
  },
  {
    nome: 'Mariana Costa',
    email: 'mariana.personal@risefit.com',
    dataNascimento: new Date('1993-11-04'),
    telefone: '12992223344',
    especializacao: 'Nutricionista Esportiva • CRN 12345/SP',
    biografia:
      'Especialista em nutrição esportiva e comportamental. Planos alimentares personalizados com base nas suas necessidades, rotina e preferências para emagrecimento e performance.',
    urlFoto: '/design/prof-mariana.jpg',
    servicos: [
      {
        nome: 'Nutrição esportiva',
        descricao: 'Planejamento alimentar voltado para performance e recuperação.',
      },
      {
        nome: 'Emagrecimento',
        descricao: 'Estratégias sustentáveis para redução de gordura corporal.',
      },
      {
        nome: 'Saúde e bem-estar',
        descricao: 'Reeducação alimentar e hábitos saudáveis no dia a dia.',
      },
    ],
  },
  {
    nome: 'Rafael Oliveira',
    email: 'rafael.oliveira@risefit.com',
    dataNascimento: new Date('1990-08-27'),
    telefone: '12993334455',
    especializacao: 'Fisioterapeuta Esportivo • CREFITO 3/123456-F',
    biografia:
      'Especialista em fisioterapia esportiva e reabilitação musculoesquelética. Foco em recuperação de lesões, alívio de dor muscular e ganho de mobilidade com exercícios adaptados.',
    urlFoto: '/design/prof-rafael.jpg',
    servicos: [
      {
        nome: 'Reabilitação',
        descricao: 'Recuperação funcional segura após lesões articulares e musculares.',
      },
      {
        nome: 'Dor muscular',
        descricao: 'Avaliação e tratamento de sobrecargas e dores recorrentes.',
      },
      {
        nome: 'Mobilidade',
        descricao: 'Ganho de amplitude articular e prevenção de lesões.',
      },
    ],
  },
];

export async function seedProfissionais(prisma: PrismaClient) {
  console.log('\n🏋️ Povoando Profissionais e Serviços...');

  const senhaPadrao = await bcrypt.hash('SenhaForte@123', SALT_ROUNDS);

  for (const item of PROFISSIONAIS_SEED) {
    const usuario = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        nome: item.nome,
        dataNascimento: item.dataNascimento,
        telefone: item.telefone,
        cargo: Cargo.PROFISSIONAL,
      },
      create: {
        nome: item.nome,
        email: item.email,
        senha: senhaPadrao,
        dataNascimento: item.dataNascimento,
        telefone: item.telefone,
        cargo: Cargo.PROFISSIONAL,
      },
    });

    const profissional = await prisma.professional.upsert({
      where: { usuarioId: usuario.id },
      update: {
        especializacao: item.especializacao,
        biografia: item.biografia,
        urlFoto: item.urlFoto,
        ativo: true,
      },
      create: {
        usuarioId: usuario.id,
        especializacao: item.especializacao,
        biografia: item.biografia,
        urlFoto: item.urlFoto,
        ativo: true,
      },
    });

    for (const srv of item.servicos) {
      const servicoExistente = await prisma.service.findFirst({
        where: { nome: srv.nome },
      });

      const servico = servicoExistente
        ? await prisma.service.update({
            where: { id: servicoExistente.id },
            data: { descricao: srv.descricao, ativo: true },
          })
        : await prisma.service.create({
            data: { nome: srv.nome, descricao: srv.descricao, ativo: true },
          });

      await prisma.professionalService.upsert({
        where: {
          profissionalId_servicoId: {
            profissionalId: profissional.id,
            servicoId: servico.id,
          },
        },
        update: {},
        create: {
          profissionalId: profissional.id,
          servicoId: servico.id,
        },
      });
    }

    console.log(
      `✅ Profissional configurado: ID ${profissional.id} | ${usuario.nome} (${item.especializacao}) | ${item.servicos.length} serviço(s)`,
    );
  }
}

const executadoDiretamente =
  process.argv[1]?.replace(/\\/g, '/').endsWith('seed-profissionais.ts') ?? false;

if (executadoDiretamente) {
  if (!process.env.DATABASE_URL) {
    throw new Error('A variável de ambiente DATABASE_URL não foi definida.');
  }

  const url = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });

  const prisma = new PrismaClient({ adapter });

  seedProfissionais(prisma)
    .then(() => {
      console.log('\n✨ Seed de profissionais finalizado com sucesso!');
    })
    .catch((error) => {
      console.error('❌ Erro durante o seed de profissionais:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
