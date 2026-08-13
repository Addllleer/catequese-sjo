import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

/**
 * Um aviso aparece publicamente quando: status = PUBLICADO, a data de
 * publicação já passou (ou não foi definida) e a data de expiração ainda
 * não passou (ou não foi definida). Especificação, seção 30.
 */
export function publicNoticeWhere(extra?: Prisma.NoticeWhereInput): Prisma.NoticeWhereInput {
  const now = new Date();
  return {
    status: "PUBLICADO",
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    ...extra,
  };
}

export async function fetchPublicNotices(opts?: {
  levelId?: string;
  communityId?: string;
  onlyHighlighted?: boolean;
  limit?: number;
}) {
  return prisma.notice.findMany({
    where: publicNoticeWhere({
      levelId: opts?.levelId,
      communityId: opts?.communityId,
      highlighted: opts?.onlyHighlighted ? true : undefined,
    }),
    include: { level: true, community: true },
    orderBy: [{ highlighted: "desc" }, { publishedAt: "desc" }],
    take: opts?.limit,
  });
}
