import { Check } from "lucide-react";

interface StepNavProps {
  steps: string[];
  currentIndex: number;
  completedUpTo: number;
}

export function StepNav({ steps, currentIndex, completedUpTo }: StepNavProps) {
  return (
    <div
      style={{
        padding: "18px 28px 8px",
        display: "flex",
        alignItems: "center",
      }}
      data-testid="step-nav"
    >
      {steps.map((step, i) => {
        const isDone = i < completedUpTo;
        const isActive = i === currentIndex;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              data-testid={`step-nav-item-${i}`}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: "var(--fh)",
                  transition: "all 0.2s",
                  ...(isDone
                    ? { background: "var(--green)", color: "#000" }
                    : isActive
                      ? { background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid var(--green)" }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }),
                }}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  ...(isDone
                    ? { color: "var(--green)" }
                    : isActive
                      ? { color: "#fff" }
                      : { color: "rgba(255,255,255,0.5)" }),
                }}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: isDone ? "var(--green)" : "rgba(255,255,255,0.1)",
                  margin: "0 10px",
                  minWidth: 24,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
