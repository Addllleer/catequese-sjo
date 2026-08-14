import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";

/**
 * Camada de autorização do sistema.
 *
 * REGRA FUNDAMENTAL (especificação, seções 48/50/69): a autorização precisa
 * ser aplicada no backend, nunca apenas escondendo elementos da interface.
 * Toda rota de API sensível deste projeto chama uma das funções abaixo antes
 * de ler ou escrever qualquer dado. As páginas administrativas (Server
 * Components) fazem o mesmo antes de consultar o Prisma diretamente.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type SessionUser = Session["user"];

/** Retorna a sessão atual (ou null) sem lançar erro. Uso em páginas públicas. */
export async function getSession() {
  return getServerSession(authOptions);
}

/** Exige uma sessão válida. Lança 401 caso não exista. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new ApiError(401, "É necessário estar autenticado para esta operação.");
  }
  return session.user;
}

/** Exige que o usuário seja o Responsável Paroquial (Administrador). */
export function requireAdmin(user: SessionUser) {
  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Esta ação está disponível somente para o Responsável Paroquial.");
  }
}

/**
 * Exige que o usuário tenha acesso administrativo ao nível informado:
 * Administrador sempre tem acesso; Responsável de Nível somente ao próprio
 * nível.
 */
export function requireLevelAccess(user: SessionUser, levelSlug: string) {
  if (user.role === "ADMIN") return;
  if (user.role === "LEVEL_RESPONSIBLE" && user.responsibleLevelSlug === levelSlug) {
    return;
  }
  throw new ApiError(
    403,
    "Você não tem permissão para administrar dados deste nível de catequese."
  );
}

/** true se o usuário pode administrar o nível informado (sem lançar erro). */
export function canManageLevel(user: SessionUser | null | undefined, levelSlug: string) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.role === "LEVEL_RESPONSIBLE" && user.responsibleLevelSlug === levelSlug;
}

/**
 * Lista de slugs de nível que o usuário pode administrar.
 * Retorna null para indicar "todos os níveis" (Administrador).
 */
export function manageableLevelSlugs(user: SessionUser): string[] | null {
  if (user.role === "ADMIN") return null;
  return user.responsibleLevelSlug ? [user.responsibleLevelSlug] : [];
}

/** Converte um ApiError (ou erro genérico) em corpo de resposta padronizado. */
export function apiErrorBody(err: unknown): { status: number; body: { error: string } } {
  if (err instanceof ApiError) {
    return { status: err.status, body: { error: err.message } };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target) ? (err.meta!.target as string[]).join(", ") : "campo";
      return { status: 409, body: { error: `Já existe um registro com o mesmo valor para: ${target}.` } };
    }
    if (err.code === "P2025") {
      return { status: 404, body: { error: "Registro não encontrado." } };
    }
  }
  console.error(err);
  return { status: 500, body: { error: "Erro interno do servidor." } };
}
