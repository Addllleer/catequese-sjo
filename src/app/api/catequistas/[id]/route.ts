import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
});

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = updateSchema.parse(await req.json());

  const catechist = await prisma.catechist.update({ where: { id: params.id }, data });

  await logAudit({ user, action: "UPDATE_CATECHIST", entityType: "Catechist", entityId: catechist.id });

  return NextResponse.json(catechist);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  requireAdmin(user); // exclusão definitiva restrita ao Responsável Paroquial — ver README

  try {
    await prisma.catechist.delete({ where: { id: params.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw new ApiError(
        409,
        "Não é possível excluir este(a) catequista porque há vínculos com turmas ou histórico. Marque-o(a) como inativo(a) em vez de excluir."
      );
    }
    throw err;
  }

  await logAudit({ user, action: "DELETE_CATECHIST", entityType: "Catechist", entityId: params.id });

  return NextResponse.json({ ok: true });
});
