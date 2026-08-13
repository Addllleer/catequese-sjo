import { prisma } from "./prisma";
import type { SessionUser } from "./permissions";

/**
 * Registra uma ação administrativa sensível (especificação, seção 70):
 * importação de catequizandos, substituição de lista, exclusões, alteração
 * de permissões/responsáveis, alteração de dados sacramentais, etc.
 */
export async function logAudit(params: {
  user: SessionUser;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.user.id,
      userName: params.user.name ?? params.user.email ?? "Desconhecido",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as any,
    },
  });
}
