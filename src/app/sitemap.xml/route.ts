import { getCatalogRepository } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 86400;

export function GET() {
  const catalog = getCatalogRepository();
  const sitemapNames = ["pages.xml"];
  const filmChunks = Math.ceil(catalog.getActiveFilmCount() / 5000);
  const peopleChunks = Math.ceil(catalog.getIndexablePeopleCount() / 5000);
  for (let chunk = 1; chunk <= filmChunks; chunk += 1) sitemapNames.push(`filmes-${chunk}.xml`);
  for (let chunk = 1; chunk <= peopleChunks; chunk += 1) sitemapNames.push(`pessoas-${chunk}.xml`);

  const children = sitemapNames.map((name) =>
    `<sitemap><loc>${absoluteUrl(`/sitemaps/${name}`)}</loc><lastmod>${catalog.generatedAt}</lastmod></sitemap>`,
  ).join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${children}</sitemapindex>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}