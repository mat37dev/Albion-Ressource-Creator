import { CraftInventoryClient } from "@/components/craft-inventory/CraftInventoryClient";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CraftInventoryPage({ params }: Props) {
  const { locale } = await params;
  return <CraftInventoryClient locale={locale} />;
}
