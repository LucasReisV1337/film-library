export type IndexablePage = "home" | "listing" | "film" | "person" | "genre";

export function getIndexability(page: IndexablePage, hasContent = true) {
  if (page === "person" && !hasContent) return { index: false, follow: true, reason: "pessoa sem créditos ativos" };
  if (page === "genre" && !hasContent) return { index: false, follow: true, reason: "gênero sem filmes ativos" };
  if (page === "listing" && !hasContent) return { index: false, follow: true, reason: "listagem sem itens" };
  return { index: true, follow: true, reason: "conteúdo disponível" };
}