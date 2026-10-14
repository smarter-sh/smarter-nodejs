/** Test src/core/sse.ts. */

import { describe, expect, it } from "vitest";

import { iterLines, iterSse, type ServerSentEvent } from "../src/core/sse.ts";
import { loadText } from "./helpers.ts";

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterable) items.push(item);
  return items;
}

async function* chunks(...parts: string[]): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  for (const part of parts) {
    await Promise.resolve();
    yield encoder.encode(part);
  }
}

describe("sse", () => {
  it("parses a real prompt stream into its progress events and its result", async () => {
    const events = await collect(iterSse(loadText("prompt_sse.txt").split(/\r?\n/)));
    expect(events.at(-1)?.event).toBe("result");
    expect(events.every((event) => ["progress", "result"].includes(event.event ?? ""))).toBe(true);
    expect((JSON.parse(events[0]?.data ?? "{}") as { type: string }).type).toBe("llm_request");
  });

  it("skips comments, joins multi-line data, and keeps id and retry", async () => {
    const lines = [
      ": comment",
      "retry: 3000",
      "",
      "event: x",
      "id: 7",
      "retry: 10",
      "data: a",
      "data:b",
      "",
      "data: last",
    ];
    const events = await collect(iterSse(lines));
    expect(events).toEqual<ServerSentEvent[]>([
      { event: "x", data: "a\nb", id: "7", retry: 10 },
      { event: null, data: "last", id: null, retry: null },
    ]);
  });

  it("ignores unknown fields, and a retry that is not a number", async () => {
    expect(await collect(iterSse(["foo: bar", "retry: soon", "data: {}", "field-without-colon", ""]))).toEqual([
      { event: null, data: "{}", id: null, retry: null },
    ]);
  });

  it("splits bytes into lines at any line ending, across chunk boundaries", async () => {
    expect(await collect(iterLines(chunks("a\r\nb\rc\n", "d", "e\r", "\nf\r", "\r", "g")))).toEqual([
      "a",
      "b",
      "c",
      "de",
      "f",
      "",
      "g",
    ]);
    expect(await collect(iterLines(chunks("x\ny\n")))).toEqual(["x", "y"]);
  });
});
