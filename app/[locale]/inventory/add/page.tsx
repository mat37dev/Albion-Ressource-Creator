import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AddInventoryItemClient } from "@/components/inventory/AddInventoryItemClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AddInventoryItemPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return <AddInventoryItemClient locale={locale} />;
}
