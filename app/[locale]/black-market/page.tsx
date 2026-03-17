import { useTranslations } from "next-intl";
import { BlackMarketClient } from "@/components/BlackMarketClient";
import { Store, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BlackMarketPage() {
  return <BlackMarketContent />;
}

function BlackMarketContent() {
  const t = useTranslations("blackMarket");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-400/10 flex items-center justify-center">
          <Store className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Card className="border-red-400/20 bg-red-400/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p>{t("info")}</p>
          </div>
        </CardContent>
      </Card>

      <BlackMarketClient />
    </div>
  );
}
