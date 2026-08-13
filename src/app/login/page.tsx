"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha incorretos, ou usuário inativo.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-parish-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-serif text-xl font-semibold text-parish-900">
            <span aria-hidden="true" className="text-gold-600">
              ✚
            </span>
            Catequese Paroquial
          </Link>
          <p className="mt-1 text-sm text-parish-500">Área Administrativa</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-parish-200 bg-white p-6 shadow-sm"
          aria-describedby={error ? "login-error" : undefined}
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-parish-800">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm focus:border-parish-500 focus:outline-none focus:ring-1 focus:ring-parish-500"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="password" className="block text-sm font-medium text-parish-800">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-parish-300 px-3 py-2 text-sm focus:border-parish-500 focus:outline-none focus:ring-1 focus:ring-parish-500"
            />
          </div>

          {error && (
            <p id="login-error" role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-parish-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-parish-900 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-parish-500">
          Catequistas não possuem login. Consulte turmas, horários e materiais na{" "}
          <Link href="/" className="font-medium text-parish-700 hover:underline">
            área pública
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
