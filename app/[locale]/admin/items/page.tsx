import { useTranslations } from "next-intl";
import { AdminItemsBrowser } from "@/components/admin/AdminItemsBrowser";

export default function AdminItemsPage() {
  return <AdminItemsPageContent />;
}

function AdminItemsPageContent() {
  const t = useTranslations("admin.items");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-albion-gold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <AdminItemsBrowser />
    </div>
  );
}
