import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-4 p-8">
      <Button>shadcn Button works</Button>
      <p className="rounded-md bg-blue-500 px-4 py-2 text-white">
        Tailwind works
      </p>
    </main>
  );
}
