import { Breadcrumbs, Collection, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository } from "@/lib/catalog";
import { buildMetadata, getIndexability } from "@/lib/seo";

const catalog = getCatalogRepository();
const slice = catalog.listActiveFilms(1);
const pagePath = "/filmes";

export const metadata = buildMetadata({
  title: "Filmes: catálogo completo",
  description: `Navegue pelo catálogo de ${slice.total.toLocaleString("pt-BR")} filmes, com informações de duração, ano, gêneros e créditos.`,
  path: pagePath,
  indexable: getIndexability("listing", slice.total > 0).index,
});

export default function FilmsPage() {
  return (
    <main id="conteudo">
      <Breadcrumbs items={[{ name: "Início", href: "/" }, { name: "Filmes" }]} />
      <PageIntro eyebrow="Catálogo" title="Filmes">
        Obras, gêneros e créditos em um catálogo navegável.
      </PageIntro>
      <Collection title="Filmes" path={pagePath} slice={slice} genresByFilm={(film) => catalog.getFilmGenres(film)} />
    </main>
  );
}