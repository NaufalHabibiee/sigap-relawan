import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage(props: PageProps<"/masuk">) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <Login searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/masuk">, "searchParams">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : null;
  return (
    <>
      {sp.error === "oauth" && (
        <p role="alert" className="mb-6 rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
          Gagal masuk lewat tautan. Coba lagi.
        </p>
      )}
      <AuthForm mode="login" next={next} />
    </>
  );
}
