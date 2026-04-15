"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInventory, Item } from "@/lib/api";

const itemsColumns: ColumnDef<Item>[] = [
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
    cell: ({ row }) => `Q${row.original.cost.toFixed(2)}`,
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "total_quantity",
    header: "Total Stock",
  },
];

export function ItemsView() {
  const [search, setSearch] = useState("");

  const deferredSearch = useDeferredValue(search.trim());

  const itemsQuery = useQuery({
    queryKey: ["inventory", deferredSearch],
    queryFn: () =>
      getInventory({
        name: deferredSearch || undefined,
      }),
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">Inventory Items</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              Browse all items in the catalog, search by name, and manage stock across shops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex-1">
                <div className="space-y-2">
                  <Label htmlFor="item-search">Search by name</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="item-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Laptop, Monitor..."
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full xl:w-auto">
                    <Plus className="size-4" />
                    Add item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add item to catalog</DialogTitle>
                    <DialogDescription>
                      This modal is ready for the item creation form. We can wire the fields and zod validation next.
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
              columns={itemsColumns}
              data={itemsQuery.data ?? []}
              isLoading={itemsQuery.isLoading}
              error={itemsQuery.error}
              emptyMessage="No items match the search criteria."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
