"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import Link from "next/link";
import { User, LogOut, ChevronDown, Shield } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface UserMenuProps {
  locale: string;
}

export function UserMenu({ locale }: UserMenuProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("auth");

  if (status === "loading") {
    return <div className="h-9 w-20 bg-albion-blue/30 rounded-md animate-pulse" />;
  }

  if (!session) {
    return (
      <Link href={`/${locale}/login`}>
        <Button
          size="sm"
          variant="outline"
          className="border-albion-gold/50 text-albion-gold hover:bg-albion-gold/10"
        >
          {t("login")}
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="text-albion-gold gap-2">
          <div className="h-6 w-6 rounded-full bg-albion-gold/20 flex items-center justify-center">
            <User className="h-3 w-3 text-albion-gold" />
          </div>
          <span className="hidden sm:inline max-w-24 truncate">
            {session.user.name ?? session.user.email}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className="bg-albion-darker border border-albion-blue/30 rounded-md p-1 shadow-xl min-w-36 z-50"
        sideOffset={4}
      >
        <DropdownMenu.Item asChild>
          <Link
            href={`/${locale}/profile`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-albion-blue/30 rounded cursor-pointer outline-none"
          >
            <User className="h-4 w-4" />
            {t("profile")}
          </Link>
        </DropdownMenu.Item>
        {session.user.role === "admin" && (
          <DropdownMenu.Item asChild>
            <Link
              href={`/${locale}/admin`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded cursor-pointer outline-none"
            >
              <Shield className="h-4 w-4" />
              {t("administration")}
            </Link>
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Separator className="my-1 h-px bg-albion-blue/30" />
        <DropdownMenu.Item asChild>
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded cursor-pointer outline-none"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
