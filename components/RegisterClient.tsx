"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";

export function RegisterClient({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorKey =
        data.error === "email_taken"
          ? "errors.emailTaken"
          : data.error === "password_too_short"
          ? "errors.passwordTooShort"
          : "errors.registrationFailed";
      setError(t(errorKey));
      setIsLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="border border-albion-blue/30 rounded-lg p-8 bg-albion-darker/50">
        <h1 className="text-2xl font-bold text-albion-gold mb-2">{t("registerTitle")}</h1>
        <p className="text-gray-400 text-sm mb-6">{t("registerSubtitle")}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("ingameName")}</Label>
            <Input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="mt-1 bg-albion-dark border-albion-blue/30"
            />
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="mt-1 bg-albion-dark border-albion-blue/30"
            />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              className="mt-1 bg-albion-dark border-albion-blue/30"
            />
            <p className="text-xs text-gray-500 mt-1">{t("passwordHint")}</p>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
          >
            {isLoading ? t("registering") : t("register")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          {t("hasAccount")}{" "}
          <Link href={`/${locale}/login`} className="text-albion-gold hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
