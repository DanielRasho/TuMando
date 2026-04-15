"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Plus } from "lucide-react";

import { DataTable } from "@/components/ui/table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getBills, Bill } from "@/lib/api";

const billsColumns: ColumnDef<Bill>[] = [
  {
    accessorKey: "id",
    header: "Bill ID",
    cell: ({ row }) => row.original.id.slice(0, 8) + "...",
  },
  {
    accessorKey: "nit",
    header: "NIT",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "shop",
    header: "Shop",
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => `$${row.original.total_amount.toFixed(2)}`,
  },
];

export function BillsView() {
  const billsQuery = useQuery({
    queryKey: ["bills"],
    queryFn: getBills,
  });

  const columns = useMemo(() => billsColumns, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Bills</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              View all sales bills, invoice details, and transaction history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4" />
                    Create bill
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create new bill</DialogTitle>
                    <DialogDescription>
                      This modal is ready for the bill creation form. We can wire the fields and zod validation next.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                    Empty modal placeholder.
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>
            </div>

            <DataTable
              columns={columns}
              data={billsQuery.data ?? []}
              isLoading={billsQuery.isLoading}
              error={billsQuery.error}
              emptyMessage="No bills found."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
