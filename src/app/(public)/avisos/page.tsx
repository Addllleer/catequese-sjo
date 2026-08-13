import Link from "next/link";
import type { Metadata } from "next";
import { fetchPublicNotices } from "@/lib/notices";
import { formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Avisos" };

export default async function NoticesPage() {
  const notices = await fetchPublicNotices();
  const highlighted = notices.filter((n) => n.highlighted);
  const others = notices.filter((n) => !n.highlighted);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-parish-900">Avisos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parish-600">
          Comunicados, inscrições, prazos e informações da coordenação da catequese.
        </p>
      </header>

      {notices.length === 0 ? (
        <p className="rounded-md border border-dashed border-parish-300 bg-white px-4 py-8 text-center text-sm text-parish-500">
          Não há avisos publicados no momento.
        </p>
      ) : (
        <div className="space-y-8">
          {highlighted.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Em destaque</h2>
              <NoticeList notices={highlighted} />
            </section>
          )}
          {others.length > 0 && (
            <section>
              {highlighted.length > 0 && (
                <h2 className="mb-3 font-serif text-lg font-semibold text-parish-900">Demais avisos</h2>
              )}
              <NoticeList notices={others} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function NoticeList({
  notices,
}: {
  notices: Awaited<ReturnType<typeof fetchPublicNotices>>;
}) {
  return (
    <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
      {notices.map((notice) => (
        <li key={notice.id} className="p-5">
          <Link href={`/avisos/${notice.id}`} className="block">
            <div className="flex flex-wrap items-center gap-2 text-xs text-parish-500">
              <span>{notice.publishedAt ? formatDateBR(notice.publishedAt) : ""}</span>
              {notice.level && <span>· {notice.level.name}</span>}
              {notice.community && <span>· {notice.community.name}</span>}
              {!notice.level && !notice.community && <span>· Aviso geral</span>}
            </div>
            <h3 className="mt-1.5 font-serif text-base font-semibold text-parish-900">
              {notice.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-parish-600">{notice.text}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
