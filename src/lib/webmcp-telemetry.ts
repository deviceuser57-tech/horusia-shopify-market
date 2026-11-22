export function runWebMCPTool<T>(
  toolName: string,
  action: () => T | Promise<T>,
): T | Promise<T> {
  const start = performance.now();
  const track = (status: "success" | "error") => {
    const duration = Math.round(performance.now() - start);
    const emitter = (window as unknown as { __lovableEvents?: { emit?: (event: string, payload: unknown) => void } })
      .__lovableEvents;
    emitter?.emit?.("lovable.webmcp_tool_invoked", {
      tool: toolName,
      status,
      duration_ms: Math.min(duration, 86_400_000),
    });
  };

  try {
    const result = action();
    if (result instanceof Promise) {
      return result
        .then((res) => {
          track("success");
          return res;
        })
        .catch((err) => {
          track("error");
          throw err;
        });
    }
    track("success");
    return result;
  } catch (err) {
    track("error");
    throw err;
  }
}
