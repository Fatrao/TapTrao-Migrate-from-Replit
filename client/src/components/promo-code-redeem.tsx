import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PromoCodeRedeem() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/promo/redeem", { code: code.trim() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to redeem");
      return data;
    },
    onSuccess: (data) => {
      setMessage(data.message);
      setIsError(false);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
    },
    onError: (err: Error) => {
      setMessage(err.message);
      setIsError(true);
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Have a promo code?
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setMessage(""); }}
          placeholder="Enter code"
          style={{
            flex: 1,
            textTransform: "uppercase",
            fontFamily: "monospace",
            fontSize: 13,
            padding: "9px 12px",
            background: "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button
          onClick={() => redeemMutation.mutate()}
          disabled={redeemMutation.isPending || !code.trim()}
          style={{
            background: "var(--sage)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            opacity: redeemMutation.isPending || !code.trim() ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {redeemMutation.isPending ? "…" : "Redeem"}
        </button>
      </div>
      {message && (
        <div style={{ fontSize: 12, color: isError ? "var(--red)" : "#16a34a" }}>
          {message}
        </div>
      )}
    </div>
  );
}
