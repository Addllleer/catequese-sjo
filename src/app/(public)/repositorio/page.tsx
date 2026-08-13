import type { Metadata } from "next";
import { fetchDocuments } from "@/lib/documents";
import { RepositoryFilterBar } from "@/components/RepositoryFilterBar";
import { RepositoryList } from "@/components/RepositoryList";
import type { DocumentCategory, DocumentType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Repositório" };

export default async function RepositoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const documents = await fetchDocuments({
    search: searchParams.busca || undefined,
    category: (searchParams.categoria as DocumentCategory) || undefined,
    type: (searchParams.tipo as DocumentType) || undefined,
    visibility: ["PUBLICO"],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parish-900">Repositório</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parish-600">
          Materiais e documentos públicos disponibilizados pela coordenação da catequese.
        </p>
      </header>

      <RepositoryFilterBar basePath="/repositorio" searchParams={searchParams} />
      <RepositoryList documents={documents} showVisibility={false} />
    </div>
  );
}
