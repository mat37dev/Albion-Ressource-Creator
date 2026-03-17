import { useTranslations } from "next-intl";
import { CraftCalculatorClient } from "@/components/CraftCalculatorClient";
import { Hammer } from "lucide-react";

export default function CraftPage() {
  return <CraftContent />;
}

function CraftContent() {
  const t = useTranslations("craft");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-orange-400/10 flex items-center justify-center">
          <Hammer className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <CraftCalculatorClient />
    </div>
  );
}
