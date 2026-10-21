import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage(props: PageProps<"/daftar">) {
  return (
    <Suspense fallback={<AuthForm mode="register" />}>
      <Register searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Register({ searchParams }: Pick<PageProps<"/daftar">, "searchParams">) {
  const sp = await searchParams;
  return <AuthForm mode="register" initialRole={sp.peran === "penyelenggara" ? "seeker" : "volunteer"} />;
}
