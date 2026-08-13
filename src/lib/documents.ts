import { prisma } from "./prisma";
import type { DocumentCategory, DocumentType, DocumentVisibility, Prisma } from "@prisma/client";
import type { SessionUser } from "./permissions";

export interface DocumentFilters {
  search?: string;
  category?: DocumentCategory;
  type?: DocumentType;
  levelId?: string;
  year?: number;
  visibility?: DocumentVisibility[];
}

export async function fetchDocuments(filters: DocumentFilters) {
  const where: Prisma.RepositoryDocumentWhereInput = {
    category: filters.category || undefined,
    type: filters.type || undefined,
    levelId: filters.levelId || undefined,
    year: filters.year || undefined,
    visibility: filters.visibility ? { in: filters.visibility } : undefined,
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { tags: { has: filters.search.toLowerCase() } },
    ];
  }

  return prisma.repositoryDocument.findMany({
    where,
    include: { level: true },
    orderBy: [{ publishedAt: "desc" }],
  });
}

/**
 * Visibilidades que o usuário atual pode enxergar no repositório.
 * Público (sem sessão): apenas PUBLICO.
 * Autenticado (Administrador ou Responsável de Nível): PUBLICO + AUTENTICADO.
 * Administrador: também ADMIN.
 */
export function visibleDocumentVisibilities(user: SessionUser | null | undefined): DocumentVisibility[] {
  if (!user) return ["PUBLICO"];
  if (user.role === "ADMIN") return ["PUBLICO", "AUTENTICADO", "ADMIN"];
  return ["PUBLICO", "AUTENTICADO"];
}

/**
 * Um responsável de nível só pode adicionar/remover documentos do próprio
 * nível (especificação, seção 32). Documentos sem nível (categoria "Geral"
 * ou "Formação de Catequistas") são gerenciáveis somente pelo Administrador.
 */
export function canManageDocument(user: SessionUser, doc: { level: { slug: string } | null }): boolean {
  if (user.role === "ADMIN") return true;
  if (!doc.level) return false;
  return user.role === "LEVEL_RESPONSIBLE" && user.responsibleLevelSlug === doc.level.slug;
}
