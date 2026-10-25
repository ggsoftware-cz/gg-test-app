import { z } from "zod";

// Fails fast (at import time) when a required variable is missing or invalid,
// instead of surfacing as a confusing runtime error later. Add new server
// variables here — for client-exposed values use NEXT_PUBLIC_* and duplicate
// them into a separate client schema.
const serverEnv = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url(),
});

export const env = serverEnv.parse(process.env);
