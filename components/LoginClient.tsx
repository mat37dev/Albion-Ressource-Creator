"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";

interface Props {
  locale: string;
  callbackUrl?: string;
  error?: string;
}

export function LoginClient({ locale, callbackUrl, error }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(error ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setFormError(t("errors.invalidCredentials"));
      setIsLoading(false);
    } else {
      router.push(callbackUrl ?? `/${locale}`);
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="border border-albion-blue/30 rounded-lg p-8 bg-albion-darker/50">
        <h1 className="text-2xl font-bold text-albion-gold mb-2">{t("loginTitle")}</h1>
        <p className="text-gray-400 text-sm mb-6">{t("loginSubtitle")}</p>

        {formError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 bg-albion-dark border-albion-blue/30"
            />
          </div>
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 bg-albion-dark border-albion-blue/30"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-albion-gold text-albion-dark hover:bg-albion-gold/90"
          >
            {isLoading ? t("loggingIn") : t("login")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/register`} className="text-albion-gold hover:underline">
            {t("register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
