"use client";

import { Suspense } from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Segmented from "@/components/Segmented";
import { CityPicker } from "@/components/CityPicker";
import type { Lang, Role } from "@/lib/types";
import { t } from "@/lib/i18n";

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = searchParams.get("mode") === "login";

  const [lang, setLang] = useState<Lang>("en");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("candidate");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isLogin ? "" : name,
          phone,
          email: isLogin ? undefined : email,
          role,
          gender: isLogin ? undefined : gender,
          region: isLogin ? undefined : region,
          preferred_cities: isLogin || role !== "candidate" ? undefined : cities,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      // Redirect based on role
      if (data.user?.role === "employer") {
        router.push("/employer/post");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-main py-12 flex justify-center">
        <div className="w-full max-w-md">
          <div className="card animate-fade-in">
            <div className="text-center mb-6">
              <h1 className="section-title">
                {isLogin ? t("loginTitle", lang) : t("signupTitle", lang)}
              </h1>
              <p className="section-sub text-sm mt-1">
                {isLogin ? t("loginSub", lang) : t("signupSub", lang)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="label">{t("fullName", lang)}</label>
                  <input
                    className="input"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder", lang)}
                  />
                </div>
              )}

              <div>
                <label className="label">{t("phone", lang)}</label>
                <input
                  className="input"
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePlaceholder", lang)}
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="label">{t("email", lang)}</label>
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="label">{t("iAmA", lang)}</label>
                    <Segmented
                      name="role"
                      value={role}
                      onChange={setRole}
                      options={[
                        { value: "candidate", label: t("jobSeeker", lang) },
                        { value: "employer", label: t("employer", lang) },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="label">{t("gender", lang)}</label>
                    <Segmented
                      name="gender"
                      value={gender as any}
                      onChange={setGender}
                      options={[
                        { value: "female", label: t("female", lang) },
                        { value: "male", label: t("male", lang) },
                        { value: "other", label: t("other", lang) },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="label">{t("region", lang)}</label>
                    <Segmented
                      name="region"
                      value={region as any}
                      onChange={setRegion}
                      options={[
                        { value: "urban", label: t("urban", lang) },
                        { value: "rural", label: t("rural", lang) },
                      ]}
                    />
                  </div>

                  {role === "candidate" && (
                    <div>
                      <label className="label">
                        {lang === "ne" ? "कहाँ काम गर्न चाहनुहुन्छ? (वैकल्पिक)" : "Where do you want to work? (optional)"}
                      </label>
                      <CityPicker value={cities} onChange={setCities} lang={lang} />
                    </div>
                  )}
                </>
              )}

              {isLogin && (
                <div>
                  <label className="label">{t("iAmA", lang)}</label>
                  <Segmented
                    name="role-login"
                    value={role}
                    onChange={setRole}
                    options={[
                      { value: "candidate", label: t("jobSeeker", lang) },
                      { value: "employer", label: t("employer", lang) },
                    ]}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-danger-light text-sm text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading
                  ? t("loading", lang)
                  : isLogin
                    ? t("login", lang)
                    : t("createAccount", lang)}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-ink-muted">
              {isLogin ? (
                <>
                  {t("noAccount", lang)}{" "}
                  <a href="/signup" className="text-brand hover:underline">
                    {t("signUp", lang)}
                  </a>
                </>
              ) : (
                <>
                  {t("alreadyHaveAccount", lang)}{" "}
                  <a href="/signup?mode=login" className="text-brand hover:underline">
                    {t("login", lang)}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** useSearchParams must sit inside a Suspense boundary for `next build`. */
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}
