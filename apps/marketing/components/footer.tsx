export function Footer() {
  return (
    <footer className="border-t border-zinc-800 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="font-heading text-lg font-bold">Micro Machine</p>
            <p className="mt-1 text-sm text-zinc-500">
              Stop guessing. Start growing.
            </p>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "#"}
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Get Started
          </a>
        </div>
        <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </footer>
  );
}
