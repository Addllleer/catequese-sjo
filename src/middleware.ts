import { withAuth } from "next-auth/middleware";

/**
 * Proteção de rotas — camada de conveniência de UX.
 *
 * IMPORTANTE (especificação, seções 48/50/69): esta é apenas a primeira
 * barreira (evita que a página administrativa chegue a renderizar sem
 * sessão). A autorização de verdade — o que cada usuário pode ver e alterar
 * dentro da área administrativa — é sempre reconferida no servidor, em cada
 * Server Component e em cada rota de API, através de src/lib/permissions.ts.
 * Nunca confie apenas nesta camada.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
