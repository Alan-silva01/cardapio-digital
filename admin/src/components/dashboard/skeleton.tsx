"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MetricCardSkeleton() {
  return (
    <Card className="shadow-none rounded-xl border border-border animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-3.5 w-3.5 bg-muted rounded-full" />
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="h-6 w-24 bg-muted rounded mt-1" />
        <div className="h-3 w-32 bg-muted rounded mt-2" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full animate-pulse">
      <CardHeader className="pb-1 pt-3 px-4 shrink-0">
        <div className="h-4 w-32 bg-muted rounded mb-2" />
        <div className="h-3 w-48 bg-muted rounded" />
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-3 flex flex-col justify-end min-h-[160px]">
        <div className="flex items-end gap-2 h-full">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-muted rounded-t"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ListSkeleton() {
  return (
    <Card className="shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full animate-pulse">
      <CardHeader className="pb-1 pt-3 px-4 shrink-0">
        <div className="h-4 w-32 bg-muted rounded mb-2" />
        <div className="h-3 w-48 bg-muted rounded" />
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-3 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-8 bg-muted rounded" />
              <div className="space-y-1">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
