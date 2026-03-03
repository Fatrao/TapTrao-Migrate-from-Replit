import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ArrowLeft, Database, AlertTriangle } from "lucide-react";

type TableCounts = {
  destinations: number;
  regionalFrameworks: number;
  originCountries: number;
  commodities: number;
  afcftaRoo: number;
};

type CommodityStats = {
  total: number;
  byType: Record<string, number>;
  byTrigger: Record<string, number>;
  stopFlagCommodities: { name: string; hsCode: string; stopFlags: Record<string, string> }[];
};

const TYPE_LABELS: Record<string, string> = {
  agricultural: "Agricultural",
  mineral: "Mineral",
  forestry: "Forestry",
  seafood: "Seafood",
  livestock: "Livestock",
  manufactured: "Manufactured",
};

export default function AdminData() {
  const { data, isLoading, isError } = useQuery<TableCounts>({
    queryKey: ["/api/table-counts"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<CommodityStats>({
    queryKey: ["/api/commodity-stats"],
  });

  return (
    <div className="admin-standalone min-h-screen w-full bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0e4e45]" />
              <span className="font-clash font-semibold text-[17px] text-gray-900">TapTrao</span>
            </div>
          </div>
          <Badge className="bg-[#0e4e45] text-white text-xs hover:bg-[#0e4e45]">
            <Database className="w-3 h-3 mr-1" />
            Data Overview
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <div className="space-y-1">
            <h1
              className="font-clash font-bold text-[28px] text-gray-900 tracking-tight"
              data-testid="text-admin-title"
            >
              Data Overview
            </h1>
            <p className="text-sm text-gray-500">
              Record counts for each database table.
            </p>
          </div>

          {/* Table Counts - Loading */}
          {isLoading && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          )}

          {/* Table Counts - Error */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              Failed to load data counts. Make sure the database is seeded.
            </div>
          )}

          {/* Table Counts - Data */}
          {data && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              {[
                { label: "Destinations", count: data.destinations },
                { label: "Frameworks", count: data.regionalFrameworks },
                { label: "Origin Countries", count: data.originCountries },
                { label: "Commodities", count: data.commodities },
                { label: "AfCFTA RoO", count: data.afcftaRoo },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
                  data-testid={`card-count-${item.label.toLowerCase().replace(/ /g, "-")}`}
                >
                  <p className="text-3xl font-bold text-[#0e4e45]">
                    {item.count}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Commodity Stats - Loading */}
          {statsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commodity Stats - Data */}
          {stats && (
            <>
              {/* By Type */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900" data-testid="text-section-by-type">
                  Commodities by Type
                  <span className="ml-2 text-gray-400 font-normal text-sm">
                    (Total: {stats.total})
                  </span>
                </h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                  {Object.entries(TYPE_LABELS).map(([key, label]) => {
                    const count = stats.byType[key] || 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={key}
                        className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
                        data-testid={`card-type-${key}`}
                      >
                        <p className="text-3xl font-bold text-gray-900">{count}</p>
                        <p className="text-sm text-gray-500 mt-1">{label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Regulatory Trigger */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900" data-testid="text-section-by-trigger">
                  Commodities by Regulatory Trigger
                </h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {Object.entries(stats.byTrigger).map(([trigger, count]) => (
                    <div
                      key={trigger}
                      className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
                      data-testid={`card-trigger-${trigger.toLowerCase()}`}
                    >
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-500 mt-1">{trigger}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* STOP Flag Commodities */}
              {stats.stopFlagCommodities.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2" data-testid="text-section-stop-flags">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    STOP Flag Commodities
                  </h2>
                  <div className="grid gap-3">
                    {stats.stopFlagCommodities.map((item) => (
                      <div
                        key={item.name}
                        className="bg-white rounded-xl p-4 shadow-sm border border-red-200 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                        data-testid={`card-stop-${item.hsCode}`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive" className="text-xs">
                            STOP
                          </Badge>
                          <div>
                            <p className="font-medium text-red-600">{item.name}</p>
                            <p className="text-xs text-gray-400">HS {item.hsCode}</p>
                          </div>
                        </div>
                        <div className="text-sm text-red-500">
                          {Object.entries(item.stopFlags).map(([key, val]) => (
                            <p key={key}>{val}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
