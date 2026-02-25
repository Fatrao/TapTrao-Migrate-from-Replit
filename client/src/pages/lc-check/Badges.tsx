import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Copy, Check } from "lucide-react";

export function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} data-testid={`button-copy-${label}`}>
      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "GREEN") {
    return <Badge variant="secondary" style={{ fontFamily: "var(--fb)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" }} data-testid="badge-severity-green"><CheckCircle2 className="w-3 h-3 mr-1" />Match</Badge>;
  }
  if (severity === "AMBER") {
    return <Badge variant="secondary" style={{ fontFamily: "var(--fb)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" }} data-testid="badge-severity-amber"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
  }
  return <Badge variant="destructive" style={{ fontFamily: "var(--fb)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" }} data-testid="badge-severity-red"><XCircle className="w-3 h-3 mr-1" />Critical</Badge>;
}

export function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "COMPLIANT") {
    return <Badge variant="secondary" style={{ fontFamily: "var(--fb)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" }} data-testid="badge-verdict">COMPLIANT</Badge>;
  }
  if (verdict === "COMPLIANT_WITH_NOTES") {
    return <Badge variant="secondary" style={{ fontFamily: "var(--fb)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" }} data-testid="badge-verdict">COMPLIANT WITH NOTES</Badge>;
  }
  return <Badge variant="destructive" style={{ fontFamily: "var(--fb)", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" }} data-testid="badge-verdict">DISCREPANCIES FOUND</Badge>;
}
