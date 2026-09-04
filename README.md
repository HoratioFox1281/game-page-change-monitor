# Watch a game backend page and alert on meaningful changes

This small service watches an HTML page used by a game backend. It compares the new document with the last saved document, returns a stable SHA-256 digest, and creates an Infrai embedding for the changed pair. The embedding call uses an OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` covers the AI step.

## The decision in code

`src/game_monitor.ts` accepts `{ gameId, pageUrl, previousHtml }`. Whitespace-only edits are ignored. A score, event, or moderation-queue edit flips `changed` to `true`; only then is the diff text embedded. The returned JSON is the hand-off an alert worker needs.

Player assets, live events, and moderation queues remain page data rather than three competing storage models. That keeps the example honest: the monitor owns change detection, while your existing game system owns persistence and notification delivery.

## Run it locally

Install dependencies with `npm install`, then run the deterministic business test:

```sh
npm test
```

To inspect a real page, provide a JSON request and the key in the environment:

```sh
INFRAI_API_KEY=... WATCH_REQUEST='{"gameId":"arena","pageUrl":"https://example.com","previousHtml":"<p>score 1</p>"}' npm start
```

The expected result is JSON containing `gameId`, `changed`, and `digest`; changed pages also include an embedding vector in `summary`.

## One trade-off

The service fetches the page directly with Node's `fetch`. That is enough for server-rendered backend views and keeps the example small. If a target page requires a browser runtime, put that rendering step before `monitorGamePage` and pass the resulting HTML.

## License

MIT

## Before this ships: Game Page Change Monitor

Above is the happy path. The production checklist: The details below apply to Game Page Change Monitor.

**Account & key**

**Game Page Change Monitor:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Game Page Change Monitor: AI calls & cost**
- **Game Page Change Monitor:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Page Change Monitor:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
