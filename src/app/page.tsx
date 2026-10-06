import Link from "next/link";
import { FilmList, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository } from "@/lib/catalog";
import { buildMetadata, genrePath, getIndexability } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Catálogo de filmes, pessoas e gêneros",
  description: "Explore filmes fictícios e navegue pelas histórias, profissionais e gêneros relacionados no catálogo Escavateca.",
  path: "/",
  indexable: getIndexability("home").index,
});

export default function HomePage() {
  const catalog = getCatalogRepository();
  const sample = catalog.listActiveFilms(1).items.slice(0, 8);
  const activeFilmCount = catalog.getActiveFilmCount();

  return (
    <main id="conteudo">
      <section className="hero-band">
        <PageIntro eyebrow="Catálogo de cinema" title="Histórias ligadas por quem as fez.">
          Explore {activeFilmCount.toLocaleString("pt-BR")} filmes fictícios e navegue entre obras, profissionais e gêneros.
        </PageIntro>
      </section>

      <div className="home-columns">
        <section>
          <div className="section-heading">
            <h2>Filmes em destaque</h2>
            <Link href="/filmes">Ver todos os filmes</Link>
          </div>
          <FilmList films={sample} genresByFilm={(film) => catalog.getFilmGenres(film)} />
        </section>

        <section id="generos">
          <div className="section-heading"><h2>Explore por gênero</h2></div>
          <ul className="genre-list">
            {catalog.genres.map((genre) => (
              <li key={genre.id}><Link href={genrePath(genre)}>{genre.name}</Link></li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
