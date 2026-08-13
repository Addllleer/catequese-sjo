import type { Period } from "@prisma/client";
import { PERIOD_SLUGS } from "./constants";

/**
 * Geração do identificador legível de turma.
 *
 * Convenção oficial (ver especificação, seção 9):
 *   nivel-comunidade-periodo[-anoinicio-anofim][-n]
 *
 * Regras:
 *  - Nível e comunidade e período são sempre obrigatórios.
 *  - Ano de início/fim SOMENTE entram no identificador para os níveis
 *    Crianças, Jovens e Adultos (level.usesYearRange).
 *  - O sufixo numérico "-n" só aparece quando já existir outra turma com
 *    exatamente a mesma combinação de nível+comunidade+período[+anos].
 *    A primeira turma NUNCA recebe sufixo (não usar "-1"). A segunda
 *    recebe "-2", a terceira "-3", e assim por diante.
 *
 * Exemplos:
 *   jovens-stcz-manha-2026-2027
 *   adolescentes-sgab-tarde
 *   criancas-sjop-noite-2026-2028-2
 */

export interface ClassIdentifierInput {
  levelSlug: string;
  communitySigla: string;
  period: Period;
  usesYearRange: boolean;
  startYear?: number | null;
  endYear?: number | null;
}

/** Monta a "base" do identificador, sem o sufixo numérico de desambiguação. */
export function buildClassIdentifierBase(input: ClassIdentifierInput): string {
  const parts = [input.levelSlug, input.communitySigla, PERIOD_SLUGS[input.period]];

  if (input.usesYearRange) {
    if (!input.startYear || !input.endYear) {
      throw new Error(
        "Ano de início e ano de término são obrigatórios para este nível no identificador da turma."
      );
    }
    parts.push(String(input.startYear), String(input.endYear));
  }

  return parts.join("-");
}

/**
 * Gera o identificador final, calculando automaticamente o sufixo numérico
 * necessário para evitar colisão com identificadores já existentes.
 *
 * @param existingPublicIds identificadores públicos já usados no sistema
 *   (normalmente todas as turmas, exceto a que está sendo editada).
 */
export function generateClassIdentifier(
  input: ClassIdentifierInput,
  existingPublicIds: string[]
): string {
  const base = buildClassIdentifierBase(input);

  const existingSet = new Set(existingPublicIds);

  if (!existingSet.has(base)) {
    return base;
  }

  // Já existe uma turma com a mesma base — procurar o próximo sufixo livre,
  // começando em 2 (nunca "-1").
  let suffix = 2;
  while (existingSet.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
