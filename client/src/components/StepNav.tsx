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
        background: "var(--s1)",
        borderBottom: "1px solid var(--s5)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
      }}
      data-testid="step-nav"
    >
      {steps.map((step, i) => {
        const isDone = i < completedUpTo;
        const isActive = i === currentIndex;
        const isPending = !isDone && !isActive;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "13px 14px 11px",
                position: "relative",
                borderBottom: isActive ? "2px solid var(--blue)" : "2px solid transparent",
                marginBottom: isActive ? -1 : 0,
                gap: 8,
              }}
              data-testid={`step-nav-item-${i}`}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  ...(isDone
                    ? { background: "var(--green)", border: "1.5px solid var(--green)", color: "#fff" }
                    : isActive
                      ? { background: "var(--blue)", border: "1.5px solid var(--blue)", color: "#fff" }
                      : { background: "transparent", border: "1.5px solid var(--t3)", color: "var(--t3)" }),
                }}
              >
                {isDone ? <Check size={10} strokeWidth={3} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDone ? "var(--t2)" : isActive ? "var(--t1)" : "var(--t3)",
                  whiteSpace: "nowrap",
                }}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                style={{
                  color: "var(--s5)",
                  fontSize: 12,
                  margin: "0 2px",
                  userSelect: "none",
                }}
              >
                ›
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
