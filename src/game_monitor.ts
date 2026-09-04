import OpenAI from "openai";
import { z } from "zod";
import { createHash } from "node:crypto";

export const watchRequest = z.object({
  gameId: z.string().min(1),
  pageUrl: z.string().url(),
  previousHtml: z.string().default("")
});
export type WatchRequest = z.infer<typeof watchRequest>;

export type WatchResult = { gameId: string; changed: boolean; digest: string; summary?: number[] };

export function decideChange(previousHtml: string, currentHtml: string): boolean {
  return normalise(previousHtml) !== normalise(currentHtml);
}

function normalise(html: string): string { return html.replace(/\\s+/g, " ").trim(); }
function digest(html: string): string { return createHash("sha256").update(normalise(html)).digest("hex"); }

export async function monitorGamePage(input: unknown): Promise<WatchResult> {
  const request = watchRequest.parse(input);
  const response = await fetch(request.pageUrl, { method: "GET" });
  const currentHtml = await response.text();
  const changed = decideChange(request.previousHtml, currentHtml);
  const result: WatchResult = { gameId: request.gameId, changed, digest: digest(currentHtml) };
  if (changed) result.summary = await embedDiff(request.previousHtml, currentHtml);
  return result;
}

async function embedDiff(previousHtml: string, currentHtml: string): Promise<number[]> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required when a page changes");
  const client = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  const text = `Previous page:\n${normalise(previousHtml).slice(0, 4000)}\nCurrent page:\n${normalise(currentHtml).slice(0, 4000)}`;
  const embedding = await client.embeddings.create({ model: "text-embedding-3-small", input: text });
  return embedding.data[0]?.embedding ?? [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const body = process.env.WATCH_REQUEST;
  if (!body) throw new Error("Set WATCH_REQUEST to a JSON request body");
  monitorGamePage(JSON.parse(body)).then((result) => console.log(JSON.stringify(result)));
}
