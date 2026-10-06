#!/usr/bin/env node
// Gera o seed.json do desafio tecnico SEO & GEO.
// Uso: node generate-seed.mjs [caminho-de-saida] [--films 3000] [--people 5000] [--seed 42]
//
// Estrutura do arquivo gerado:
// {
//   "generated_at": "2026-09-15T00:00:00.000Z",
//   "genres":  [{ "id", "name" }],
//   "people":  [{ "id", "name", "birth_date"|null, "bio"|null, "updated_at" }],
//   "films":   [{ "id", "title", "synopsis"|null, "year", "runtime_minutes",
//                 "genre_ids": [..], "credits": [{ "person_id", "role" }],
//                 "updated_at", "removed_at"|null }]
// }
// role: "director" | "writer" | "actor"
//
// Buracos de proposito:
// - ~15% dos filmes sem sinopse
// - ~30% das pessoas sem bio, ~50% sem data de nascimento
// - 2 generos sem nenhum filme
// - ~3% dos filmes descatalogados (removed_at preenchido)
// - titulos repetidos naturalmente e algumas duplicacoes adicionais
// - nomes repetidos naturalmente e 40 tentativas adicionais de duplicacao

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ---------- args ----------
const DEFAULT_OUTPUT = fileURLToPath(new URL("./seed.json", import.meta.url));
const SNAPSHOT_AT = "2026-09-15T00:00:00.000Z";
const SNAPSHOT_MS = Date.parse(SNAPSHOT_AT);
const options = { films: 3000, people: 5000, seed: 42 };
let out;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") {
    console.log("Uso: node generate-seed.mjs [caminho-de-saida] [--films 3000] [--people 5000] [--seed 42]");
    console.log("Sem caminho, grava seed.json ao lado do gerador. Valores inteiros não negativos; seed até 4294967295.");
    process.exit(0);
  }
  if (arg.startsWith("--")) {
    const key = arg.slice(2);
    const value = args[++i];
    if (!Object.hasOwn(options, key) || !value || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      console.error(`Argumento inválido: ${arg}. Consulte --help.`);
      process.exit(1);
    }
    options[key] = Number(value);
  } else if (!out) {
    out = arg;
  } else {
    console.error(`Caminho adicional não permitido: ${arg}. Consulte --help.`);
    process.exit(1);
  }
}
out ??= DEFAULT_OUTPUT;
const { films: FILMS, people: PEOPLE, seed: SEED } = options;
if ((FILMS > 0 && PEOPLE === 0) || SEED > 4294967295) {
  console.error("Filmes exigem ao menos uma pessoa. A semente deve estar entre 0 e 4294967295.");
  process.exit(1);
}

// ---------- prng (mulberry32) ----------
let s = SEED >>> 0;
const rand = () => {
  s += 0x6d2b79f5;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const sample = (arr, n) => {
  const copy = arr.slice();
  const res = [];
  while (res.length < n && copy.length) res.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return res;
};
const isoDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
const randomDateTime = (fromYear, toYear) =>
  new Date(Date.UTC(fromYear, 0, 1) + rand() * (Math.min(Date.UTC(toYear, 11, 31), SNAPSHOT_MS) - Date.UTC(fromYear, 0, 1))).toISOString();

// ---------- vocabulario ----------
const genres = [
  "Drama", "Comédia", "Suspense", "Terror", "Ficção Científica", "Romance", "Aventura",
  "Animação", "Documentário", "Policial", "Fantasia", "Guerra", "Musical", "Faroeste",
  "Biografia", "Mistério", "Esporte", "Infantil",
];
const GENRES_WITHOUT_FILMS = new Set(["Faroeste", "Musical"]);

const firstNames = [
  "Ana", "Beatriz", "Carlos", "Daniel", "Eduarda", "Fernando", "Gabriela", "Helena", "Igor", "Júlia",
  "Kaique", "Larissa", "Marcelo", "Natália", "Otávio", "Paula", "Rafael", "Sofia", "Tiago", "Valentina",
  "André", "Bruna", "Caio", "Diego", "Elisa", "Felipe", "Giovana", "Henrique", "Isabela", "João",
  "Lucas", "Mariana", "Nicolas", "Olívia", "Pedro", "Renata", "Samuel", "Tereza", "Vitor", "Yasmin",
  "Alice", "Bernardo", "Clara", "Davi", "Emanuel", "Flávia", "Guilherme", "Heitor", "Ísis", "Joaquim",
  "Laura", "Miguel", "Nina", "Oscar", "Priscila", "Rodrigo", "Sérgio", "Tomás", "Vera", "William",
  "Adriana", "Breno", "Cecília", "Douglas", "Estela", "Fábio", "Gustavo", "Hugo", "Ingrid", "Jonas",
  "Leandro", "Milena", "Nelson", "Patrícia", "Raul", "Simone", "Tadeu", "Vanessa", "Wagner", "Zélia",
];
const lastNames = [
  "Almeida", "Barbosa", "Cardoso", "Duarte", "Esteves", "Ferreira", "Gomes", "Henriques", "Ibarra", "Jardim",
  "Klein", "Lacerda", "Machado", "Nogueira", "Oliveira", "Pereira", "Queiroz", "Ribeiro", "Santos", "Teixeira",
  "Uchoa", "Vasconcelos", "Xavier", "Zanetti", "Andrade", "Bittencourt", "Carvalho", "Dias", "Figueiredo",
  "Guimarães", "Lopes", "Macedo", "Neves", "Pacheco", "Ramos", "Siqueira", "Toledo", "Vieira", "Amaral",
  "Brandão", "Coelho", "Fonseca", "Leal", "Moreira", "Pinheiro", "Rezende", "Sampaio", "Tavares",
];

const titleAdj = [
  "Última", "Primeira", "Silenciosa", "Distante", "Quebrada", "Escondida", "Perdida", "Longa", "Breve",
  "Estranha", "Vermelha", "Azul", "Branca", "Negra", "Fria", "Quente", "Doce", "Amarga", "Lenta", "Velha",
  "Torta", "Justa", "Alta", "Funda", "Seca", "Clara", "Nova", "Muda", "Curta", "Pobre", "Rica", "Rara",
];
const titleNounF = [
  "Maré", "Noite", "Casa", "Estrada", "Ilha", "Chuva", "Cidade", "Ponte", "Estação", "Fronteira",
  "Carta", "Manhã", "Janela", "Sombra", "Margem", "Colheita", "Promessa", "Memória", "Travessia", "Viagem",
];
const titleNounM = [
  "Rio", "Inverno", "Verão", "Silêncio", "Mapa", "Farol", "Deserto", "Porto", "Retrato", "Relógio",
  "Vento", "Trem", "Jardim", "Espelho", "Abrigo", "Motor", "Voo", "Caminho", "Sonho", "Muro",
];
const titleOf = [
  "de Cobre", "de Vidro", "de Sal", "de Papel", "de Areia", "de Fogo", "do Norte", "do Sul", "de Ninguém",
  "dos Outros", "de Agosto", "de Domingo", "das Marés", "do Fim do Mundo", "da Meia-Noite", "de Chumbo",
  "de Março", "de Sexta", "dos Esquecidos", "da Esquina", "do Subúrbio", "de Ferro", "da Serra", "do Cais",
  "de Verão", "de Inverno", "sem Nome", "sem Volta", "de Ontem", "de Amanhã", "da Estação", "do Bairro",
];
const titleTemplates = [
  () => `A ${pick(titleAdj)} ${pick(titleNounF)}`,
  () => `O ${pick(titleNounM)} ${pick(titleOf)}`,
  () => `${pick(titleNounF)} ${pick(titleOf)}`,
  () => `${pick(titleNounM)} e ${pick(titleNounM)}`,
  () => `${pick(firstNames)} ${pick(titleOf)}`,
  () => `Os ${pick(titleNounM)}s de ${pick(lastNames)}`,
  () => `A ${pick(titleNounF)} ${pick(titleOf)}`,
  () => `${pick(titleAdj)} ${pick(titleNounF)} ${pick(titleOf)}`,
  () => `O ${pick(titleAdj).replace(/a$/, "o")} ${pick(titleNounM)}`,
  () => `${pick(firstNames)} ${pick(lastNames)} ${pick(titleOf)}`,
  () => `A ${pick(titleNounF)} de ${pick(firstNames)}`,
];

const synopsisA = [
  "Depois de anos longe", "Às vésperas de uma mudança", "Em uma cidade pequena do interior", "Durante um verão que parecia comum",
  "Em meio a uma greve que paralisa a região", "No último dia de uma longa viagem", "Enquanto a família se reúne pela primeira vez em décadas",
  "Após receber uma carta sem remetente", "Logo depois de perder o emprego", "Numa madrugada de tempestade",
];
const synopsisB = [
  "uma professora aposentada", "um mecânico de poucas palavras", "dois irmãos que não se falam", "uma jovem fotógrafa",
  "um grupo de amigos de infância", "um casal prestes a se separar", "um cartógrafo obcecado por um erro antigo",
  "uma médica recém-chegada", "um pescador endividado", "uma adolescente que herdou uma casa vazia",
];
const synopsisC = [
  "precisa decidir entre ficar e partir", "descobre um segredo que muda tudo o que sabia sobre a própria família",
  "tenta reconstruir uma ponte que ninguém mais quer", "se vê no centro de uma investigação que não pediu",
  "aceita uma proposta que parece boa demais", "encontra um caderno com anotações que não deveriam existir",
  "corre contra o tempo para impedir um erro que já cometeu antes", "aprende que a memória guarda mais do que mostra",
  "enfrenta o passado que fingiu esquecer", "percebe que a cidade inteira sabe de algo que ela ignora",
];
const synopsisD = [
  "Um filme sobre pertencimento e escolhas.", "Um retrato silencioso de uma geração.", "Entre o humor e a melancolia.",
  "Uma história sobre o que fica quando todos vão embora.", "Um suspense de fôlego curto e efeito longo.", "",
  "Baseado em fatos que talvez nunca tenham acontecido.", "Uma comédia de erros com um final inesperado.",
];
const bioA = [
  "Nasceu em uma cidade litorânea", "Cresceu entre o interior e a capital", "Começou no teatro amador ainda adolescente",
  "Formou-se em arquitetura antes de migrar para o cinema", "Trabalhou como montador por uma década", "Estreou em curtas universitários",
  "Passou a infância entre bastidores de circo", "Iniciou a carreira como assistente de direção",
];
const bioB = [
  "e desde então alternou trabalhos em cinema e televisão.", "e se firmou como um dos nomes mais discretos da sua geração.",
  "e ficou conhecido por personagens de poucas palavras.", "e acumulou uma filmografia marcada por histórias de família.",
  "e hoje divide o tempo entre atuação e ensino.", "e construiu uma carreira longe dos grandes estúdios.",
  "e ganhou espaço em produções independentes.", "e nunca deixou de escrever para o palco.",
];

// ---------- generos ----------
const genreRows = genres.map((name, i) => ({ id: i + 1, name }));
const usableGenreIds = genreRows.filter((g) => !GENRES_WITHOUT_FILMS.has(g.name)).map((g) => g.id);

// ---------- pessoas ----------
const people = [];
for (let i = 1; i <= PEOPLE; i++) {
  const name = `${pick(firstNames)} ${pick(lastNames)}${chance(0.3) ? " " + pick(lastNames) : ""}`;
  const hasBirth = chance(0.5);
  const hasBio = chance(0.7);
  people.push({
    id: i,
    name,
    birth_date: hasBirth ? isoDate(int(1935, 2002), int(1, 12), int(1, 28)) : null,
    bio: hasBio ? `${pick(bioA)} ${pick(bioB)}` : null,
    updated_at: randomDateTime(2019, 2026),
  });
}
// alguns homonimos de proposito
for (let k = 0; k < 40 && people.length > 1; k++) {
  const a = pick(people);
  const b = pick(people);
  if (a.id !== b.id) b.name = a.name;
}

// pools por papel (pessoas podem ter mais de um papel ao longo da carreira)
const poolSize = (fraction) => Math.min(PEOPLE, Math.max(1, Math.floor(PEOPLE * fraction)));
const directors = sample(people, poolSize(0.12));
const writers = sample(people, poolSize(0.18));
const actors = sample(people, poolSize(0.85));

// ---------- filmes ----------
const films = [];
for (let i = 1; i <= FILMS; i++) {
  const year = int(1948, 2026);
  const genreIds = sample(usableGenreIds, int(1, 3));
  const credits = [];
  const seen = new Set();
  const add = (person, role) => {
    const key = `${person.id}:${role}`;
    if (seen.has(key)) return;
    seen.add(key);
    credits.push({ person_id: person.id, role });
  };
  add(pick(directors), "director");
  if (chance(0.1)) add(pick(directors), "director");
  for (const w of sample(writers, int(1, 2))) add(w, "writer");
  for (const a of sample(actors, int(3, 8))) add(a, "actor");

  const createdAt = randomDateTime(2018, 2025);
  const updatedAt = new Date(Date.parse(createdAt) + rand() * (Date.UTC(2026, 8, 1) - Date.parse(createdAt))).toISOString();
  const removed = chance(0.03);

  films.push({
    id: i,
    title: pick(titleTemplates)(),
    synopsis: chance(0.85) ? `${pick(synopsisA)}, ${pick(synopsisB)} ${pick(synopsisC)}. ${pick(synopsisD)}`.trim() : null,
    year,
    runtime_minutes: int(68, 178),
    genre_ids: genreIds,
    credits,
    updated_at: updatedAt,
    removed_at: removed ? new Date(Math.min(Date.parse(updatedAt) + int(1, 400) * 86400000, SNAPSHOT_MS)).toISOString() : null,
  });
}

// titulos repetidos de proposito (mesmo titulo, ano diferente)
for (let k = 0; k < Math.floor(FILMS * 0.02); k++) {
  const a = pick(films);
  const b = pick(films);
  if (a.id !== b.id && a.year !== b.year) b.title = a.title;
}

// ---------- saida ----------
const seed = { generated_at: SNAPSHOT_AT, genres: genreRows, people, films };
writeFileSync(out, JSON.stringify(seed, null, 2));

// resumo
const removedCount = films.filter((f) => f.removed_at).length;
const noSynopsis = films.filter((f) => !f.synopsis).length;
const noBio = people.filter((p) => !p.bio).length;
const titleCounts = films.reduce((m, f) => ((m[f.title] = (m[f.title] || 0) + 1), m), {});
const dupTitles = Object.values(titleCounts).filter((c) => c > 1).length;
const usedGenres = new Set(films.flatMap((f) => f.genre_ids));
console.log(`gerado: ${out}`);
console.log(`filmes: ${films.length} (sem sinopse: ${noSynopsis}, descatalogados: ${removedCount}, titulos repetidos: ${dupTitles})`);
console.log(`pessoas: ${people.length} (sem bio: ${noBio})`);
console.log(`generos: ${genreRows.length} (sem filmes: ${genreRows.length - usedGenres.size})`);
