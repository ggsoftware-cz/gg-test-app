import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Lightweight liveness probe used by CI smoke tests, Docker HEALTHCHECK and
// uptime monitors. Append ?db=1 to also verify the database connection.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = { status: "ok", timestamp: new Date().toISOString() };

  if (url.searchParams.has("db")) {
    try {
      const { prisma } = await import("@/app/lib/db");
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      return NextResponse.json(
        { ...payload, status: "degraded", db: "down", error: String(error) },
        { status: 503 },
      );
    }
    return NextResponse.json({ ...payload, db: "up" });
  }

  return NextResponse.json(payload);
}
