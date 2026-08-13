import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { noticeSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  const data = noticeSchema.parse(await req.json());
  const current = await prisma.notice.findUnique({ where: { id: params.id } });
  if (!current) throw new ApiError(404, "Aviso não encontrado.");

  const updated = await prisma.notice.update({
    where: { id: current.id },
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

  await logAudit({ user, action: "UPDATE_NOTICE", entityType: "Notice", entityId: updated.id });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user);

  await prisma.notice.delete({ where: { id: params.id } });

  await logAudit({ user, action: "DELETE_NOTICE", entityType: "Notice", entityId: params.id });

  return NextResponse.json({ ok: true });
});
