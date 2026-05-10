import type { Metadata } from "next";
import Link from "next/link";
import { ScrollProgress } from "@/components/scroll-progress";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroScan -- Brain Tumor MRI Atlas",
  description:
    "An interactive atlas: upload a brain MRI and see deep-learning predictions, attention maps, and a written interpretation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen">
        <ScrollProgress />
        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="mx-auto w-full max-w-[1280px] px-8 pt-8">
      <div className="flex items-baseline justify-between border-b border-ink/80 pb-4">
        <Link href="/" className="group relative inline-flex items-baseline gap-3">
          <span className="font-display text-2xl font-medium tracking-tight">
            Neuro<span className="font-display-italic">scan</span>
          </span>
        </Link>
        <nav className="flex items-baseline gap-7 font-sans text-sm text-ink-2">
          <NavLink href="/#atlas">Atlas</NavLink>
          <NavLink href="/#console">Console</NavLink>
          <NavLink href="/#method">Method</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-baseline transition-colors hover:text-copper"
    >
      {children}
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto mt-32 w-full max-w-[1280px] px-8 pb-10">
      <div className="rule-h mb-4" />
      <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 sm:flex-row sm:items-baseline sm:justify-between">
        <span>
          Neuroscan &middot; Created by{" "}
          <a
            href="https://github.com/AureliusNguyen"
            className="text-ink underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Aurelius Nguyen
          </a>
        </span>
        <span className="opacity-80">
          Research preview &middot; not for clinical use
        </span>
      </div>
    </footer>
  );
}
