"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBillById, BillDetailResponse } from "@/lib/api";

interface BillDetailsDialogProps {
  billId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillDetailsDialog({ billId, open, onOpenChange }: BillDetailsDialogProps) {
  const billQuery = useQuery({
    queryKey: ["bill", billId],
    queryFn: () => getBillById(billId!),
    enabled: open && !!billId,
  });

  const bill = billQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
          <DialogDescription>Transaction information and purchased items</DialogDescription>
        </DialogHeader>

        {billQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : billQuery.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {billQuery.error.message || "Failed to load bill details"}
          </div>
        ) : bill ? (
          <div className="space-y-6">
            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/60 bg-muted/40 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Bill ID</p>
                <p className="text-sm font-mono">{bill.id.slice(0, 8)}...{bill.id.slice(-4)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">NIT</p>
                <p className="text-sm font-semibold">{bill.nit}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Date</p>
                <p className="text-sm">{new Date(bill.date).toLocaleDateString()} {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
                <p className="text-sm font-semibold">Q{bill.total_amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Purchased Items</h3>
              <div className="space-y-2 rounded border border-border/60">
                <div className="grid grid-cols-5 gap-2 border-b bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <div>Item</div>
                  <div className="text-right">Unit Cost</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Total</div>
                </div>
                {bill.detail.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 border-b px-3 py-2.5 text-sm last:border-b-0">
                    <div className="font-medium">
                      {item.name}
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">Q{item.unitary_cost.toFixed(2)}</div>
                    <div className="text-right">{item.quantity}</div>
                    <div className="text-right font-semibold">Q{item.total_cost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end rounded-lg border border-border/60 bg-muted/40 p-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <p className="text-2xl font-bold">Q{bill.total_amount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
