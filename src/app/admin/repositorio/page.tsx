import { redirect } from "next/navigation";
import { getSession, manageableLevelSlugs } from "@/lib/permissions";
import { fetchDocuments, visibleDocumentVisibilities, canManageDocument } from "@/lib/documents";
import { RepositoryFilterBar } from "@/components/RepositoryFilterBar";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { DocumentUploadForm } from "@/components/DocumentUploadForm";
import { RepositoryList } from "@/components/RepositoryList";
import { EditableEntity } from "@/components/admin/EditableEntity";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_TO_LEVEL_SLUG, DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentCategory, DocumentType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminRepositoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/repositorio");
  const user = session.user;

  const documents = await fetchDocuments({
    search: searchParams.busca || undefined,
    category: (searchParams.categoria as DocumentCategory) || undefined,
    type: (searchParams.tipo as DocumentType) || undefined,
    visibility: visibleDocumentVisibilities(user),
  });

  const allowedCategories = (Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).filter((cat) => {
    const levelSlug = DOCUMENT_CATEGORY_TO_LEVEL_SLUG[cat];
    if (!levelSlug) return user.role === "ADMIN";
    return user.role === "ADMIN" || user.responsibleLevelSlug === levelSlug;
  });

  const editFields = [
    { name: "name", label: "Nome", type: "text" as const, required: true },
    { name: "description", label: "Descrição", type: "textarea" as const },
    {
      name: "category",
      label: "Categoria",
      type: "select" as const,
      required: true,
      options: allowedCategories.map((c) => ({ value: c, label: DOCUMENT_CATEGORY_LABELS[c] })),
    },
    {
      name: "type",
      label: "Tipo",
      type: "select" as const,
      required: true,
      options: Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: "year", label: "Ano", type: "number" as const },
    {
      name: "visibility",
      label: "Visibilidade",
      type: "select" as const,
      required: true,
      options: [
        { value: "PUBLICO", label: "🌐 Público" },
        { value: "AUTENTICADO", label: "🔐 Usuários autenticados" },
        { value: "ADMIN", label: "🔴 Somente Administrador" },
      ],
    },
  ];

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Repositório</h1>
        <p className="mt-1 text-sm text-parish-500">
          Biblioteca digital de documentos e materiais da catequese.
        </p>
      </header>

      {allowedCategories.length > 0 && (
        <div className="mb-6">
          <CreatePanel label="+ Novo documento">
            {(close) => <DocumentUploadForm allowedCategories={allowedCategories} onDone={close} />}
          </CreatePanel>
        </div>
      )}

      <RepositoryFilterBar basePath="/admin/repositorio" searchParams={searchParams} />

      <RepositoryList
        documents={documents}
        showVisibility
        actions={(doc) =>
          canManageDocument(user, doc) ? (
            <EditableEntity
              patchAction={`/api/documentos/${doc.id}`}
              deleteAction={`/api/documentos/${doc.id}`}
              deleteTitle="Excluir documento"
              deleteMessage={`Você está prestes a excluir permanentemente "${doc.name}". Esta ação não pode ser desfeita.`}
              initialValues={{
                name: doc.name,
                description: doc.description ?? "",
                category: doc.category,
                type: doc.type,
                year: doc.year ?? "",
                visibility: doc.visibility,
              }}
              fields={editFields}
            >
              <span className="sr-only">Editar {doc.name}</span>
            </EditableEntity>
          ) : null
        }
      />
    </div>
  );
}
