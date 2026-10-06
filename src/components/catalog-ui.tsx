import Link from "next/link";
import type { ReactNode } from "react";
import { PAGE_SIZE } from "@/lib/catalog";
import { filmPath, genrePath, paginatedPath, serializeJsonLd } from "@/lib/seo";
import type { PageSlice } from "@/lib/catalog";
import type { Film, Genre } from "@/lib/types";

const roleLabels = {
  director: "Direção",
  writer: "Roteiro",
  actor: "Elenco",
} as const;

export function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }} />;
}

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Trilha de navegação">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children ? <p className="intro-copy">{children}</p> : null}
    </div>
  );
}

export function FilmList({ films, genresByFilm }: { films: Film[]; genresByFilm: (film: Film) => Genre[] }) {
  if (films.length === 0) return <EmptyState message="Nenhum filme encontrado nesta página." />;

  return (
    <ul className="film-list">
      {films.map((film) => (
        <li className="film-row" key={film.id}>
          <div className="film-row-main">
            <h2><Link href={filmPath(film)}>{film.title}</Link></h2>
            <p>{film.year} <span aria-hidden="true">·</span> {film.runtime_minutes} min</p>
            <ul className="tag-list" aria-label={`Gêneros de ${film.title}`}>
              {genresByFilm(film).map((genre) => (
                <li key={genre.id}><Link href={genrePath(genre)}>{genre.name}</Link></li>
              ))}
            </ul>
          </div>
          {film.synopsis ? <p className="film-excerpt">{film.synopsis}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function Pagination({
  basePath,
  page,
  pageCount,
}: {
  basePath: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const links = [page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount);

  return (
    <nav className="pagination" aria-label="Paginação">
      {page > 1 ? <Link rel="prev" href={paginatedPath(basePath, page - 1)}>Anterior</Link> : <span />}
      <ol>
        {links.map((value) => (
          <li key={value}>
            {value === page
              ? <span aria-current="page">{value}</span>
              : <Link href={paginatedPath(basePath, value)}>{value}</Link>}
          </li>
        ))}
      </ol>
      {page < pageCount ? <Link rel="next" href={paginatedPath(basePath, page + 1)}>Próxima</Link> : <span />}
    </nav>
  );
}

export function Collection({
  title,
  path,
  slice,
  genresByFilm,
}: {
  title: string;
  path: string;
  slice: PageSlice<Film>;
  genresByFilm: (film: Film) => Genre[];
}) {
  const first = (slice.page - 1) * PAGE_SIZE + 1;
  const last = Math.min(slice.page * PAGE_SIZE, slice.total);
  return (
    <>
      <p className="result-count">Exibindo {first}–{last} de {slice.total} filmes</p>
      <FilmList films={slice.items} genresByFilm={genresByFilm} />
      <Pagination basePath={path} page={slice.page} pageCount={slice.pageCount} />
      <span className="visually-hidden">{title}</span>
    </>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}

export function CreditGroups({
  credits,
}: {
  credits: { role: keyof typeof roleLabels; person: { id: number; name: string; path: string } }[];
}) {
  return (
    <div className="credit-groups">
      {(Object.keys(roleLabels) as (keyof typeof roleLabels)[]).map((role) => {
        const people = credits.filter((credit) => credit.role === role);
        if (!people.length) return null;
        return (
          <section key={role}>
            <h3>{roleLabels[role]}</h3>
            <ul className="person-links">
              {people.map(({ person }, index) => (
                <li key={`${person.id}-${role}-${index}`}><Link href={person.path}>{person.name}</Link></li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}