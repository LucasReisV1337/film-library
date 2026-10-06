import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, CreditGroups, JsonLd, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository } from "@/lib/catalog";
import { parseEntityPath } from "@/lib/urls.mjs";
import {
  breadcrumbJsonLd,
  buildMetadata,
  filmPath,
  genrePath,
  movieJsonLd,
  personPath,
} from "@/lib/seo";
import type { Film, Genre, Person, CreditRole } from "@/lib/types";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCatalogRepository().listActiveFilmsRange(0, 12).map((film) => ({
    slug: `${filmPath(film).split("/").at(-1)}`,
  }));
}

async function getFilm(params: Props["params"]) {
  const { slug } = await params;
  const route = parseEntityPath(slug);
  if (!route) return null;
  const catalog = getCatalogRepository();
  const film = catalog.getFilmById(route.id);
  if (!film || film.removed_at !== null) return null;
  return { catalog, film };
}

function filmDescription(
  film: Film,
  genres: Genre[],
  credits: { role: CreditRole; person: Person }[],
) {
  const director = credits.find((credit) => credit.role === "director")?.person.name;
  const details = [
    `${film.year}`,
    `${film.runtime_minutes} minutos`,
    genres.map((genre) => genre.name).join(", "),
    director ? `direção de ${director}` : "créditos disponíveis",
  ].join(" · ");
  const source = film.synopsis
    ? `${film.synopsis} Filme de ${details} no catálogo fictício Escavateca.`
    : `${film.title}: filme de ${details} no catálogo fictício Escavateca.`;
  return source.length > 157 ? `${source.slice(0, 154).trimEnd()}...` : source;
}

export async function generateMetadata({ params }: Props) {
  const data = await getFilm(params);
  if (!data) return { robots: { index: false, follow: false } };
  const { catalog, film } = data;
  const genres = catalog.getFilmGenres(film);
  const credits = catalog.getCreditsForFilm(film);
  return buildMetadata({
    title: `${film.title} (${film.year}) · #${film.id}`,
    description: filmDescription(film, genres, credits),
    path: filmPath(film),
    indexable: true,
    type: "article",
  });
}

export default async function FilmDetailPage({ params }: Props) {
  const data = await getFilm(params);
  if (!data) notFound();
  const { catalog, film } = data;
  const genres = catalog.getFilmGenres(film);
  const credits = catalog.getCreditsForFilm(film);
  const path = filmPath(film);
  const breadcrumbs = [
    { name: "Início", path: "/" },
    { name: "Filmes", path: "/filmes" },
    { name: film.title, path },
  ];

  return (
    <main id="conteudo">
      <Breadcrumbs items={[{ name: "Início", href: "/" }, { name: "Filmes", href: "/filmes" }, { name: film.title }]} />
      <PageIntro eyebrow="Filme" title={film.title}>
        Produção de {film.year}, com {film.runtime_minutes} minutos, relacionada a {genres.map((genre) => genre.name).join(", ")}.
      </PageIntro>
      <JsonLd value={movieJsonLd({ film, genres, credits })} />
      <JsonLd value={breadcrumbJsonLd(breadcrumbs)} />

      <dl className="detail-facts">
        <div><dt>Ano</dt><dd>{film.year}</dd></div>
        <div><dt>Duração</dt><dd>{film.runtime_minutes} minutos</dd></div>
        <div><dt>Gênero{genres.length > 1 ? "s" : ""}</dt><dd>{genres.map((genre, index) => (
          <span key={genre.id}>{index > 0 ? ", " : ""}<Link href={genrePath(genre)}>{genre.name}</Link></span>
        ))}</dd></div>
      </dl>

      <section className="detail-section">
        <h2>Sinopse</h2>
        <p>{film.synopsis ?? "Sinopse não informada no catálogo."}</p>
      </section>

      <section className="detail-section">
        <h2>Créditos</h2>
        <CreditGroups credits={credits.map(({ role, person }) => ({ role, person: { id: person.id, name: person.name, path: personPath(person) } }))} />
      </section>
    </main>
  );
}