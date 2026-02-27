import { AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Convert ISO 3166-1 alpha-2 code to regional indicator emoji flag */
export function iso2ToFlag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "";
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(
    0x1f1e6 - 65 + upper.charCodeAt(0),
    0x1f1e6 - 65 + upper.charCodeAt(1)
  );
}

interface CountryFlagBadgeProps {
  iso2: string;
  countryName: string;
  status?: string | null;
  flagReason?: string | null;
  flagDetails?: string | null;
  /** Show just the flag + iso code instead of full name */
  compact?: boolean;
  className?: string;
}

export default function CountryFlagBadge({
  iso2,
  countryName,
  status,
  flagReason,
  flagDetails,
  compact = false,
  className,
}: CountryFlagBadgeProps) {
  const isFlagged = status === "FLAG";
  const flag = iso2ToFlag(iso2);

  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      {flag} {compact ? iso2 : countryName}
      {isFlagged && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <span className="inline-flex cursor-help">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-xs bg-[#1a1a1c] border border-amber-500/30 shadow-lg z-[9999]"
              sideOffset={8}
            >
              <div className="space-y-1.5 p-1">
                <p className="font-semibold text-amber-400 text-xs">
                  {flagReason ?? "Flagged Country"}
                </p>
                {flagDetails && (
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {flagDetails}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 italic">
                  Enhanced due diligence required
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}
