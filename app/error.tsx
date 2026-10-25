"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook point for Sentry/other error reporting.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-neutral-500">
        An unexpected error occurred
        {error.digest ? ` (ref: ${error.digest})` : ""}.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Try again
      </button>
    </main>
  );
}
