"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TrendingUp, ArrowLeftRight, Hammer, Repeat, Store } from "lucide-react";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    { href: `/${locale}`, label: t("home"), icon: TrendingUp },
    { href: `/${locale}/transport`, label: t("transport"), icon: ArrowLeftRight },
    { href: `/${locale}/craft`, label: t("craft"), icon: Hammer },
    { href: `/${locale}/flipper`, label: t("flipper"), icon: Repeat },
    { href: `/${locale}/black-market`, label: t("blackMarket"), icon: Store },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-albion-blue/30 bg-albion-darker/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-albion-gold/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-albion-gold" />
            </div>
            <span className="text-lg font-bold text-albion-gold">AlbionCreator</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== `/${locale}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-albion-blue/50 text-albion-gold"
                      : "text-gray-400 hover:text-white hover:bg-albion-blue/30"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <LanguageSwitcher currentLocale={locale} />
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex overflow-x-auto gap-1 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== `/${locale}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-albion-blue/50 text-albion-gold"
                    : "text-gray-400 hover:text-white hover:bg-albion-blue/30"
                )}
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
