import assert from "node:assert/strict";
import { decideChange, watchRequest } from "./game_monitor.ts";

assert.equal(decideChange("<p>score 1</p>", " <p>score 1</p> "), false);
assert.equal(decideChange("<p>score 1</p>", "<p>score 2</p>"), true);
assert.equal(watchRequest.parse({ gameId: "arena", pageUrl: "https://example.com" }).previousHtml, "");
console.log("game monitor decisions pass");
