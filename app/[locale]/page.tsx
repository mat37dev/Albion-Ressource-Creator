import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeftRight, Hammer, Repeat, Store, TrendingUp, Zap, RefreshCw, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopOpportunities } from "@/components/TopOpportunities";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations("home");

  const features = [
    {
      href: `/${locale}/flipper`,
      icon: ArrowLeftRight,
      title: t("cards.flipper.title"),
      description: t("cards.flipper.description"),
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      href: `/${locale}/craft`,
      icon: Hammer,
      title: t("cards.craft.title"),
      description: t("cards.craft.description"),
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      border: "border-orange-400/20",
    },
    {
      href: `/${locale}/black-market`,
      icon: Store,
      title: t("cards.blackMarket.title"),
      description: t("cards.blackMarket.description"),
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      border: "border-red-400/20",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-albion-gold/20 flex items-center justify-center">
            <TrendingUp className="h-9 w-9 text-albion-gold" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-albion-gold">
          {t("title")}
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t("description")}
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className={`h-full transition-all hover:scale-[1.02] hover:border-albion-gold/40 cursor-pointer border ${feature.border}`}>
                <CardHeader>
                  <div className={`h-10 w-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Top Opportunities */}
      <TopOpportunities />

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, value: "7", label: t("stats.cities"), color: "text-albion-gold" },
          { icon: RefreshCw, value: "30 min", label: t("stats.minutes"), color: "text-blue-400" },
          { icon: TrendingUp, value: "EU", label: "Server", color: "text-green-400" },
          { icon: DollarSign, value: "100%", label: t("stats.free"), color: "text-purple-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
