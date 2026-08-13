import Link from "next/link";
import { fetchPublicNotices } from "@/lib/notices";
import { formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACCESSES = [
  {
    href: "/catequese",
    icon: "📋",
    title: "Catequese",
    description: "Consulte as comunidades, níveis, turmas, horários e salas.",
  },
  {
    href: "/calendario",
    icon: "📅",
    title: "Calendário",
    description: "Veja encontros, eventos, celebrações e demais atividades.",
  },
  {
    href: "/repositorio",
    icon: "📚",
    title: "Repositório",
    description: "Acesse materiais e documentos disponíveis.",
  },
  {
    href: "/avisos",
    icon: "📢",
    title: "Avisos",
    description: "Consulte avisos paroquiais e comunicados importantes.",
  },
];

export default async function HomePage() {
  const notices = await fetchPublicNotices({ limit: 4 });

  return (
    <div>
      <section className="border-b border-parish-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="font-serif text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            Paróquia São José Operário
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight text-parish-900 sm:text-5xl">
            Catequese Paroquial
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-parish-600 sm:text-lg">
            Um só lugar para consultar comunidades, turmas, horários, calendário e materiais da
            catequese — e para a coordenação acompanhar cada nível e comunidade com clareza.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="sr-only">Acessos principais</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCESSES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col rounded-lg border border-parish-200 bg-white p-6 transition hover:border-gold-400 hover:shadow-sm"
            >
              <span className="text-2xl" aria-hidden="true">
                {item.icon}
              </span>
              <span className="mt-3 font-serif text-lg font-semibold text-parish-900 group-hover:text-parish-950">
                {item.title}
              </span>
              <span className="mt-1.5 text-sm leading-relaxed text-parish-600">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {notices.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-semibold text-parish-900">Avisos recentes</h2>
            <Link href="/avisos" className="text-sm font-medium text-parish-600 hover:text-parish-900">
              Ver todos os avisos →
            </Link>
          </div>
          <ul className="divide-y divide-parish-200 rounded-lg border border-parish-200 bg-white">
            {notices.map((notice) => (
              <li key={notice.id} className="p-5">
                <Link href={`/avisos/${notice.id}`} className="block">
                  <div className="flex flex-wrap items-center gap-2">
                    {notice.highlighted && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-800">
                        Destaque
                      </span>
                    )}
                    <span className="text-xs text-parish-500">
                      {notice.publishedAt ? formatDateBR(notice.publishedAt) : ""}
                    </span>
                    {notice.level && (
                      <span className="text-xs text-parish-500">· {notice.level.name}</span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-serif text-base font-semibold text-parish-900">
                    {notice.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-parish-600">{notice.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
