import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Cargo } from '../src/generated/prisma/client.js';
import { seedProfissionais } from './seed-profissionais.js';

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

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...\n');

  // ==========================================
  // 1. Seed de Planos da Academia
  // ==========================================
  console.log('📋 Povoando Planos...');

  const plansToSeed = [
    {
      id: 1,
      nome: 'Essencial',
      descricao: 'O plano ideal para quem está começando e quer cuidar da saúde.',
      preco: 99.9,
      duracaoMeses: 1,
      ativo: true,
    },
    {
      id: 2,
      nome: 'Personalizado',
      descricao: 'O plano completo para quem busca resultados com acompanhamento.',
      preco: 139.9,
      duracaoMeses: 1,
      ativo: true,
    },
    {
      id: 3,
      nome: 'Premium',
      descricao: 'A experiência completa para quem busca o máximo de resultado.',
      preco: 159.9,
      duracaoMeses: 1,
      ativo: true,
    },
  ];

  for (const plan of plansToSeed) {
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [{ id: plan.id }, { nome: plan.nome }],
      },
    });

    const targetId = existingPlan ? existingPlan.id : plan.id;

    const seededPlan = await prisma.plan.upsert({
      where: { id: targetId },
      update: {
        nome: plan.nome,
        descricao: plan.descricao,
        preco: plan.preco,
        duracaoMeses: plan.duracaoMeses,
        ativo: plan.ativo,
      },
      create: {
        id: plan.id,
        nome: plan.nome,
        descricao: plan.descricao,
        preco: plan.preco,
        duracaoMeses: plan.duracaoMeses,
        ativo: plan.ativo,
      },
    });

    console.log(
      `✅ Plano configurado: ${seededPlan.nome} [${seededPlan.duracaoMeses} mês(es) - R$ ${Number(seededPlan.preco).toFixed(2)}]`,
    );
  }

  // ==========================================
  // 2. Seed de Usuários
  // ==========================================
  console.log('\n👤 Povoando Usuários...');

  const defaultPassword = 'SenhaForte@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  const usersToSeed = [
    {
      nome: 'Administrador RiseFit',
      email: 'admin@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1990-01-15'),
      telefone: '11999998888',
      cargo: Cargo.ADMIN,
    },
    {
      nome: 'Carlos Aluno',
      email: 'carlos.aluno@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1998-06-22'),
      telefone: '11988887777',
      cargo: Cargo.ALUNO,
    },
    {
      nome: 'Mariana Personal',
      email: 'mariana.personal@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1993-11-04'),
      telefone: '11977776666',
      cargo: Cargo.PROFISSIONAL,
    },
  ];

  for (const user of usersToSeed) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nome: user.nome,
        senha: user.senha,
        dataNascimento: user.dataNascimento,
        telefone: user.telefone,
        cargo: user.cargo,
      },
      create: user,
    });

    console.log(`✅ Usuário configurado: ${seededUser.email} [${seededUser.cargo}]`);
  }

  // ==========================================
  // 3. Seed de Profissionais
  // ==========================================
  await seedProfissionais(prisma);

  console.log('\n✨ Seed finalizado com sucesso!');
}

main()
  .catch((error) => {
    console.error('❌ Erro durante a execução do seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
