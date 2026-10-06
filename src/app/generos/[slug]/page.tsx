import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Collection, EmptyState, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository } from "@/lib/catalog";
import { buildMetadata, getIndexability, genrePath } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCatalogRepository().genres.map((genre) => ({ slug: genrePath(genre).split("/").at(-1) ?? "" }));
}

async function getGenreData(params: Props["params"], page = 1) {
  const { slug } = await params;
  const catalog = getCatalogRepository();
  const genre = catalog.getGenreBySlug(slug);
  if (!genre) return null;
  const slice = catalog.listActiveFilms(page, genre.id);
  if (page > Math.max(1, slice.pageCount)) return null;
  return { catalog, genre, slice, path: genrePath(genre) };
}

export async function generateMetadata({ params }: Props) {
  const data = await getGenreData(params);
  if (!data) return { robots: { index: false, follow: false } };
  const count = data.slice.total;
  return buildMetadata({
    title: `${data.genre.name}: filmes`,
    description: count
      ? `Explore ${count} filmes de ${data.genre.name} no catálogo fictício Escavateca, com seus anos, sinopses e créditos.`
      : `O catálogo Escavateca não possui filmes ativos do gênero ${data.genre.name}.`,
    path: data.path,
    indexable: getIndexability("genre", count > 0).index,
  });
}

export default async function GenrePage({ params }: Props) {
  const data = await getGenreData(params);
  if (!data) notFound();
  const { catalog, genre, slice, path } = data;
  return (
    <main id="conteudo">
      <Breadcrumbs items={[{ name: "Início", href: "/" }, { name: "Gêneros", href: "/#generos" }, { name: genre.name }]} />
      <PageIntro eyebrow="Gênero" title={genre.name}>
        {slice.total ? `${slice.total} filme(s) ativo(s) neste gênero.` : "Não há filmes ativos associados a este gênero."}
      </PageIntro>
      {slice.total
        ? <Collection title={genre.name} path={path} slice={slice} genresByFilm={(film) => catalog.getFilmGenres(film)} />
        : <EmptyState message="Este gênero permanece no catálogo, mas ainda não possui filmes ativos." />}
      <p className="detail-section"><Link href="/filmes">Voltar à listagem de filmes</Link></p>
    </main>
  );
}