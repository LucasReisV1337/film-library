import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="conteudo">
      <p className="eyebrow">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p>O endereço pode estar incorreto ou o conteúdo não está disponível.</p>
      <p><Link href="/filmes">Ir para o catálogo de filmes</Link></p>
    </main>
  );
}