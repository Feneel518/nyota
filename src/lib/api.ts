"use client";
export async function api<T = Record<string, unknown>>(
  url: string,
  data?: unknown,
): Promise<T> {
  const result = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const body = await result.json();
  if (!result.ok)
    throw new ApiError(
      body.error || "Could not complete this request. Please retry.",
      result.status,
    );
  return body;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function errorMessage(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Something went wrong. Please try again.";
}
export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
