import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "@fontsource-variable/inter";
import "@fontsource/poppins/latin-600.css";
import "./globals.css";
import { siteOrigin } from "@/lib/seo";
import { FilmSearch } from "@/components/film-search";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: "Escavateca", template: "%s | Escavateca" },
  applicationName: "Escavateca",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <header className="site-header">
          <div className="site-header-inner">
            <Link className="brand-lockup" href="/" aria-label="Escavateca, início">
              <Image src="/logo-escavador.svg" alt="Escavador" width={106} height={22} unoptimized />
              <span className="wordmark">escava<span>teca</span></span>
            </Link>
            <nav aria-label="Navegação principal">
              <Link href="/">Início</Link>
              <Link href="/filmes">Filmes</Link>
            </nav>
            <FilmSearch />
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <p>Escavateca <span aria-hidden="true">·</span> catálogo demonstrativo com dados fictícios</p>
            <a href="/llms.txt">Sobre este catálogo</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
