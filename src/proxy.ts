import { NextResponse, type NextRequest } from "next/server";
import { getCatalogRepository } from "@/lib/catalog";
import { entityPath, parseEntityPath } from "@/lib/urls.mjs";

function redirect301(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url), 301);
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/filmes" && searchParams.has("page")) {
    const pages = searchParams.getAll("page");
    const page = pages.length === 1 ? Number(pages[0]) : Number.NaN;
    if (!Number.isSafeInteger(page) || page < 1) {
      return new Response("Página inválida.", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
    }
    return redirect301(request, page === 1 ? "/filmes" : `/filmes/pagina/${page}`);
  }

  const firstFilmPage = pathname === "/filmes/pagina/1";
  const firstGenrePage = /^\/generos\/([a-z0-9-]+)\/pagina\/1$/.exec(pathname);
  if (firstFilmPage || firstGenrePage) {
    return redirect301(request, firstFilmPage ? "/filmes" : `/generos/${firstGenrePage?.[1]}`);
  }

  const filmMatch = /^\/filmes\/([^/]+)$/.exec(pathname);
  const personMatch = /^\/pessoas\/([^/]+)$/.exec(pathname);
  const match = filmMatch ?? personMatch;
  if (!match) return NextResponse.next();

  const route = parseEntityPath(match[1]);
  if (!route) return NextResponse.next();
  const catalog = getCatalogRepository();

  if (filmMatch) {
    const film = catalog.getFilmById(route.id);
    if (!film) return NextResponse.next();
    if (film.removed_at !== null) {
      return new Response(
        "<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\"><title>Filme removido</title><main><p>Erro 410</p><h1>Este filme foi removido do catálogo.</h1><p>O registro não está mais disponível.</p><a href=\"/filmes\">Explorar filmes ativos</a> <a href=\"/\">Início</a></main></html>",
        {
          status: 410,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex, nofollow",
            "Cache-Control": "no-store",
          },
        },
      );
    }
    const canonical = entityPath("filmes", film.title, film.id);
    if (pathname !== canonical) return redirect301(request, canonical);
  }

  if (personMatch) {
    const person = catalog.getPersonById(route.id);
    if (!person) return NextResponse.next();
    const canonical = entityPath("pessoas", person.name, person.id);
    if (pathname !== canonical) return redirect301(request, canonical);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/filmes/:path*", "/pessoas/:path*", "/generos/:path*"],
};