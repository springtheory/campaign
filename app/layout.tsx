import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fall 2026 Campaign Planning",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold">
              Fall 2026 Campaigns
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Board
              </Link>
              <Link href="/methods" className="hover:underline">
                Methods
              </Link>
              <Link href="/nudges" className="hover:underline">
                Nudges
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="text-gray-500 hover:text-gray-900" type="submit">
                  Sign out
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
