import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Lupa kata sandi" };

export default function ForgotPage() {
  return <ResetRequestForm />;
}
