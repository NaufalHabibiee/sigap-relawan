import type { Metadata } from "next";
import { DM_Mono, Instrument_Sans, Plus_Jakarta_Sans, Poppins } from "next/font/google";
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

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html lang="id" data-scroll-behavior="smooth" className={`${poppins.variable} ${instrument.variable} ${jakarta.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
