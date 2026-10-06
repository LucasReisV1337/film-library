export type CreditRole = "director" | "writer" | "actor";

export interface Genre {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
  birth_date: string | null;
  bio: string | null;
  updated_at: string;
}

export interface Film {
  id: number;
  title: string;
  synopsis: string | null;
  year: number;
  runtime_minutes: number;
  genre_ids: number[];
  credits: { person_id: number; role: CreditRole }[];
  updated_at: string;
  removed_at: string | null;
}

export interface Catalog {
  generated_at: string;
  genres: Genre[];
  people: Person[];
  films: Film[];
}
