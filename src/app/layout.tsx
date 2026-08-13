import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Catequese Paroquial — Paróquia São José Operário",
    template: "%s — Catequese Paroquial",
  },
  description:
    "Sistema de gestão da catequese da Paróquia São José Operário: comunidades, turmas, calendário, repositório e avisos.",
  robots: {
    // O conteúdo público é institucional; ainda assim, nenhuma rota
    // administrativa ou de dados privados é servida fora de /admin, que é
    // protegida por autenticação — nunca por robots.txt.
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
