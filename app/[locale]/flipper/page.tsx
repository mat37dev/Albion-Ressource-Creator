import { useTranslations } from "next-intl";
import { FlipperClient } from "@/components/FlipperClient";
import { Repeat } from "lucide-react";

export default function FlipperPage() {
  return <FlipperContent />;
}

function FlipperContent() {
  const t = useTranslations("flipper");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
          <Repeat className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <FlipperClient />
    </div>
  );
}
