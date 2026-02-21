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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight">TapTrao</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Database className="w-3 h-3 mr-1" />
            Data Overview
          </Badge>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28, letterSpacing: "-0.5px", color: "var(--t1)" }}
              data-testid="text-admin-title"
            >
              Data Overview
            </h1>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--t2)" }}>
              Record counts for each database table.
            </p>
          </div>

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isError && (
            <Card className="border-destructive/50">
              <CardContent className="p-4 text-sm text-destructive">
                Failed to load data counts. Make sure the database is seeded.
              </CardContent>
            </Card>
          )}

          {data && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Destinations", count: data.destinations },
                { label: "Frameworks", count: data.regionalFrameworks },
                { label: "Origin Countries", count: data.originCountries },
                { label: "Commodities", count: data.commodities },
                { label: "AfCFTA RoO", count: data.afcftaRoo },
              ].map((item) => (
                <Card key={item.label} data-testid={`card-count-${item.label.toLowerCase().replace(/ /g, "-")}`}>
                  <CardContent className="p-6 text-center space-y-1">
                    <p className="text-3xl font-bold text-primary">
                      {item.count}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {statsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {stats && (
            <>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" data-testid="text-section-by-type">
                  Commodities by Type
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    (Total: {stats.total})
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {Object.entries(TYPE_LABELS).map(([key, label]) => {
                    const count = stats.byType[key] || 0;
                    if (count === 0) return null;
                    return (
                      <Card key={key} data-testid={`card-type-${key}`}>
                        <CardContent className="p-6 text-center space-y-1">
                          <p className="text-3xl font-bold">{count}</p>
                          <p className="text-sm text-muted-foreground">{label}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold" data-testid="text-section-by-trigger">
                  Commodities by Regulatory Trigger
                </h2>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(stats.byTrigger).map(([trigger, count]) => (
                    <Card key={trigger} data-testid={`card-trigger-${trigger.toLowerCase()}`}>
                      <CardContent className="p-6 text-center space-y-1">
                        <p className="text-3xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground">{trigger}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {stats.stopFlagCommodities.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-section-stop-flags">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    STOP Flag Commodities
                  </h2>
                  <div className="grid gap-4 md:grid-cols-1">
                    {stats.stopFlagCommodities.map((item) => (
                      <Card
                        key={item.name}
                        className="border-destructive/50"
                        data-testid={`card-stop-${item.hsCode}`}
                      >
                        <CardContent className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive" className="text-xs">
                              STOP
                            </Badge>
                            <div>
                              <p className="font-medium text-destructive">{item.name}</p>
                              <p className="text-xs text-muted-foreground">HS {item.hsCode}</p>
                            </div>
                          </div>
                          <div className="text-sm text-destructive/80">
                            {Object.entries(item.stopFlags).map(([key, val]) => (
                              <p key={key}>{val}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
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
