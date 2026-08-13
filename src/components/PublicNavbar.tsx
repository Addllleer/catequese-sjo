import Link from "next/link";

const links = [
  { href: "/", label: "Início" },
  { href: "/catequese", label: "Catequese" },
  { href: "/comunidades", label: "Comunidades" },
  { href: "/calendario", label: "Calendário" },
  { href: "/repositorio", label: "Repositório" },
  { href: "/avisos", label: "Avisos" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-parish-200 bg-white/95 backdrop-blur">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-parish-900">
          <span aria-hidden="true" className="text-gold-600">
            ✚
          </span>
          Catequese Paroquial
        </Link>

        <ul className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-2 font-medium text-parish-700 hover:bg-parish-100 hover:text-parish-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/admin"
              className="ml-1 rounded-md bg-parish-800 px-3 py-2 font-medium text-white hover:bg-parish-900"
            >
              Área Administrativa
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
