"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
  id: number;
  title: string;
  year: number;
  href: string;
}

export function FilmSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const term = query.trim();
  const expanded = open && term.length >= 2;

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/filmes?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search request failed");
        const data: { results: SearchResult[] } = await response.json();
        if (!controller.signal.aborted) {
          setResults(data.results);
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, term]);

  return (
    <div className="film-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          input.current?.focus();
          setOpen(false);
          return;
        }
        if (!expanded || !results.length || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
        event.preventDefault();
        const links = [...(list.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
        const current = links.indexOf(document.activeElement as HTMLAnchorElement);
        const next = event.key === "ArrowDown" ? current + 1 : current < 0 ? links.length - 1 : current - 1;
        if (next < 0 || next >= links.length) input.current?.focus();
        else links[next]?.focus();
      }}>
      <form role="search" aria-label="Buscar filmes" onSubmit={(event) => {
        event.preventDefault();
        if (status === "ready" && results[0]) {
          setOpen(false);
          router.push(results[0].href);
        }
      }}>
        <label className="visually-hidden" htmlFor="film-search-input">Buscar filmes</label>
        <input ref={input} id="film-search-input" type="search" placeholder="Buscar filmes"
          autoComplete="off" maxLength={120} value={query}
          aria-controls={expanded ? "film-search-results" : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setResults([]);
            setStatus(value.trim().length >= 2 ? "loading" : "idle");
            setOpen(true);
          }} />
      </form>
      {expanded ? (
        <div className="search-panel" id="film-search-results" aria-busy={status === "loading"}>
          <p className="search-status" role="status">
            {status === "loading" ? "Buscando..."
              : status === "error" ? "N\u00e3o foi poss\u00edvel buscar. Tente novamente."
                : results.length === 0 ? "Nenhum filme encontrado."
                  : `${results.length} ${results.length === 1 ? "filme encontrado" : "filmes encontrados"}`}
          </p>
          {status === "ready" && results.length > 0 ? (
            <ul ref={list} className="search-results" aria-label="Filmes encontrados">
              {results.map((film) => (
                <li key={film.id}>
                  <Link href={film.href} prefetch={false} onClick={() => {
                    setOpen(false);
                    setQuery("");
                    setResults([]);
                    setStatus("idle");
                  }}>
                    <span>{film.title}</span><span className="search-year">{film.year}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}