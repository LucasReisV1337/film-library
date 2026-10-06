import { absoluteUrl } from "@/lib/seo";

export const revalidate = 86400;

export function GET() {
  const body = `# Escavateca\n\nCatálogo demonstrativo de filmes, pessoas e gêneros. Todos os registros são fictícios e não descrevem pessoas ou obras reais.\n\n## Navegação\n- [Início e gêneros](${absoluteUrl("/")})\n- [Filmes](${absoluteUrl("/filmes")})\n- [Sitemap](${absoluteUrl("/sitemap.xml")})\n\n## Conteúdo e URLs\nFilmes e pessoas têm páginas próprias identificadas por slug e ID. Páginas de filme incluem ano, duração, gêneros e créditos disponíveis; campos desconhecidos são omitidos ou declarados como não informados. Filmes removidos respondem com HTTP 410 e não aparecem em listagens.\n\nEste arquivo é um índice complementar. O conteúdo completo e as relações estão nas páginas HTML e nos sitemaps; llms.txt não substitui robots.txt, links, metadata ou SEO tradicional.\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}