import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getIndexability } from "./indexing";
import { slugify } from "./urls.mjs";
import type { Catalog, CreditRole, Film, Genre, Person } from "./types";

export const PAGE_SIZE = 24;

export interface PageSlice<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

export interface PersonFilmCredit {
  film: Film;
  roles: CreditRole[];
}

export class JsonCatalogRepository {
  private readonly catalog: Catalog;
  private readonly filmsById = new Map<number, Film>();
  private readonly peopleById = new Map<number, Person>();
  private readonly genresBySlug = new Map<string, Genre>();
  private readonly filmsByGenre = new Map<number, Film[]>();
  private readonly creditsByPerson = new Map<number, Map<number, CreditRole[]>>();
  private readonly activeFilms: Film[];

  constructor(catalog: Catalog) {
    this.catalog = catalog;
    for (const film of catalog.films) {
      this.filmsById.set(film.id, film);
      if (film.removed_at !== null) continue;
      for (const genreId of film.genre_ids) {
        const films = this.filmsByGenre.get(genreId) ?? [];
        films.push(film);
        this.filmsByGenre.set(genreId, films);
      }
      for (const credit of film.credits) {
        const byFilm = this.creditsByPerson.get(credit.person_id) ?? new Map<number, CreditRole[]>();
        const roles = byFilm.get(film.id) ?? [];
        roles.push(credit.role);
        byFilm.set(film.id, roles);
        this.creditsByPerson.set(credit.person_id, byFilm);
      }
    }

    this.activeFilms = catalog.films
      .filter((film) => film.removed_at === null)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at) || left.id - right.id);
    for (const person of catalog.people) this.peopleById.set(person.id, person);
    for (const genre of catalog.genres) this.genresBySlug.set(slugify(genre.name), genre);
  }

  get generatedAt(): string {
    return this.catalog.generated_at;
  }

  get genres(): Genre[] {
    return this.catalog.genres;
  }

  getFilmById(id: number): Film | undefined {
    return this.filmsById.get(id);
  }

  getPersonById(id: number): Person | undefined {
    return this.peopleById.get(id);
  }

  getGenreBySlug(slug: string): Genre | undefined {
    return this.genresBySlug.get(slug);
  }

  getGenreById(id: number): Genre | undefined {
    return this.catalog.genres.find((genre) => genre.id === id);
  }

  getFilmGenres(film: Film): Genre[] {
    return film.genre_ids.flatMap((id) => {
      const genre = this.getGenreById(id);
      return genre ? [genre] : [];
    });
  }

  listActiveFilms(page: number, genreId?: number): PageSlice<Film> {
    const source = genreId === undefined ? this.activeFilms : this.filmsByGenre.get(genreId) ?? [];
    return this.page(source, page);
  }

  listActiveFilmsRange(offset: number, limit: number, genreId?: number): Film[] {
    const source = genreId === undefined ? this.activeFilms : this.filmsByGenre.get(genreId) ?? [];
    return source.slice(offset, offset + limit);
  }

  getActiveFilmCount(genreId?: number): number {
    return genreId === undefined ? this.activeFilms.length : this.filmsByGenre.get(genreId)?.length ?? 0;
  }

  searchActiveFilms(query: string): Film[] {
    const normalize = (value: string) => value.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
    const term = normalize(query);
    if (term.length < 2 || term.length > 120) return [];
    return this.activeFilms
      .filter((film) => normalize(film.title).includes(term))
      .sort((left, right) => Number(normalize(right.title) === term) - Number(normalize(left.title) === term)
        || Number(normalize(right.title).startsWith(term)) - Number(normalize(left.title).startsWith(term))
        || left.title.localeCompare(right.title, "pt-BR") || right.year - left.year || left.id - right.id)
      .slice(0, 8);
  }

  getPersonFilms(personId: number): PersonFilmCredit[] {
    const credits = this.creditsByPerson.get(personId);
    if (!credits) return [];
    return [...credits.entries()]
      .flatMap(([filmId, roles]) => {
        const film = this.filmsById.get(filmId);
        return film ? [{ film, roles }] : [];
      })
      .sort((left, right) => right.film.updated_at.localeCompare(left.film.updated_at) || left.film.id - right.film.id);
  }

  getCreditsForFilm(film: Film): { role: CreditRole; person: Person }[] {
    return film.credits.flatMap((credit) => {
      const person = this.peopleById.get(credit.person_id);
      return person ? [{ role: credit.role, person }] : [];
    });
  }

  listIndexablePeople(offset: number, limit: number): Person[] {
    return this.catalog.people
      .filter((person) => getIndexability("person", (this.creditsByPerson.get(person.id)?.size ?? 0) > 0).index)
      .slice(offset, offset + limit);
  }

  getIndexablePeopleCount(): number {
    let count = 0;
    for (const personId of this.peopleById.keys()) {
      if (getIndexability("person", (this.creditsByPerson.get(personId)?.size ?? 0) > 0).index) count += 1;
    }
    return count;
  }

  listAllIndexableGenres(): Genre[] {
    return this.catalog.genres.filter((genre) => getIndexability("genre", this.getActiveFilmCount(genre.id) > 0).index);
  }

  private page<T>(items: T[], page: number): PageSlice<T> {
    const pageCount = Math.ceil(items.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    return { items: items.slice(start, start + PAGE_SIZE), page, pageCount, total: items.length };
  }
}

let repository: JsonCatalogRepository | undefined;

export function getCatalogRepository(): JsonCatalogRepository {
  if (!repository) {
    const catalog = JSON.parse(readFileSync(join(process.cwd(), "seed.json"), "utf8")) as Catalog;
    repository = new JsonCatalogRepository(catalog);
  }
  return repository;
}

export function isValidPositiveInteger(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}