import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Cargo } from '../src/generated/prisma/client.js';

if (!process.env.DATABASE_URL) {
  throw new Error('A variável de ambiente DATABASE_URL não foi definida.');
}

const url = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

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

  console.log('✨ Seed finalizado com sucesso!');
}

main()
  .catch((error) => {
    console.error('❌ Erro durante a execução do seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

