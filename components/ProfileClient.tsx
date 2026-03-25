"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { Session } from "next-auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Props {
  locale: string;
  session: Session;
}

export function ProfileClient({ locale, session }: Props) {
  const t = useTranslations("auth");
  const [name, setName] = useState(session.user.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSaveName = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSaveStatus(res.ok ? "success" : "error");
    setIsSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="border border-albion-blue/30 rounded-lg p-8 bg-albion-darker/50">
        <h1 className="text-2xl font-bold text-albion-gold mb-6">{t("profileTitle")}</h1>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-400">{t("email")}</p>
            <p className="text-white">{session.user.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-400">{t("role")}</p>
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-albion-blue/30 text-albion-gold capitalize">
              {session.user.role}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("ingameName")}</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-albion-dark border-albion-blue/30 flex-1"
              />
              <Button
                onClick={handleSaveName}
                disabled={isSaving}
                className="bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
              >
                {isSaving ? t("saving") : t("save")}
              </Button>
            </div>
            {saveStatus === "success" && (
              <p className="text-green-400 text-xs">{t("saveSuccess")}</p>
            )}
            {saveStatus === "error" && (
              <p className="text-red-400 text-xs">{t("saveError")}</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-albion-blue/30">
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
          >
            {t("logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
