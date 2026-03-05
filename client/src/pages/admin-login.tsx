import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";

export default function AdminLogin() {
  const { t } = useTranslation("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  usePageTitle("Admin Login");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          {t("login.title")}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("login.subtitle")}
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            loginMutation.mutate();
          }}
        >
          <div className="form-group">
            <label>{t("login.passwordLabel")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.passwordPlaceholder")}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ fontSize: 15, color: "var(--red)", marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending || !password}
            style={{
              background: "var(--sage)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loginMutation.isPending || !password ? 0.5 : 1,
            }}
          >
            {loginMutation.isPending ? t("login.submitting") : t("login.submitButton")}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
