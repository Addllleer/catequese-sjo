import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const communitySchema = z.object({
  name: z.string().min(2, "Informe o nome da comunidade."),
  sigla: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[a-z]+$/, "A sigla deve conter apenas letras minúsculas."),
});

export const roomSchema = z.object({
  name: z.string().min(1, "Informe o nome da sala."),
  capacity: z.number().int().positive().optional().nullable(),
  communityId: z.string().min(1, "Selecione a comunidade."),
  active: z.boolean().optional(),
});

export const catechistSchema = z.object({
  name: z.string().min(2, "Informe o nome do(a) catequista."),
  active: z.boolean().optional(),
  classIds: z.array(z.string()).optional(),
});

export const levelUpdateSchema = z.object({
  description: z.string().min(1).optional(),
});

export const assignResponsibleSchema = z.object({
  levelId: z.string().min(1),
  userId: z.string().min(1).nullable(),
});

export const classSchema = z
  .object({
    levelId: z.string().min(1, "Selecione o nível."),
    communityId: z.string().min(1, "Selecione a comunidade."),
    period: z.enum(["MANHA", "TARDE", "NOITE"]),
    weekday: z.enum(["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]),
    startTime: z.string().regex(timeRegex, "Horário inicial inválido."),
    endTime: z.string().regex(timeRegex, "Horário final inválido."),
    roomId: z.string().nullable().optional(),
    status: z.enum(["ATIVA", "PLANEJAMENTO", "CONCLUIDA"]),
    startYear: z.number().int().min(2000).max(2100).nullable().optional(),
    endYear: z.number().int().min(2000).max(2100).nullable().optional(),
    catechumensCountOverride: z.number().int().min(0).nullable().optional(),
    notes: z.string().optional().nullable(),
    catechistIds: z.array(z.string()).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "O horário final deve ser depois do horário inicial.",
    path: ["endTime"],
  })
  .refine(
    (data) => {
      if (data.startYear && data.endYear) return data.endYear >= data.startYear;
      return true;
    },
    { message: "O ano de término não pode ser anterior ao ano de início.", path: ["endYear"] }
  );

export const catechumenSchema = z.object({
  name: z.string().min(2, "Informe o nome do(a) catequizando(a)."),
  birthDate: z.string().min(1, "Informe a data de nascimento."),
  baptized: z.boolean().default(false),
  firstEucharist: z.boolean().default(false),
  confirmed: z.boolean().default(false),
});

export const calendarEventSchema = z.object({
  title: z.string().min(2, "Informe o título do evento."),
  description: z.string().optional().nullable(),
  date: z.string().min(1, "Informe a data."),
  startTime: z.string().regex(timeRegex).optional().nullable(),
  endTime: z.string().regex(timeRegex).optional().nullable(),
  location: z.string().optional().nullable(),
  communityId: z.string().optional().nullable(),
  levelId: z.string().optional().nullable(),
  category: z.enum([
    "GERAL",
    "PAIS_PADRINHOS",
    "INFANTIL",
    "CRIANCAS",
    "ADOLESCENTES",
    "JOVENS",
    "ADULTOS",
    "CATEQUISTAS",
  ]),
  visibility: z.enum(["PUBLICO", "AUTENTICADO"]).default("PUBLICO"),
  status: z.enum(["CONFIRMADO", "ADIADO", "CANCELADO"]).default("CONFIRMADO"),
  observations: z.string().optional().nullable(),
});

export const noticeSchema = z.object({
  title: z.string().min(2, "Informe o título do aviso."),
  text: z.string().min(2, "Informe o texto do aviso."),
  publishedAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  levelId: z.string().optional().nullable(),
  communityId: z.string().optional().nullable(),
  highlighted: z.boolean().default(false),
  status: z.enum(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]).default("RASCUNHO"),
});

export const documentMetaSchema = z.object({
  name: z.string().min(2, "Informe o nome do documento."),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  category: z.enum([
    "GERAL",
    "PAIS_PADRINHOS",
    "INFANTIL",
    "CRIANCAS",
    "ADOLESCENTES",
    "JOVENS",
    "ADULTOS",
    "FORMACAO_CATEQUISTAS",
  ]),
  type: z.enum([
    "ROTEIRO",
    "DOCUMENTO",
    "APRESENTACAO",
    "ATIVIDADE",
    "DINAMICA",
    "FORMULARIO",
    "MATERIAL_FORMACAO",
    "OUTRO",
  ]),
  year: z.number().int().optional().nullable(),
  visibility: z.enum(["PUBLICO", "AUTENTICADO", "ADMIN"]).default("AUTENTICADO"),
});

export const userSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").optional(),
  role: z.enum(["ADMIN", "LEVEL_RESPONSIBLE"]),
  responsibleLevelId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});
