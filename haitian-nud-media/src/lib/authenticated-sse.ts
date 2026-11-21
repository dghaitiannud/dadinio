export type ApiSseEvent = (event: string, data: string) => void;

/**
 * Fetch-based SSE client. Unlike EventSource, fetch allows the Supabase JWT
 * to be sent in the Authorization header instead of exposing it in the URL.
 */
export async function consumeAuthenticatedSSE(
  url: string,
  accessToken: string,
  onEvent: ApiSseEvent,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed (${response.status})`);
  }
  if (!response.body) {
    throw new Error("SSE response body is unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (block: string) => {
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(":")) continue;
      const separator = line.indexOf(":");
      const field = separator === -1 ? line : line.slice(0, separator);
      const value = separator === -1 ? "" : line.slice(separator + 1).replace(/^ /, "");
      if (field === "event") eventName = value || "message";
      if (field === "data") dataLines.push(value);
    }

    if (dataLines.length) onEvent(eventName, dataLines.join("\n"));
  };

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: !done });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        dispatch(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }

      if (done) {
        if (buffer.trim()) dispatch(buffer);
        return;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The server may already have closed the stream.
    }
  }
}
