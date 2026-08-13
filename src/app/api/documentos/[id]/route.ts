import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, canManageLevel, ApiError } from "@/lib/permissions";
import { apiHandler } from "@/lib/api";
import { documentMetaSchema } from "@/lib/validations";
import { DOCUMENT_CATEGORY_TO_LEVEL_SLUG } from "@/lib/constants";
import { deleteDocumentFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

async function checkDocumentAccess(user: Awaited<ReturnType<typeof requireUser>>, category: string) {
  const levelSlug = DOCUMENT_CATEGORY_TO_LEVEL_SLUG[category as keyof typeof DOCUMENT_CATEGORY_TO_LEVEL_SLUG];
  if (levelSlug) {
    if (!canManageLevel(user, levelSlug)) {
      throw new ApiError(403, "Você só pode gerenciar documentos do próprio nível.");
    }
  } else if (user.role !== "ADMIN") {
    throw new ApiError(403, "Documentos gerais ou de formação de catequistas são gerenciados pelo Administrador.");
  }
}

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const data = documentMetaSchema.parse(await req.json());

  const current = await prisma.repositoryDocument.findUnique({ where: { id: params.id } });
  if (!current) throw new ApiError(404, "Documento não encontrado.");

  await checkDocumentAccess(user, current.category);
  await checkDocumentAccess(user, data.category); // também valida a categoria de destino, se mudou

  const levelSlug = DOCUMENT_CATEGORY_TO_LEVEL_SLUG[data.category];
  const level = levelSlug ? await prisma.level.findUnique({ where: { slug: levelSlug } }) : null;

  const updated = await prisma.repositoryDocument.update({
    where: { id: current.id },
    data: {
      name: data.name,
      description: data.description || null,
      tags: data.tags ?? [],
      category: data.category,
      type: data.type,
      year: data.year || null,
      levelId: level?.id ?? null,
      visibility: data.visibility,
    },
  });

  await logAudit({ user, action: "UPDATE_DOCUMENT", entityType: "RepositoryDocument", entityId: updated.id });

  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  const current = await prisma.repositoryDocument.findUnique({ where: { id: params.id } });
  if (!current) throw new ApiError(404, "Documento não encontrado.");
  await checkDocumentAccess(user, current.category);

  await prisma.repositoryDocument.delete({ where: { id: current.id } });
  await deleteDocumentFile(current.filePath);

  await logAudit({ user, action: "DELETE_DOCUMENT", entityType: "RepositoryDocument", entityId: current.id });

  return NextResponse.json({ ok: true });
});
