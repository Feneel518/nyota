import type { Instrumentation } from "next";
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("./server/env");
    env();
  }
}
export const onRequestError: Instrumentation.onRequestError = (
  error,
  _request,
  context,
) => {
  // Never send request paths, cookies, query strings, content, or provider errors to logs.
  console.error(
    JSON.stringify({
      code: "SERVER_RENDER_FAILED",
      digest:
        error && typeof error === "object" && "digest" in error
          ? String(error.digest)
          : undefined,
      route: context.routePath,
      kind: context.routeType,
    }),
  );
};
