/**
 * Seed de dados de demonstração.
 *
 * IMPORTANTE: nenhum dado de catequizando aqui é real. Nomes de
 * catequizandos usam o padrão "Catequizando(a) Exemplo NNN" propositalmente,
 * para deixar claro que são fictícios (especificação, seções 61/62).
 * Nomes de catequistas são fictícios, mas em formato de nome comum
 * brasileiro para fins de demonstração de interface.
 *
 * Executar com: npm run db:seed
 */
import {
  PrismaClient,
  Period,
  Weekday,
  ClassStatus,
  EventCategory,
  EventVisibility,
  EventStatus,
  DocumentCategory,
  DocumentType,
  DocumentVisibility,
  NoticeStatus,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { OFFICIAL_LEVELS, OFFICIAL_COMMUNITIES } from "../src/lib/constants";
import { buildClassIdentifierBase, generateClassIdentifier } from "../src/lib/classIdentifier";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Catequese@2026";
const STORAGE_DIR = path.join(process.cwd(), process.env.STORAGE_DIR || "storage/repository");

async function main() {
  console.log("→ Limpando dados existentes...");
  await prisma.auditLog.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.repositoryDocument.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.catechumen.deleteMany();
  await prisma.classYearRecordCatechist.deleteMany();
  await prisma.classYearRecord.deleteMany();
  await prisma.catechistOnClass.deleteMany();
  await prisma.class.deleteMany();
  await prisma.catechist.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.level.deleteMany();
  await prisma.community.deleteMany();

  console.log("→ Criando comunidades oficiais...");
  const communities: Record<string, { id: string }> = {};
  for (const c of OFFICIAL_COMMUNITIES) {
    communities[c.sigla] = await prisma.community.create({
      data: { name: c.name, sigla: c.sigla },
    });
  }

  console.log("→ Criando níveis oficiais...");
  const levels: Record<string, { id: string; usesYearRange: boolean }> = {};
  for (const l of OFFICIAL_LEVELS) {
    levels[l.slug] = await prisma.level.create({
      data: {
        name: l.name,
        slug: l.slug,
        description: l.description,
        order: l.order,
        usesYearRange: l.usesYearRange,
      },
    });
  }

  console.log("→ Criando usuários administrativos...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.create({
    data: {
      name: "Coordenação Paroquial da Catequese",
      email: "admin@catequesesjo.org.br",
      passwordHash,
      role: Role.ADMIN,
      active: true,
    },
  });
  await prisma.user.create({
    data: {
      name: "Responsável pelo nível Jovens",
      email: "jovens@catequesesjo.org.br",
      passwordHash,
      role: Role.LEVEL_RESPONSIBLE,
      active: true,
      responsibleLevelId: levels["jovens"].id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Responsável pelo nível Crianças",
      email: "criancas@catequesesjo.org.br",
      passwordHash,
      role: Role.LEVEL_RESPONSIBLE,
      active: true,
      responsibleLevelId: levels["criancas"].id,
    },
  });

  console.log("→ Criando salas...");
  const rooms: Record<string, { id: string }> = {};
  const roomDefs: Array<[string, string, string, number]> = [
    ["sjop-1", "sjop", "Sala 1", 20],
    ["sjop-2", "sjop", "Sala 2", 18],
    ["sjop-3", "sjop", "Sala 3", 25],
    ["sjop-salao", "sjop", "Salão Paroquial", 60],
    ["stcz-1", "stcz", "Sala 1", 15],
    ["stcz-2", "stcz", "Sala 2", 15],
    ["sgab-1", "sgab", "Sala 1", 15],
    ["sgab-2", "sgab", "Sala 2", 15],
  ];
  for (const [key, sigla, name, capacity] of roomDefs) {
    rooms[key] = await prisma.room.create({
      data: { name, capacity, communityId: communities[sigla].id, active: true },
    });
  }

  console.log("→ Criando catequistas...");
  const catechistNames = [
    "João Batista Ferreira",
    "Maria Aparecida Souza",
    "Pedro Henrique Lima",
    "Ana Paula Rocha",
    "Carlos Eduardo Santos",
    "Fernanda Oliveira Costa",
    "Rafael Augusto Pereira",
    "Juliana Martins Alves",
    "Bruno César Ribeiro",
    "Camila Fernandes Dias",
    "Lucas Gabriel Nunes",
    "Patrícia Regina Gomes",
    "Thiago Henrique Barros",
    "Vanessa Cristina Melo",
  ];
  const catechists: Record<string, { id: string }> = {};
  for (const name of catechistNames) {
    catechists[name] = await prisma.catechist.create({ data: { name, active: true } });
  }
  catechists["Catequista Exemplo Inativo"] = await prisma.catechist.create({
    data: { name: "Catequista Exemplo Inativo", active: false },
  });

  // --------------------------------------------------------------------
  // Turmas
  // --------------------------------------------------------------------
  console.log("→ Criando turmas...");
  const createdPublicIds: string[] = [];

  async function createClass(input: {
    levelSlug: string;
    communitySigla: string;
    period: Period;
    weekday: Weekday;
    startTime: string;
    endTime: string;
    roomKey?: string;
    status: ClassStatus;
    startYear?: number;
    endYear?: number;
    catechumensCountOverride?: number | null;
    catechistNames?: string[];
    notes?: string;
  }) {
    const level = levels[input.levelSlug];
    const base = buildClassIdentifierBase({
      levelSlug: input.levelSlug,
      communitySigla: input.communitySigla,
      period: input.period,
      usesYearRange: level.usesYearRange,
      startYear: input.startYear,
      endYear: input.endYear,
    });
    const publicId = generateClassIdentifier(
      {
        levelSlug: input.levelSlug,
        communitySigla: input.communitySigla,
        period: input.period,
        usesYearRange: level.usesYearRange,
        startYear: input.startYear,
        endYear: input.endYear,
      },
      createdPublicIds
    );
    createdPublicIds.push(publicId);
    const suffix = publicId === base ? null : Number(publicId.slice(base.length + 1));

    const cls = await prisma.class.create({
      data: {
        publicId,
        levelId: level.id,
        communityId: communities[input.communitySigla].id,
        period: input.period,
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime,
        roomId: input.roomKey ? rooms[input.roomKey].id : null,
        status: input.status,
        startYear: input.startYear ?? null,
        endYear: input.endYear ?? null,
        suffix,
        catechumensCountOverride: input.catechumensCountOverride ?? null,
        notes: input.notes ?? null,
      },
    });

    if (input.catechistNames?.length) {
      await prisma.catechistOnClass.createMany({
        data: input.catechistNames.map((n) => ({ classId: cls.id, catechistId: catechists[n].id })),
      });
    }

    return cls;
  }

  let catechumenCounter = 0;
  function nextCatechumenName() {
    catechumenCounter += 1;
    return `Catequizando(a) Exemplo ${String(catechumenCounter).padStart(3, "0")}`;
  }
  function birthDateForAge(age: number): Date {
    return new Date(Date.UTC(2026 - age, 5, 15));
  }
  function buildSpecs(
    n: number,
    baptizedCount: number,
    eucharistCount: number,
    confirmedCount: number,
    age: number
  ) {
    return Array.from({ length: n }, (_, i) => ({
      baptized: i < baptizedCount,
      firstEucharist: i < eucharistCount,
      confirmed: i < confirmedCount,
      age,
    }));
  }
  async function createCatechumens(
    classId: string,
    specs: Array<{ baptized: boolean; firstEucharist: boolean; confirmed: boolean; age: number }>
  ) {
    for (const s of specs) {
      await prisma.catechumen.create({
        data: {
          classId,
          name: nextCatechumenName(),
          birthDate: birthDateForAge(s.age),
          baptized: s.baptized,
          firstEucharist: s.firstEucharist,
          confirmed: s.confirmed,
        },
      });
    }
  }

  // Pais e Padrinhos — São José Operário (ativa, sem lista individual)
  await createClass({
    levelSlug: "pais-padrinhos",
    communitySigla: "sjop",
    period: Period.MANHA,
    weekday: Weekday.DOMINGO,
    startTime: "09:00",
    endTime: "10:00",
    roomKey: "sjop-1",
    status: ClassStatus.ATIVA,
    catechumensCountOverride: 12,
    catechistNames: ["Patrícia Regina Gomes"],
  });

  // Infantil — São José Operário (ativa, com lista)
  const infantilSjop = await createClass({
    levelSlug: "infantil",
    communitySigla: "sjop",
    period: Period.MANHA,
    weekday: Weekday.SABADO,
    startTime: "08:30",
    endTime: "10:00",
    roomKey: "sjop-1",
    status: ClassStatus.ATIVA,
    catechistNames: ["Camila Fernandes Dias"],
  });
  await createCatechumens(infantilSjop.id, buildSpecs(12, 12, 0, 0, 7));

  // Infantil — Santa Cruz (ativa, SEM lista individual — só quantidade prevista)
  await createClass({
    levelSlug: "infantil",
    communitySigla: "stcz",
    period: Period.TARDE,
    weekday: Weekday.SABADO,
    startTime: "14:00",
    endTime: "15:00",
    roomKey: "stcz-1",
    status: ClassStatus.ATIVA,
    catechumensCountOverride: 15,
    catechistNames: ["Vanessa Cristina Melo"],
  });

  // Infantil — São Gabriel Arcanjo (ativa, com lista)
  const infantilSgab = await createClass({
    levelSlug: "infantil",
    communitySigla: "sgab",
    period: Period.MANHA,
    weekday: Weekday.SABADO,
    startTime: "09:00",
    endTime: "10:00",
    roomKey: "sgab-1",
    status: ClassStatus.ATIVA,
    catechistNames: ["Thiago Henrique Barros"],
  });
  await createCatechumens(infantilSgab.id, buildSpecs(9, 9, 0, 0, 7));

  // Crianças — São José Operário — Terça (ativa, com lista, alguns sem Batismo)
  const criancasSjopA = await createClass({
    levelSlug: "criancas",
    communitySigla: "sjop",
    period: Period.NOITE,
    weekday: Weekday.TERCA,
    startTime: "19:30",
    endTime: "21:00",
    roomKey: "sjop-2",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2028,
    catechistNames: ["Maria Aparecida Souza", "Ana Paula Rocha"],
  });
  await createCatechumens(criancasSjopA.id, buildSpecs(14, 12, 0, 0, 10));

  // Crianças — São José Operário — Quinta (mesma combinação → identificador com sufixo -2)
  const criancasSjopB = await createClass({
    levelSlug: "criancas",
    communitySigla: "sjop",
    period: Period.NOITE,
    weekday: Weekday.QUINTA,
    startTime: "19:30",
    endTime: "21:00",
    roomKey: "sjop-3",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2028,
    catechistNames: ["Bruno César Ribeiro"],
  });
  await createCatechumens(criancasSjopB.id, buildSpecs(10, 9, 0, 0, 10));

  // Crianças — Santa Cruz (ativa, com lista)
  const criancasStcz = await createClass({
    levelSlug: "criancas",
    communitySigla: "stcz",
    period: Period.TARDE,
    weekday: Weekday.SABADO,
    startTime: "15:00",
    endTime: "16:30",
    roomKey: "stcz-2",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2028,
    catechistNames: ["Lucas Gabriel Nunes"],
  });
  await createCatechumens(criancasStcz.id, buildSpecs(11, 10, 0, 0, 10));

  // Crianças — São Gabriel Arcanjo (ativa, com lista)
  const criancasSgab = await createClass({
    levelSlug: "criancas",
    communitySigla: "sgab",
    period: Period.NOITE,
    weekday: Weekday.SEXTA,
    startTime: "19:00",
    endTime: "20:30",
    roomKey: "sgab-2",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2028,
    catechistNames: ["Juliana Martins Alves"],
  });
  await createCatechumens(criancasSgab.id, buildSpecs(9, 8, 0, 0, 10));

  // Adolescentes — São José Operário (EM PLANEJAMENTO, ainda sem catequizandos)
  await createClass({
    levelSlug: "adolescentes",
    communitySigla: "sjop",
    period: Period.TARDE,
    weekday: Weekday.SABADO,
    startTime: "14:00",
    endTime: "15:30",
    roomKey: "sjop-3",
    status: ClassStatus.PLANEJAMENTO,
    catechistNames: ["Rafael Augusto Pereira"],
  });

  // Adolescentes — Santa Cruz (ativa, sem lista individual ainda)
  await createClass({
    levelSlug: "adolescentes",
    communitySigla: "stcz",
    period: Period.TARDE,
    weekday: Weekday.SABADO,
    startTime: "16:00",
    endTime: "17:30",
    roomKey: "stcz-1",
    status: ClassStatus.ATIVA,
    catechumensCountOverride: 20,
    catechistNames: ["Camila Fernandes Dias"],
  });

  // Adolescentes — São Gabriel Arcanjo (ativa, com lista)
  const adolescentesSgab = await createClass({
    levelSlug: "adolescentes",
    communitySigla: "sgab",
    period: Period.TARDE,
    weekday: Weekday.DOMINGO,
    startTime: "14:00",
    endTime: "15:30",
    roomKey: "sgab-1",
    status: ClassStatus.ATIVA,
    catechistNames: ["Patrícia Regina Gomes"],
  });
  await createCatechumens(adolescentesSgab.id, buildSpecs(13, 13, 0, 0, 13));

  // Jovens — Santa Cruz (exemplo da especificação, seção 39)
  const jovensStcz = await createClass({
    levelSlug: "jovens",
    communitySigla: "stcz",
    period: Period.MANHA,
    weekday: Weekday.SABADO,
    startTime: "09:00",
    endTime: "10:30",
    roomKey: "stcz-1",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2027,
    catechistNames: ["João Batista Ferreira", "Maria Aparecida Souza", "Pedro Henrique Lima"],
  });
  await createCatechumens(jovensStcz.id, buildSpecs(18, 17, 15, 0, 16));

  // Jovens — São José Operário (ativa, vários catequistas, indicadores variados)
  const jovensSjop = await createClass({
    levelSlug: "jovens",
    communitySigla: "sjop",
    period: Period.NOITE,
    weekday: Weekday.SEXTA,
    startTime: "19:30",
    endTime: "21:00",
    roomKey: "sjop-salao",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2027,
    catechistNames: ["Rafael Augusto Pereira", "Juliana Martins Alves", "Bruno César Ribeiro"],
  });
  await createCatechumens(jovensSjop.id, buildSpecs(20, 18, 16, 0, 16));

  // Jovens — São Gabriel Arcanjo (EM PLANEJAMENTO, para 2027)
  await createClass({
    levelSlug: "jovens",
    communitySigla: "sgab",
    period: Period.TARDE,
    weekday: Weekday.DOMINGO,
    startTime: "15:00",
    endTime: "16:30",
    roomKey: "sgab-1",
    status: ClassStatus.PLANEJAMENTO,
    startYear: 2027,
    endYear: 2028,
  });

  // Jovens — São José Operário (CONCLUÍDA/ARQUIVADA — com histórico ao longo de 2 anos)
  const jovensSjopHistorico = await createClass({
    levelSlug: "jovens",
    communitySigla: "sjop",
    period: Period.MANHA,
    weekday: Weekday.SABADO,
    startTime: "09:00",
    endTime: "10:30",
    roomKey: "sjop-3",
    status: ClassStatus.CONCLUIDA,
    startYear: 2024,
    endYear: 2025,
    catechistNames: ["Carlos Eduardo Santos", "Fernanda Oliveira Costa"],
  });
  await createCatechumens(jovensSjopHistorico.id, buildSpecs(16, 15, 14, 12, 17));
  await prisma.classYearRecord.create({
    data: {
      classId: jovensSjopHistorico.id,
      year: 2024,
      roomId: rooms["sjop-2"].id,
      catechumensCount: 18,
      notes: "Turma iniciada com 18 catequizandos.",
      catechists: {
        create: [
          { catechistId: catechists["Ana Paula Rocha"].id },
          { catechistId: catechists["Carlos Eduardo Santos"].id },
        ],
      },
    },
  });
  await prisma.classYearRecord.create({
    data: {
      classId: jovensSjopHistorico.id,
      year: 2025,
      roomId: rooms["sjop-3"].id,
      catechumensCount: 16,
      notes: "Turma concluída com a Crisma de 12 jovens.",
      catechists: {
        create: [
          { catechistId: catechists["Carlos Eduardo Santos"].id },
          { catechistId: catechists["Fernanda Oliveira Costa"].id },
        ],
      },
    },
  });

  // Adultos — São José Operário (ativa — casos "sem Batismo e sem Eucaristia")
  const adultosSjop = await createClass({
    levelSlug: "adultos",
    communitySigla: "sjop",
    period: Period.NOITE,
    weekday: Weekday.QUARTA,
    startTime: "20:00",
    endTime: "21:30",
    roomKey: "sjop-2",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2027,
    catechistNames: ["Ana Paula Rocha"],
  });
  await createCatechumens(adultosSjop.id, buildSpecs(8, 6, 5, 1, 30));

  // Adultos — São Gabriel Arcanjo (ativa)
  const adultosSgab = await createClass({
    levelSlug: "adultos",
    communitySigla: "sgab",
    period: Period.NOITE,
    weekday: Weekday.QUARTA,
    startTime: "19:30",
    endTime: "21:00",
    roomKey: "sgab-2",
    status: ClassStatus.ATIVA,
    startYear: 2026,
    endYear: 2027,
    catechistNames: ["Thiago Henrique Barros"],
  });
  await createCatechumens(adultosSgab.id, buildSpecs(6, 4, 3, 0, 28));

  // --------------------------------------------------------------------
  // Calendário
  // --------------------------------------------------------------------
  console.log("→ Criando eventos de calendário...");
  const events: Array<Parameters<typeof prisma.calendarEvent.create>[0]["data"]> = [
    {
      title: "Abertura do Ano Catequético 2026",
      description: "Missa de abertura seguida de encontro com todas as turmas.",
      date: new Date("2026-02-08T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "11:00",
      location: "Igreja Matriz — São José Operário",
      category: EventCategory.GERAL,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Reunião da Coordenação Paroquial",
      description: "Alinhamento entre responsáveis de nível e coordenação.",
      date: new Date("2026-03-07T00:00:00.000Z"),
      startTime: "19:00",
      endTime: "21:00",
      location: "Salão Paroquial",
      category: EventCategory.GERAL,
      visibility: EventVisibility.AUTENTICADO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Retiro de Crisma — Jovens",
      description: "Retiro preparatório para o Sacramento da Crisma.",
      date: new Date("2026-09-19T00:00:00.000Z"),
      startTime: "08:00",
      endTime: "18:00",
      location: "Casa de Retiros Bom Pastor",
      levelId: levels["jovens"].id,
      category: EventCategory.JOVENS,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Celebração da Primeira Eucaristia",
      description: "Celebração para os catequizandos de Crianças da comunidade São José Operário.",
      date: new Date("2026-10-11T00:00:00.000Z"),
      startTime: "10:00",
      endTime: "12:00",
      location: "Igreja Matriz — São José Operário",
      communityId: communities["sjop"].id,
      levelId: levels["criancas"].id,
      category: EventCategory.CRIANCAS,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Retiro de Adultos — Iniciação Cristã",
      date: new Date("2026-11-08T00:00:00.000Z"),
      startTime: "08:00",
      endTime: "17:00",
      location: "Salão Paroquial",
      levelId: levels["adultos"].id,
      category: EventCategory.ADULTOS,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Formação de Catequistas — Módulo 2",
      description: "Encontro de formação continuada para todos os catequistas da paróquia.",
      date: new Date("2026-08-29T00:00:00.000Z"),
      startTime: "14:00",
      endTime: "17:00",
      location: "Salão Paroquial",
      category: EventCategory.CATEQUISTAS,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Encontro de Pais e Padrinhos",
      date: new Date("2026-09-06T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "10:30",
      location: "Salão Paroquial — São José Operário",
      communityId: communities["sjop"].id,
      levelId: levels["pais-padrinhos"].id,
      category: EventCategory.PAIS_PADRINHOS,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Inscrições para a Catequese 2027",
      description: "Período de inscrições para o próximo ano catequético.",
      date: new Date("2027-01-17T00:00:00.000Z"),
      category: EventCategory.GERAL,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
    {
      title: "Encontro de Infantil — Comunidade Santa Cruz",
      date: new Date("2026-08-22T00:00:00.000Z"),
      startTime: "14:00",
      endTime: "15:00",
      location: "Capela Santa Cruz",
      communityId: communities["stcz"].id,
      levelId: levels["infantil"].id,
      category: EventCategory.INFANTIL,
      visibility: EventVisibility.PUBLICO,
      status: EventStatus.CONFIRMADO,
    },
  ];
  for (const e of events) {
    await prisma.calendarEvent.create({ data: e });
  }

  // --------------------------------------------------------------------
  // Avisos
  // --------------------------------------------------------------------
  console.log("→ Criando avisos...");
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const past = new Date("2025-12-20T00:00:00.000Z");

  await prisma.notice.create({
    data: {
      title: "Inscrições abertas para a Catequese 2027",
      text: "As inscrições para o ano catequético de 2027 já estão abertas. Procure a secretaria paroquial ou o catequista da sua comunidade para mais informações.",
      status: NoticeStatus.PUBLICADO,
      highlighted: true,
      publishedAt: now,
      expiresAt: in60Days,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Retiro de Crisma — inscrições",
      text: "Estão abertas as inscrições para o Retiro de Crisma dos Jovens. Vagas limitadas.",
      status: NoticeStatus.PUBLICADO,
      highlighted: true,
      levelId: levels["jovens"].id,
      publishedAt: now,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Alteração de horário — Adolescentes (Santa Cruz)",
      text: "A partir do próximo encontro, a turma de Adolescentes da comunidade Santa Cruz passa a ocorrer às 16h.",
      status: NoticeStatus.PUBLICADO,
      levelId: levels["adolescentes"].id,
      communityId: communities["stcz"].id,
      publishedAt: now,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Formação de Catequistas — vagas limitadas",
      text: "Inscreva-se até o fim do mês para garantir sua vaga na próxima formação de catequistas.",
      status: NoticeStatus.PUBLICADO,
      publishedAt: now,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Planejamento interno 2027 (rascunho)",
      text: "Minuta do planejamento do próximo ano — ainda em revisão pela coordenação.",
      status: NoticeStatus.RASCUNHO,
    },
  });
  await prisma.notice.create({
    data: {
      title: "Encontro de Natal 2025",
      text: "Celebração de encerramento do ano catequético de 2025.",
      status: NoticeStatus.ARQUIVADO,
      publishedAt: past,
      expiresAt: new Date("2026-01-05T00:00:00.000Z"),
    },
  });

  // --------------------------------------------------------------------
  // Repositório de documentos
  // --------------------------------------------------------------------
  console.log("→ Criando documentos do repositório...");
  await mkdir(STORAGE_DIR, { recursive: true });

  async function seedDocument(opts: {
    name: string;
    fileName: string;
    content: string;
    category: DocumentCategory;
    type: DocumentType;
    visibility: DocumentVisibility;
    levelSlug?: string;
    year?: number;
    description?: string;
    tags?: string[];
  }) {
    const storedName = `${Buffer.from(opts.fileName).toString("hex").slice(0, 12)}-${opts.fileName}`;
    await writeFile(path.join(STORAGE_DIR, storedName), opts.content, "utf-8");
    await prisma.repositoryDocument.create({
      data: {
        name: opts.name,
        description: opts.description,
        tags: opts.tags ?? [],
        category: opts.category,
        type: opts.type,
        year: opts.year,
        levelId: opts.levelSlug ? levels[opts.levelSlug].id : null,
        visibility: opts.visibility,
        fileName: opts.fileName,
        filePath: storedName,
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(opts.content, "utf-8"),
        publishedAt: new Date(),
      },
    });
  }

  await seedDocument({
    name: "Roteiro — Encontro de Advento (Infantil)",
    fileName: "roteiro-advento-infantil.txt",
    content: "Roteiro de demonstração para encontro de Advento — nível Infantil.",
    category: DocumentCategory.INFANTIL,
    type: DocumentType.ROTEIRO,
    visibility: DocumentVisibility.PUBLICO,
    levelSlug: "infantil",
    year: 2026,
    tags: ["advento", "infantil"],
  });
  await seedDocument({
    name: "Formulário de Matrícula",
    fileName: "formulario-matricula.txt",
    content: "Formulário de demonstração para matrícula de catequizandos.",
    category: DocumentCategory.GERAL,
    type: DocumentType.FORMULARIO,
    visibility: DocumentVisibility.PUBLICO,
    year: 2026,
    tags: ["matrícula", "inscrição"],
  });
  await seedDocument({
    name: "Dinâmica de Acolhida — Adolescentes",
    fileName: "dinamica-acolhida-adolescentes.txt",
    content: "Dinâmica de demonstração para o primeiro encontro do ano — nível Adolescentes.",
    category: DocumentCategory.ADOLESCENTES,
    type: DocumentType.DINAMICA,
    visibility: DocumentVisibility.PUBLICO,
    levelSlug: "adolescentes",
    year: 2026,
  });
  await seedDocument({
    name: "Planejamento Anual — Crianças 2026",
    fileName: "planejamento-anual-criancas-2026.txt",
    content: "Planejamento interno de demonstração — nível Crianças, ano 2026.",
    category: DocumentCategory.CRIANCAS,
    type: DocumentType.DOCUMENTO,
    visibility: DocumentVisibility.AUTENTICADO,
    levelSlug: "criancas",
    year: 2026,
  });
  await seedDocument({
    name: "Apresentação — Formação de Catequistas (Módulo 2)",
    fileName: "apresentacao-formacao-modulo2.txt",
    content: "Conteúdo de demonstração da apresentação de formação de catequistas.",
    category: DocumentCategory.FORMACAO_CATEQUISTAS,
    type: DocumentType.APRESENTACAO,
    visibility: DocumentVisibility.AUTENTICADO,
    year: 2026,
  });
  await seedDocument({
    name: "Roteiro — Encontro de Jovens (Crisma)",
    fileName: "roteiro-jovens-crisma.txt",
    content: "Roteiro de demonstração para encontro preparatório da Crisma — nível Jovens.",
    category: DocumentCategory.JOVENS,
    type: DocumentType.ROTEIRO,
    visibility: DocumentVisibility.AUTENTICADO,
    levelSlug: "jovens",
    year: 2026,
  });
  await seedDocument({
    name: "Ata da Reunião da Coordenação — Agosto/2026",
    fileName: "ata-reuniao-coordenacao-ago2026.txt",
    content: "Ata de demonstração da reunião da coordenação paroquial.",
    category: DocumentCategory.GERAL,
    type: DocumentType.DOCUMENTO,
    visibility: DocumentVisibility.ADMIN,
    year: 2026,
  });
  await seedDocument({
    name: "Relatório Interno de Indicadores — 2026",
    fileName: "relatorio-interno-indicadores-2026.txt",
    content: "Relatório interno de demonstração com indicadores gerais da catequese.",
    category: DocumentCategory.GERAL,
    type: DocumentType.DOCUMENTO,
    visibility: DocumentVisibility.ADMIN,
    year: 2026,
  });

  console.log("\n✅ Seed concluído com sucesso.\n");
  console.log("Usuários de demonstração (senha igual para todos):");
  console.log(`  Administrador:            admin@catequesesjo.org.br`);
  console.log(`  Responsável — Jovens:     jovens@catequesesjo.org.br`);
  console.log(`  Responsável — Crianças:   criancas@catequesesjo.org.br`);
  console.log(`  Senha:                    ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
