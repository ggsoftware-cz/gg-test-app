import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Replace these template sanity tests with real unit tests as the project
// grows. DATABASE_URL points at the ephemeral Neon branch in CI when Neon is
// configured, so DB-backed tests work there too.
describe("template sanity", () => {
  it("runs vitest", () => {
    expect(true).toBe(true);
  });

  it("uses postgres as the Prisma provider", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/provider\s*=\s*"postgresql"/);
  });
});
