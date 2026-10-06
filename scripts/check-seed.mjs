import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const isoTimestamp = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

function idsOf(rows, label) {
  assert(Array.isArray(rows), `${label} deve ser uma lista`);
  const ids = new Set();
  for (const row of rows) {
    assert(Number.isSafeInteger(row.id) && row.id > 0, `${label}: ID inválido`);
    assert(!ids.has(row.id), `${label}: ID duplicado ${row.id}`);
    ids.add(row.id);
  }
  return ids;
}

function repeatedGroups(rows, field) {
  const counts = new Map();
  for (const row of rows) counts.set(row[field], (counts.get(row[field]) ?? 0) + 1);
  const repeated = [...counts.values()].filter((count) => count > 1);
  return { groups: repeated.length, records: repeated.reduce((total, count) => total + count, 0) };
}

export function validateCatalog(catalog) {
  assert(isoTimestamp(catalog.generated_at), "generated_at inválido");
  const snapshotMs = Date.parse(catalog.generated_at);
  const genreIds = idsOf(catalog.genres, "genres");
  const peopleIds = idsOf(catalog.people, "people");
  idsOf(catalog.films, "films");
  const usedGenres = new Set();
  const creditedPeople = new Set();
  const checkUpdate = (row) => {
    assert(isoTimestamp(row.updated_at), `updated_at inválido: ${row.id}`);
    assert(Date.parse(row.updated_at) <= snapshotMs, `Atualização posterior ao snapshot: ${row.id}`);
  };

  for (const genre of catalog.genres) assert(typeof genre.name === "string" && genre.name.length > 0);
  for (const person of catalog.people) {
    assert(typeof person.name === "string" && person.name.length > 0);
    assert(person.bio === null || typeof person.bio === "string");
    assert(person.birth_date === null || (typeof person.birth_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(person.birth_date) && new Date(person.birth_date).toISOString().slice(0, 10) === person.birth_date));
    checkUpdate(person);
  }
  for (const film of catalog.films) {
    assert(typeof film.title === "string" && film.title.length > 0);
    assert(film.synopsis === null || typeof film.synopsis === "string");
    assert(Number.isInteger(film.year));
    assert(Number.isInteger(film.runtime_minutes) && film.runtime_minutes > 0);
    checkUpdate(film);
    if (film.removed_at !== null) {
      assert(isoTimestamp(film.removed_at), `removed_at inválido: ${film.id}`);
      assert(Date.parse(film.removed_at) >= Date.parse(film.updated_at), `Remoção anterior à atualização: ${film.id}`);
      assert(Date.parse(film.removed_at) <= snapshotMs, `Remoção posterior ao snapshot: ${film.id}`);
    }
    assert(Array.isArray(film.genre_ids) && film.genre_ids.length > 0);
    assert(new Set(film.genre_ids).size === film.genre_ids.length, `Gênero duplicado: ${film.id}`);
    for (const id of film.genre_ids) {
      assert(genreIds.has(id), `Gênero inexistente ${id}`);
      usedGenres.add(id);
    }
    assert(Array.isArray(film.credits) && film.credits.length > 0);
    const credits = new Set();
    for (const credit of film.credits) {
      assert(peopleIds.has(credit.person_id), `Pessoa inexistente ${credit.person_id}`);
      assert(["director", "writer", "actor"].includes(credit.role), `Papel inválido ${credit.role}`);
      const key = `${credit.person_id}:${credit.role}`;
      assert(!credits.has(key), `Crédito duplicado: ${film.id}/${key}`);
      credits.add(key);
      creditedPeople.add(credit.person_id);
    }
  }

  return {
    generated_at: catalog.generated_at,
    films: catalog.films.length,
    activeFilms: catalog.films.filter((film) => film.removed_at === null).length,
    filmsWithoutSynopsis: catalog.films.filter((film) => film.synopsis === null).length,
    removedFilms: catalog.films.filter((film) => film.removed_at !== null).length,
    people: catalog.people.length,
    peopleWithoutBio: catalog.people.filter((person) => person.bio === null).length,
    peopleWithoutBirthDate: catalog.people.filter((person) => person.birth_date === null).length,
    peopleWithoutCredits: catalog.people.filter((person) => !creditedPeople.has(person.id)).length,
    genres: catalog.genres.length,
    emptyGenres: catalog.genres.filter((genre) => !usedGenres.has(genre.id)).map((genre) => genre.name),
    repeatedTitles: repeatedGroups(catalog.films, "title"),
    homonyms: repeatedGroups(catalog.people, "name"),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const path = process.argv[2] ?? fileURLToPath(new URL("../seed.json", import.meta.url));
    const bytes = readFileSync(path);
    const summary = validateCatalog(JSON.parse(bytes));
    console.log(JSON.stringify({ ...summary, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }, null, 2));
  } catch (error) {
    console.error(`Seed inválido: ${error.message}`);
    process.exitCode = 1;
  }
}
