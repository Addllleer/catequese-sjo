import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { catechistSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * Cadastro de catequistas: tanto o Administrador quanto qualquer
 * Responsável de Nível podem cadastrar novos catequistas (especificação,
 * seção 16). A associação do catequista a turmas específicas, porém, só é
 * possível dentro dos níveis que o usuário tem permissão de editar — isso é
 * reforçado nas rotas de turma, não aqui.
 */
export const POST = apiHandler(async (req) => {
  const user = await requireUser();

  const data = catechistSchema.parse(await req.json());
  const catechist = await prisma.catechist.create({
    data: { name: data.name, active: data.active ?? true },
  });

  await logAudit({ user, action: "CREATE_CATECHIST", entityType: "Catechist", entityId: catechist.id });

  return NextResponse.json(catechist, { status: 201 });
});
