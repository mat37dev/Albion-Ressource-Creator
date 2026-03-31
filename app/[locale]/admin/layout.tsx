import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Users, Package, Shield } from "lucide-react";
import React from "react";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("admin");

  const navItems = [
    { href: `/${locale}/admin/users`, label: t("nav.users"), icon: Users },
    { href: `/${locale}/admin/items`, label: t("nav.items"), icon: Package },
  ];

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <aside className="w-52 shrink-0">
        <div className="border border-albion-blue/30 rounded-lg overflow-hidden bg-albion-darker/30">
          <div className="px-4 py-3 border-b border-albion-blue/30 flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">{t("panelTitle")}</span>
          </div>
          <nav className="p-2 space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-albion-blue/30 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
