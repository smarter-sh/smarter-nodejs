/**
 * A parser of Server-Sent Events.
 *
 * The Smarter prompt api streams a prompt's progress as Server-Sent Events when the request's
 * `Accept` header includes `text/event-stream`: `progress` events while it runs, then one `result`
 * event with the same JSON as a non-streaming response.
 */

/** The content type of a Server-Sent Events stream. */
export const EVENT_STREAM_CONTENT_TYPE = "text/event-stream";

/** One Server-Sent Event. */
export interface ServerSentEvent {
  /** The event's type, e.g. `progress`, or null for an unnamed event. */
  event: string | null;
  /** The event's data: its `data:` lines, joined by newlines. */
  data: string;
  /** The event's id, if any. */
  id: string | null;
  /** The reconnection time that the server asked for, in milliseconds, if any. */
  retry: number | null;
}

/**
 * Split a stream of bytes into lines, without their line endings (`\n`, `\r\n` or `\r`).
 *
 * @param stream - The stream, e.g. a response's body.
 * @returns The lines, in order.
 */
export async function* iterLines(stream: AsyncIterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let match: RegExpExecArray | null;
    while ((match = /\r\n|\r|\n/.exec(buffer)) !== null) {
      // a \r at the end of the buffer may be the first half of a \r\n
      if (match[0] === "\r" && match.index === buffer.length - 1) break;
      yield buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
    }
  }
  buffer += decoder.decode();
  for (const line of buffer.split(/\r\n|\r|\n/)) {
    if (line !== "") yield line;
  }
}

/**
 * Parse a stream's lines into events, as the HTML Living Standard specifies.
 *
 * A blank line ends an event. Comments (lines that start with `:`), and blocks that set only
 * `retry`, yield nothing.
 *
 * @param lines - The stream's lines, without their line endings.
 * @returns The events, in order.
 */
export async function* iterSse(lines: AsyncIterable<string> | Iterable<string>): AsyncGenerator<ServerSentEvent> {
  let event: string | null = null;
  let data: string[] = [];
  let id: string | null = null;
  let retry: number | null = null;
  for await (const line of lines) {
    if (line === "") {
      if (data.length > 0 || event !== null) yield { event, data: data.join("\n"), id, retry };
      event = null;
      data = [];
      id = null;
      retry = null;
      continue;
    }
    if (line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id") id = value;
    else if (field === "retry" && /^\d+$/.test(value)) retry = Number(value);
  }
  if (data.length > 0 || event !== null) yield { event, data: data.join("\n"), id, retry };
}
