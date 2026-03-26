import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { InventoryClient } from "@/components/inventory/InventoryClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function InventoryPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return <InventoryClient locale={locale} />;
}
