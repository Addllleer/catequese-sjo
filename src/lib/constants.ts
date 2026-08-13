// ============================================================================
// Fonte única de verdade para vocabulário de negócio fixo pela especificação.
// Estes valores não devem ser alterados sem uma decisão explícita da
// coordenação, pois afetam a geração de identificadores e as regras de
// permissão do sistema.
// ============================================================================

import type {
  ClassStatus,
  DocumentCategory,
  EventCategory,
  Period,
  Weekday,
} from "@prisma/client";

// ----------------------------------------------------------------------------
// Níveis oficiais (seed) — ordem, slug e se usam intervalo de anos no
// identificador de turma (somente Crianças, Jovens e Adultos).
// ----------------------------------------------------------------------------
export const OFFICIAL_LEVELS = [
  {
    order: 1,
    name: "Pais e Padrinhos",
    slug: "pais-padrinhos",
    usesYearRange: false,
    description:
      "Preparação de pais e padrinhos de crianças de até 7 anos que serão batizadas.",
  },
  {
    order: 2,
    name: "Infantil",
    slug: "infantil",
    usesYearRange: false,
    description: "Crianças aproximadamente de 6 a 9 anos.",
  },
  {
    order: 3,
    name: "Crianças",
    slug: "criancas",
    usesYearRange: true,
    description:
      "Crianças aproximadamente de 9 a 12 anos, especialmente no processo de preparação para a Primeira Eucaristia.",
  },
  {
    order: 4,
    name: "Adolescentes",
    slug: "adolescentes",
    usesYearRange: false,
    description: "Adolescentes aproximadamente de 12 a 14 anos.",
  },
  {
    order: 5,
    name: "Jovens",
    slug: "jovens",
    usesYearRange: true,
    description:
      "Jovens aproximadamente de 14 a 18 anos, especialmente no processo de preparação para a Crisma.",
  },
  {
    order: 6,
    name: "Adultos",
    slug: "adultos",
    usesYearRange: true,
    description:
      "Adultos acima de 18 anos que estão se preparando para receber os Sacramentos da Iniciação à Vida Cristã que ainda não possuem.",
  },
] as const;

// ----------------------------------------------------------------------------
// Comunidades oficiais (seed) — siglas nunca devem ser alteradas.
// ----------------------------------------------------------------------------
export const OFFICIAL_COMMUNITIES = [
  { name: "São José Operário", sigla: "sjop" },
  { name: "Santa Cruz", sigla: "stcz" },
  { name: "São Gabriel Arcanjo", sigla: "sgab" },
] as const;

// ----------------------------------------------------------------------------
// Períodos
// ----------------------------------------------------------------------------
export const PERIOD_LABELS: Record<Period, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
};

export const PERIOD_SLUGS: Record<Period, string> = {
  MANHA: "manha",
  TARDE: "tarde",
  NOITE: "noite",
};

// ----------------------------------------------------------------------------
// Dias da semana
// ----------------------------------------------------------------------------
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  SEGUNDA: "Seg",
  TERCA: "Ter",
  QUARTA: "Qua",
  QUINTA: "Qui",
  SEXTA: "Sex",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

export const WEEKDAY_ORDER: Weekday[] = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
];

// ----------------------------------------------------------------------------
// Status de turma
// ----------------------------------------------------------------------------
export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  ATIVA: "Ativa",
  PLANEJAMENTO: "Em planejamento",
  CONCLUIDA: "Concluída/Arquivada",
};

export const CLASS_STATUS_DOT: Record<ClassStatus, string> = {
  ATIVA: "🟢",
  PLANEJAMENTO: "🟡",
  CONCLUIDA: "🔴",
};

// ----------------------------------------------------------------------------
// Categorias de evento no calendário (cores fixas — nunca depender só da cor)
// ----------------------------------------------------------------------------
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  GERAL: "Geral / Paroquial",
  PAIS_PADRINHOS: "Pais e Padrinhos",
  INFANTIL: "Infantil",
  CRIANCAS: "Crianças",
  ADOLESCENTES: "Adolescentes",
  JOVENS: "Jovens",
  ADULTOS: "Adultos",
  CATEQUISTAS: "Catequistas",
};

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  GERAL: "bg-blue-100 text-blue-800 border-blue-300",
  PAIS_PADRINHOS: "bg-amber-100 text-amber-900 border-amber-300",
  INFANTIL: "bg-green-100 text-green-800 border-green-300",
  CRIANCAS: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ADOLESCENTES: "bg-orange-100 text-orange-800 border-orange-300",
  JOVENS: "bg-red-100 text-red-800 border-red-300",
  ADULTOS: "bg-purple-100 text-purple-800 border-purple-300",
  CATEQUISTAS: "bg-gray-200 text-gray-900 border-gray-400",
};

export const EVENT_CATEGORY_DOT: Record<EventCategory, string> = {
  GERAL: "🟦",
  INFANTIL: "🟩",
  CRIANCAS: "🟨",
  ADOLESCENTES: "🟧",
  JOVENS: "🟥",
  ADULTOS: "🟪",
  PAIS_PADRINHOS: "🟫",
  CATEQUISTAS: "⬛",
};

// ----------------------------------------------------------------------------
// Categorias de documento do repositório
// ----------------------------------------------------------------------------
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  GERAL: "Geral",
  PAIS_PADRINHOS: "Pais e Padrinhos",
  INFANTIL: "Infantil",
  CRIANCAS: "Crianças",
  ADOLESCENTES: "Adolescentes",
  JOVENS: "Jovens",
  ADULTOS: "Adultos",
  FORMACAO_CATEQUISTAS: "Formação de Catequistas",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ROTEIRO: "Roteiro",
  DOCUMENTO: "Documento",
  APRESENTACAO: "Apresentação",
  ATIVIDADE: "Atividade",
  DINAMICA: "Dinâmica",
  FORMULARIO: "Formulário",
  MATERIAL_FORMACAO: "Material de formação",
  OUTRO: "Outro",
};

export const DOCUMENT_VISIBILITY_LABELS: Record<string, string> = {
  PUBLICO: "Público",
  AUTENTICADO: "Usuários autenticados",
  ADMIN: "Somente Administrador",
};

// Mapeia a categoria do documento (quando corresponde a um nível) para o
// slug de nível equivalente — usado para checar permissão do responsável
// de nível sobre documentos "do próprio nível".
export const DOCUMENT_CATEGORY_TO_LEVEL_SLUG: Partial<Record<DocumentCategory, string>> = {
  PAIS_PADRINHOS: "pais-padrinhos",
  INFANTIL: "infantil",
  CRIANCAS: "criancas",
  ADOLESCENTES: "adolescentes",
  JOVENS: "jovens",
  ADULTOS: "adultos",
};

export const NOTICE_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  PUBLICADO: "Publicado",
  ARQUIVADO: "Arquivado",
};
