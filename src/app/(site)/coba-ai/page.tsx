import type { Metadata } from "next";
import { DemoAi } from "@/components/demo-ai";
import { OfflineTriagePanel } from "@/components/offline-triage-panel";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Coba AI Sigap",
  description: "Ketik atau ucapkan kebutuhan relawan. AI Sigap menyusun panggilan, menilai urgensi, dan memeriksa tanda penipuan tanpa perlu login.",
};

export default function TryAiPage() {
  return (
    <Container className="max-w-3xl space-y-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold tracking-wide text-sigap-ink uppercase">Demo tanpa login</p>
        <h1 className="h-section text-3xl sm:text-4xl">Coba AI Sigap</h1>
        <p className="text-ink-soft">
          Ceritakan kebutuhan relawan dengan bahasa sehari-hari, ketik atau tekan <b>Bicara</b>. Dalam beberapa detik AI menyusun panggilan relawan, menilai tingkat urgensi, dan
          memeriksa tanda penipuan serta risiko keselamatan. Tidak ada data yang disimpan.
        </p>
      </header>
      <DemoAi />
      <OfflineTriagePanel />
    </Container>
  );
}
