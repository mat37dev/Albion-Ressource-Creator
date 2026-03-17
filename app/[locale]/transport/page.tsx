import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { TransportClient } from "@/components/TransportClient";
import { ArrowLeftRight } from "lucide-react";

export default function TransportPage() {
  return <TransportContent />;
}

function TransportContent() {
  const t = useTranslations("transport");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
          <ArrowLeftRight className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>
      <Suspense fallback={<div className="text-muted-foreground">{t("loading")}</div>}>
        <TransportClient />
      </Suspense>
    </div>
  );
}
