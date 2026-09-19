import assert from "node:assert/strict";
import { shouldArchive } from "../src/redact_document.ts";

assert.equal(shouldArchive(0.4), true);
assert.equal(shouldArchive(0.7), false);
assert.equal(shouldArchive(Number.NaN), false);
console.log("risk archive decision: ok");
