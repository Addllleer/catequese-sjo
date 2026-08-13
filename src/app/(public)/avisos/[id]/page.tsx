import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { publicNoticeWhere } from "@/lib/notices";
import { formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({ params }: { params: { id: string } }) {
  const notice = await prisma.notice.findFirst({
    where: publicNoticeWhere({ id: params.id }),
    include: { level: true, community: true },
  });

  if (!notice) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/avisos" className="text-sm font-medium text-parish-600 hover:text-parish-900">
        ← Voltar aos avisos
      </Link>

      <article className="mt-4 rounded-lg border border-parish-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-parish-500">
          <span>{notice.publishedAt ? formatDateBR(notice.publishedAt) : ""}</span>
          {notice.level && <span>· {notice.level.name}</span>}
          {notice.community && <span>· {notice.community.name}</span>}
        </div>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-parish-900">{notice.title}</h1>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-parish-700">
          {notice.text}
        </p>
      </article>
    </div>
  );
}
