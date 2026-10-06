import { getCatalogRepository } from "@/lib/catalog";
import { filmPath } from "@/lib/seo";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const results = getCatalogRepository().searchActiveFilms(query).map((film) => ({
    id: film.id,
    title: film.title,
    year: film.year,
    href: filmPath(film),
  }));
  return Response.json({ results }, {
    headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
}