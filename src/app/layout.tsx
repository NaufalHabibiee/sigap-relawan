import type { Metadata } from "next";
import { Instrument_Sans, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Sigap — Temukan panggilan relawan yang cocok untukmu",
    template: "%s · Sigap",
  },
  description:
    "Sigap mencocokkan relawan dengan penyelenggara yang membutuhkan bantuan: tanggap bencana, pendidikan, lingkungan, acara sosial, sampai promosi UMKM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${poppins.variable} ${instrument.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
