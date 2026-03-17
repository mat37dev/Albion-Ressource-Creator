"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";

interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Replace the locale segment in the path
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={currentLocale === "fr" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchLocale("fr")}
        className={currentLocale === "fr" ? "bg-albion-gold text-albion-dark hover:bg-albion-gold/90" : "text-gray-400 hover:text-white"}
      >
        FR
      </Button>
      <Button
        variant={currentLocale === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchLocale("en")}
        className={currentLocale === "en" ? "bg-albion-gold text-albion-dark hover:bg-albion-gold/90" : "text-gray-400 hover:text-white"}
      >
        EN
      </Button>
    </div>
  );
}
