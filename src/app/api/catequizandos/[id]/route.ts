import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { catechumenSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

async function loadWithLevel(id: string) {
  const catechumen = await prisma.catechumen.findUnique({
    where: { id },
    include: { class: { include: { level: true } } },
  });
  if (!catechumen) throw new ApiError(404, "Catequizando(a) não encontrado(a).");
  return catechumen;
}

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = catechumenSchema.partial().parse(await req.json());

  const current = await loadWithLevel(params.id);
  requireLevelAccess(user, current.class.level.slug);

  const updated = await prisma.catechumen.update({
    where: { id: current.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.birthDate !== undefined && { birthDate: new Date(data.birthDate) }),
      ...(data.baptized !== undefined && { baptized: data.baptized }),
      ...(data.firstEucharist !== undefined && { firstEucharist: data.firstEucharist }),
      ...(data.confirmed !== undefined && { confirmed: data.confirmed }),
    },
  });

  await logAudit({
    user,
    action: "UPDATE_CATECHUMEN_SACRAMENTS",
    entityType: "Catechumen",
    entityId: updated.id,
  });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const current = await loadWithLevel(params.id);
  requireLevelAccess(user, current.class.level.slug);

  await prisma.catechumen.delete({ where: { id: current.id } });

  await logAudit({
    user,
    action: "DELETE_CATECHUMEN",
    entityType: "Catechumen",
    entityId: current.id,
    metadata: { classId: current.classId },
  });

  return NextResponse.json({ ok: true });
});
