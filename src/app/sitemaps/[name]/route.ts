import { getCatalogRepository } from "@/lib/catalog";
import { absoluteUrl, filmPath, genrePath, getIndexability, maxIsoDate, paginatedPath, personPath } from "@/lib/seo";

export const revalidate = 86400;

type Entry = { path: string; lastmod?: string };

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlset(entries: Entry[]) {
  const urls = entries.map(({ path, lastmod }) =>
    `<url><loc>${xmlEscape(absoluteUrl(path))}</loc>${lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ""}</url>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

function pageEntries(): Entry[] {
  const catalog = getCatalogRepository();
  const entries: Entry[] = [{ path: "/", lastmod: catalog.generatedAt }];
  const allFilms = catalog.listActiveFilms(1);
  for (let page = 1; page <= allFilms.pageCount; page += 1) {
    const slice = catalog.listActiveFilms(page);
    if (getIndexability("listing", slice.items.length > 0).index) {
      entries.push({
        path: paginatedPath("/filmes", page),
        lastmod: maxIsoDate(slice.items.map((film) => film.updated_at)),
      });
    }
  }

  for (const genre of catalog.listAllIndexableGenres()) {
    const firstPage = catalog.listActiveFilms(1, genre.id);
    for (let page = 1; page <= firstPage.pageCount; page += 1) {
      const slice = catalog.listActiveFilms(page, genre.id);
      if (!getIndexability("genre", slice.items.length > 0).index) continue;
      entries.push({
        path: paginatedPath(genrePath(genre), page),
        lastmod: maxIsoDate(slice.items.map((film) => film.updated_at)),
      });
    }
  }
  return entries;
}

function peopleEntries(chunk: number): Entry[] {
  const catalog = getCatalogRepository();
  const people = catalog.listIndexablePeople((chunk - 1) * 5000, 5000);
  return people.map((person) => {
    const filmDates = catalog.getPersonFilms(person.id).map(({ film }) => film.updated_at);
    return {
      path: personPath(person),
      lastmod: maxIsoDate([person.updated_at, ...filmDates]),
    };
  });
}

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const catalog = getCatalogRepository();
  let entries: Entry[] | null = null;

  if (name === "pages.xml") {
    entries = pageEntries();
  } else {
    const filmMatch = /^filmes-([1-9]\d*)\.xml$/.exec(name);
    const peopleMatch = /^pessoas-([1-9]\d*)\.xml$/.exec(name);
    const chunk = Number(filmMatch?.[1] ?? peopleMatch?.[1]);
    if (Number.isSafeInteger(chunk) && chunk > 0 && chunk <= 100000) {
      if (filmMatch) {
        const films = catalog.listActiveFilmsRange((chunk - 1) * 5000, 5000);
        if (films.length) entries = films.map((film) => ({ path: filmPath(film), lastmod: film.updated_at }));
      } else if (peopleMatch) {
        const count = catalog.getIndexablePeopleCount();
        if ((chunk - 1) * 5000 < count) entries = peopleEntries(chunk);
      }
    }
  }

  if (!entries) {
    return new Response("Sitemap não encontrado.", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  return new Response(urlset(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}