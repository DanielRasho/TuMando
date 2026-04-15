"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Store } from "lucide-react";
import { useMemo, useState } from "react";

import { getPopularItemsReport, getShops, PopularItem } from "@/lib/api";
import { popularItemsDescription } from "@/components/reports/reports-view";
import { DataTable } from "@/components/ui/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns: ColumnDef<PopularItem>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: ({ row }) => row.original.cost.toFixed(2),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "total_quantity",
    header: "Total quantity",
  },
];

export function PopularItemsReportView() {
  const [shopId, setShopId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const shopsQuery = useQuery({
    queryKey: ["shops", "report-filter"],
    queryFn: () => getShops({}),
  });

  const isReady = Boolean(shopId && startDate && endDate);

  const reportFilters = useMemo(() => {
    if (!isReady) {
      return null;
    }

    return {
      shopId: Number(shopId),
      start: toStartOfDayEpoch(startDate),
      end: toEndOfDayEpoch(endDate),
    };
  }, [endDate, isReady, shopId, startDate]);

  const query = useQuery({
    queryKey: ["reports", "popular-items", reportFilters],
    queryFn: () => getPopularItemsReport(reportFilters!),
    enabled: Boolean(reportFilters),
  });

  const sortedColumns = useMemo(() => columns, []);

  return (
    <div className="p-4 sm:p-6">
      <Card className="border border-border/60 bg-card/90 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Button variant="ghost" asChild className="w-fit px-0 text-muted-foreground hover:text-foreground">
                <Link href="/reports">
                  <ArrowLeft className="size-4" />
                  Back to reports
                </Link>
              </Button>
              <CardTitle className="text-2xl">Popular Items</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">{popularItemsDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-shop">Shop</Label>
              <Select value={shopId} onValueChange={setShopId} disabled={shopsQuery.isLoading || !!shopsQuery.error}>
                <SelectTrigger id="report-shop" className="w-full">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a shop" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(shopsQuery.data ?? []).map((shop) => (
                    <SelectItem key={shop.id} value={String(shop.id)}>
                      {shop.id} - {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-start">Start date</Label>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="report-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-end">End date</Label>
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="report-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {shopsQuery.error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {shopsQuery.error.message || "Something went wrong while loading shops."}
            </div>
          ) : null}

          <DataTable
            columns={sortedColumns}
            data={isReady ? query.data ?? [] : []}
            isLoading={query.isLoading}
            error={query.error}
            emptyMessage={
              isReady
                ? "No popular items were found for the selected shop and date range."
                : "Select a shop, a start date, and an end date to load this report."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function toStartOfDayEpoch(value: string) {
  return Math.floor(new Date(`${value}T00:00:00`).getTime() / 1000);
}

function toEndOfDayEpoch(value: string) {
  return Math.floor(new Date(`${value}T23:59:59`).getTime() / 1000);
}
