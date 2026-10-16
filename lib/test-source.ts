import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Read a source file with its comments removed, for the source-scanning tests.
 *
 * Test-only; nothing in the app imports this.
 *
 * WHY IT IS WRITTEN THIS CAREFULLY
 * --------------------------------
 * The obvious version — `src.replace(/\/\*[\s\S]*?\*\//g, "")` — is wrong, and
 * wrong in a way that makes tests pass while proving nothing: a `/*` inside a
 * string is not a comment. The portfolio admin contains the MIME wildcard
 * `"image/*"`, which that regex treats as the start of a block comment, and it
 * then deletes everything up to the next closing delimiter — around eighty lines of real
 * code, including the symbol a test was asserting on. The test failed for a
 * reason that had nothing to do with the code under test.
 *
 * Anchoring the block-comment match to the start of a line fixes it: a JSDoc
 * block always begins a line, and `image/*` and `/api/*` never do.
 *
 * Whole-line `//` comments are removed, not trailing ones, because `//` in a
 * string is far more often a URL (`https://…`) than a comment.
 *
 * Stripping comments at all is deliberate: without it these tests forbid ever
 * explaining a past bug, since the explanation necessarily quotes the wrong
 * wording it is describing.
 */
export function readSourceStripped(relativePath: string, root = process.cwd()): string {
  const src = readFileSync(path.join(root, relativePath), "utf8");
  return src.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, "").replace(/^[ \t]*\/\/.*$/gm, "");
}
