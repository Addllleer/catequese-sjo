import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { VisibilityBadge } from "@/components/ui/VisibilityBadge";
import { formatDateBR } from "@/lib/format";
import type { RepositoryDocument, Level } from "@prisma/client";

type DocWithLevel = RepositoryDocument & { level: Level | null };

export function RepositoryList({
  documents,
  showVisibility,
  actions,
}: {
  documents: DocWithLevel[];
  showVisibility: boolean;
  actions?: (doc: DocWithLevel) => React.ReactNode;
}) {
  if (documents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
        Nenhum documento encontrado para os filtros selecionados.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-start justify-between gap-3 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-parish-500">
              <span>{DOCUMENT_TYPE_LABELS[doc.type]}</span>
              {doc.level && <span>· {doc.level.name}</span>}
              {doc.year && <span>· {doc.year}</span>}
              {showVisibility && <VisibilityBadge visibility={doc.visibility} />}
            </div>
            <h3 className="mt-1 font-serif text-base font-semibold text-parish-900">{doc.name}</h3>
            {doc.description && <p className="mt-1 text-sm text-parish-600">{doc.description}</p>}
            {doc.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-parish-100 px-2 py-0.5 text-xs text-parish-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {doc.publishedAt && (
              <p className="mt-2 text-xs text-parish-400">
                Publicado em {formatDateBR(doc.publishedAt)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`/api/documentos/${doc.id}/download`}
              className="rounded-md border border-parish-300 px-3 py-1.5 text-sm font-medium text-parish-700 hover:bg-parish-50"
            >
              Baixar
            </a>
            {actions?.(doc)}
          </div>
        </li>
      ))}
    </ul>
  );
}
