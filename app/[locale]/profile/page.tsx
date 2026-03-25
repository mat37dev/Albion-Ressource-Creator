import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return <ProfileClient locale={locale} session={session} />;
}
