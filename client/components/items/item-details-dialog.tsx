"use client";

import { ComponentType, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Coins, Package2, Clock } from "lucide-react";

import { getItemDetails } from "@/lib/api";
import { RestockItemDialog } from "@/components/items/restock-item-dialog";
import { TransferItemDialog } from "@/components/items/transfer-item-dialog";
import { ItemHistoryDialog } from "@/components/items/item-history-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SkeletonTable } from "@/components/ui/table/skeleton-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ItemDetailsDialog({
  sku,
  open,
  onOpenChange,
}: {
  sku: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const detailsQuery = useQuery({
    queryKey: ["inventory", "details", sku],
    queryFn: () => getItemDetails(sku!),
    enabled: open && sku !== null,
  });

  const details = detailsQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Item details</DialogTitle>
          <DialogDescription>
            Review item information by shop and restock inventory when needed.
          </DialogDescription>
        </DialogHeader>

        {detailsQuery.isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((value) => (
                <Card key={value} className="border border-border/60 bg-card/90">
                  <CardHeader>
                    <CardTitle className="text-sm">Loading</CardTitle>
                  </CardHeader>
                  <CardContent className="h-8" />
                </Card>
              ))}
            </div>
            <SkeletonTable rows={3} columns={3} />
          </div>
        ) : detailsQuery.error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load item</AlertTitle>
            <AlertDescription>
              {detailsQuery.error.message || "Something went wrong while loading the item details."}
            </AlertDescription>
          </Alert>
        ) : details ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoCard title="SKU" value={String(details.item.sku)} icon={Package2} />
              <InfoCard title="Name" value={details.item.name} icon={Boxes} />
              <InfoCard title="Cost" value={`Q${details.item.cost.toFixed(2)}`} icon={Coins} />
            </div>

            <Card className="border border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">Stock by shop</CardTitle>
                <div className="flex items-center gap-2">
                  <TransferItemDialog sku={details.item.sku} itemName={details.item.name} />
                  <RestockItemDialog sku={details.item.sku} itemName={details.item.name} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop ID</TableHead>
                      <TableHead>Shop name</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.shops.map((shop) => (
                      <TableRow key={shop.shop_id}>
                        <TableCell>{shop.shop_id}</TableCell>
                        <TableCell>{shop.shop_name}</TableCell>
                        <TableCell>{shop.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <DialogFooter className="flex items-center justify-between pt-4">
          {details && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="gap-2"
            >
              <Clock className="size-4" />
              History
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <ItemHistoryDialog sku={sku} open={historyOpen} onOpenChange={setHistoryOpen} />
    </Dialog>
  );
}

function InfoCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" />
          {title}
        </div>
      </CardHeader>
      <CardContent className="text-base font-medium">{value}</CardContent>
    </Card>
  );
}
