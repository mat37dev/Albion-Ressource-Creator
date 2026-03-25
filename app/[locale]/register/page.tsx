import { RegisterClient } from "@/components/RegisterClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  return <RegisterClient locale={locale} />;
}
