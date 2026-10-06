import { notFound } from "next/navigation";
import { Breadcrumbs, Collection, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository, isValidPositiveInteger } from "@/lib/catalog";
import { buildMetadata, getIndexability, genrePath, paginatedPath } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string; page: string }> };

async function getPageData(params: Props["params"]) {
  const { slug, page: rawPage } = await params;
  const page = isValidPositiveInteger(rawPage);
  if (page === null || page === 1) return null;
  const catalog = getCatalogRepository();
  const genre = catalog.getGenreBySlug(slug);
  if (!genre) return null;
  const slice = catalog.listActiveFilms(page, genre.id);
  if (page > slice.pageCount) return null;
  return { catalog, genre, page, slice, path: paginatedPath(genrePath(genre), page) };
}

export async function generateMetadata({ params }: Props) {
  const data = await getPageData(params);
  if (!data) return { robots: { index: false, follow: false } };
  return buildMetadata({
    title: `${data.genre.name}: página ${data.page}`,
    description: `Página ${data.page} de filmes do gênero ${data.genre.name} no catálogo fictício Escavateca.`,
    path: data.path,
    indexable: getIndexability("listing", data.slice.items.length > 0).index,
  });
}

export default async function GenrePageNumber({ params }: Props) {
  const data = await getPageData(params);
  if (!data) notFound();
  const { catalog, genre, page, slice } = data;
  return (
    <main id="conteudo">
      <Breadcrumbs items={[{ name: "Início", href: "/" }, { name: genre.name, href: genrePath(genre) }, { name: `Página ${page}` }]} />
      <PageIntro eyebrow={`Gênero · ${genre.name}`} title={`${genre.name} · página ${page}`}>
        {slice.total} filmes ativos neste gênero.
      </PageIntro>
      <Collection title={genre.name} path={genrePath(genre)} slice={slice} genresByFilm={(film) => catalog.getFilmGenres(film)} />
    </main>
  );
}