import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-neutral-500">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Back to homepage
      </Link>
    </main>
  );
}
