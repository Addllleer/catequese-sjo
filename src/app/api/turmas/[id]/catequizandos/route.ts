import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireLevelAccess, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { catechumenSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = catechumenSchema.parse(await req.json());

  const cls = await prisma.class.findUnique({ where: { id: params.id }, include: { level: true } });
  if (!cls) throw new ApiError(404, "Turma não encontrada.");
  requireLevelAccess(user, cls.level.slug);

  const catechumen = await prisma.catechumen.create({
    data: {
      classId: cls.id,
      name: data.name,
      birthDate: new Date(data.birthDate),
      baptized: data.baptized,
      firstEucharist: data.firstEucharist,
      confirmed: data.confirmed,
    },
  });

  await logAudit({
    user,
    action: "CREATE_CATECHUMEN",
    entityType: "Catechumen",
    entityId: catechumen.id,
    metadata: { classId: cls.id },
  });

  return NextResponse.json(catechumen, { status: 201 });
});
