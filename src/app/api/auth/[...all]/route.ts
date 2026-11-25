import { type NextRequest, NextResponse } from "next/server";

// Better Auth routes are served from convex/http.ts
// This catch-all proxies to the Convex HTTP handler

export async function POST(req: NextRequest) {
  // Forward to Convex Better Auth handler
  // The full URL should be the Convex deployment URL
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const path = req.nextUrl.pathname;

  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex URL not configured" },
      { status: 500 },
    );
  }

  const response = await fetch(`${convexUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: await req.text(),
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(req: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const path = req.nextUrl.pathname;

  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex URL not configured" },
      { status: 500 },
    );
  }

  const response = await fetch(`${convexUrl}${path}`, {
    method: "GET",
    headers: req.headers as any,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/json",
    },
  });
}
