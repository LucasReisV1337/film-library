/** @param {string} value */
export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** @param {"filmes" | "pessoas"} collection @param {string} name @param {number} id */
export function entityPath(collection, name, id) {
  return `/${collection}/${slugify(name)}-${id}`;
}

/** @param {string} value */
export function parseEntityPath(value) {
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)-([1-9]\d*)$/.exec(value);
  if (!match) return null;

  const id = Number(match[2]);
  if (!Number.isSafeInteger(id)) return null;

  return { slug: match[1], id };
}