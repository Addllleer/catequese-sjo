import { NextResponse } from "next/server";
import { apiErrorBody } from "./permissions";
import { ZodError } from "zod";

/**
 * Envolve o corpo de uma rota de API, convertendo exceções (ApiError, erros
 * de validação Zod, ou erros inesperados) em respostas HTTP consistentes.
 * Mantém as rotas curtas e evita duplicar try/catch em cada handler.
 */
export function apiHandler(fn: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos.", issues: err.flatten() },
          { status: 422 }
        );
      }
      const { status, body } = apiErrorBody(err);
      return NextResponse.json(body, { status });
    }
  };
}
