import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Logo />
      <h1 className="h-display mt-8 text-5xl">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-md text-ink-soft">Mungkin panggilan ini sudah dihapus atau tautannya salah.</p>
      <Link href="/panggilan" className="btn btn-ink mt-8">
        Jelajah panggilan
      </Link>
    </main>
  );
}
