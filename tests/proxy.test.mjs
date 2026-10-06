import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { entityPath } from "../src/lib/urls.mjs";

const source = readFileSync(fileURLToPath(new URL("../src/proxy.ts", import.meta.url)), "utf8");
const require = createRequire(import.meta.url);
const next = Symbol("next");
const film = { id: 42, title: "A Última Maré", removed_at: null };
const removedFilm = { id: 43, title: "Filme removido", removed_at: "2026-01-01" };
const person = { id: 7, name: "Ana Maria da Silva" };

function loadProxy() {
  const catalog = {
    getFilmById: (id) => [film, removedFilm].find((item) => item.id === id),
    getPersonById: (id) => id === person.id ? person : undefined,
  };
  const nextServer = {
    NextResponse: {
      redirect: (url, status) => new Response(null, { status, headers: { location: url.toString() } }),
      next: () => next,
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  const mockedRequire = (specifier) => {
    if (specifier === "next/server") return nextServer;
    if (specifier === "@/lib/catalog") return { getCatalogRepository: () => catalog };
    if (specifier === "@/lib/urls.mjs") return require("../src/lib/urls.mjs");
    throw new Error(`Import não esperado no proxy: ${specifier}`);
  };

  new Function("require", "module", "exports", compiled)(mockedRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports.proxy;
}

function request(path) {
  const url = new URL(path, "https://escavateca.test");
  return { url: url.toString(), nextUrl: url };
}

test("proxy redireciona parâmetros de paginação válidos e rejeita inválidos", () => {
  const proxy = loadProxy();
  const firstPage = proxy(request("/filmes?page=1"));
  const thirdPage = proxy(request("/filmes?page=3"));

  assert.equal(firstPage.status, 301);
  assert.equal(firstPage.headers.get("location"), "https://escavateca.test/filmes");
  assert.equal(thirdPage.status, 301);
  assert.equal(thirdPage.headers.get("location"), "https://escavateca.test/filmes/pagina/3");

  for (const query of ["page=0", "page=1.5", "page=2&page=3"]) {
    const response = proxy(request(`/filmes?${query}`));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
  }
});

test("proxy redireciona as primeiras páginas para suas URLs canônicas", () => {
  const proxy = loadProxy();

  assert.equal(proxy(request("/filmes/pagina/1")).headers.get("location"), "https://escavateca.test/filmes");
  assert.equal(proxy(request("/generos/drama/pagina/1")).headers.get("location"), "https://escavateca.test/generos/drama");
});

test("proxy normaliza slug de filme e deixa passar URL já canônica ou inexistente", () => {
  const proxy = loadProxy();
  const staleSlug = proxy(request("/filmes/titulo-antigo-42"));

  assert.equal(staleSlug.status, 301);
  assert.equal(staleSlug.headers.get("location"), `https://escavateca.test${entityPath("filmes", film.title, film.id)}`);
  assert.equal(proxy(request(entityPath("filmes", film.title, film.id))), next);
  assert.equal(proxy(request("/filmes/filme-ausente-999")), next);
  assert.equal(proxy(request("/filmes/slug-invalido")), next);
});

test("proxy responde 410 sem indexação para filme removido", async () => {
  const response = loadProxy()(request("/filmes/filme-removido-43"));

  assert.equal(response.status, 410);
  assert.match(response.headers.get("content-type"), /text\/html; charset=utf-8/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(await response.text(), /Este filme foi removido do catálogo/);
});

test("proxy normaliza slug de pessoa e deixa passar URL já canônica", () => {
  const proxy = loadProxy();
  const canonicalPath = entityPath("pessoas", person.name, person.id);
  const staleSlug = proxy(request("/pessoas/nome-antigo-7"));

  assert.equal(staleSlug.status, 301);
  assert.equal(staleSlug.headers.get("location"), `https://escavateca.test${canonicalPath}`);
  assert.equal(proxy(request(canonicalPath)), next);
});