"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  cost: z.coerce.number().positive("Cost must be greater than 0"),
  category: z.string().min(1, "Category is required"),
});

type CreateItemValues = z.infer<typeof createItemSchema>;

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateItemValues>({
    resolver: zodResolver(createItemSchema),
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

  const onSubmit = handleSubmit((values) => createMutation.mutateAsync(values));

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
            {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-cost">Cost</Label>
            <Input
              id="item-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("cost")}
            />
            {errors.cost ? <p className="text-sm text-destructive">{errors.cost.message}</p> : null}
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
            {errors.category ? <p className="text-sm text-destructive">{errors.category.message}</p> : null}
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
