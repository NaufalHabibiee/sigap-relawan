import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Kata sandi baru" };

export default function NewPasswordPage() {
  return <NewPasswordForm />;
}
