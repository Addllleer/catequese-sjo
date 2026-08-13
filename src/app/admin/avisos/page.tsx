import { redirect } from "next/navigation";
import { getSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreatePanel } from "@/components/admin/CreatePanel";
import { AdminEntityForm } from "@/components/admin/AdminEntityForm";
import { EditableEntity } from "@/components/admin/EditableEntity";
import { NOTICE_STATUS_LABELS } from "@/lib/constants";
import { formatDateBR, formatDateInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminNoticesPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/admin/avisos");
  const isAdmin = session.user.role === "ADMIN";

  const [notices, levels, communities] = await Promise.all([
    prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
      include: { level: true, community: true },
    }),
    prisma.level.findMany({ orderBy: { order: "asc" } }),
    prisma.community.findMany({ orderBy: { sigla: "asc" } }),
  ]);

  const noticeFields = [
    { name: "title", label: "Título", type: "text" as const, required: true },
    { name: "text", label: "Texto", type: "textarea" as const, required: true },
    { name: "publishedAt", label: "Data de publicação", type: "date" as const },
    { name: "expiresAt", label: "Data de expiração (opcional)", type: "date" as const },
    {
      name: "levelId",
      label: "Nível relacionado (opcional — deixe em branco para geral)",
      type: "select" as const,
      options: levels.map((l) => ({ value: l.id, label: l.name })),
    },
    {
      name: "communityId",
      label: "Comunidade relacionada (opcional — deixe em branco para todas)",
      type: "select" as const,
      options: communities.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "highlighted", label: "Destacar este aviso", type: "checkbox" as const },
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      required: true,
      options: [
        { value: "RASCUNHO", label: "Rascunho" },
        { value: "PUBLICADO", label: "Publicado" },
        { value: "ARQUIVADO", label: "Arquivado" },
      ],
    },
  ];

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-parish-900">Avisos</h1>
        <p className="mt-1 text-sm text-parish-500">
          A gestão de avisos é responsabilidade do Responsável Paroquial.
        </p>
      </header>

      {isAdmin && (
        <div className="mb-6">
          <CreatePanel label="+ Novo aviso">
            {(close) => (
              <AdminEntityForm
                submitLabel="Criar aviso"
                method="POST"
                action="/api/avisos"
                onSuccess={close}
                onCancel={close}
                initialValues={{ status: "RASCUNHO", highlighted: false }}
                fields={noticeFields}
              />
            )}
          </CreatePanel>
        </div>
      )}

      <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
        {notices.map((notice) => (
          <li key={notice.id} className="p-5">
            {isAdmin ? (
              <EditableEntity
                patchAction={`/api/avisos/${notice.id}`}
                deleteAction={`/api/avisos/${notice.id}`}
                deleteTitle="Excluir aviso"
                deleteMessage={`Você está prestes a excluir permanentemente o aviso "${notice.title}". Esta ação não pode ser desfeita.`}
                initialValues={{
                  title: notice.title,
                  text: notice.text,
                  publishedAt: notice.publishedAt ? formatDateInputValue(notice.publishedAt) : "",
                  expiresAt: notice.expiresAt ? formatDateInputValue(notice.expiresAt) : "",
                  levelId: notice.levelId ?? "",
                  communityId: notice.communityId ?? "",
                  highlighted: notice.highlighted,
                  status: notice.status,
                }}
                fields={noticeFields}
              >
                <NoticeSummary notice={notice} />
              </EditableEntity>
            ) : (
              <NoticeSummary notice={notice} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoticeSummary({
  notice,
}: {
  notice: {
    title: string;
    text: string;
    status: string;
    highlighted: boolean;
    publishedAt: Date | null;
    level: { name: string } | null;
    community: { name: string } | null;
  };
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-parish-500">
        <span className="rounded-full border border-parish-300 px-2 py-0.5">
          {NOTICE_STATUS_LABELS[notice.status]}
        </span>
        {notice.highlighted && (
          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-gold-800">Destaque</span>
        )}
        {notice.publishedAt && <span>{formatDateBR(notice.publishedAt)}</span>}
        {notice.level && <span>· {notice.level.name}</span>}
        {notice.community && <span>· {notice.community.name}</span>}
      </div>
      <p className="mt-1 font-serif text-base font-semibold text-parish-900">{notice.title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-parish-600">{notice.text}</p>
    </div>
  );
}
