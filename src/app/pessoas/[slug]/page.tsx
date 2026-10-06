import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, EmptyState, JsonLd, PageIntro } from "@/components/catalog-ui";
import { getCatalogRepository } from "@/lib/catalog";
import { parseEntityPath } from "@/lib/urls.mjs";
import { breadcrumbJsonLd, buildMetadata, filmPath, getIndexability, personFilmsJsonLd, personJsonLd, personPath } from "@/lib/seo";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };
const roleNames = { director: "Direção", writer: "Roteiro", actor: "Elenco" } as const;

export function generateStaticParams() {
  return getCatalogRepository().listIndexablePeople(0, 12).map((person) => ({
    slug: personPath(person).split("/").at(-1) ?? "",
  }));
}

async function getPerson(params: Props["params"]) {
  const { slug } = await params;
  const route = parseEntityPath(slug);
  if (!route) return null;
  const catalog = getCatalogRepository();
  const person = catalog.getPersonById(route.id);
  if (!person) return null;
  return { catalog, person, films: catalog.getPersonFilms(person.id) };
}

export async function generateMetadata({ params }: Props) {
  const data = await getPerson(params);
  if (!data) return { robots: { index: false, follow: false } };
  const description = `${data.person.bio ? `${data.person.bio} ` : ""}${data.person.name} tem ${data.films.length} filme(s) com créditos ativos no catálogo fictício Escavateca.`
    .slice(0, 157);
  return buildMetadata({
    title: `${data.person.name}: filmes e créditos · #${data.person.id}`,
    description,
    path: personPath(data.person),
    indexable: getIndexability("person", data.films.length > 0).index,
    type: "article",
  });
}

export default async function PersonDetailPage({ params }: Props) {
  const data = await getPerson(params);
  if (!data) notFound();
  const { person, films } = data;
  const path = personPath(person);
  const breadcrumbs = [
    { name: "Início", path: "/" },
    { name: person.name, path },
  ];

  return (
    <main id="conteudo">
      <Breadcrumbs items={[{ name: "Início", href: "/" }, { name: person.name }]} />
      <PageIntro eyebrow="Pessoa" title={person.name}>
        {films.length ? `${films.length} filme(s) com créditos ativos no catálogo.` : "Registro preservado no catálogo, sem filmes ativos associados."}
      </PageIntro>
      <JsonLd value={personJsonLd(person, films)} />
      {films.length ? <JsonLd value={personFilmsJsonLd(films)} /> : null}
      <JsonLd value={breadcrumbJsonLd(breadcrumbs)} />

      <dl className="detail-facts">
        <div><dt>Data de nascimento</dt><dd>{person.birth_date ?? "Não informada"}</dd></div>
        <div><dt>Créditos ativos</dt><dd>{films.length}</dd></div>
      </dl>
      <section className="detail-section">
        <h2>Biografia</h2>
        <p>{person.bio ?? "Biografia não informada no catálogo."}</p>
      </section>
      <section className="detail-section">
        <h2>Filmes</h2>
        {films.length === 0 ? <EmptyState message="Esta pessoa não tem filmes ativos no catálogo." /> : (
          <ul className="related-films">
            {films.map(({ film, roles }) => (
              <li key={film.id}>
                <Link href={filmPath(film)}>
                  {film.title} ({film.year})
                </Link>
                <p>{roles.map((role) => roleNames[role]).join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}