"use client";

import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

export default function Home() {
  // Temporary connection test (Phase 0). Replaced by real screens in Phase 12.
  const result = useQuery(api.health.ping);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <Button>shadcn Button works</Button>
      <p className="rounded-md bg-blue-500 px-4 py-2 text-white">
        Tailwind works
      </p>
      <p className="rounded-md border px-4 py-2 font-mono text-sm">
        {result === undefined
          ? "Convex: loading..."
          : `Convex: ${JSON.stringify(result)}`}
      </p>
    </main>
  );
}