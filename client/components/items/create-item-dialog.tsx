"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
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
import { postInventory } from "@/lib/api";

// Fixed catalog categories per business seed data
const CATEGORIES = [
  { id: 1, name: "Laptops" },
  { id: 2, name: "Periféricos" },
  { id: 3, name: "Componentes" },
] as const;

interface CreateItemValues {
  name: string;
  cost: number;
  category: string;
}

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateItemValues>({
    mode: "onBlur",
    defaultValues: { name: "", cost: 0, category: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateItemValues) =>
      postInventory({
        name: values.name,
        cost: values.cost,
        category: parseInt(values.category, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Item created successfully");
      reset();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create item");
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Manual validation
    if (!values.name || values.name.length === 0) {
      toast.error("Name is required");
      return;
    }
    if (values.name.length > 50) {
      toast.error("Name must be 50 characters or less");
      return;
    }
    if (!values.cost || values.cost <= 0) {
      toast.error("Cost must be greater than 0");
      return;
    }
    if (!values.category) {
      toast.error("Category is required");
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
        <Button className="w-full xl:w-auto">
          <Plus className="size-4" />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add item to catalog</DialogTitle>
          <DialogDescription>Register a new product in the shared catalog.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" placeholder="Laptop, Monitor..." {...register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-cost">Cost</Label>
            <Input
              id="item-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("cost", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-category">Category</Label>
            <Select
              value={watch("category")}
              onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger id="item-category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
