import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "@/lib/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const t = (key: string) => i18n.t(key, { ns: "common" });

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#000",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#242428",
              borderRadius: 18,
              padding: "48px 40px",
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 600,
                fontSize: 22,
                color: "#fff",
                margin: "0 0 8px",
              }}
            >
              {t("error.title")}
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.55)",
                margin: "0 0 28px",
                lineHeight: 1.5,
              }}
            >
              {t("error.description")}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
                fontWeight: 500,
                background: "#6b9080",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 28px",
                cursor: "pointer",
              }}
            >
              {t("error.reload")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
