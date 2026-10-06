import { notFound } from "next/navigation";
import { Breadcrumbs, Collection, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository, isValidPositiveInteger } from "@/lib/catalog";
import { buildMetadata, getIndexability, paginatedPath } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ page: string }> };

export function generateStaticParams() {
  const pageCount = getCatalogRepository().listActiveFilms(1).pageCount;
  return Array.from({ length: Math.max(0, Math.min(pageCount, 10) - 1) }, (_, index) => ({ page: String(index + 2) }));
}

async function getPageData(params: Props["params"]) {
  const { page: rawPage } = await params;
  const page = isValidPositiveInteger(rawPage);
  if (page === null || page === 1) return null;
  const catalog = getCatalogRepository();
  const slice = catalog.listActiveFilms(page);
  if (page > slice.pageCount) return null;
  return { catalog, page, slice, path: paginatedPath("/filmes", page) };
}

export async function generateMetadata({ params }: Props) {
  const data = await getPageData(params);
  if (!data) return { robots: { index: false, follow: false } };
  return buildMetadata({
    title: `Filmes: página ${data.page}`,
    description: `Página ${data.page} do catálogo de filmes da Escavateca. Consulte títulos, anos, gêneros e créditos disponíveis.`,
    path: data.path,
    indexable: getIndexability("listing", data.slice.items.length > 0).index,
  });
}

export default async function FilmsPageNumber({ params }: Props) {
  const data = await getPageData(params);
  if (!data) notFound();
  const { catalog, page, slice } = data;
  return (
    <main id="conteudo">
      <Breadcrumbs items={[{ name: "Início", href: "/" }, { name: "Filmes", href: "/filmes" }, { name: `Página ${page}` }]} />
      <PageIntro eyebrow="Catálogo" title={`Filmes · página ${page}`}>
        Continue explorando obras, gêneros e créditos do catálogo.
      </PageIntro>
      <Collection title="Filmes" path="/filmes" slice={slice} genresByFilm={(film) => catalog.getFilmGenres(film)} />
    </main>
  );
}