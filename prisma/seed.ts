import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  PrismaClient,
  Prisma,
  Cargo,
  SubscriptionStatus,
  OrderStatus,
  EventParticipantStatus,
  ExerciseLevel,
} from '../src/generated/prisma/client.js';

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
const DEFAULT_PASSWORD = 'SenhaForte@123';

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados RiseFit...\n');

  // ==========================================
  // 1. Planos da Academia (Plan)
  // ==========================================
  console.log('📋 Povoando Planos...');

  const plansToSeed = [
    {
      id: 1,
      nome: 'Plano Essencial',
      descricao:
        'Acesso total à musculação, armários rotativos e avaliação física inicial básica.',
      preco: new Prisma.Decimal(99.9),
      duracaoMeses: 1,
      ativo: true,
    },
    {
      id: 2,
      nome: 'Plano Personalizado',
      descricao:
        'Acesso completo à academia, treinos personalizados e acompanhamento mensal com profissional.',
      preco: new Prisma.Decimal(139.9),
      duracaoMeses: 1,
      ativo: true,
    },
    {
      id: 3,
      nome: 'Plano Premium',
      descricao:
        'Acesso ilimitado a todas as unidades, todas as aulas coletivas e consultoria nutricional periódica.',
      preco: new Prisma.Decimal(159.9),
      duracaoMeses: 1,
      ativo: true,
    },
    {
      id: 4,
      nome: 'Plano Anual - VIP',
      descricao:
        'Acesso VIP irrestrito por 12 meses, todas as aulas coletivas, bioimpedância mensal e kit de boas-vindas RiseFit.',
      preco: new Prisma.Decimal(999.0),
      duracaoMeses: 12,
      ativo: true,
    },
  ];

  const planMap = new Map<number, { id: number; nome: string }>();

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

    planMap.set(seededPlan.id, seededPlan);
    console.log(
      `  ✅ Plano configurado: [ID ${seededPlan.id}] ${seededPlan.nome} (${seededPlan.duracaoMeses} mês(es) - R$ ${Number(seededPlan.preco).toFixed(2)})`,
    );
  }

  // ==========================================
  // 2. Serviços da Plataforma (Service)
  // ==========================================
  console.log('\n🛠️ Povoando Serviços...');

  const servicesToSeed = [
    {
      nome: 'Musculação & Treino de Força',
      descricao:
        'Acesso completo aos equipamentos biomecânicos, pesos livres e área cardiovascular com climatização.',
      ativo: true,
    },
    {
      nome: 'Aulas Coletivas & Funcional',
      descricao:
        'Grade horária com Spinning, Treinamento Funcional, HIIT, Yoga e Pilates de solo.',
      ativo: true,
    },
    {
      nome: 'Avaliação Física & Bioimpedância',
      descricao:
        'Exame detalhado de composição corporal, análise de massa magra/gordura e acompanhamento de métricas evolutivas.',
      ativo: true,
    },
    {
      nome: 'Consultoria Nutricional',
      descricao:
        'Atendimento com nutricionista esportivo parceiro para cálculo de macronutrientes e planejamento alimentar.',
      ativo: true,
    },
    {
      nome: 'Personal Trainer Dedicado',
      descricao:
        'Sessões de treino individualizadas focadas em objetivos específicos: hipertrofia, força ou reabilitação física.',
      ativo: true,
    },
  ];

  const serviceMap = new Map<string, number>();

  for (const s of servicesToSeed) {
    const existing = await prisma.service.findFirst({
      where: { nome: s.nome },
    });

    let serviceId: number;
    if (existing) {
      serviceId = existing.id;
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          descricao: s.descricao,
          ativo: s.ativo,
        },
      });
    } else {
      const created = await prisma.service.create({
        data: s,
      });
      serviceId = created.id;
    }

    serviceMap.set(s.nome, serviceId);
    console.log(`  ✅ Serviço configurado: [ID ${serviceId}] ${s.nome}`);
  }

  // ==========================================
  // 3. Vínculo Planos e Serviços (PlanService)
  // ==========================================
  console.log('\n🔗 Vinculando Serviços aos Planos...');

  const planServiceRelations: { planId: number; serviceNames: string[] }[] = [
    {
      planId: 1, // Essencial
      serviceNames: ['Musculação & Treino de Força'],
    },
    {
      planId: 2, // Personalizado
      serviceNames: [
        'Musculação & Treino de Força',
        'Avaliação Física & Bioimpedância',
        'Personal Trainer Dedicado',
      ],
    },
    {
      planId: 3, // Premium
      serviceNames: [
        'Musculação & Treino de Força',
        'Aulas Coletivas & Funcional',
        'Avaliação Física & Bioimpedância',
        'Consultoria Nutricional',
      ],
    },
    {
      planId: 4, // VIP
      serviceNames: [
        'Musculação & Treino de Força',
        'Aulas Coletivas & Funcional',
        'Avaliação Física & Bioimpedância',
        'Consultoria Nutricional',
        'Personal Trainer Dedicado',
      ],
    },
  ];

  for (const rel of planServiceRelations) {
    for (const serviceName of rel.serviceNames) {
      const servicoId = serviceMap.get(serviceName);
      if (servicoId) {
        await prisma.planService.upsert({
          where: {
            planoId_servicoId: {
              planoId: rel.planId,
              servicoId,
            },
          },
          update: {},
          create: {
            planoId: rel.planId,
            servicoId,
          },
        });
      }
    }
    console.log(
      `  ✅ Serviços vinculados com sucesso ao Plano ID ${rel.planId}`,
    );
  }

  // ==========================================
  // 4. Usuários da Plataforma (User)
  // ==========================================
  console.log('\n👤 Povoando Usuários...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // CPFs matematicamente válidos de acordo com o algoritmo oficial da Receita Federal
  const usersToSeed = [
    {
      nome: 'Administrador RiseFit',
      email: 'admin@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1990-01-15'),
      telefone: '11999998888',
      cpf: '123.456.789-09',
      sexo: 'Masculino',
      cargo: Cargo.ADMIN,
    },
    {
      nome: 'Mariana Personal',
      email: 'mariana.personal@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1993-11-04'),
      telefone: '11977776666',
      cpf: '987.654.321-00',
      sexo: 'Feminino',
      cargo: Cargo.PROFISSIONAL,
    },
    {
      nome: 'Carlos Aluno',
      email: 'carlos.aluno@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1998-06-22'),
      telefone: '11988887777',
      cpf: '456.789.123-64',
      sexo: 'Masculino',
      cargo: Cargo.ALUNO,
    },
    {
      nome: 'Ana Beatriz Silva',
      email: 'ana.silva@risefit.com',
      senha: hashedPassword,
      dataNascimento: new Date('1996-08-10'),
      telefone: '11987654321',
      cpf: '321.654.987-91',
      sexo: 'Feminino',
      cargo: Cargo.ALUNO,
    },
  ];

  const userMap = new Map<string, { id: number; email: string; cargo: Cargo }>();

  for (const user of usersToSeed) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nome: user.nome,
        senha: user.senha,
        dataNascimento: user.dataNascimento,
        telefone: user.telefone,
        cpf: user.cpf,
        sexo: user.sexo,
        cargo: user.cargo,
      },
      create: user,
    });

    userMap.set(seededUser.email, seededUser);
    console.log(
      `  ✅ Usuário configurado: [ID ${seededUser.id}] ${seededUser.email} (${seededUser.cargo}) - CPF: ${user.cpf}`,
    );
  }

  // ==========================================
  // 5. Endereços dos Usuários (Address)
  // ==========================================
  console.log('\n🏠 Povoando Endereços...');

  const addressesToSeed = [
    {
      userEmail: 'carlos.aluno@risefit.com',
      cep: '01310-100',
      estado: 'SP',
      cidade: 'São Paulo',
      bairro: 'Bela Vista',
      rua: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Apto 42',
    },
    {
      userEmail: 'ana.silva@risefit.com',
      cep: '04538-133',
      estado: 'SP',
      cidade: 'São Paulo',
      bairro: 'Itaim Bibi',
      rua: 'Rua Joaquim Floriano',
      numero: '500',
      complemento: 'Conjunto 12',
    },
  ];

  for (const addr of addressesToSeed) {
    const user = userMap.get(addr.userEmail);
    if (!user) continue;

    const existingAddress = await prisma.address.findFirst({
      where: { usuarioId: user.id },
    });

    if (existingAddress) {
      await prisma.address.update({
        where: { id: existingAddress.id },
        data: {
          cep: addr.cep,
          estado: addr.estado,
          cidade: addr.cidade,
          bairro: addr.bairro,
          rua: addr.rua,
          numero: addr.numero,
          complemento: addr.complemento,
        },
      });
      console.log(
        `  ✅ Endereço atualizado para usuário ${addr.userEmail} [ID ${existingAddress.id}]`,
      );
    } else {
      const created = await prisma.address.create({
        data: {
          usuarioId: user.id,
          cep: addr.cep,
          estado: addr.estado,
          cidade: addr.cidade,
          bairro: addr.bairro,
          rua: addr.rua,
          numero: addr.numero,
          complemento: addr.complemento,
        },
      });
      console.log(
        `  ✅ Endereço criado para usuário ${addr.userEmail} [ID ${created.id}]`,
      );
    }
  }

  // ==========================================
  // 6. Perfil Profissional (Professional)
  // ==========================================
  console.log('\n🏋️ Povoando Profissionais...');

  const professionalUser = userMap.get('mariana.personal@risefit.com');
  let professionalId: number | null = null;

  if (professionalUser) {
    const seededProfessional = await prisma.professional.upsert({
      where: { usuarioId: professionalUser.id },
      update: {
        especializacao:
          'Personal Trainer & Treinamento Funcional (CREF 045123-G/SP)',
        biografia:
          'Bacharel em Educação Física pela USP, especialista em biomecânica da musculação, hipertrofia e reabilitação postural com mais de 8 anos de experiência.',
        urlFoto:
          'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400',
        ativo: true,
      },
      create: {
        usuarioId: professionalUser.id,
        especializacao:
          'Personal Trainer & Treinamento Funcional (CREF 045123-G/SP)',
        biografia:
          'Bacharel em Educação Física pela USP, especialista em biomecânica da musculação, hipertrofia e reabilitação postural com mais de 8 anos de experiência.',
        urlFoto:
          'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400',
        ativo: true,
      },
    });

    professionalId = seededProfessional.id;
    console.log(
      `  ✅ Profissional configurado: [ID ${seededProfessional.id}] (Usuário ID: ${seededProfessional.usuarioId}) - ${seededProfessional.especializacao}`,
    );

    // Vínculo do profissional com os serviços que ele presta
    const profServices = [
      'Personal Trainer Dedicado',
      'Avaliação Física & Bioimpedância',
      'Consultoria Nutricional',
    ];

    for (const serviceName of profServices) {
      const servicoId = serviceMap.get(serviceName);
      if (servicoId) {
        await prisma.professionalService.upsert({
          where: {
            profissionalId_servicoId: {
              profissionalId: seededProfessional.id,
              servicoId,
            },
          },
          update: {},
          create: {
            profissionalId: seededProfessional.id,
            servicoId,
          },
        });
      }
    }
    console.log(
      `  ✅ Serviços vinculados com sucesso ao Profissional ID ${seededProfessional.id}`,
    );
  }

  // ==========================================
  // 7. Produtos do E-commerce (Product)
  // ==========================================
  console.log('\n🛍️ Povoando Produtos...');

  const productsToSeed = [
    {
      nome: '100% Whey Protein Isolado (900g)',
      descricao:
        'Proteína de alto valor biológico com rápida absorção celular, 27g de proteína por dose e zero adição de açúcar.',
      preco: 189.9,
      estoque: 50,
      urlImagem:
        'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=400',
      ativo: true,
    },
    {
      nome: 'Creatina Monohidratada 100% Pura (300g)',
      descricao:
        'Creatina pura micronizada de absorção rápida, promovendo ganho de força explosiva e aumento de volume muscular.',
      preco: 89.9,
      estoque: 80,
      urlImagem:
        'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400',
      ativo: true,
    },
    {
      nome: 'Pré-Treino Focus & Energy (300g)',
      descricao:
        'Fórmula termogênica avançada com cafeína anidra, beta-alanina e taurina para intensidade e foco nos treinos pesados.',
      preco: 129.9,
      estoque: 35,
      urlImagem:
        'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&q=80&w=400',
      ativo: true,
    },
    {
      nome: 'Coqueteleira Blender RiseFit Pro (700ml)',
      descricao:
        'Coqueteleira com mola misturadora em aço cirúrgico, livre de BPA com sistema de fechamento 100% anti-vazamento.',
      preco: 34.9,
      estoque: 100,
      urlImagem:
        'https://images.unsplash.com/photo-1514995669114-6081e934b693?auto=format&fit=crop&q=80&w=400',
      ativo: true,
    },
    {
      nome: 'Barra de Proteína Crisp Caixa c/ 12 unid.',
      descricao:
        'Snack proteico prático e crocante com 15g de proteína por barra, sabor chocolate belga e avelã torrada.',
      preco: 96.0,
      estoque: 40,
      urlImagem:
        'https://images.unsplash.com/photo-1622484216802-9a7c37666dfa?auto=format&fit=crop&q=80&w=400',
      ativo: true,
    },
    {
      nome: 'Kit Mini Bands - 5 Elásticos de Resistência',
      descricao:
        'Conjunto com 5 níveis progressivos de tensão em látex natural para ativação glútea, mobilidade e exercícios em casa.',
      preco: 49.9,
      estoque: 60,
      urlImagem:
        'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&q=80&w=400',
      ativo: true,
    },
  ];

  const productMap = new Map<
    string,
    { id: number; nome: string; preco: Prisma.Decimal }
  >();

  for (const p of productsToSeed) {
    const existing = await prisma.product.findFirst({
      where: { nome: p.nome },
    });

    let productRecord: { id: number; nome: string; preco: Prisma.Decimal };

    if (existing) {
      productRecord = await prisma.product.update({
        where: { id: existing.id },
        data: {
          descricao: p.descricao,
          preco: new Prisma.Decimal(p.preco),
          estoque: p.estoque,
          urlImagem: p.urlImagem,
          ativo: p.ativo,
        },
      });
    } else {
      productRecord = await prisma.product.create({
        data: {
          nome: p.nome,
          descricao: p.descricao,
          preco: new Prisma.Decimal(p.preco),
          estoque: p.estoque,
          urlImagem: p.urlImagem,
          ativo: p.ativo,
        },
      });
    }

    productMap.set(p.nome, productRecord);
    console.log(
      `  ✅ Produto configurado: [ID ${productRecord.id}] ${p.nome} - R$ ${Number(productRecord.preco).toFixed(2)} (Estoque: ${p.estoque})`,
    );
  }

  // ==========================================
  // 8. Exercícios (Exercise)
  // ==========================================
  console.log('\n🏋️‍♂️ Povoando Exercícios...');

  const exercisesToSeed = [
    {
      nome: 'Supino Reto com Barra',
      grupoMuscular: 'Peito',
      descricao:
        'Exercício multiarticular fundamental para hipertrofia peitoral, deltoides anteriores e tríceps.',
      passoAPasso:
        '1. Deite-se no banco mantendo os pés firmes no chão e escápulas aduzidas.\n2. Segure a barra um pouco além da largura dos ombros.\n3. Desça a barra de forma controlada até tocar suavemente o peitoral médio.\n4. Empurre com força de volta à posição inicial sem travar os cotovelos.',
      errosComuns:
        'Hiperextensão descontrolada da lombar, rebater a barra no peito e afastar os cotovelos a 90 graus.',
      nivel: ExerciseLevel.INTERMEDIARIO,
      urlVideo: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
      ativo: true,
    },
    {
      nome: 'Agachamento Livre com Barra',
      grupoMuscular: 'Pernas',
      descricao:
        'O exercício construtor essencial para membros inferiores: quadríceps, glúteos e estabilizadores do tronco.',
      passoAPasso:
        '1. Apoie a barra no trapézio superior com pés alinhados à largura dos ombros.\n2. Mantenha o abdômen travado e inicie flexionando os quadris para trás.\n3. Desça flexionando os joelhos até as coxas ficarem paralelas ao chão.\n4. Suba empurrando pelo calcanhar e respirando na fase concêntrica.',
      errosComuns:
        'Valgo dinâmico nos joelhos, calcanhares descolando do chão e perda de curvatura neutra na coluna.',
      nivel: ExerciseLevel.INTERMEDIARIO,
      urlVideo: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
      ativo: true,
    },
    {
      nome: 'Puxada Alta no Pulley',
      grupoMuscular: 'Costas',
      descricao:
        'Focado no desenvolvimento da asa dorsal, trapézio médio, romboides e flexores do cotovelo.',
      passoAPasso:
        '1. Ajuste os rolos de apoio sobre as coxas e segure a barra com pegada pronada aberta.\n2. Puxe a barra em direção ao topo do peitoral contraindo as costas.\n3. Faça uma pausa de 1 segundo de pico de contração.\n4. Retorne devagar permitindo o alongamento controlado do grande dorsal.',
      errosComuns:
        'Puxar a barra atrás da nuca, usar balanço excessivo do tronco e elevar os ombros tensionando o pescoço.',
      nivel: ExerciseLevel.INICIANTE,
      urlVideo: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
      ativo: true,
    },
    {
      nome: 'Elevação Lateral com Halteres',
      grupoMuscular: 'Ombros',
      descricao:
        'Exercício de isolamento direcionado para desenvolvimento da cabeça lateral do deltoide.',
      passoAPasso:
        '1. Em pé, mantenha os pés na largura do quadril e um halter em cada mão com cotovelos levemente flexionados.\n2. Eleve os braços lateralmente até o nível dos ombros guiando pelos cotovelos.\n3. Pause brevemente e retorne controlando a descida em 2 segundos.',
      errosComuns:
        'Usar impulso lombar com carga excessiva e elevar os pulsos acima da linha dos cotovelos.',
      nivel: ExerciseLevel.INICIANTE,
      urlVideo: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
      ativo: true,
    },
    {
      nome: 'Rosca Direta com Halteres',
      grupoMuscular: 'Braços',
      descricao:
        'Exercício básico para ativação máxima do bíceps braquial e braquiorradial.',
      passoAPasso:
        '1. Segure os halteres ao lado do corpo com as palmas voltadas para a frente.\n2. Mantenha os cotovelos fixos ao lado do tronco e flexione os antebraços.\n3. Contraia o bíceps no topo do movimento por 1 segundo.\n4. Desça de forma controlada até a extensão quase completa.',
      errosComuns:
        'Projetar cotovelos para frente no topo e balançar as costas para iniciar o movimento.',
      nivel: ExerciseLevel.INICIANTE,
      urlVideo: 'https://www.youtube.com/watch?v=in7PaeYlhrM',
      ativo: true,
    },
    {
      nome: 'Tríceps Corda no Pulley',
      grupoMuscular: 'Braços',
      descricao:
        'Isolamento muscular com ênfase na cabeça lateral e longa do tríceps braquial.',
      passoAPasso:
        '1. Fixe a corda na polia alta e segure nas pontas com pegada neutra.\n2. Mantenha os cotovelos fixados ao lado do corpo e o tronco levemente inclinado.\n3. Estenda os braços para baixo e abra as pontas da corda na contração máxima.\n4. Retorne controlando o peso até os antebraços formarem 90 graus.',
      errosComuns:
        'Mover os cotovelos para frente e para trás e usar o peso do corpo para empurrar o cabo.',
      nivel: ExerciseLevel.INICIANTE,
      urlVideo: 'https://www.youtube.com/watch?v=vB5OHsJ3EME',
      ativo: true,
    },
    {
      nome: 'Levantamento Terra',
      grupoMuscular: 'Costas',
      descricao:
        'Movimento global de força que desenvolve toda a cadeia posterior: lombar, glúteos, isquiotibiais e antebraços.',
      passoAPasso:
        '1. Posicione a barra próxima às canelas com pés na largura do quadril.\n2. Flexione os quadris e joelhos mantendo o peito erguido e coluna neutra.\n3. Segure a barra firmemente e realize o levantamento estendendo pernas e tronco sincronizadamente.\n4. Fique ereto sem arquear a lombar para trás e retorne ao solo controladamente.',
      errosComuns:
        'Arredondar a coluna lombar (cifose), afastar a barra do corpo e dobrar os braços ao tracionar o peso.',
      nivel: ExerciseLevel.AVANCADO,
      urlVideo: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
      ativo: true,
    },
    {
      nome: 'Prancha Abdominal Estática',
      grupoMuscular: 'Abdômen',
      descricao:
        'Contração isométrica de excelência para estabilidade articular da coluna e fortalecimento do transverso do abdômen.',
      passoAPasso:
        '1. Apoie os antebraços e pontas dos pés no colchonete mantendo cotovelos sob os ombros.\n2. Alinhe o pescoço, tronco e pernas em uma linha reta perfeita.\n3. Contraia o abdômen e glúteos vigorosamente durante toda a sustentação.\n4. Mantenha a respiração compassada e suave sem prender o ar.',
      errosComuns:
        'Deixar o quadril cair em direção ao chão e elevar o quadril formando um ângulo acentuado.',
      nivel: ExerciseLevel.INICIANTE,
      urlVideo: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      ativo: true,
    },
  ];

  for (const ex of exercisesToSeed) {
    const existing = await prisma.exercise.findFirst({
      where: { nome: ex.nome },
    });

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          grupoMuscular: ex.grupoMuscular,
          descricao: ex.descricao,
          passoAPasso: ex.passoAPasso,
          errosComuns: ex.errosComuns,
          nivel: ex.nivel,
          urlVideo: ex.urlVideo,
          ativo: ex.ativo,
        },
      });
      console.log(
        `  ✅ Exercício atualizado: [ID ${existing.id.toString()}] ${ex.nome} (${ex.grupoMuscular} - ${ex.nivel})`,
      );
    } else {
      const created = await prisma.exercise.create({
        data: ex,
      });
      console.log(
        `  ✅ Exercício criado: [ID ${created.id.toString()}] ${ex.nome} (${ex.grupoMuscular} - ${ex.nivel})`,
      );
    }
  }

  // ==========================================
  // 9. Assinaturas (Subscription)
  // ==========================================
  console.log('\n📄 Povoando Assinaturas...');

  const subscriptionsToSeed = [
    {
      userEmail: 'carlos.aluno@risefit.com',
      planId: 2, // Plano Personalizado
      dataInicio: new Date('2026-10-01'),
      dataFim: new Date('2026-12-31'),
      status: SubscriptionStatus.ATIVA,
    },
    {
      userEmail: 'ana.silva@risefit.com',
      planId: 1, // Plano Essencial
      dataInicio: new Date('2026-11-01'),
      dataFim: new Date('2026-12-01'),
      status: SubscriptionStatus.ATIVA,
    },
  ];

  for (const sub of subscriptionsToSeed) {
    const user = userMap.get(sub.userEmail);
    if (!user) continue;

    const existingSub = await prisma.subscription.findFirst({
      where: { usuarioId: user.id },
    });

    if (existingSub) {
      const updated = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          planoId: sub.planId,
          dataInicio: sub.dataInicio,
          dataFim: sub.dataFim,
          status: sub.status,
        },
      });
      console.log(
        `  ✅ Assinatura atualizada: Usuário ${sub.userEmail} [Assinatura ID: ${updated.id}, Status: ${updated.status}]`,
      );
    } else {
      const created = await prisma.subscription.create({
        data: {
          usuarioId: user.id,
          planoId: sub.planId,
          dataInicio: sub.dataInicio,
          dataFim: sub.dataFim,
          status: sub.status,
        },
      });
      console.log(
        `  ✅ Assinatura criada: Usuário ${sub.userEmail} [Assinatura ID: ${created.id}, Status: ${created.status}]`,
      );
    }
  }

  // ==========================================
  // 10. Pedidos, Itens e Pagamentos (Order, OrderProduct, Payment)
  // ==========================================
  console.log('\n🛒 Povoando Pedidos e Pagamentos...');

  const whey = productMap.get('100% Whey Protein Isolado (900g)');
  const creatina = productMap.get('Creatina Monohidratada 100% Pura (300g)');
  const coqueteleira = productMap.get('Coqueteleira Blender RiseFit Pro (700ml)');
  const preTreino = productMap.get('Pré-Treino Focus & Energy (300g)');
  const miniBands = productMap.get('Kit Mini Bands - 5 Elásticos de Resistência');

  const ordersToSeed = [
    {
      userEmail: 'carlos.aluno@risefit.com',
      status: OrderStatus.CONFIRMADO,
      formaPagamento: 'credito',
      itens: [
        { product: whey!, quantidade: 1 },
        { product: creatina!, quantidade: 1 },
        { product: coqueteleira!, quantidade: 1 },
      ],
      pagamento: {
        token: 'tok_mastercard_carlos_risefit_1234',
        bandeira: 'Mastercard',
        ultimosDigitos: '4242',
      },
    },
    {
      userEmail: 'ana.silva@risefit.com',
      status: OrderStatus.ENTREGUE,
      formaPagamento: 'credito',
      itens: [
        { product: preTreino!, quantidade: 1 },
        { product: miniBands!, quantidade: 1 },
      ],
      pagamento: {
        token: 'tok_visa_ana_risefit_5678',
        bandeira: 'Visa',
        ultimosDigitos: '8899',
      },
    },
  ];

  for (const o of ordersToSeed) {
    const user = userMap.get(o.userEmail);
    if (!user) continue;

    // Calcular valores dos itens
    let orderTotal = new Prisma.Decimal(0);
    const preparedItems = o.itens
      .filter((i) => i.product)
      .map((i) => {
        const precoUnitario = i.product.preco;
        const subtotal = precoUnitario.mul(i.quantidade);
        orderTotal = orderTotal.add(subtotal);
        return {
          produtoId: i.product.id,
          quantidade: i.quantidade,
          precoUnitario,
          subtotal,
        };
      });

    const existingOrder = await prisma.order.findFirst({
      where: { usuarioId: user.id },
      include: { itens: true, pagamento: true },
    });

    let orderId: number;

    if (existingOrder) {
      orderId = existingOrder.id;
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: o.status,
          formaPagamento: o.formaPagamento,
          total: orderTotal,
        },
      });

      // Upsert pagamento
      if (existingOrder.pagamento) {
        await prisma.payment.update({
          where: { id: existingOrder.pagamento.id },
          data: {
            token: o.pagamento.token,
            bandeira: o.pagamento.bandeira,
            ultimosDigitos: o.pagamento.ultimosDigitos,
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            pedidoId: existingOrder.id,
            token: o.pagamento.token,
            bandeira: o.pagamento.bandeira,
            ultimosDigitos: o.pagamento.ultimosDigitos,
          },
        });
      }

      // Upsert itens
      for (const item of preparedItems) {
        await prisma.orderProduct.upsert({
          where: {
            pedidoId_produtoId: {
              pedidoId: existingOrder.id,
              produtoId: item.produtoId,
            },
          },
          update: {
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          },
          create: {
            pedidoId: existingOrder.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          },
        });
      }

      console.log(
        `  ✅ Pedido atualizado: [ID ${orderId}] Usuário: ${o.userEmail} - Total: R$ ${Number(orderTotal).toFixed(2)} (${o.status})`,
      );
    } else {
      const createdOrder = await prisma.order.create({
        data: {
          usuarioId: user.id,
          status: o.status,
          formaPagamento: o.formaPagamento,
          total: orderTotal,
          itens: {
            create: preparedItems,
          },
          pagamento: {
            create: o.pagamento,
          },
        },
      });
      orderId = createdOrder.id;
      console.log(
        `  ✅ Pedido criado: [ID ${orderId}] Usuário: ${o.userEmail} - Total: R$ ${Number(orderTotal).toFixed(2)} (${o.status})`,
      );
    }
  }

  // ==========================================
  // 11. Eventos e Participantes (Event, EventParticipant)
  // ==========================================
  console.log('\n📅 Povoando Eventos e Participantes...');

  const eventsToSeed = [
    {
      titulo: 'Workshop RiseFit: Nutrição, Suplementação & Performance',
      descricao:
        'Imersão teórico-prática ministrada por especialistas para otimizar dietas, cronograma de suplementação e performance desportiva.',
      local: 'Auditório Principal - RiseFit Jardins (SP)',
      horarioInicio: new Date('2026-11-28T09:00:00Z'),
      horarioFim: new Date('2026-11-28T13:00:00Z'),
      capacidade: 50,
      participantEmails: [
        'carlos.aluno@risefit.com',
        'ana.silva@risefit.com',
      ],
    },
    {
      titulo: 'Desafio RiseFit 5K - Corrida de Rua',
      descricao:
        'Circuito de 5km no Parque Ibirapuera para incentivo cardiovascular de alunos com hidratação, fotos e medalhas exclusivas.',
      local: 'Parque Ibirapuera - Portão 7 (SP)',
      horarioInicio: new Date('2026-12-05T07:30:00Z'),
      horarioFim: new Date('2026-12-05T10:30:00Z'),
      capacidade: 120,
      participantEmails: ['carlos.aluno@risefit.com'],
    },
  ];

  for (const ev of eventsToSeed) {
    const existingEvent = await prisma.event.findFirst({
      where: { titulo: ev.titulo },
    });

    let eventId: number;

    if (existingEvent) {
      eventId = existingEvent.id;
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: {
          descricao: ev.descricao,
          local: ev.local,
          horarioInicio: ev.horarioInicio,
          horarioFim: ev.horarioFim,
          capacidade: ev.capacidade,
        },
      });
      console.log(`  ✅ Evento atualizado: [ID ${eventId}] ${ev.titulo}`);
    } else {
      const createdEvent = await prisma.event.create({
        data: {
          titulo: ev.titulo,
          descricao: ev.descricao,
          local: ev.local,
          horarioInicio: ev.horarioInicio,
          horarioFim: ev.horarioFim,
          capacidade: ev.capacidade,
        },
      });
      eventId = createdEvent.id;
      console.log(`  ✅ Evento criado: [ID ${eventId}] ${ev.titulo}`);
    }

    // Registrar participantes
    for (const email of ev.participantEmails) {
      const user = userMap.get(email);
      if (user) {
        await prisma.eventParticipant.upsert({
          where: {
            usuarioId_eventoId: {
              usuarioId: user.id,
              eventoId: eventId,
            },
          },
          update: {
            status: EventParticipantStatus.INSCRITO,
          },
          create: {
            usuarioId: user.id,
            eventoId: eventId,
            status: EventParticipantStatus.INSCRITO,
          },
        });
        console.log(
          `    👉 Participante inscrito: ${email} no Evento ID ${eventId}`,
        );
      }
    }
  }

  console.log('\n✨ Seed RiseFit finalizado com 100% de sucesso!');
}

main()
  .catch((error) => {
    console.error('❌ Erro durante a execução do seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
