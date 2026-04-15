"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { getShops, getInventory, postBill } from "@/lib/api";

interface LineItem {
  sku: string;
  quantity: number;
}

interface CreateBillValues {
  nit: string;
  shop_id: string;
  detail: LineItem[];
}

export function CreateBillDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBillValues>({
    mode: "onBlur",
    defaultValues: {
      nit: "",
      shop_id: "",
      detail: [{ sku: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detail",
  });

  const shopsQuery = useQuery({ queryKey: ["shops", "", "all", "all"], queryFn: () => getShops({}) });
  const itemsQuery = useQuery({ queryKey: ["inventory", ""], queryFn: () => getInventory({}) });

  const createMutation = useMutation({
    mutationFn: (values: CreateBillValues) =>
      postBill({
        nit: values.nit,
        shop_id: parseInt(values.shop_id, 10),
        detail: values.detail.map((d) => ({
          sku: parseInt(d.sku, 10),
          quantity: typeof d.quantity === "string" ? parseInt(d.quantity, 10) : d.quantity,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Bill created successfully");
      reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create bill");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Manual validation
    const validationErrors: Record<string, string> = {};

    if (!values.nit || values.nit.length === 0) {
      validationErrors.nit = "NIT is required";
    } else if (values.nit.length > 10) {
      validationErrors.nit = "NIT must be 10 characters or less";
    }

    if (!values.shop_id) {
      validationErrors.shop_id = "Shop is required";
    }

    if (!values.detail || values.detail.length === 0) {
      toast.error("At least one item is required");
      return;
    }

    for (let i = 0; i < values.detail.length; i++) {
      if (!values.detail[i].sku) {
        toast.error(`Item ${i + 1}: Item is required`);
        return;
      }
      if (!values.detail[i].quantity || values.detail[i].quantity < 1) {
        toast.error(`Item ${i + 1}: Quantity must be at least 1`);
        return;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    return createMutation.mutateAsync(values);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create bill</DialogTitle>
          <DialogDescription>Register a new sales transaction.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bill-nit">NIT</Label>
            <Input
              id="bill-nit"
              placeholder="Customer ID (max 10 chars)"
              maxLength={10}
              {...register("nit")}
            />
            {errors.nit ? <p className="text-sm text-destructive">{errors.nit.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-shop">Shop</Label>
            <Select
              value={watch("shop_id")}
              onValueChange={(value) => setValue("shop_id", value, { shouldValidate: true })}
              disabled={shopsQuery.isLoading}
            >
              <SelectTrigger id="bill-shop" className="w-full">
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {(shopsQuery.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.shop_id ? <p className="text-sm text-destructive">{errors.shop_id.message}</p> : null}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ sku: "", quantity: 1 })}
              >
                <Plus className="size-3" />
                Add item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded border p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label htmlFor={`detail-${index}-sku`} className="text-xs">
                      Name
                    </Label>
                    <Select
                      value={watch(`detail.${index}.sku`)}
                      onValueChange={(value) =>
                        setValue(`detail.${index}.sku`, value, { shouldValidate: true })
                      }
                      disabled={itemsQuery.isLoading}
                    >
                      <SelectTrigger id={`detail-${index}-sku`} className="w-full text-sm">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {(itemsQuery.data ?? []).map((item) => (
                          <SelectItem key={item.sku} value={String(item.sku)}>
                            {item.name} (Q{item.cost.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.detail?.[index]?.sku ? (
                      <p className="text-xs text-destructive">{errors.detail[index]?.sku?.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`detail-${index}-qty`} className="text-xs">
                      Qty
                    </Label>
                    <Input
                      id={`detail-${index}-qty`}
                      type="number"
                      min="1"
                      className="text-sm"
                      {...register(`detail.${index}.quantity`)}
                    />
                    {errors.detail?.[index]?.quantity ? (
                      <p className="text-xs text-destructive">{errors.detail[index]?.quantity?.message}</p>
                    ) : null}
                  </div>
                </div>

                {fields.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}

            {errors.detail ? (
              <p className="text-sm text-destructive">{errors.detail.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
