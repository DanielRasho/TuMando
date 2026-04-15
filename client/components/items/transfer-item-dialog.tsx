"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getShops, transferInventory } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransferValues {
  from_shop: string;
  to_shop: string;
  quantity: number;
}

export function TransferItemDialog({
  sku,
  itemName,
}: {
  sku: number;
  itemName: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const shopsQuery = useQuery({
    queryKey: ["shops", "transfer-filter"],
    queryFn: () => getShops({}),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isSubmitting },
  } = useForm<TransferValues>({
    mode: "onBlur",
    defaultValues: { from_shop: "", to_shop: "", quantity: 0 },
  });

  const fromShop = useWatch({ control, name: "from_shop" });
  const toShop = useWatch({ control, name: "to_shop" });

  const transferMutation = useMutation({
    mutationFn: (values: TransferValues) =>
      transferInventory({
        sku,
        from_shop: parseInt(values.from_shop, 10),
        to_shop: parseInt(values.to_shop, 10),
        quantity: values.quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "details", sku] });
      toast.success("Inventory transferred successfully");
      reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to transfer item");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Manual validation
    if (!values.from_shop) {
      toast.error("Source shop is required");
      return;
    }
    if (!values.to_shop) {
      toast.error("Destination shop is required");
      return;
    }
    if (values.from_shop === values.to_shop) {
      toast.error("Source and destination shops must be different");
      return;
    }
    if (!values.quantity || values.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    return transferMutation.mutateAsync(values);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="size-4" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer item</DialogTitle>
          <DialogDescription>Move stock for {itemName} from one shop to another.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-from-shop">From shop</Label>
            <Select
              value={fromShop}
              onValueChange={(value) => setValue("from_shop", value, { shouldValidate: true })}
              disabled={shopsQuery.isLoading}
            >
              <SelectTrigger id="transfer-from-shop" className="w-full">
                <SelectValue placeholder="Select source shop" />
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
            <Label htmlFor="transfer-to-shop">To shop</Label>
            <Select
              value={toShop}
              onValueChange={(value) => setValue("to_shop", value, { shouldValidate: true })}
              disabled={shopsQuery.isLoading}
            >
              <SelectTrigger id="transfer-to-shop" className="w-full">
                <SelectValue placeholder="Select destination shop" />
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
            <Label htmlFor="transfer-quantity">Quantity</Label>
            <Input id="transfer-quantity" type="number" min="1" step="1" {...register("quantity", { valueAsNumber: true })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || shopsQuery.isLoading}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
