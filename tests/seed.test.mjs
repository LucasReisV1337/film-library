import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "../scripts/check-seed.mjs";

const generator = fileURLToPath(new URL("../generate-seed.mjs", import.meta.url));
const officialBytes = readFileSync(new URL("../seed.json", import.meta.url));

test("catálogo oficial mantém o volume e a integridade dos dados", () => {
  const summary = validateCatalog(JSON.parse(officialBytes));
  assert.equal(summary.films, 3000);
  assert.equal(summary.people, 5000);
  assert.equal(summary.genres, 18);
});

test("gerador reproduz o seed oficial", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "escavateca-seed-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = join(directory, "seed.json");
  const result = spawnSync(process.execPath, [generator, output], {
    cwd: directory,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(output), officialBytes);
});
