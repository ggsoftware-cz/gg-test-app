import type { Route } from "next";
import Link from "next/link";
import { Heading } from "@/app/components/heading";

const stack = [
  "Next.js 16",
  "Prisma 7 + PostgreSQL (Neon)",
  "Tailwind CSS v4",
  "Vitest + Playwright",
  "GitHub Actions → Vercel",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <Heading
        title="GG Software template"
        subtitle="Next.js + Prisma + Neon, with the company CI/CD standard pre-wired."
      />

      <ul className="flex max-w-md flex-wrap items-center justify-center gap-2">
        {stack.map((item) => (
          <li
            key={item}
            className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="flex gap-4 text-sm">
        <a
          href="/api/health"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background"
        >
          Health check
        </a>
        <Link
          href={"/does-not-exist" as Route}
          className="rounded-md border border-neutral-300 px-4 py-2 font-medium dark:border-neutral-700"
        >
          404 example
        </Link>
      </div>
    </main>
  );
}
