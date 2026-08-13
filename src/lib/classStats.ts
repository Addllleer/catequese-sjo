/**
 * Regras de cálculo (especificação, seções 21/22):
 *  - Quando a turma possui lista individual de catequizandos cadastrada, a
 *    quantidade exibida é sempre a contagem REAL dos registros — nunca um
 *    valor informado manualmente.
 *  - Quando não existe lista individual, usa-se o valor administrativo
 *    "previsto/atual" (catechumensCountOverride).
 *  - Indicadores sacramentais (batizados, com Eucaristia, etc.) são SEMPRE
 *    calculados a partir dos registros individuais. Turmas sem lista
 *    individual não possuem indicadores sacramentais (não há como calculá-los).
 */

export interface CatechumenLike {
  baptized: boolean;
  firstEucharist: boolean;
  confirmed: boolean;
}

export interface ClassWithCatechumens {
  catechumensCountOverride: number | null;
  catechumens: CatechumenLike[];
}

export function getCatechumensCount(cls: ClassWithCatechumens): number {
  if (cls.catechumens.length > 0) return cls.catechumens.length;
  return cls.catechumensCountOverride ?? 0;
}

export function hasIndividualList(cls: ClassWithCatechumens): boolean {
  return cls.catechumens.length > 0;
}

export interface SacramentIndicators {
  total: number;
  baptized: number;
  notBaptized: number;
  firstEucharist: number;
  notFirstEucharist: number;
  confirmed: number;
  notConfirmed: number;
}

export function computeSacramentIndicators(catechumens: CatechumenLike[]): SacramentIndicators {
  const total = catechumens.length;
  const baptized = catechumens.filter((c) => c.baptized).length;
  const firstEucharist = catechumens.filter((c) => c.firstEucharist).length;
  const confirmed = catechumens.filter((c) => c.confirmed).length;

  return {
    total,
    baptized,
    notBaptized: total - baptized,
    firstEucharist,
    notFirstEucharist: total - firstEucharist,
    confirmed,
    notConfirmed: total - confirmed,
  };
}
