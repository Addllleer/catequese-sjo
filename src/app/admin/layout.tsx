import { redirect } from "next/navigation";
import { getSession } from "@/lib/permissions";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verificação real de autenticação — o middleware (src/middleware.ts) já
  // barra a maior parte dos acessos, mas a página em si nunca deve confiar
  // apenas nisso (especificação, seção 48/50).
  const session = await getSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
