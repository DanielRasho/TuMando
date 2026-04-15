"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/ui/table/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBills, Bill } from "@/lib/api";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import { BillDetailsDialog } from "@/components/bills/bill-details-dialog";

const createBillsColumns = (onRowClick: (billId: string) => void): ColumnDef<Bill>[] => [
  {
    accessorKey: "id",
    header: "Bill ID",
    cell: ({ row }) => (
      <button
        onClick={() => onRowClick(row.original.id)}
        className="font-mono text-sm text-primary hover:underline"
      >
        {row.original.id.slice(0, 8)}...
      </button>
    ),
  },
  {
    accessorKey: "nit",
    header: "NIT",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
  {
    accessorKey: "shop",
    header: "Shop",
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => `Q${row.original.total_amount.toFixed(2)}`,
  },
];

export function BillsView() {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const billsQuery = useQuery({
    queryKey: ["bills"],
    queryFn: getBills,
  });

  const columns = useMemo(() => createBillsColumns((billId) => {
    setSelectedBillId(billId);
    setDetailsOpen(true);
  }), []);

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Bills</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              View all sales bills, invoice details, and transaction history. Click on a bill to see details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-end">
              <CreateBillDialog />
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

      <BillDetailsDialog billId={selectedBillId} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
}
