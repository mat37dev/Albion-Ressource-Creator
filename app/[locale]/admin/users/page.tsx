import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/admin/UsersClient";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("admin.users");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
          <Users className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("description")}</p>
        </div>
      </div>
      <UsersClient currentUserId={session.user.id} />
    </div>
  );
}
