"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { getShops, increaseInventory } from "@/lib/api";
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

const restockSchema = z.object({
  shop: z.string().min(1, "Shop is required"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
});

type RestockValues = z.infer<typeof restockSchema>;

export function RestockItemDialog({
  sku,
  itemName,
}: {
  sku: number;
  itemName: string;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const shopsQuery = useQuery({
    queryKey: ["shops", "restock-filter"],
    queryFn: () => getShops({}),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RestockValues>({
    resolver: zodResolver(restockSchema),
    defaultValues: { shop: "", quantity: 0 },
  });
  const selectedShop = useWatch({ control, name: "shop" });

  const restockMutation = useMutation({
    mutationFn: (values: RestockValues) =>
      increaseInventory({
        sku,
        shop: parseInt(values.shop, 10),
        quantity: values.quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "details", sku] });
      toast.success("Inventory restocked successfully");
      reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to restock item");
    },
  });

  const onSubmit = handleSubmit((values) => restockMutation.mutateAsync(values));

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
        <Button>
          <Plus className="size-4" />
          Restock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock item</DialogTitle>
          <DialogDescription>Add stock for {itemName} in a specific shop.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restock-shop">Shop</Label>
            <Select
              value={selectedShop}
              onValueChange={(value) => setValue("shop", value, { shouldValidate: true })}
              disabled={shopsQuery.isLoading}
            >
              <SelectTrigger id="restock-shop" className="w-full">
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {(shopsQuery.data ?? []).map((shop) => (
                  <SelectItem key={shop.id} value={String(shop.id)}>
                    {shop.id} - {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.shop ? <p className="text-sm text-destructive">{errors.shop.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="restock-quantity">Quantity</Label>
            <Input id="restock-quantity" type="number" min="1" step="1" {...register("quantity")} />
            {errors.quantity ? <p className="text-sm text-destructive">{errors.quantity.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || shopsQuery.isLoading}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
