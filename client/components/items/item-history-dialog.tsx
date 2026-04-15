"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getItemHistory } from "@/lib/api";

interface ItemHistoryDialogProps {
  sku: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_CONFIG = {
  Buy: {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    label: "Purchase",
  },
  Sell: {
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Sale",
  },
  Transfer: {
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Transfer",
  },
} as const;

export function ItemHistoryDialog({ sku, open, onOpenChange }: ItemHistoryDialogProps) {
  const historyQuery = useQuery({
    queryKey: ["itemHistory", sku],
    queryFn: () => getItemHistory(sku!),
    enabled: open && !!sku,
  });

  const history = historyQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Item History</DialogTitle>
          <DialogDescription>All transactions and movements for this item (SKU: {sku})</DialogDescription>
        </DialogHeader>

        {historyQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : historyQuery.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {historyQuery.error.message || "Failed to load history"}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            No transaction history available
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-4">
            {history.map((entry, idx) => {
              const config = ACTION_CONFIG[entry.action_name as keyof typeof ACTION_CONFIG] || {
                icon: TrendingUp,
                color: "text-gray-600",
                bgColor: "bg-gray-50",
                label: entry.action_name,
              };
              const Icon = config.icon;

              return (
                <div
                  key={idx}
                  className={`flex gap-4 rounded-lg border border-border/60 p-3 ${config.bgColor}`}
                >
                  <div className={`flex items-center justify-center rounded-lg ${config.bgColor} p-2`}>
                    <Icon className={`size-5 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{config.label}</h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.color} ${config.bgColor}`}>
                        {entry.action_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-semibold">{entry.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unit Cost</p>
                        <p className="font-semibold">Q{entry.unitary_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-semibold text-xs">
                          {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {entry.bill ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Bill: <span className="font-mono">{entry.bill.slice(0, 8)}...{entry.bill.slice(-4)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
