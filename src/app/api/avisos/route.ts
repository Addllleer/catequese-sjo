import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { noticeSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * Gestão de avisos é restrita ao Administrador (especificação, seção 30):
 * "Não criar automaticamente permissão para responsáveis de nível
 * publicarem avisos gerais." Diferente do calendário, aqui não há exceção
 * por nível.
 */
export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = noticeSchema.parse(await req.json());
  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      text: data.text,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      levelId: data.levelId || null,
      communityId: data.communityId || null,
      highlighted: data.highlighted,
      status: data.status,
    },
  });

  await logAudit({ user, action: "CREATE_NOTICE", entityType: "Notice", entityId: notice.id });

  return NextResponse.json(notice, { status: 201 });
});
