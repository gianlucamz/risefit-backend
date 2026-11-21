import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client.js';

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

async function main() {
  console.log('🌱 Iniciando seed isolado de planos RiseFit...\n');

  const planosParaCadastrar = [
    {
      nome: 'Essencial',
      descricao: 'O plano ideal para quem está começando e quer cuidar da saúde.',
      preco: 99.9,
      duracaoMeses: 1,
      ativo: true,
    },
    {
      nome: 'Personalizado',
      descricao: 'O plano completo para quem busca resultados com acompanhamento.',
      preco: 139.9,
      duracaoMeses: 1,
      ativo: true,
    },
    {
      nome: 'Premium',
      descricao: 'A experiência completa para quem busca o máximo de resultado.',
      preco: 159.9,
      duracaoMeses: 1,
      ativo: true,
    },
  ];

  for (const item of planosParaCadastrar) {
    const existente = await prisma.plan.findFirst({
      where: {
        OR: [
          { nome: item.nome },
          { nome: { equals: item.nome } },
        ],
      },
    });

    let planoSalvo;
    if (existente) {
      planoSalvo = await prisma.plan.update({
        where: { id: existente.id },
        data: {
          nome: item.nome,
          descricao: item.descricao,
          preco: item.preco,
          duracaoMeses: item.duracaoMeses,
          ativo: item.ativo,
        },
      });
      console.log(
        `🔄 Plano atualizado: ID ${planoSalvo.id} | ${planoSalvo.nome} | R$ ${Number(planoSalvo.preco).toFixed(2)}/mês`,
      );
    } else {
      planoSalvo = await prisma.plan.create({
        data: item,
      });
      console.log(
        `✅ Plano criado: ID ${planoSalvo.id} | ${planoSalvo.nome} | R$ ${Number(planoSalvo.preco).toFixed(2)}/mês`,
      );
    }
  }

  console.log('\n📋 Todos os planos disponíveis no banco de dados:');
  const todosOsPlanos = await prisma.plan.findMany({
    orderBy: { id: 'asc' },
  });

  for (const p of todosOsPlanos) {
    console.log(
      `   - [ID ${p.id}] ${p.nome} - R$ ${Number(p.preco).toFixed(2)} (Ativo: ${p.ativo ? 'SIM' : 'NÃO'})`,
    );
  }

  console.log('\n✨ Seed de planos finalizado com sucesso!');
}

main()
  .catch((error) => {
    console.error('❌ Erro durante a execução do seed de planos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
