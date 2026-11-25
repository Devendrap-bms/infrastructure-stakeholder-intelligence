"use client";
import Link from "next/link";
import { useAuthClient } from "@/hooks/use-auth-client";

export default function HomePage() {
  const { isAuthenticated } = useAuthClient();

  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">You are signed in.</p>
        <p className="text-sm text-muted-foreground">Navigate to projects...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          Infrastructure Stakeholder Intelligence
        </h1>
        <p className="text-muted-foreground">
          Knowledge-driven stakeholder analysis and risk intelligence
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login" className="border p-2 rounded">
            Login
          </Link>
          <Link href="/auth/signup" className="border p-2 rounded">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
