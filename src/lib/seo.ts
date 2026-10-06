import type { Metadata } from "next";
import { entityPath, slugify } from "./urls.mjs";
import type { CreditRole, Film, Genre, Person } from "./types";

export { getIndexability } from "./indexing";

export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL deve ser uma URL absoluta com protocolo HTTP ou HTTPS.");
  }  return url.origin;
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${siteOrigin()}/`).toString();
}

export function filmPath(film: Film): string {
  return entityPath("filmes", film.title, film.id);
}

export function personPath(person: Person): string {
  return entityPath("pessoas", person.name, person.id);
}

export function genrePath(genre: Genre): string {
  return `/generos/${slugify(genre.name)}`;
}

export function paginatedPath(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}/pagina/${page}`;
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  indexable: boolean;
  type?: "website" | "article";
}): Metadata {
  const canonical = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: input.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "Escavateca",
      locale: "pt_BR",
      type: input.type ?? "website",
    },
    twitter: { card: "summary", title: input.title, description: input.description },
   
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function movieJsonLd(input: {
  film: Film;
  genres: Genre[];
  credits: { role: CreditRole; person: Person }[];
}) {
  const url = absoluteUrl(filmPath(input.film));
  const peopleForRole = (role: CreditRole) => input.credits
    .filter((credit) => credit.role === role)
    .map(({ person }) => ({
      "@type": "Person",
      "@id": `${absoluteUrl(personPath(person))}#person`,
      name: person.name,
      url: absoluteUrl(personPath(person)),
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${url}#movie`,
    url,
    name: input.film.title,
    datePublished: String(input.film.year),
    duration: `PT${input.film.runtime_minutes}M`,
    genre: input.genres.map((genre) => genre.name),
    ...(input.film.synopsis ? { description: input.film.synopsis } : {}),
    ...(peopleForRole("director").length ? { director: peopleForRole("director") } : {}),
    ...(peopleForRole("writer").length ? { author: peopleForRole("writer") } : {}),
    ...(peopleForRole("actor").length ? { actor: peopleForRole("actor") } : {}),
  };
}

export function personJsonLd(person: Person, films: { film: Film; roles: CreditRole[] }[]) {
  const url = absoluteUrl(personPath(person));
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    url,
    name: person.name,
    ...(person.birth_date ? { birthDate: person.birth_date } : {}),
    ...(person.bio ? { description: person.bio } : {}),
    ...(films.length ? {
      subjectOf: films.map(({ film }) => ({
        "@type": "Movie",
        "@id": `${absoluteUrl(filmPath(film))}#movie`,
        url: absoluteUrl(filmPath(film)),
        name: film.title,
      })),
    } : {}),
  };
}

export function personFilmsJsonLd(films: { film: Film; roles: CreditRole[] }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: films.length,
    itemListElement: films.map(({ film }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(filmPath(film)),
      item: { "@id": `${absoluteUrl(filmPath(film))}#movie`, name: film.title },
    })),
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function maxIsoDate(dates: string[]): string | undefined {
  return dates.filter(Boolean).sort().at(-1);
}