"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

/**
 * O menu se adapta às permissões do usuário (especificação, seção 73/75):
 * Usuários e Administração ficam visíveis somente para o Administrador.
 * Isto é apenas conveniência de interface — as rotas correspondentes também
 * recusam a operação no servidor caso alguém tente acessá-las diretamente.
 */
export function AdminNav({ user }: { user: Session["user"] }) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const sections: Array<{ label: string; items: Array<{ href: string; label: string }> }> = [
    {
      label: "",
      items: [{ href: "/admin", label: "Dashboard" }],
    },
    {
      label: "Catequese",
      items: [
        { href: "/admin/quadro", label: "Quadro de Turmas" },
        { href: "/admin/comunidades", label: "Comunidades" },
        { href: "/admin/niveis", label: "Níveis" },
        { href: "/admin/turmas", label: "Turmas" },
        { href: "/admin/catequistas", label: "Catequistas" },
      ],
    },
    {
      label: "Gestão",
      items: [{ href: "/admin/relatorios", label: "Relatórios" }],
    },
    {
      label: "",
      items: [
        { href: "/admin/calendario", label: "Calendário" },
        { href: "/admin/repositorio", label: "Repositório" },
        { href: "/admin/avisos", label: "Avisos" },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      label: "Administração",
      items: [
        { href: "/admin/usuarios", label: "Usuários e Responsáveis" },
      ],
    });
  }

  return (
    <nav aria-label="Navegação administrativa" className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-parish-400">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-md px-3 py-2 text-sm font-medium ${
                        active
                          ? "bg-parish-800 text-white"
                          : "text-parish-700 hover:bg-parish-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-parish-200 p-4">
        <p className="truncate text-sm font-medium text-parish-900">{user.name}</p>
        <p className="text-xs text-parish-500">
          {isAdmin ? "Responsável Paroquial" : `Responsável — ${user.responsibleLevelName}`}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-3 w-full rounded-md border border-parish-300 px-3 py-1.5 text-sm font-medium text-parish-700 hover:bg-parish-50"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
