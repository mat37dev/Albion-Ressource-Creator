import { LoginClient } from "@/components/LoginClient";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;
  return <LoginClient locale={locale} callbackUrl={callbackUrl} error={error} />;
}
